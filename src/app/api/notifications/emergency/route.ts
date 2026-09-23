import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, customerName, message, type = 'EMERGENCY' } = body;

        console.log('[Emergency API] Received payload:', { bookingId, customerName, type });

        if (!bookingId) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) {
            console.error('[Emergency API] supabaseAdmin is null — SUPABASE_SECRET_KEY missing?');
            return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
        }

        /**
         * SCHEMA StaffNotifications:
         * - id: UUID (PK, auto-generated)
         * - bookingId: TEXT
         * - type: TEXT ('EMERGENCY' | 'NORMAL')
         * - message: TEXT
         * - isRead: BOOLEAN
         * - createdAt: TIMESTAMPTZ (auto default hoặc truyền tay)
         * - employeeId: TEXT (optional)
         */
        const insertPayload = {
            bookingId,
            // ✅ Dùng 'EMERGENCY' — khớp với SOUND_MAP và isCritical check trong admin
            type: 'EMERGENCY',
            message: message || `Khách hàng ${customerName || 'vô danh'} yêu cầu hỗ trợ khẩn cấp tại phòng.`,
            isRead: false,
            createdAt: new Date().toISOString(),
        };


        console.log('[Emergency API] Inserting into StaffNotifications:', insertPayload);

        const { data, error } = await supabaseAdmin
            .from('StaffNotifications')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            // Log FULL error object để dễ debug trên Vercel Function Logs
            console.error('🚨 [Emergency API] Supabase INSERT error:', JSON.stringify(error, null, 2));
            return NextResponse.json({ 
                error: error.message, 
                code: error.code,
                details: error.details,
                hint: error.hint 
            }, { status: 500 });
        }

        console.log('[Emergency API] ✅ Inserted successfully:', data?.id);
        return NextResponse.json({ success: true, notification: data }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [Emergency API] Critical Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
