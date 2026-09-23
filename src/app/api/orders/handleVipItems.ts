import { SupabaseClient } from '@supabase/supabase-js';
import { ALL_VIP_SKILLS } from '@/lib/vipSkills.constants';
import { resolveVipServiceId } from '@/lib/vipPricingEngine';
import { DEEP_BODY_SKILL_MAP, formatDeepBodyAdminName } from '@/lib/deepBody.constants';
import { translateText } from '@/lib/translationService';

// =============================================
// 👑 VIP Items Handler
// Ported from /api/booking/vip-appointment/route.ts (Step 6.5)
// Handles: Build display name from skills, assign KTV per item,
// insert into BookingItems with VIP-specific options
// =============================================

const SKILL_MAP = Object.fromEntries(ALL_VIP_SKILLS.map(s => [s.id, s]));

// Dictionary mapping multilingual body area keywords to standardized uppercase keys
const BODY_AREA_KEY_MAP: Record<string, string> = {
    // English
    head: 'HEAD', neck: 'NECK', shoulder: 'SHOULDER', shoulders: 'SHOULDER',
    arm: 'ARM', arms: 'ARM', back: 'BACK', thigh: 'THIGH', knee: 'KNEE',
    calf: 'CALF', foot: 'FOOT', feet: 'FOOT',
    // Vietnamese
    'đầu': 'HEAD', 'cổ': 'NECK', 'vai': 'SHOULDER', 'tay': 'ARM', 'lưng': 'BACK',
    'đùi': 'THIGH', 'gối': 'KNEE', 'bắp chân': 'CALF', 'bàn chân': 'FOOT',
    // Chinese
    '头部': 'HEAD', '头': 'HEAD', '颈部': 'NECK', '颈': 'NECK',
    '肩部': 'SHOULDER', '肩': 'SHOULDER', '手臂': 'ARM', '手': 'ARM',
    '背部': 'BACK', '背': 'BACK', '大腿': 'THIGH', '膝盖': 'KNEE',
    '小腿': 'CALF', '脚': 'FOOT', '足部': 'FOOT',
    // Korean
    '머리': 'HEAD', '목': 'NECK', '어깨': 'SHOULDER', '팔': 'ARM',
    '등': 'BACK', '허벅지': 'THIGH', '무릎': 'KNEE', '종아리': 'CALF', '발': 'FOOT',
    // Japanese
    '首': 'NECK', '腕': 'ARM', '膝': 'KNEE'
};

const AREA_TO_VN: Record<string, string> = {
    HEAD: 'Đầu',
    NECK: 'Cổ',
    SHOULDER: 'Vai',
    ARM: 'Tay',
    BACK: 'Lưng',
    THIGH: 'Đùi',
    KNEE: 'Gối',
    CALF: 'Bắp chân',
    FOOT: 'Bàn chân',
};

export function validateVipItems(vipItems: any[]): void {
    for (const item of vipItems) {
        resolveVipServiceId(
            String(item.serviceId || item.options?.serviceId || item.id || ''),
            item.vipDuration ?? item.timeValue ?? 60,
            1,
            item.vipDisplayName || item.options?.displayName || ''
        );
    }
}

// Helper parsing areas from notes string if array is not provided
function parseAreasFromText(text: string, prefixRegex: RegExp): string[] {
    const match = text.match(prefixRegex);
    if (!match || !match[1]) return [];
    const rawList = match[1].split(/[,、•|]+/).map(s => s.trim().toLowerCase());
    const areas: string[] = [];
    for (const raw of rawList) {
        if (BODY_AREA_KEY_MAP[raw] && !areas.includes(BODY_AREA_KEY_MAP[raw])) {
            areas.push(BODY_AREA_KEY_MAP[raw]);
        }
    }
    return areas;
}

