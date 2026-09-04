// =============================================
// 🎯 VIP MENU — SKILLS MASTER LIST
// Source of truth for all VIP skill definitions.
// DB key names MUST match Staff.skills jsonb keys.
// =============================================

// --- Skill Type ---
export type SkillType = 'LE' | 'CHINH';

// --- Skill Value (DB stores boolean OR string level) ---
// Some KTV records use: true/false
// Others use: "none" | "basic" | "expert"
// This helper normalizes both formats.
export const hasSkill = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value !== 'none' && value !== '';
  return false;
};

// --- Single Skill Definition ---
export interface VipSkill {
  id: string;           // DB key in Staff.skills jsonb
  type: SkillType;
  blocked?: boolean;    // true = temporarily hidden from menu
  composite?: boolean;  // true = virtual skill (aggregated from multiple DB keys)
  compositeKeys?: string[]; // DB keys to check for composite skills
  name: {
    vi: string;
    en: string;
    cn: string;
    jp: string;
    kr: string;
  };
}

// =============================================
// 📋 NHÓM LẺ (11 skills)
// =============================================
export const LE_SKILLS: VipSkill[] = [
  {
    id: 'shampoo',
    type: 'LE',
    name: { vi: 'Gội đầu thư giãn', en: 'Hair Wash', cn: '舒缓洗发', jp: 'シャンプー', kr: '헤어 워시' },
  },
  {
    id: 'earCombo',
    type: 'LE',
    name: { vi: 'Lấy ráy tai', en: 'Ear Clean', cn: '采耳', jp: '耳掃除', kr: '귀 청소' },
  },
  {
    id: 'earChuyen',
    type: 'LE',
    name: { vi: 'Lấy ráy tai', en: 'Ear Clean', cn: '采耳', jp: '耳掃除', kr: '귀 청소' },
  },
  {
    id: 'razorShave',
    type: 'LE',
    name: { vi: 'Cạo râu (Dao cạo)', en: 'Razor Shave', cn: '剃须刀刮胡', jp: 'カミソリシェービング', kr: '전통 면도' },
  },
  {
    id: 'machineShave',
    type: 'LE',
    name: { vi: 'Cạo râu (Máy)', en: 'Machine Shave', cn: '电动剃须', jp: '電気シェービング', kr: '전기 면도' },
  },
  {
    id: 'facial',
    type: 'LE',
    name: { vi: 'Chăm sóc da mặt', en: 'Facial', cn: '面部护理', jp: 'フェイシャル', kr: '페이셜 케어' },
  },
  {
    id: 'nailCombo',
    type: 'LE',
    name: { vi: 'Cắt móng', en: 'Nail cut', cn: '剪指甲', jp: '爪切り', kr: '손톱 정리' },
  },
  {
    id: 'nailChuyen',
    type: 'LE',
    name: { vi: 'Cắt móng tay & chân', en: 'Manicure & Pedicure', cn: '手部与足部美甲护理', jp: 'ハンド＆フットケア', kr: '매니큐어 & 페디큐어' },
  },
  {
    id: 'heelScrub',
    type: 'LE',
    name: { vi: 'Chà gót chân', en: 'Heel skin shave', cn: '去脚底死皮', jp: 'かかと角質削り', kr: '발뒤꿈치 각질 제거' },
  },
  {
    id: 'hairCut',
    type: 'LE',
    name: { vi: 'Cắt tóc', en: 'Hair Cut', cn: '理发', jp: 'ヘアカット', kr: '헤어컷' },
  },
  {
    id: 'hairExtensionShampoo',
    type: 'LE',
    name: { vi: 'Gội đầu nối tóc', en: 'Hair Extension Shampoo', cn: '接发洗发', jp: 'エクステシャンプー', kr: '붙임머리 샴푸' },
  },
];

// =============================================
// 💪 NHÓM CHÍNH (7 skills)
// =============================================
export const CHINH_SKILLS: VipSkill[] = [
  {
    id: 'thaiBody',
    type: 'CHINH',
    name: { vi: 'Massage Thái', en: 'Thai Body', cn: '泰式按摩', jp: 'タイ式ボディ', kr: '타이 바디' },
  },
  {
    id: 'shiatsuBody',
    type: 'CHINH',
    name: { vi: 'Massage Shiatsu', en: 'Shiatsu Body', cn: '指压按摩', jp: '指圧ボディ', kr: '시아츠 바디' },
  },
  {
    id: 'oilBody',
    type: 'CHINH',
    name: { vi: 'Massage Tinh Dầu', en: 'Oil Body', cn: '精油按摩', jp: 'オイルボディ', kr: '오일 바디' },
  },
  {
    id: 'hotStoneBody',
    type: 'CHINH',
    name: { vi: 'Massage Đá Nóng', en: 'Hot Stone Body', cn: '热石按摩', jp: 'ホットストーンボディ', kr: '핫스톤 바디' },
  },
  {
    id: 'bodyMix',
    type: 'CHINH',
    name: { vi: 'Massage Tứ Thủ', en: 'Mix of Four Body', cn: '四手按摩', jp: 'フォーハンドボディ', kr: '포핸드 바디' },
  },
  {
    id: 'foot',
    type: 'CHINH',
    name: { vi: 'Chân', en: 'Foot', cn: '足部', jp: 'フット', kr: '발' },
  },
];

// =============================================
// 🚫 BLOCKED SKILLS
// =============================================
export const BLOCKED_SKILL_IDS: string[] = ['scrubBody'];

// =============================================
// 📦 COMBINED EXPORTS
// =============================================
export const ALL_VIP_SKILLS: VipSkill[] = [...LE_SKILLS, ...CHINH_SKILLS];

/** Quick lookup: skillId → VipSkill */
export const SKILL_MAP: Record<string, VipSkill> = Object.fromEntries(
  ALL_VIP_SKILLS.map((s) => [s.id, s])
);

/** Duration tiers available in VIP pricing */
export const VIP_DURATION_TIERS = [60, 70, 90, 120, 150, 180, 240] as const;
export type VipDuration = (typeof VIP_DURATION_TIERS)[number];

/** Supported languages */
export type VipLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';
