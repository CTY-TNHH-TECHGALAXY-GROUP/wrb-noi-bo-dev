import { SupabaseClient } from '@supabase/supabase-js';

// =============================================
// 🛒 Standard Items Handler
// Extracted from /api/orders/route.ts
// Handles: processItems with Vietnamese translation, 
// insert into BookingItems with options (strength, therapist, focus, avoid, tags, note)
// =============================================

// Helper to translate Options to Vietnamese
const toVietnamese = (text: string | null | undefined): string => {
    if (!text) return '';
    const map: Record<string, string> = {
        'light': 'Nhẹ', 'medium': 'Vừa', 'strong': 'Mạnh',
        'male': 'Nam', 'female': 'Nữ', 'random': 'Ngẫu nhiên',
        'neck': 'Cổ', 'shoulder': 'Vai', 'back': 'Lưng', 'waist': 'Thắt lưng',
        'arm': 'Tay', 'thigh': 'Đùi', 'calf': 'Bắp chân', 'foot': 'Bàn chân',
        'head': 'Đầu', 'pregnant': 'Mang thai', 'allergy': 'Dị ứng',
        'Medium': 'Vừa', 'Random': 'Ngẫu nhiên'
    };
    const lower = text.toLowerCase();
    if (map[lower]) return map[lower];
    return text.charAt(0).toUpperCase() + text.slice(1);
};

export async function handleStandardItems(
    supabase: SupabaseClient,
    bookingId: string,
    items: any[],
    startIndex: number = 0
): Promise<number> {
    const processedItems = items.map((item: any) => {
        const opts = item.options || {};
        const strengthVN = toVietnamese(opts.strength || 'Medium');
        const therapistVN = toVietnamese(opts.therapist || 'Random');
        const focusVN = (opts.bodyParts?.focus || []).map((f: string) => toVietnamese(f));
        const avoidVN = (opts.bodyParts?.avoid || []).map((a: string) => toVietnamese(a));

        const tagList = [];
        if (opts.notes?.tag0) {
            if (item.TAGS && item.TAGS[0] && (item.TAGS[0].vn || item.TAGS[0].vi || item.TAGS[0].en)) {
                tagList.push(item.TAGS[0].vn || item.TAGS[0].vi || item.TAGS[0].en);
            } else {
                tagList.push(toVietnamese('pregnant'));
            }
        }
        if (opts.notes?.tag1) {
            if (item.TAGS && item.TAGS[1] && (item.TAGS[1].vn || item.TAGS[1].vi || item.TAGS[1].en)) {
                tagList.push(item.TAGS[1].vn || item.TAGS[1].vi || item.TAGS[1].en);
            } else {
                tagList.push(toVietnamese('allergy'));
            }
        }
        if (opts.notes?.privateRoom) {
            tagList.push('Phòng riêng');
        }

        return {
            id: item.id,
            name_en: item.names?.en || item.name,
            name_vn: item.names?.vn || item.name,
            qty: item.qty,
            price: item.priceVND,
            strength: strengthVN,
            therapist: therapistVN,
            focus: focusVN,
            avoid: avoidVN,
            tags: tagList,
            note: opts.notes?.customText || opts.notes?.content || ''
        };
    });

    // Expand items with qty > 1 into separate BookingItem rows (each qty = 1)
    // This ensures each service is a separate row for dispatch/KTV assignment
    const itemsToInsert: any[] = [];
    let globalIndex = 0;

    for (const pi of processedItems) {
        const qty = pi.qty || 1;
        for (let q = 0; q < qty; q++) {
            itemsToInsert.push({
                id: `${bookingId}-item${startIndex + globalIndex + 1}`,
                bookingId: bookingId,
                serviceId: pi.id,
                quantity: 1,
                price: pi.price,
                options: {
                    strength: pi.strength,
                    therapist: pi.therapist,
                    focus: pi.focus,
                    avoid: pi.avoid,
                    tags: pi.tags,
                    note: pi.note
                }
            });
            globalIndex++;
        }
    }

    const { error } = await supabase
        .from('BookingItems')
        .insert(itemsToInsert);

    if (error) throw error;

    return itemsToInsert.length;
}