export async function handleVipItems(
    supabase: SupabaseClient,
    bookingId: string,
    vipItems: any[],
    startIndex: number = 0,
    customerLang?: string
): Promise<void> {
    // Helper determine display name for VIP / Deep Body items
    const getVipItemName = (item: any): { displayName: string; adminSkills: string[]; isDeepBody: boolean } => {
        const skillIds: string[] = item.vipSkillIds || [];
        const serviceId = String(item.serviceId || item.options?.serviceId || item.id || '');
        const deepBodyName = typeof item.vipDisplayName === 'string' && (
            item.vipDisplayName.toLowerCase().includes('deep body') ||
            item.vipDisplayName.toLowerCase().includes('body chuyên sâu') ||
            item.vipDisplayName.toLowerCase().includes('trị liệu chuyên sâu')
        );
        const isDeepBody =
            deepBodyName || (serviceId.startsWith('NHT') && skillIds.some(id => id in DEEP_BODY_SKILL_MAP));

        if (isDeepBody) {
            const adminName = formatDeepBodyAdminName(skillIds);
            return {
                displayName: adminName,
                adminSkills: [adminName],
                isDeepBody: true,
            };
        }

        const skillNames = skillIds.map((id: string) => {
            let name = SKILL_MAP[id]?.name?.vi || id;
            if (name.toLowerCase().includes('ráy')) name = 'Ráy';
            if (name.toLowerCase().includes('nail') || name.toLowerCase().includes('móng')) name = 'Nail';
            return name;
        });
        const uniqueSkillNames = [...new Set(skillNames)];
        const displayName = uniqueSkillNames.length > 0
            ? uniqueSkillNames.join(' + ')
            : (serviceId.startsWith('NHT') || /^Therapy Service/.test(item.vipDisplayName || '')
                ? 'Điều trị Therapy'
                : (item.vipDisplayName || item.options?.displayName || 'Gói VIP'));
        return {
            displayName,
            adminSkills: skillIds,
            isDeepBody: false,
        };
    };

    // Each addVipToCart call is one package, even if another package has the same name/duration.
    const groupMap = new Map<string, number>();
    for (const item of vipItems) {
        const duration = item.vipDuration ?? item.timeValue ?? 60;
        const key = item.vipGroupId || item.options?.vipGroupId || `${item.vipDisplayName || item.options?.displayName}||${duration}`;
        groupMap.set(key, (groupMap.get(key) || 0) + 1);
    }

    const itemsToInsert = await Promise.all(vipItems.map(async (item: any, index: number) => {
        const { displayName, adminSkills, isDeepBody } = getVipItemName(item);
        const duration = item.vipDuration ?? item.timeValue ?? 60;
        
        const key = item.vipGroupId || item.options?.vipGroupId || `${item.vipDisplayName || item.options?.displayName}||${duration}`;
        const numKtvs = groupMap.get(key) || 1;
        const requestedId = String(item.serviceId || item.options?.serviceId || item.id || '');
        const targetServiceId = resolveVipServiceId(
            requestedId, duration, numKtvs, item.vipDisplayName || item.options?.displayName || ''
        );

        const isNht = isDeepBody || targetServiceId.startsWith('NHT');

        // Extract focus and avoid
        let focus: string[] = item.vipFocus || item.options?.focus || item.bodyParts?.focus || item.focus || [];
        let avoid: string[] = item.vipAvoid || item.options?.avoid || item.bodyParts?.avoid || item.avoid || [];
        let rawNote: string = item.vipNote || item.options?.note || item.specialNote || item.note || '';

        const rawCustomerNotes = item.vipCustomerNotes || item.options?.customerNotes || '';

        // Fallback: parse from rawCustomerNotes if focus/avoid empty
        if (focus.length === 0 && rawCustomerNotes) {
            focus = parseAreasFromText(
                rawCustomerNotes,
                /(?:Tập trung|Focus|重点|집중)[:：]\s*([^•|\]]+)/i
            );
        }
        if (avoid.length === 0 && rawCustomerNotes) {
            avoid = parseAreasFromText(
                rawCustomerNotes,
                /(?:Tránh|Avoid|避开|피함|避ける)[:：]\s*([^•|\]]+)/i
            );
        }

        // If rawNote is empty, extract free text outside brackets
        if (!rawNote && rawCustomerNotes) {
            const cleanText = rawCustomerNotes
                .replace(/^[•\s]*/, '')
                .replace(/\[[^\]]+\]/g, '')
                .replace(/\((?:Tứ thủ[^)]*|Four Hands[^)]*|四手[^)]*|포핸즈[^)]*|Mỗi khách[^)]*|Separate[^)]*|独立[^)]*)\)/gi, '')
                .trim();
            if (cleanText) {
                rawNote = cleanText;
            }
        }

        // Translate free-text note if foreign
        let displayNote = rawNote;
        const targetLang = (customerLang || '').toLowerCase();
        const hasChinese = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(rawNote);
        const hasKorean = /[\uac00-\ud7af]/.test(rawNote);
        const hasJapanese = /[\u3040-\u30ff]/.test(rawNote);

        const detectedSource = targetLang === 'cn' || hasChinese
            ? 'zh'
            : targetLang === 'kr' || hasKorean
            ? 'ko'
            : targetLang === 'jp' || hasJapanese
            ? 'ja'
            : targetLang === 'en'
            ? 'en'
            : null;

        if (rawNote && detectedSource) {
            try {
                const transRes = await translateText({
                    text: rawNote,
                    sourceLang: detectedSource,
                    targetLang: 'vi',
                    sender: 'customer'
                });
                if (transRes.translatedText && transRes.translatedText.trim() !== rawNote.trim()) {
                    displayNote = `${transRes.translatedText.trim()} [Gốc: ${rawNote.trim()}]`;
                }
            } catch (err) {
                console.warn('[handleVipItems] Translation error fallback:', err);
            }
        }

        // Format Vietnamese customerNotes for Admin Dispatch tooltip
        const bodyPartsList: string[] = [];
        if (focus.length > 0) {
            bodyPartsList.push(`Tập trung: ${focus.map(k => AREA_TO_VN[k] || k).join(', ')}`);
        }
        if (avoid.length > 0) {
            bodyPartsList.push(`Tránh: ${avoid.map(k => AREA_TO_VN[k] || k).join(', ')}`);
        }

        let modeTag = '';
        if (numKtvs > 1 || /tứ thủ|four hands|四手|포핸즈/i.test(rawCustomerNotes)) {
            modeTag = '(Tứ thủ - 2 KTV)';
        } else if (/mỗi khách|separate|独立|개별/i.test(rawCustomerNotes)) {
            modeTag = '(Mỗi khách 1 KTV)';
        }

        const finalCustomerNotes = [
            bodyPartsList.length > 0 ? `[${bodyPartsList.join(' | ')}]` : '',
            modeTag,
            displayNote
        ].filter(Boolean).join(' ');

        // Update item object so calling functions (notifications, Bookings.notes) also get Vietnamese note
        item.vipCustomerNotes = finalCustomerNotes;

        const optionsPayload: Record<string, any> = {
            displayName,
            vipDuration: duration,
            selectedSkills: adminSkills,
            customerNotes: finalCustomerNotes,
        };
        if (item.vipGroupId || item.options?.vipGroupId) {
            optionsPayload.vipGroupId = item.vipGroupId || item.options.vipGroupId;
        }

        // For NHT (Deep Body), follow exact existing structure from NHS/NHP:
        // top-level keys: focus, avoid, note
        if (isNht || focus.length > 0 || avoid.length > 0 || displayNote) {
            optionsPayload.focus = focus;
            optionsPayload.avoid = avoid;
            optionsPayload.note = displayNote;
        }

        return {
            id: `${bookingId}-vip${startIndex + index + 1}`,
            bookingId: bookingId,
            serviceId: targetServiceId, // Lưu chuẩn mã dịch vụ trong DB (NHT0002, NHT0003, NHT0004...)
            quantity: 1,
            price: item.priceVND || 0,
            technicianCodes: item.vipStaffId ? [item.vipStaffId] : [],
            status: 'WAITING',
            options: optionsPayload
        };
    }));

    const { error } = await supabase
        .from('BookingItems')
        .insert(itemsToInsert);

    if (error) {
        console.error('[handleVipItems] BookingItems insert error:', error);
        throw error;
    }
}
