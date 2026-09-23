import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { realContact, findVisitorByContact } from '@/lib/bookingCustomer';

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
    const { phone, email } = realContact({ phone: searchParams.get('phone'), email: searchParams.get('email') });

    if ((!phone && !email) || (phone && email)) {
      return NextResponse.json(
        { success: false, error: 'Phone or email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database client not initialized' },
        { status: 503 }
      );
    }

    const customer = await findVisitorByContact(supabase, phone, email);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' });
    }

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    console.error('Lookup error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
