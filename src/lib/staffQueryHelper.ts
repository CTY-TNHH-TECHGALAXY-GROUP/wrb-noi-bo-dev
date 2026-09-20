export interface PostgrestErrorLike {
  code?: string;
  message?: string;
}

/**
 * Helper kiểm tra lỗi Postgres 42703 thiếu cột gallery_urls trong database schema.
 */
export const isMissingGalleryUrls = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const record = err as PostgrestErrorLike;
  return Boolean(
    record.code === '42703' &&
      typeof record.message === 'string' &&
      /\bgallery_urls\b/i.test(record.message)
  );
};

/**
 * Chuẩn hóa danh sách Staff fallback với gallery_urls rỗng khi DB chưa migration.
 */
export function normalizeFallbackStaffList<T extends Record<string, unknown>>(
  data: T[] | null | undefined
): (T & { gallery_urls: string[] })[] | null {
  if (!data) return null;
  return data.map((staff) => ({
    ...staff,
    gallery_urls: [],
  }));
}
