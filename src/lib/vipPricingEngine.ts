// =============================================
// 💰 VIP MENU — PRICING ENGINE
// Ported from Simulator logic (đã chốt).
// Handles: minDuration, available durations, price lookup.
// =============================================

import {
  SKILL_MAP,
  VIP_DURATION_TIERS,
  type VipDuration,
} from './vipSkills.constants';

// --- Pricing Table shape (from SystemConfigs.menu_vip_pricing) ---
// { "1": { "60": 720000, "70": 840000, ... }, "2": { "60": 1080000, ... } }
export type VipPricingTable = Record<string, Record<string, number>>;
export type { VipDuration };

export const VIP_1K_MAP: Record<number, string> = {
  60: 'NHP0001',
  70: 'NHP0002',
  90: 'NHP0003',
  120: 'NHP0004',
  150: 'NHP0005',
  180: 'NHP0006',
  240: 'NHP0007',
};

export const VIP_2K_MAP: Record<number, string> = {
  60: 'NHP0008',
  70: 'NHP0009',
  90: 'NHP0010',
  120: 'NHP0011',
  150: 'NHP0012',
  180: 'NHP0013',
  240: 'NHP0014',
};

export const getVipServiceId = (numKtvs: number, duration: number): string => {
  const map = numKtvs >= 2 ? VIP_2K_MAP : VIP_1K_MAP;
  if (VIP_DURATION_TIERS.includes(duration as any)) {
    return map[duration];
  }
  // Fallback: find closest duration that is >= selected duration
  const closest = VIP_DURATION_TIERS.find(d => d >= duration) || VIP_DURATION_TIERS[VIP_DURATION_TIERS.length - 1];
  return map[closest];
};

// --- Engine Output ---
export interface VipPricingResult {
  leCount: number;
  chinhCount: number;
  totalCount: number;
  minDuration: VipDuration;
  availableDurations: VipDuration[];
  price: number;
  pricePerMinute: number;
}

/**
 * Calculate minimum duration based on selected skills.
 *
 * Rules (from Simulator — FINAL):
 * 1. Default: 60 phút
 * 2. If (leCount >= 1 AND chinhCount >= 1) OR (chinhCount > 2): → 70p
 * 3. If totalCount >= 3: → 90p
 * 4. If totalCount >= 4: → 120p
 * 5. If totalCount >= 5: → 150p
 */
export const calculateMinDuration = (
  selectedSkillIds: string[]
): { leCount: number; chinhCount: number; totalCount: number; minDuration: VipDuration } => {
  let leCount = 0;
  let chinhCount = 0;

  for (const skillId of selectedSkillIds) {
    const skill = SKILL_MAP[skillId];
    if (!skill) continue;
    if (skill.type === 'LE') leCount++;
    else if (skill.type === 'CHINH') chinhCount++;
  }

  const totalCount = leCount + chinhCount;
  let minDuration: VipDuration = 60;

  // Rule 5 first (highest priority)
  if (totalCount >= 5) {
    minDuration = 150;
  } else if (totalCount >= 4) {
    minDuration = 120;
  } else if (totalCount >= 3) {
    minDuration = 90;
  } else if ((leCount >= 1 && chinhCount >= 1) || chinhCount > 2) {
    // Mix LE + CHINH, or 3+ CHINH → 70p
    // Note: 2 CHINH (e.g. Body + Foot) stays at 60p
    minDuration = 70;
  }

  return { leCount, chinhCount, totalCount, minDuration };
};

/**
 * Get available duration options (filter out durations below minDuration).
 */
export const getAvailableDurations = (minDuration: VipDuration): VipDuration[] => {
  return VIP_DURATION_TIERS.filter((d) => d >= minDuration) as VipDuration[];
};

/**
 * Look up price from pricing table.
 *
 * @param pricingTable - from SystemConfigs.menu_vip_pricing
 * @param numStaff - 1 or 2
 * @param duration - selected duration in minutes
 * @returns price in VND, or 0 if not found
 */
export const lookupPrice = (
  pricingTable: VipPricingTable,
  numStaff: number,
  duration: VipDuration
): number => {
  const staffKey = String(Math.min(numStaff, 2)); // Cap at 2 KTV
  const durationKey = String(duration);
  return pricingTable?.[staffKey]?.[durationKey] ?? 0;
};

/**
 * Full pricing calculation — single entry point.
 *
 * @param selectedSkillIds - skill IDs the customer selected
 * @param numStaff - number of KTV (1 or 2)
 * @param selectedDuration - customer's chosen duration (will be clamped to >= minDuration)
 * @param pricingTable - pricing data from SystemConfigs
 */
export const calculateVipPrice = (
  selectedSkillIds: string[],
  numStaff: number,
  selectedDuration: VipDuration,
  pricingTable: VipPricingTable
): VipPricingResult => {
  const { leCount, chinhCount, totalCount, minDuration } = calculateMinDuration(selectedSkillIds);

  // Clamp duration to at least minDuration
  const effectiveDuration = (
    selectedDuration >= minDuration ? selectedDuration : minDuration
  ) as VipDuration;

  const availableDurations = getAvailableDurations(minDuration);
  const price = lookupPrice(pricingTable, numStaff, effectiveDuration);
  const pricePerMinute = effectiveDuration > 0 ? Math.round(price / effectiveDuration) : 0;

  return {
    leCount,
    chinhCount,
    totalCount,
    minDuration,
    availableDurations,
    price,
    pricePerMinute,
  };
};
