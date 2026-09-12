import { SupabaseClient } from '@supabase/supabase-js';
import { ALL_VIP_SKILLS } from '@/lib/vipSkills.constants';
import { getVipServiceId } from '@/lib/vipPricingEngine';
import { DEEP_BODY_SKILL_MAP, formatDeepBodyAdminName } from '@/lib/deepBody.constants';

// =============================================
// 👑 VIP Items Handler
// Ported from /api/booking/vip-appointment/route.ts (Step 6.5)
// Handles: Build display name from skills, assign KTV per item,
// insert into BookingItems with VIP-specific options
// =============================================

const SKILL_MAP = Object.fromEntries(ALL_VIP_SKILLS.map(s => [s.id, s]));

export async function handleVipItems(
    supabase: SupabaseClient,
    bookingId: string,
    vipItems: any[],
    startIndex: number = 0
): Promise<void> {
    // Helper determine display name for VIP / Deep Body items
    const getVipItemName = (item: any): { displayName: string; adminSkills: string[] } => {
        const skillIds: string[] = item.vipSkillIds || [];
        const isDeepBody =
            skillIds.some(id => id in DEEP_BODY_SKILL_MAP) ||
            (typeof item.serviceId === 'string' && item.serviceId.startsWith('NHT')) ||
            (typeof item.id === 'string' && item.id.startsWith('NHT')) ||
            (typeof item.vipDisplayName === 'string' && (
                item.vipDisplayName.toLowerCase().includes('deep body') ||
                item.vipDisplayName.toLowerCase().includes('body chuyên sâu') ||
                item.vipDisplayName.toLowerCase().includes('trị liệu chuyên sâu')
            ));

        if (isDeepBody) {
            const adminName = formatDeepBodyAdminName(skillIds);
            return {
                displayName: adminName,
                adminSkills: [adminName],
            };
        }

        const skillNames = skillIds.map((id: string) => {
            let name = SKILL_MAP[id]?.name?.vi || id;
            if (name.toLowerCase().includes('ráy')) name = 'Ráy';
            if (name.toLowerCase().includes('nail') || name.toLowerCase().includes('móng')) name = 'Nail';
            return name;
        });
        const uniqueSkillNames = [...new Set(skillNames)];
        const displayName = uniqueSkillNames.length > 0 ? uniqueSkillNames.join(' + ') : 'Gói VIP';
        return {
            displayName,
            adminSkills: skillIds,
        };
    };

    // Group items by displayName and duration to determine numKtvs (Tứ thủ = 2, Single = 1)
    const groupMap = new Map<string, number>();
    for (const item of vipItems) {
        const { displayName } = getVipItemName(item);
        const duration = item.vipDuration ?? item.timeValue ?? 60;
        const key = `${displayName}||${duration}`;
        groupMap.set(key, (groupMap.get(key) || 0) + 1);
    }

    const itemsToInsert = vipItems.map((item: any, index: number) => {
        const { displayName, adminSkills } = getVipItemName(item);
        const duration = item.vipDuration ?? item.timeValue ?? 60;
        
        const key = `${displayName}||${duration}`;
        const numKtvs = groupMap.get(key) || 1;
        const targetServiceId =
            item.serviceId ||
            item.options?.serviceId ||
            (item.id && (item.id.startsWith('NHT') || item.id.startsWith('NHP'))
                ? item.id
                : getVipServiceId(numKtvs, duration));

        return {
            id: `${bookingId}-vip${startIndex + index + 1}`,
            bookingId: bookingId,
            serviceId: targetServiceId, // Lưu chuẩn mã dịch vụ trong DB (NHT0002, NHT0003, NHT0004...)
            quantity: 1,
            price: item.priceVND || 0,
            technicianCodes: item.vipStaffId ? [item.vipStaffId] : [],
            status: 'WAITING',
            options: {
                displayName,
                vipDuration: duration,
                selectedSkills: adminSkills,
                customerNotes: item.vipCustomerNotes || '',
            }
        };
    });

    const { error } = await supabase
        .from('BookingItems')
        .insert(itemsToInsert);

    if (error) {
        console.error('[handleVipItems] BookingItems insert error:', error);
        throw error;
    }
}

