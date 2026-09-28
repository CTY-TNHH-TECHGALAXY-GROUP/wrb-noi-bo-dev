export type MenuPhotoStaff = {
  gallery_urls?: unknown;
  galleryUrls?: unknown;
  avatar_url?: unknown;
  avatarUrl?: unknown;
  photoUrl?: unknown;
  skills?: Record<string, unknown> | null;
};

export function vipGalleryPhotos(
  gallery: unknown,
  skills: Record<string, unknown> | null | undefined,
  privilegeUrl?: string | null
): string[] {
  const privilegeUrls: string[] = [];
  const vipSkillUrls: string[] = [];

  const rawPrivilege = typeof privilegeUrl === 'string' && privilegeUrl.trim() ? privilegeUrl.trim() : null;
  if (rawPrivilege) {
    privilegeUrls.push(rawPrivilege);
  }

  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      if (!item || typeof item !== 'object' || typeof item.url !== 'string') continue;
      if ((item as any).hidden === true) continue;
      const url = item.url.trim();
      if (!url) continue;

      const isPrivilegeKind = item.kind === 'privilege';
      const isPrivilegeSkill =
        item.kind === 'vip' &&
        typeof item.skillId === 'string' &&
        ['privilege', 'dacquyen', 'dac_quyen', 'dac-quyen'].includes(item.skillId.toLowerCase());

      if (isPrivilegeKind || isPrivilegeSkill) {
        if (!privilegeUrls.includes(url)) privilegeUrls.push(url);
        continue;
      }

      if (item.kind !== 'vip' || typeof item.skillId !== 'string' || !skills) continue;
      const value = skills[item.skillId];
      const isSkillActive = value === true || (typeof value === 'string' && value !== '' && value !== 'none');
      if (isSkillActive && !vipSkillUrls.includes(url)) {
        vipSkillUrls.push(url);
      }
    }
  }

  return [...privilegeUrls, ...vipSkillUrls];
}

export function normalizePhotoList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        // String thuần → giữ nguyên
        if (typeof item === 'string') return item.trim();
        // Object có URL (từ gallery metadata) → bóc tách lấy URL
        if (item && typeof item === 'object' && typeof (item as any).url === 'string') {
          return (item as any).url.trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return normalizePhotoList(parsed);
      } catch {}
    }
    return [trimmed];
  }
  return [];
}

export function resolveMenuPhotos({
  staff,
  configPhotos,
  menu,
  showAvatar = true,
}: {
  staff?: MenuPhotoStaff | null;
  configPhotos?: unknown;
  menu: 'nhp' | 'nht';
  showAvatar?: boolean;
}): {
  primary: string | null;
  photos: string[];
} {
  const config = normalizePhotoList(configPhotos);
  const gallery = normalizePhotoList(staff?.gallery_urls ?? staff?.galleryUrls);
  const rawAvatar = staff?.avatar_url || staff?.avatarUrl || staff?.photoUrl;
  const avatar = typeof rawAvatar === 'string' && rawAvatar.trim() ? rawAvatar.trim() : null;

  const sourcePhotos = config.length > 0 ? config : gallery;

  if (menu === 'nhp') {
    const featureFlags = (staff && typeof (staff as any).feature_flags === 'object') ? (staff as any).feature_flags : ((staff && typeof (staff as any).featureFlags === 'object') ? (staff as any).featureFlags : null);
    const directPrivilege =
      (typeof (staff as any)?.privilegeUrl === 'string' && (staff as any).privilegeUrl.trim()) ||
      (typeof (staff as any)?.privilege_url === 'string' && (staff as any).privilege_url.trim()) ||
      (typeof featureFlags?.privilege_url === 'string' && featureFlags.privilege_url.trim()) ||
      (typeof featureFlags?.privilegeUrl === 'string' && featureFlags.privilegeUrl.trim()) ||
      (typeof featureFlags?.privilege_photo === 'string' && featureFlags.privilege_photo.trim()) ||
      null;

    const vipPhotos = vipGalleryPhotos(staff?.gallery_urls ?? staff?.galleryUrls, staff?.skills, directPrivilege);
    if (showAvatar && avatar) {
      const rest = vipPhotos.filter((url) => url !== avatar);
      return {
        primary: avatar,
        photos: [avatar, ...rest],
      };
    }
    return {
      primary: vipPhotos[0] ?? (showAvatar ? avatar : null),
      photos: vipPhotos,
    };
  }

  // menu === 'nht'
  if (sourcePhotos.length > 0) {
    return {
      primary: (showAvatar ? avatar : null) ?? (sourcePhotos[0] ?? null),
      photos: sourcePhotos,
    };
  }

  if (showAvatar && avatar) {
    return {
      primary: avatar,
      photos: [avatar],
    };
  }

  return {
    primary: null,
    photos: [],
  };
}

import {
  DEEP_BODY_BASE_TECHNIQUE_IDS,
  type DeepBodyBaseTechniqueId,
} from './deepBody.constants';

