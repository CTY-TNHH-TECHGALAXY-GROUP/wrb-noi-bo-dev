export const STRENGTH_LEVELS = ['light', 'medium', 'strong'] as const;
export type StrengthLevel = (typeof STRENGTH_LEVELS)[number];

export function allowedStrengths(config: unknown): StrengthLevel[] {
    if (config === null || config === undefined) return [...STRENGTH_LEVELS];
    if (typeof config !== 'object' || Array.isArray(config)) return [];
    const values = config as Record<string, unknown>;
    return STRENGTH_LEVELS.filter(level => values[level] === true);
}

export function normalizeStrength(value: unknown): StrengthLevel | null {
    if (typeof value !== 'string') return null;
    const levels: Record<string, StrengthLevel> = {
        light: 'light', soft: 'light', nhẹ: 'light', nhe: 'light',
        medium: 'medium', normal: 'medium', vừa: 'medium', vua: 'medium',
        strong: 'strong', hard: 'strong', mạnh: 'strong', manh: 'strong',
    };
    return levels[value.trim().toLowerCase()] || null;
}

export function isStrengthAvailable(showStrength: unknown, config: unknown, value: unknown): boolean {
    const level = normalizeStrength(value);
    return showStrength === true && level !== null && allowedStrengths(config).includes(level);
}
