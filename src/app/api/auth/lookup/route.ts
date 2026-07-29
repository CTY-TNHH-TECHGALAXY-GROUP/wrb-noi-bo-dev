import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/auth/lookup?phone=0901234567
 * GET /api/auth/lookup?email=abc@gmail.com
 *
 * Lookup customer in Customers table by phone or email.
 * Returns customer info if found.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!phone && !email) {
      return NextResponse.json(
        { success: false, error: 'Phone or email is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('Customers')
      .select('id, fullName, phone, email');

    if (phone) {
      // Normalize phone: remove spaces, dashes
      const normalizedPhone = phone.replace(/[\s\-()]/g, '');
      query = query.eq('phone', normalizedPhone);
    } else if (email) {
      query = query.ilike('email', email);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Customer lookup error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Customer not found' });
    }

    // FETCH LATEST LANG FROM BOOKINGS
    const { data: bookingData, error: bookingError } = await supabase
      .from('Bookings')
      .select('customerLang')
      .eq('customerId', data.id)
      .order('bookingDate', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bookingError) {
        console.error('Fetch customerLang error:', bookingError);
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: data.id,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        lang: bookingData?.customerLang || null
      },
    });
  } catch (err: any) {
    console.error('Lookup error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
