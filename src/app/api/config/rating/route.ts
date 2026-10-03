import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { RATING_CONFIG_KEYS, normalizeScale, mergeLabels, DEFAULT_RATING_LABELS } from '@/lib/ratingScale';

export const dynamic = 'force-dynamic';

/**
 * GET /api/config/rating
 * Customer rating scale (4|5) + level labels set by admin. Never returns deduction tables.
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        if (!supabase) return NextResponse.json({ scale: 4, labels: DEFAULT_RATING_LABELS });
        const { data } = await supabase
            .from('SystemConfigs')
            .select('key, value')
            .in('key', [RATING_CONFIG_KEYS.scale, RATING_CONFIG_KEYS.labels]);
        const byKey = Object.fromEntries((data || []).map((row: any) => [row.key, row.value]));
        return NextResponse.json({ scale: normalizeScale(byKey[RATING_CONFIG_KEYS.scale]), labels: mergeLabels(byKey[RATING_CONFIG_KEYS.labels]) });
    } catch (error) {
        console.error('[config/rating] read failed, using defaults:', error);
        return NextResponse.json({ scale: 4, labels: DEFAULT_RATING_LABELS });
    }
}