export type VipGalleryParsedItem =
  | {
      url: string;
      kind: 'vip';
      skillId: string;
    }
  | {
      url: string;
      kind: 'privilege';
      privilegeId?: string;
    }
  | {
      url: string;
      kind: 'avatar';
    }
  | {
      url: string;
      kind: 'legacy';
    };

export function resolveVipGalleryForStaff({
  avatarUrl,
  galleryUrls,
  skills,
  privilegeUrl,
  showAvatar = true,
}: {
  avatarUrl?: unknown;
  galleryUrls?: unknown;
  skills?: Record<string, unknown> | null;
  privilegeUrl?: unknown;
  showAvatar?: boolean;
}): VipGalleryParsedItem[] {
  const rawAvatar = typeof avatarUrl === 'string' && avatarUrl.trim() ? avatarUrl.trim() : null;
  const rawPrivilege = typeof privilegeUrl === 'string' && privilegeUrl.trim() ? privilegeUrl.trim() : null;
  const rawGallery = Array.isArray(galleryUrls) ? galleryUrls : [];

  const privilegeItems: VipGalleryParsedItem[] = [];
  const validVipItems: VipGalleryParsedItem[] = [];
  const seenUrls = new Set<string>();

  // If explicit privilegeUrl is provided, seed it into privilegeItems
  if (rawPrivilege) {
    seenUrls.add(rawPrivilege);
    privilegeItems.push({
      url: rawPrivilege,
      kind: 'privilege',
    });
  }

  for (const item of rawGallery) {
    if (!item || typeof item !== 'object') continue;
    if (item.kind === 'avatar' && !showAvatar) continue;
    if ((item as any).hidden === true) continue;
    const url = typeof item.url === 'string' ? item.url.trim() : '';
    if (!url || seenUrls.has(url)) continue;

    // Check if privilege ("Đặc quyền")
    const isPrivilegeKind = item.kind === 'privilege';
    const isPrivilegeSkill =
      item.kind === 'vip' &&
      typeof item.skillId === 'string' &&
      ['privilege', 'dacquyen', 'dac_quyen', 'dac-quyen'].includes(item.skillId.toLowerCase());

    if (isPrivilegeKind || isPrivilegeSkill) {
      seenUrls.add(url);
      privilegeItems.push({
        url,
        kind: 'privilege',
        ...(typeof item.privilegeId === 'string' ? { privilegeId: item.privilegeId } : {}),
      });
      continue;
    }

    // Check if VIP skill photo
    if (item.kind !== 'vip' || typeof item.skillId !== 'string') continue;
    const skillVal = skills ? skills[item.skillId] : null;
    const isSkillActive =
      skillVal === true ||
      (typeof skillVal === 'string' && skillVal !== '' && skillVal !== 'none');
    if (!isSkillActive) continue;

    seenUrls.add(url);
    validVipItems.push({
      url,
      kind: 'vip',
      skillId: item.skillId,
    });
  }

  // When showAvatar is ON (true) and avatar is provided:
  // Order is strictly: [Avatar] -> [Privilege] -> [Skills]
  if (showAvatar && rawAvatar) {
    const privMatchIdx = privilegeItems.findIndex((it) => it.url === rawAvatar);
    if (privMatchIdx >= 0) {
      const matchingPrivItem = privilegeItems.splice(privMatchIdx, 1)[0];
      return [matchingPrivItem, ...privilegeItems, ...validVipItems];
    }

    const vipMatchIdx = validVipItems.findIndex((it) => it.url === rawAvatar);
    if (vipMatchIdx >= 0) {
      const matchingVipItem = validVipItems.splice(vipMatchIdx, 1)[0];
      return [matchingVipItem, ...privilegeItems, ...validVipItems];
    }

    return [{ url: rawAvatar, kind: 'avatar' }, ...privilegeItems, ...validVipItems];
  }

  // When showAvatar is OFF (false): strictly [Privilege] -> [Skills]
  return [...privilegeItems, ...validVipItems];
}

export type TherapyGalleryItem =
  | {
      url: string;
      kind: 'therapy';
      therapyId: DeepBodyBaseTechniqueId;
    }
  | {
      url: string;
      kind: 'mix';
    };

export type TherapyGalleryLegacyItem = {
  url: string;
  kind: 'legacy';
};

export type TherapyGalleryParsedItem =
  | TherapyGalleryItem
  | TherapyGalleryLegacyItem;

export type TherapyGalleryConfig = {
  version: 2;
  staff: Record<string, TherapyGalleryItem[]>;
};

export function linkedTherapyImages(
  staff: { therapyGallery?: TherapyGalleryParsedItem[] }[],
  techniqueId: string
): string[] {
  return [...new Set(staff.flatMap((person) =>
    (person.therapyGallery ?? [])
      .filter((item) => techniqueId === 'mixofourtherapies'
        ? item.kind === 'mix'
        : item.kind === 'therapy' && item.therapyId === techniqueId)
      .map((item) => item.url)
  ))];
}

