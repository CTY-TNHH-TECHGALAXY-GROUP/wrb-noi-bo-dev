import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Chỉ các cột hoá đơn cần. KHÔNG có notes / violations / reception_feedback (nội bộ quầy).
// accessToken lấy ra để quyết định trả journeyToken, không trả thẳng.
//
// ⚠️ Mọi cột ở đây PHẢI có thật trong `Bookings` (xem TableInSupabase.md ở repo Admin).
// PostgREST gặp một cột lạ là trả 400 cho CẢ câu select → `.data` = null → route báo
// "Booking not found" cho mọi đơn. Đã xảy ra 04/10/2026 với `discountAmount`
// (bảng không có cột này; giảm giá luôn = 0). Kiểm bằng `scratch/check_invoice_columns.cjs`.
const INVOICE_BOOKING_COLUMNS =
    'id, billCode, customerName, customerPhone, customerEmail, customerLang, createdAt, bookingDate, timeStart, timeEnd, ' +
    'paymentMethod, totalAmount, status, source, parent_booking_id, roomName, bedId, accessToken';
const INVOICE_PUBLIC_FIELDS = [
    'id', 'billCode', 'customerName', 'customerPhone', 'customerEmail', 'customerLang', 'createdAt', 'bookingDate',
    'timeStart', 'timeEnd', 'paymentMethod', 'totalAmount', 'status', 'source', 'parent_booking_id',
    'roomName', 'bedId',
] as const;
type InvoiceBookingRow = {
    id: string;
    accessToken: string | null;
    totalAmount: number | null;
    [key: string]: unknown;
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bookingId } = await params;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || '';
        
        console.log('[API Invoice] supabaseServiceKey length:', supabaseServiceKey.length);
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false },
            global: { fetch: (url, opts) => fetch(url, { ...opts, cache: 'no-store' }) }
        });

        if (!bookingId) {
            return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
        }

        // Fetch Booking: nhận mã đơn (link phòng chờ / lịch sử) hoặc accessToken (từ màn hành trình).
        // Hai query .eq riêng, không nội suy chuỗi người dùng vào .or() (tránh chèn filter PostgREST).
        const byToken = (await supabase
            .from('Bookings')
            .select(INVOICE_BOOKING_COLUMNS)
            .eq('accessToken', bookingId)
            .maybeSingle()).data as InvoiceBookingRow | null;
        const openedByToken = !!byToken;
        const booking: InvoiceBookingRow | null = byToken || ((await supabase
            .from('Bookings')
            .select(INVOICE_BOOKING_COLUMNS)
            .eq('id', bookingId)
            .maybeSingle()).data as InvoiceBookingRow | null);

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }
        // Token hành trình chỉ trả khi request đến bằng token (QR trên hoá đơn mở từ màn hành trình).
        // Mở bằng mã đơn → không lộ token.
        const journeyToken = booking.accessToken;
        // Whitelist tường minh (không dựa vào danh sách cột của select) — không bao giờ lộ notes/violations/token.
        const publicBooking = Object.fromEntries(INVOICE_PUBLIC_FIELDS.filter(k => k in booking).map(k => [k, booking[k]]));

        // Fetch child bookings if this is a parent booking
        const actualBookingId = booking.id;
        // Cũng không select `discountAmount` ở đây: trước 04/10 câu này lỗi 400 âm thầm
        // (không check error) nên đơn tách chưa bao giờ được cộng tiền đơn con.
        const { data: childBookings, error: cError } = await supabase
            .from('Bookings')
            .select('id, totalAmount')
            .eq('parent_booking_id', actualBookingId);
        if (cError) throw cError;

        const allBookingIds = [actualBookingId, ...(childBookings || []).map(b => b.id)];

        // Bảng Bookings không có cột giảm giá → hoá đơn luôn hiển thị giảm giá 0.
        const aggregatedDiscount = 0;
        let aggregatedTotal = booking.totalAmount || 0;
        
        if (childBookings && childBookings.length > 0) {
            childBookings.forEach(cb => {
                aggregatedTotal += (cb.totalAmount || 0);
            });
        }

        // Fetch Items
        const { data: items, error: iError } = await supabase
            .from('BookingItems')
            .select('*')
            .in('bookingId', allBookingIds);

        if (iError) throw iError;

        // Fetch Services info
        let enrichedItems = items || [];
        if (enrichedItems.length > 0) {
            const serviceIds = enrichedItems.map(i => i.serviceId).filter(Boolean);
            const { data: svcs, error: svError } = await supabase
                .from('Services')
                .select('id, code, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, duration')
                .in('id', serviceIds);

            if (!svError && svcs) {
                const svcMap = new Map();
                svcs.forEach((s: any) => {
                    if (s.id) svcMap.set(String(s.id).trim().toLowerCase(), s);
                    if (s.code) svcMap.set(String(s.code).trim().toLowerCase(), s);
                });
                
                enrichedItems = enrichedItems.map(i => {
                    const sId = String(i.serviceId || '').trim().toLowerCase();
                    const svc = svcMap.get(sId);
                    const customName = typeof i.options?.displayName === 'string' && i.options?.vipDuration != null
                        ? i.options.displayName.trim()
                        : '';
                    
                    const getName = () => {
                        const n = svc?.nameVN || svc?.nameEN || svc?.name;
                        if (typeof n === 'object' && n !== null) return n.vn || n.en || String(n);
                        return n || `Dịch vụ ${i.serviceId || 'Chưa rõ'}`;
                    };

                    return {
                        ...i,
                        serviceName: customName || getName(),
                        serviceNameEN: customName || svc?.nameEN || '',
                        serviceNameCN: customName || svc?.nameCN || '',
                        serviceNameJP: customName || svc?.nameJP || '',
                        serviceNameKR: customName || svc?.nameKR || '',
                        originalPrice: svc?.priceVND || i.price,
                        duration: i.options?.vipDuration ?? i.duration ?? svc?.duration ?? 60
                    };
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...publicBooking,
                journeyToken: openedByToken ? journeyToken : null,
                discountAmount: aggregatedDiscount,
                totalAmount: aggregatedTotal,
                items: enrichedItems
            }
        });
    } catch (error: any) {
        console.error('[API Invoice] Error fetching booking:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
