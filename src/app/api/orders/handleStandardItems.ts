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
): Promise<void> {
    const processedItems = items.map((item: any) => {
        const opts = item.options || {};
        const strengthVN = toVietnamese(opts.strength || 'Medium');
        const therapistVN = toVietnamese(opts.therapist || 'Random');
        const focusVN = (opts.bodyParts?.focus || []).map((f: string) => toVietnamese(f));
        const avoidVN = (opts.bodyParts?.avoid || []).map((a: string) => toVietnamese(a));

        const tagList = [];
        if (opts.notes?.tag0) tagList.push(toVietnamese('pregnant'));
        if (opts.notes?.tag1) tagList.push(toVietnamese('allergy'));

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
            note: opts.notes?.content || ''
        };
    });

    const itemsToInsert = processedItems.map((pi: any, index: number) => ({
        id: `${bookingId}-item${startIndex + index + 1}`,
        bookingId: bookingId,
        serviceId: pi.id,
        quantity: pi.qty,
        price: pi.price,
        options: {
            strength: pi.strength,
            therapist: pi.therapist,
            focus: pi.focus,
            avoid: pi.avoid,
            tags: pi.tags,
            note: pi.note
        }
    }));

    const { error } = await supabase
        .from('BookingItems')
        .insert(itemsToInsert);

    if (error) throw error;
}
