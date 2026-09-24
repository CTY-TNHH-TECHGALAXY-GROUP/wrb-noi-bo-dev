export type MenuPhotoStaff = {
  gallery_urls?: unknown;
  galleryUrls?: unknown;
  avatar_url?: unknown;
  avatarUrl?: unknown;
  photoUrl?: unknown;
  skills?: Record<string, unknown> | null;
};

export function vipGalleryPhotos(gallery: unknown, skills: Record<string, unknown> | null | undefined): string[] {
  if (!Array.isArray(gallery) || !skills) return [];
  return gallery.flatMap((item) => {
    if (!item || typeof item !== 'object' || item.kind !== 'vip' || typeof item.url !== 'string' || typeof item.skillId !== 'string') return [];
    const value = skills[item.skillId];
    return value === true || (typeof value === 'string' && value !== '' && value !== 'none')
      ? [item.url.trim()].filter(Boolean)
      : [];
  });
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
}: {
  staff?: MenuPhotoStaff | null;
  configPhotos?: unknown;
  menu: 'nhp' | 'nht';
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
    const vipPhotos = vipGalleryPhotos(staff?.gallery_urls ?? staff?.galleryUrls, staff?.skills);
    if (avatar) {
      const rest = vipPhotos.filter((url) => url !== avatar);
      return {
        primary: avatar,
        photos: [avatar, ...rest],
      };
    }
    return {
      primary: vipPhotos[0] ?? null,
      photos: vipPhotos,
    };
  }

  // menu === 'nht': gallery/config trước, chỉ fallback avatar khi gallery/config rỗng
  if (sourcePhotos.length > 0) {
    return {
      primary: avatar ?? (sourcePhotos[0] ?? null),
      photos: sourcePhotos,
    };
  }

  return {
    primary: avatar,
    photos: avatar ? [avatar] : [],
  };
}

import {
  DEEP_BODY_BASE_TECHNIQUE_IDS,
  type DeepBodyBaseTechniqueId,
} from './deepBody.constants';

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

      if (obj.kind === 'therapy') {
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
}: {
  staffId: string;
  nhtConfig?: unknown;
  legacyConfig?: unknown;
  galleryUrls?: unknown;
  avatarUrl?: string | null;
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

  // 5. Avatar fallback
  if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
    return [{ url: avatarUrl.trim(), kind: 'legacy' }];
  }

  return [];
}