export function normalizeTherapyGallery(
  value: unknown
): TherapyGalleryParsedItem[] {
  if (!value) return [];

  let rawList: unknown[] = [];
  if (Array.isArray(value)) {
    rawList = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) rawList = parsed;
        else rawList = [trimmed];
      } catch {
        rawList = [trimmed];
      }
    } else {
      rawList = [trimmed];
    }
  } else {
    return [];
  }

  const result: TherapyGalleryParsedItem[] = [];

  for (const item of rawList) {
    if (typeof item === 'string') {
      const url = item.trim();
      if (url && (url.startsWith('http') || url.startsWith('/'))) {
        result.push({ url, kind: 'legacy' });
      }
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const url = typeof obj.url === 'string' ? obj.url.trim() : '';
      if (!url) continue;

      if (obj.kind === 'avatar') continue;
      if (obj.hidden === true) continue;

      if (obj.kind === 'privilege') {
        result.push({
          url,
          kind: 'privilege',
          ...(typeof obj.privilegeId === 'string' ? { privilegeId: obj.privilegeId } : {}),
        } as any);
      } else if (obj.kind === 'therapy') {
        if (
          typeof obj.therapyId === 'string' &&
          (DEEP_BODY_BASE_TECHNIQUE_IDS as readonly string[]).includes(obj.therapyId)
        ) {
          result.push({
            url,
            kind: 'therapy',
            therapyId: obj.therapyId as DeepBodyBaseTechniqueId,
          });
        }
      } else if (obj.kind === 'mix') {
        result.push({
          url,
          kind: 'mix',
        });
      } else if (obj.kind === 'legacy') {
        result.push({
          url,
          kind: 'legacy',
        });
      }
    }
  }

  return result;
}

export const THERAPY_DISPLAY_ORDER: Record<string, number> = {
  coconutOil: 1,
  hotStone: 2,
  thaiTherapy: 3,
  shiatsu: 4,
  mix: 5,
};

export function sortTherapyGalleryItems(
  items: TherapyGalleryParsedItem[]
): TherapyGalleryParsedItem[] {
  return [...items].sort((a, b) => {
    const orderA =
      a.kind === 'therapy'
        ? (THERAPY_DISPLAY_ORDER[a.therapyId] ?? 90)
        : a.kind === 'mix'
        ? (THERAPY_DISPLAY_ORDER.mix ?? 90)
        : 99;

    const orderB =
      b.kind === 'therapy'
        ? (THERAPY_DISPLAY_ORDER[b.therapyId] ?? 90)
        : b.kind === 'mix'
        ? (THERAPY_DISPLAY_ORDER.mix ?? 90)
        : 99;

    return orderA - orderB;
  });
}

export function resolveTherapyGalleryForStaff({
  staffId,
  nhtConfig,
  legacyConfig,
  galleryUrls,
  avatarUrl,
  showAvatar = true,
}: {
  staffId: string;
  nhtConfig?: unknown;
  legacyConfig?: unknown;
  galleryUrls?: unknown;
  avatarUrl?: string | null;
  showAvatar?: boolean;
}): TherapyGalleryParsedItem[] {
  // 1. nht_therapist_photos version 2
  if (nhtConfig && typeof nhtConfig === 'object') {
    const configObj = nhtConfig as Record<string, unknown>;
    const rawStaffData = (configObj.staff as Record<string, unknown>)?.[staffId] ?? configObj[staffId];
    const parsed = normalizeTherapyGallery(rawStaffData);
    if (parsed.length > 0) return sortTherapyGalleryItems(parsed);
  }

  // 2. Staff.gallery_urls if it contains structured therapy metadata (therapy or mix)
  if (galleryUrls) {
    const parsed = normalizeTherapyGallery(galleryUrls);
    if (parsed.some((it) => it.kind === 'therapy' || it.kind === 'mix')) {
      return sortTherapyGalleryItems(parsed);
    }
  }

  // 3. deep_body_therapist_photos legacy
  if (legacyConfig && typeof legacyConfig === 'object') {
    const legacyObj = legacyConfig as Record<string, unknown>;
    const rawLegacyData = (legacyObj.staff as Record<string, unknown>)?.[staffId] ?? legacyObj[staffId];
    const parsed = normalizeTherapyGallery(rawLegacyData);
    if (parsed.length > 0) return sortTherapyGalleryItems(parsed);
  }

  // 4. Staff.gallery_urls fallback (plain URLs / legacy)
  if (galleryUrls) {
    const parsed = normalizeTherapyGallery(galleryUrls);
    if (parsed.length > 0) return sortTherapyGalleryItems(parsed);
  }

  // 5. Avatar fallback (chỉ dùng khi showAvatar = true / ON)
  if (showAvatar && typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return [{ url: avatarUrl.trim(), kind: 'legacy' }];
  }

  return [];
}
