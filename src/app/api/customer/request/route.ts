import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const CustomerRequestSchema = z.object({
    bookingId: z.string().min(1),
    accessToken: z.string().min(1),
    type: z.enum(['WATER', 'SUPPORT', 'EMERGENCY', 'CHECKOUT']),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parseResult = CustomerRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ success: false, error: parseResult.error.issues[0].message }, { status: 400 });
        }
        const { bookingId, accessToken, type } = parseResult.data;

        const supabase = getSupabaseAdmin();
        if (!supabase) throw new Error('Supabase admin not initialized');

        // 2. Validate accessToken
        const { data: booking, error: bookingError } = await supabase
            .from('Bookings')
            .select('id, roomName, bedId')
            .eq('id', bookingId)
            .eq('accessToken', accessToken)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ success: false, error: 'Unauthorized or Booking not found' }, { status: 403 });
        }

        // 3. Rate limit check (3 minutes)
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { data: recentNotif } = await supabase
            .from('StaffNotifications')
            .select('id')
            .eq('bookingId', bookingId)
            .eq('type', `CUSTOMER_${type}`)
            .eq('source', 'CUSTOMER')
            .gte('createdAt', threeMinutesAgo)
            .limit(1);

        if (recentNotif && recentNotif.length > 0) {
            return NextResponse.json({ success: false, error: 'Vui lòng đợi 3 phút trước khi gửi yêu cầu tương tự' }, { status: 429 });
        }

        // 4. Lấy roomName từ booking
        const roomName = booking.roomName || '???';
        const bedId = booking.bedId || '';
        const roomInfo = `Phòng ${roomName}${bedId ? ` giường ${bedId}` : ''}`;

        // 5. Map message
        const messageMap: Record<string, string> = {
            'WATER': `👤 Khách ${roomInfo} yêu cầu mang nước/trà`,
            'SUPPORT': `👤 Khách ${roomInfo} yêu cầu hỗ trợ`,
            'EMERGENCY': `🚨 Khách ${roomInfo} BÁO KHẨN CẤP`,
            'CHECKOUT': `👤 Khách ${roomInfo} muốn thanh toán`,
        };
        const message = messageMap[type];

        // 6. Insert StaffNotifications
        const { data: notification, error: insertError } = await supabase
            .from('StaffNotifications')
            .insert({
                type: `CUSTOMER_${type}`,
                message,
                bookingId,
                source: 'CUSTOMER',
                isRead: false
            })
            .select('id')
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, requestId: notification.id });
    } catch (error: any) {
        console.error('API Error (POST /api/customer/request):', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
