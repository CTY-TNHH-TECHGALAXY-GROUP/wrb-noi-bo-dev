import assert from 'node:assert/strict';
import {
  normalizePhotoList,
  resolveMenuPhotos,
  resolveTherapyGalleryForStaff,
  resolveVipGalleryForStaff,
  linkedTherapyImages,
} from '../src/lib/menuPhotos.helper';
import { getVipSkillBadgeLabel } from '../src/lib/vipSkills.constants';

let passedCount = 0;

function it(name: string, fn: () => void) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ Case ${passedCount}: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    throw err;
  }
}

console.log('🧪 Running Test Suite: Menu Photos Helper (NHP & NHT Production Logic)...\n');

it('Info modal uses only the selected therapy links of selected staff', () => {
  const staff = [
    { therapyGallery: [
      { url: 'https://cdn.example.com/coconut-1.jpg', kind: 'therapy' as const, therapyId: 'coconutOil' as const },
      { url: 'https://cdn.example.com/stone.jpg', kind: 'therapy' as const, therapyId: 'hotStone' as const },
      { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' as const },
      { url: 'https://cdn.example.com/avatar.jpg', kind: 'legacy' as const },
    ] },
    { therapyGallery: [
      { url: 'https://cdn.example.com/coconut-2.jpg', kind: 'therapy' as const, therapyId: 'coconutOil' as const },
    ] },
  ];
  assert.deepEqual(linkedTherapyImages(staff, 'coconutOil'), [
    'https://cdn.example.com/coconut-1.jpg',
    'https://cdn.example.com/coconut-2.jpg',
  ]);
  assert.deepEqual(linkedTherapyImages(staff, 'hotStone'), ['https://cdn.example.com/stone.jpg']);
  assert.deepEqual(linkedTherapyImages(staff, 'mixofourtherapies'), ['https://cdn.example.com/mix.jpg']);
  assert.deepEqual(linkedTherapyImages(staff, 'shiatsu'), []);
});

// ─── NHP / VIP MENU TESTS ───────────────────────────────────────────────────

// 1. normalize: [' a ', '', null, 'b'] → ['a', 'b']
it('normalizePhotoList removes empty/null and trims strings', () => {
  const input = [' a ', '', null, 'b', undefined, '   '];
  const result = normalizePhotoList(input);
  assert.deepEqual(result, ['a', 'b']);
});

// 1b. normalize: extracts url from objects with metadata
it('normalizePhotoList extracts url from metadata objects {url, kind, therapyId}', () => {
  const input = [
    'https://cdn.example.com/legacy.jpg',
    { url: 'https://cdn.example.com/therapy.jpg', kind: 'therapy', therapyId: 'hotStone' },
    { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
    null,
    { invalid: true },
  ];
  const result = normalizePhotoList(input);
  assert.deepEqual(result, [
    'https://cdn.example.com/legacy.jpg',
    'https://cdn.example.com/therapy.jpg',
    'https://cdn.example.com/mix.jpg',
  ]);
});

// 2. NHP only receives photos tagged to an enabled VIP skill.
it('NHP: T027 dual-menu gallery never includes NHT photos or unticked VIP skills', () => {
  const res = resolveMenuPhotos({
    staff: {
      avatar_url: 'https://cdn.example.com/avatar.jpg',
      skills: { shampoo: true, facial: false },
      gallery_urls: [
        { url: 'https://cdn.example.com/nht.jpg', kind: 'therapy', therapyId: 'hotStone' },
        { url: 'https://cdn.example.com/nhp-shampoo.jpg', kind: 'vip', skillId: 'shampoo' },
        { url: 'https://cdn.example.com/nhp-facial.jpg', kind: 'vip', skillId: 'facial' },
      ],
    },
    menu: 'nhp',
  });
  assert.equal(res.primary, 'https://cdn.example.com/avatar.jpg');
  assert.deepEqual(res.photos, [
    'https://cdn.example.com/avatar.jpg',
    'https://cdn.example.com/nhp-shampoo.jpg',
  ]);
});

// 3. Old untagged photos do not leak across menus.
it('NHP: untagged gallery and config do not appear as VIP skill photos', () => {
  const res = resolveMenuPhotos({
    staff: {
      avatar_url: 'https://cdn.example.com/avatar.jpg',
      gallery_urls: ['https://cdn.example.com/gal1.jpg'],
    },
    configPhotos: ['https://cdn.example.com/cfg1.jpg', 'https://cdn.example.com/cfg2.jpg'],
    menu: 'nhp',
  });
  assert.equal(res.primary, 'https://cdn.example.com/avatar.jpg');
  assert.deepEqual(res.photos, ['https://cdn.example.com/avatar.jpg']);
});

// 4. A VIP photo identical to the avatar appears only once.
it('NHP: tagged VIP photo matching avatar is deduplicated', () => {
  const res = resolveMenuPhotos({
    staff: {
      avatar_url: 'https://cdn.example.com/avatar.jpg',
      skills: { shampoo: true },
      gallery_urls: [
        { url: 'https://cdn.example.com/p1.jpg', kind: 'vip', skillId: 'shampoo' },
        { url: 'https://cdn.example.com/avatar.jpg', kind: 'vip', skillId: 'shampoo' },
        { url: 'https://cdn.example.com/p2.jpg', kind: 'vip', skillId: 'shampoo' },
      ],
    },
    menu: 'nhp',
  });
  assert.equal(res.primary, 'https://cdn.example.com/avatar.jpg');
  assert.deepEqual(res.photos, [
    'https://cdn.example.com/avatar.jpg',
    'https://cdn.example.com/p1.jpg',
    'https://cdn.example.com/p2.jpg',
  ]);
});

it('NHT: T027 dual-menu gallery ignores VIP skill photos', () => {
  const gallery = resolveTherapyGalleryForStaff({
    staffId: 'T027',
    galleryUrls: [
      { url: 'https://cdn.example.com/nht.jpg', kind: 'therapy', therapyId: 'hotStone' },
      { url: 'https://cdn.example.com/nhp.jpg', kind: 'vip', skillId: 'shampoo' },
    ],
  });
  assert.deepEqual(gallery.map((item) => item.url), ['https://cdn.example.com/nht.jpg']);
});

// ─── NHT / DEEP BODY TESTS (resolveTherapyGalleryForStaff) ───────────────────

// 5. Config v2 kind:'mix' → galleryUrls has correct URL and keeps mix metadata
it("NHT: Config v2 kind:'mix' preserves URL and mix metadata", () => {
  const nhtConfig = {
    version: 2,
    staff: {
      KTV01: [
        { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
      ],
    },
  };

  const gallery = resolveTherapyGalleryForStaff({
    staffId: 'KTV01',
    nhtConfig,
    galleryUrls: ['https://cdn.example.com/fallback.jpg'],
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  });

  assert.equal(gallery.length, 1);
  assert.equal(gallery[0].url, 'https://cdn.example.com/mix.jpg');
  assert.equal(gallery[0].kind, 'mix');
});

// 6. Config v2 kind:'therapy' + valid therapyId → keeps metadata
it("NHT: Config v2 kind:'therapy' + valid therapyId preserves technique metadata", () => {
  const nhtConfig = {
    version: 2,
    staff: {
      KTV01: [
        { url: 'https://cdn.example.com/shiatsu.jpg', kind: 'therapy', therapyId: 'shiatsu' },
      ],
    },
  };

  const gallery = resolveTherapyGalleryForStaff({
    staffId: 'KTV01',
    nhtConfig,
  });

  assert.equal(gallery.length, 1);
  assert.equal(gallery[0].url, 'https://cdn.example.com/shiatsu.jpg');
  assert.equal(gallery[0].kind, 'therapy');
  if (gallery[0].kind === 'therapy') {
    assert.equal(gallery[0].therapyId, 'shiatsu');
  }
});

// 7. Two staff: one uses new NHT config, one falls back to legacy
it('NHT: per-staff isolation - KTV01 uses new NHT while KTV02 falls back to legacy', () => {
  const nhtConfig = {
    version: 2,
    staff: {
      KTV01: [{ url: 'https://cdn.example.com/ktv01-nht.jpg', kind: 'mix' }],
    },
  };
  const legacyConfig = {
    version: 2,
    staff: {
      KTV01: [{ url: 'https://cdn.example.com/ktv01-legacy.jpg', kind: 'legacy' }],
      KTV02: [{ url: 'https://cdn.example.com/ktv02-legacy.jpg', kind: 'legacy' }],
    },
  };

  const g1 = resolveTherapyGalleryForStaff({ staffId: 'KTV01', nhtConfig, legacyConfig });
  const g2 = resolveTherapyGalleryForStaff({ staffId: 'KTV02', nhtConfig, legacyConfig });

  assert.deepEqual(g1.map((i) => i.url), ['https://cdn.example.com/ktv01-nht.jpg']);
  assert.deepEqual(g2.map((i) => i.url), ['https://cdn.example.com/ktv02-legacy.jpg']);
});

// 8. Staff's own config empty → falls back to legacy
it('NHT: empty staff entry in new config falls back to legacy', () => {
  const nhtConfig = {
    version: 2,
    staff: {
      KTV01: [],
    },
  };
  const legacyConfig = {
    version: 2,
    staff: {
      KTV01: [{ url: 'https://cdn.example.com/ktv01-legacy.jpg', kind: 'legacy' }],
    },
  };

  const gallery = resolveTherapyGalleryForStaff({ staffId: 'KTV01', nhtConfig, legacyConfig });
  assert.deepEqual(gallery.map((i) => i.url), ['https://cdn.example.com/ktv01-legacy.jpg']);
});

// 9. No config → Staff.gallery_urls
it('NHT: when no config exists, resolves directly from Staff.gallery_urls', () => {
  const gallery = resolveTherapyGalleryForStaff({
    staffId: 'KTV01',
    galleryUrls: ['https://cdn.example.com/gal1.jpg', 'https://cdn.example.com/gal2.jpg'],
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  });

  assert.deepEqual(gallery.map((i) => i.url), [
    'https://cdn.example.com/gal1.jpg',
    'https://cdn.example.com/gal2.jpg',
  ]);
});

// 10. No gallery → avatar fallback
it('NHT: when neither config nor gallery exists, falls back to avatarUrl', () => {
  const gallery = resolveTherapyGalleryForStaff({
    staffId: 'KTV01',
    galleryUrls: [],
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
  });

  assert.deepEqual(gallery.map((i) => i.url), ['https://cdn.example.com/avatar.jpg']);
  assert.equal(gallery[0].kind, 'legacy');
});

// 11. galleryUrls always equals therapyGallery.map(item => item.url)
it('NHT: galleryUrls matches therapyGallery URLs exactly', () => {
  const nhtConfig = {
    version: 2,
    staff: {
      KTV01: [
        { url: 'https://cdn.example.com/photoA.jpg', kind: 'therapy', therapyId: 'hotStone' },
        { url: 'https://cdn.example.com/photoB.jpg', kind: 'mix' },
      ],
    },
  };

  const therapyGallery = resolveTherapyGalleryForStaff({ staffId: 'KTV01', nhtConfig });
  const galleryUrls = therapyGallery.map((item) => item.url);

  assert.deepEqual(galleryUrls, [
    'https://cdn.example.com/photoA.jpg',
    'https://cdn.example.com/photoB.jpg',
  ]);
  assert.equal(galleryUrls.length, therapyGallery.length);
  for (let i = 0; i < galleryUrls.length; i++) {
    assert.equal(galleryUrls[i], therapyGallery[i].url);
  }
});

// 12. Backward compatibility: flat map config support
it('NHT: supports legacy flat map config format', () => {
  const flatConfig = {
    KTV01: ['https://cdn.example.com/flat1.jpg', 'https://cdn.example.com/flat2.jpg'],
  };

  const gallery = resolveTherapyGalleryForStaff({ staffId: 'KTV01', nhtConfig: flatConfig });
  assert.deepEqual(gallery.map((i) => i.url), [
    'https://cdn.example.com/flat1.jpg',
    'https://cdn.example.com/flat2.jpg',
  ]);
});

// ─── PARSING & NORMALIZATION TESTS ──────────────────────────────────────────

import { normalizeTherapyGallery } from '../src/lib/menuPhotos.helper';
import {
  staffHasDeepBodyTechnique,
  getDeepBodyMinDuration,
  DEEP_BODY_DURATION_SERVICES,
  formatDeepBodyAdminName,
} from '../src/lib/deepBody.constants';

// 13. normalizeTherapyGallery: string[] → legacy kind items
it('normalizeTherapyGallery: converts legacy string[] into legacy items', () => {
  const input = ['https://cdn.example.com/p1.jpg', '  https://cdn.example.com/p2.jpg  ', '   ', 'invalid-no-http'];
  const res = normalizeTherapyGallery(input);
  assert.deepEqual(res, [
    { url: 'https://cdn.example.com/p1.jpg', kind: 'legacy' },
    { url: 'https://cdn.example.com/p2.jpg', kind: 'legacy' },
  ]);
});

// 14. normalizeTherapyGallery: drops invalid therapyId or empty URLs
it('normalizeTherapyGallery: drops items with invalid therapyId or empty URL', () => {
  const input = [
    { url: 'https://cdn.example.com/valid.jpg', kind: 'therapy', therapyId: 'coconutOil' },
    { url: 'https://cdn.example.com/invalid.jpg', kind: 'therapy', therapyId: 'randomUnknownId' },
    { url: '   ', kind: 'therapy', therapyId: 'shiatsu' },
    { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
  ];
  const res = normalizeTherapyGallery(input);
  assert.deepEqual(res, [
    { url: 'https://cdn.example.com/valid.jpg', kind: 'therapy', therapyId: 'coconutOil' },
    { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
  ]);
});

// ─── SKILL MAPPING & DURATION MATRIX TESTS ──────────────────────────────────

// 15. staffHasDeepBodyTechnique skill mapping
it('staffHasDeepBodyTechnique: checks both legacy skill keys and base technique IDs', () => {
  const skillsStaff1 = { oilBody: true, thaiBody: false, shiatsu: true };
  assert.equal(staffHasDeepBodyTechnique(skillsStaff1, 'coconutOil'), true);
  assert.equal(staffHasDeepBodyTechnique(skillsStaff1, 'thaiTherapy'), false);
  assert.equal(staffHasDeepBodyTechnique(skillsStaff1, 'shiatsu'), true);
  assert.equal(staffHasDeepBodyTechnique(skillsStaff1, 'hotStone'), false);

  const skillsStaff2 = { hotStoneBody: true };
  assert.equal(staffHasDeepBodyTechnique(skillsStaff2, 'hotStone'), true);
  assert.equal(staffHasDeepBodyTechnique(null, 'coconutOil'), false);
});

// 16. getDeepBodyMinDuration matrix
it('getDeepBodyMinDuration: enforces 70min for 1-2, 90min for 3, 120min for 4', () => {
  assert.equal(getDeepBodyMinDuration(0), 70);
  assert.equal(getDeepBodyMinDuration(1), 70);
  assert.equal(getDeepBodyMinDuration(2), 70);
  assert.equal(getDeepBodyMinDuration(3), 90);
  assert.equal(getDeepBodyMinDuration(4), 120);
  assert.equal(getDeepBodyMinDuration(5), 120);
});

// 17. DEEP_BODY_DURATION_SERVICES exact ID mapping NHT0002–NHT0006
it('DEEP_BODY_DURATION_SERVICES: maps exactly to NHT0002 through NHT0006', () => {
  assert.equal(DEEP_BODY_DURATION_SERVICES[70].serviceId, 'NHT0002');
  assert.equal(DEEP_BODY_DURATION_SERVICES[90].serviceId, 'NHT0003');
  assert.equal(DEEP_BODY_DURATION_SERVICES[120].serviceId, 'NHT0004');
  assert.equal(DEEP_BODY_DURATION_SERVICES[150].serviceId, 'NHT0005');
  assert.equal(DEEP_BODY_DURATION_SERVICES[180].serviceId, 'NHT0006');
});

// 18. formatDeepBodyAdminName formatting
it('formatDeepBodyAdminName: formats single, multiple, and mix therapies for Admin/Invoice', () => {
  assert.equal(
    formatDeepBodyAdminName(['coconutOil']),
    'Body chuyên sâu: Tinh dầu dừa'
  );
  assert.equal(
    formatDeepBodyAdminName(['coconutOil', 'thaiTherapy']),
    'Body chuyên sâu: Tinh dầu dừa + Thái'
  );
  assert.equal(
    formatDeepBodyAdminName(['mixofourtherapies']),
    '4 liệu trình (Ấn huyệt, Thái, Dầu & Đá Nóng)'
  );
  assert.equal(
    formatDeepBodyAdminName(['coconutOil', 'thaiTherapy', 'shiatsu', 'hotStone']),
    '4 liệu trình (Ấn huyệt, Thái, Dầu & Đá Nóng)'
  );
});

// ─── VIP GALLERY & SKILL BADGE TESTS (MENU NHP) ───────────────────────────────

// 22. resolveVipGalleryForStaff: preserves skill tags and drops unticked/untagged photos for Menu NHP
it('resolveVipGalleryForStaff: preserves skill tags and drops unticked/untagged photos for Menu NHP', () => {
  const staff = {
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    skills: {
      thaiBody: true,
      shampoo: 'expert',
      facialCare: false,
      earCombo: null,
      oilBody: 'none',
    },
    galleryUrls: [
      // Tagged VIP photo for an active boolean skill
      { url: 'https://cdn.example.com/thai.jpg', kind: 'vip', skillId: 'thaiBody' },
      // Tagged VIP photo for an active string skill ('expert')
      { url: 'https://cdn.example.com/shampoo.jpg', kind: 'vip', skillId: 'shampoo' },
      // Tagged VIP photo for an inactive boolean skill (false) -> must be dropped
      { url: 'https://cdn.example.com/facial.jpg', kind: 'vip', skillId: 'facialCare' },
      // Tagged VIP photo for null skill -> must be dropped
      { url: 'https://cdn.example.com/ear.jpg', kind: 'vip', skillId: 'earCombo' },
      // Tagged VIP photo for 'none' skill -> must be dropped
      { url: 'https://cdn.example.com/oil.jpg', kind: 'vip', skillId: 'oilBody' },
      // NHT therapy photo -> must be dropped in Menu NHP
      { url: 'https://cdn.example.com/nht-therapy.jpg', kind: 'therapy', therapyId: 'coconutOil' },
      // Untagged plain string -> must be dropped in Menu NHP
      'https://cdn.example.com/plain.jpg',
      // Duplicate URL -> must be deduplicated
      { url: 'https://cdn.example.com/thai.jpg', kind: 'vip', skillId: 'thaiBody' },
    ],
  };

  const result = resolveVipGalleryForStaff(staff);

  // Avatar prepended as kind: 'avatar', followed by active VIP skill photos
  assert.deepEqual(result, [
    { url: 'https://cdn.example.com/avatar.jpg', kind: 'avatar' },
    { url: 'https://cdn.example.com/thai.jpg', kind: 'vip', skillId: 'thaiBody' },
    { url: 'https://cdn.example.com/shampoo.jpg', kind: 'vip', skillId: 'shampoo' },
  ]);

  // Case where avatar matches a tagged VIP photo: should not duplicate, matching item is first
  const staffMatchingAvatar = {
    avatarUrl: 'https://cdn.example.com/thai.jpg',
    skills: { thaiBody: true, shampoo: true },
    galleryUrls: [
      { url: 'https://cdn.example.com/shampoo.jpg', kind: 'vip', skillId: 'shampoo' },
      { url: 'https://cdn.example.com/thai.jpg', kind: 'vip', skillId: 'thaiBody' },
    ],
  };
  const resultMatching = resolveVipGalleryForStaff(staffMatchingAvatar);
  assert.deepEqual(resultMatching, [
    { url: 'https://cdn.example.com/thai.jpg', kind: 'vip', skillId: 'thaiBody' },
    { url: 'https://cdn.example.com/shampoo.jpg', kind: 'vip', skillId: 'shampoo' },
  ]);
});

// 23. getVipSkillBadgeLabel: resolves localized badge labels for VIP skills and aliases
it('getVipSkillBadgeLabel: resolves localized badge labels for VIP skills and aliases', () => {
  // Direct match - Vietnamese default
  assert.equal(getVipSkillBadgeLabel('thaiBody'), 'Massage Thái');
  assert.equal(getVipSkillBadgeLabel('shampoo'), 'Gội đầu thư giãn');

  // Direct match - Multi-language
  assert.equal(getVipSkillBadgeLabel('thaiBody', 'en'), 'Thai Body');
  assert.equal(getVipSkillBadgeLabel('thaiBody', 'cn'), '泰式按摩');
  assert.equal(getVipSkillBadgeLabel('thaiBody', 'jp'), 'タイ式ボディ');
  assert.equal(getVipSkillBadgeLabel('thaiBody', 'kr'), '타이 바디');

  // Case-insensitivity
  assert.equal(getVipSkillBadgeLabel('ThaiBody', 'vi'), 'Massage Thái');
  assert.equal(getVipSkillBadgeLabel('SHAMPOO', 'en'), 'Hair Wash');

  // Aliases
  assert.equal(getVipSkillBadgeLabel('coconutOil', 'vi'), 'Massage Tinh Dầu');
  assert.equal(getVipSkillBadgeLabel('hotStone', 'vi'), 'Massage Đá Nóng');
  assert.equal(getVipSkillBadgeLabel('thaiTherapy', 'en'), 'Thai Body');
  assert.equal(getVipSkillBadgeLabel('oilFoot', 'vi'), 'Chân');
  assert.equal(getVipSkillBadgeLabel('earClean', 'vi'), 'Lấy ráy tai');

  // Unknown / Empty
  assert.equal(getVipSkillBadgeLabel(''), null);
  assert.equal(getVipSkillBadgeLabel('unknownSkillIdXYZ'), null);
});

console.log(`\n🎉 ALL ${passedCount} MENU PHOTOS TEST CASES PASSED SUCCESSFULLY!\n`);
