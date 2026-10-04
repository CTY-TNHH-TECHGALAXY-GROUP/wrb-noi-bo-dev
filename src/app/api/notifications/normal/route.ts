import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// 🔧 CONFIGURATION
const RATE_LIMIT_SECONDS = 60;
const MESSAGE_MAX_LENGTH = 500;
const NOTIFICATION_TYPE = 'BUY_MORE';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, customerName, message, type = 'NORMAL' } = body;

        console.log('[Normal API] Received payload:', { bookingId, customerName, type });

        if (typeof bookingId !== 'string' || !bookingId.trim()) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) {
            console.error('[Normal API] supabaseAdmin is null — SUPABASE_SECRET_KEY missing?');
            return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
        }

        // 🔒 bookingId phải là accessToken của một đơn có thật (trang Journey luôn gửi token).
        // Giá trị ghi vào StaffNotifications.bookingId giữ nguyên như client gửi (quyết định 04/10).
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('Bookings')
            .select('id')
            .eq('accessToken', bookingId.trim())
            .maybeSingle();
        if (ownerError) {
            console.error('[Normal API] resolve error:', ownerError);
            return NextResponse.json({ error: ownerError.message }, { status: 500 });
        }
        if (!owner) {
            return NextResponse.json({ error: 'Unauthorized or Booking not found' }, { status: 403 });
        }

        // Chống spam chuông: cùng đơn + cùng type trong RATE_LIMIT_SECONDS → 429
        const sinceIso = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
            .from('StaffNotifications')
            .select('id')
            .eq('bookingId', bookingId)
            .eq('type', NOTIFICATION_TYPE)
            .gte('createdAt', sinceIso)
            .limit(1);
        if (recent && recent.length > 0) {
            return NextResponse.json({ error: 'Vui lòng đợi trước khi gửi lại' }, { status: 429 });
        }

        const safeMessage = typeof message === 'string' ? message.slice(0, MESSAGE_MAX_LENGTH) : '';

        const insertPayload = {
            bookingId,
            // ✅ Dùng 'BUY_MORE' — admin đã có UI với màu tím và icon đẹp sẵn
            type: NOTIFICATION_TYPE,
            message: safeMessage || `Khách hàng ${customerName || 'vô danh'} yêu cầu thêm dịch vụ.`,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        console.log('[Normal API] Inserting into StaffNotifications:', insertPayload);

        const { data, error } = await supabaseAdmin
            .from('StaffNotifications')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            // Log FULL error object để dễ debug trên Vercel Function Logs
            console.error('🚨 [Normal API] Supabase INSERT error:', JSON.stringify(error, null, 2));
            return NextResponse.json({
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            }, { status: 500 });
        }

        console.log('[Normal API] ✅ Inserted successfully:', data?.id);
        return NextResponse.json({ success: true, notification: data }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [Normal API] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
