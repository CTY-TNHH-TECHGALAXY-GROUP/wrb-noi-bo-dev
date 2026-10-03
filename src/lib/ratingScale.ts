/**
 * Customer rating scale (4 | 5 stars) + level labels, set by admin in "Cài đặt hệ thống".
 * Mirrors admin `lib/services/RatingScaleService.ts` (scale, labels, clamp only).
 * Money (deduction / bonus) is NOT computed here — the admin app / DB triggers own it.
 */

export type RatingScale = 4 | 5;
export const RATING_CONFIG_KEYS = { scale: 'customer_rating_scale', labels: 'rating_labels' } as const;

export const RATING_LANGS = ['VN', 'EN', 'KR', 'JP', 'ZH'] as const;
export type RatingLang = typeof RATING_LANGS[number];
export type RatingLabelSet = { internal: string } & Record<RatingLang, string>;
export type RatingLabels = Record<RatingScale, Record<number, RatingLabelSet>>;

/** WRB route lang → admin label column. */
const LANG_MAP: Record<string, RatingLang> = { vi: 'VN', en: 'EN', kr: 'KR', ko: 'KR', jp: 'JP', ja: 'JP', cn: 'ZH', zh: 'ZH' };

const L = (internal: string, VN: string, EN: string, KR: string, JP: string, ZH: string): RatingLabelSet =>
    ({ internal, VN, EN, KR, JP, ZH });
/** Same defaults as admin DEFAULT_RATING_LABELS (scale 5 from the Oria multilingual rating sheet). */
export const DEFAULT_RATING_LABELS: RatingLabels = {
    4: {
        1: L('Tệ', 'Tệ', 'Bad', '나쁨', '悪い', '差'),
        2: L('Bình thường', 'Bình thường', 'Ok', '보통', '普通', '一般'),
        3: L('Tốt', 'Tốt', 'Good', '좋음', '良い', '好'),
        4: L('Xuất sắc', 'Tuyệt vời', 'Excellent', '매우 좋음', '素晴らしい', '极好'),
    },
    5: {
        1: L('Cực kỳ tệ', 'Cực kỳ tệ', 'Very poor', '매우 나쁨', '非常に悪い', '非常差'),
        2: L('Thất vọng', 'Thất vọng', 'Disappointing', '실망스러움', '期待外れ', '令人失望'),
        3: L('Chưa ổn lắm', 'Chưa ổn lắm', 'Could be better', '아쉬움', 'もう少し', '有待改进'),
        4: L('Tuyệt vời', 'Tuyệt vời', 'Great', '훌륭함', '素晴らしい', '很好'),
        5: L('Xuất sắc', 'Xuất sắc', 'Excellent', '최고', '最高', '非常出色'),
    },
};

const LABEL_MAX_LENGTH = 40;

const parseJson = (raw: unknown): any => {
    let value = raw;
    for (let i = 0; i < 2 && typeof value === 'string'; i++) {
        try { value = JSON.parse(value); } catch { return undefined; }
    }
    return value;
};

/** Anything but 5 is the legacy 4-star scale. */
export const normalizeScale = (raw: unknown): RatingScale => (Number(parseJson(raw)) === 5 ? 5 : 4);

export function mergeLabels(raw: unknown): RatingLabels {
    const saved = parseJson(raw) || {};
    const out: RatingLabels = JSON.parse(JSON.stringify(DEFAULT_RATING_LABELS));
    for (const scale of [4, 5] as const) for (const level of Object.keys(out[scale]).map(Number)) {
        const custom = saved?.[scale]?.[level];
        if (!custom || typeof custom !== 'object') continue;
        for (const key of ['internal', ...RATING_LANGS] as const) {
            const text = typeof custom[key] === 'string' ? custom[key].trim() : '';
            if (text) out[scale][level][key] = text.slice(0, LABEL_MAX_LENGTH);
        }
    }
    return out;
}

export const ratingLabelFor = (score: number, scale: RatingScale, labels: RatingLabels, lang: string): string => {
    const set = labels[scale]?.[Math.min(Math.max(1, Math.round(score)), scale)];
    if (!set) return String(score);
    return set[LANG_MAP[lang] || 'EN'] || set.internal;
};

/** Customer ticked complaints → the best rating still allowed (scale 4 keeps 3/2/1 as before). */
export const maxRatingForViolations = (count: number, scale: RatingScale): number =>
    count >= 3 ? 1 : count >= 2 ? 2 : count >= 1 ? scale - 1 : scale;

/** 0 = skipped (kept as-is); otherwise 1..scale. */
export const clampRating = (rating: unknown, scale: RatingScale): number | null => {
    const n = Math.round(Number(rating));
    if (!Number.isFinite(n) || n < 0) return null;
    return n === 0 ? 0 : Math.min(n, scale);
};

export const isTopRating = (rating: number, scale: RatingScale) => rating >= scale;

/** Colour band inside the scale (scale 4: 4 top · 3 good · 2 mid · 1 low, as before). */
export const ratingTone = (rating: number, scale: RatingScale): 'top' | 'good' | 'mid' | 'low' =>
    rating >= scale ? 'top' : rating >= scale - 1 ? 'good' : rating >= 2 ? 'mid' : 'low';
