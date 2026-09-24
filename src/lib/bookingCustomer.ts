import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type Admin = SupabaseClient;
type CustomerInput = { id?: unknown; name?: unknown; phone?: unknown; email?: unknown; gender?: unknown };
type InvoiceInput = Record<string, unknown>;

export const normalizePhone = (value: string) => value.replace(/[\s\-()]/g, '');
export const literalLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

export function realContact(customer: CustomerInput | null | undefined) {
    const rawPhone = typeof customer?.phone === 'string' ? customer.phone.trim() : '';
    const phone = /^GUEST-/i.test(rawPhone) ? '' : normalizePhone(rawPhone);
    const email = typeof customer?.email === 'string' ? customer.email.trim().toLowerCase() : '';
    return {
        phone,
        email: /^guest-.*@no-email\.com$/i.test(email) ? '' : email,
    };
}

export async function saveBookingCustomer(db: Admin, customer: CustomerInput | null | undefined, bookingId: string, createdAt: string, vatInvoice?: InvoiceInput | null) {
    const { phone, email } = realContact(customer);
    // A lookup failure cannot turn valid contact details into a rejected order.
    const [emailMatches, phoneMatches] = await Promise.all([
        email ? Promise.resolve(db.from('Customers').select('id,email,createdAt').ilike('email', literalLike(email)).order('createdAt', { ascending: false, nullsFirst: false }).order('id', { ascending: false }).limit(1)).then(({ data, error }) => error ? [] : data || []).catch(() => []) : Promise.resolve([]),
        phone ? rowsForPhone(db, 'Customers', 'phone', 'id,phone,email,createdAt', phone).catch(() => []) : Promise.resolve([]),
    ]);
    const matchingBoth = email ? phoneMatches.filter(row => String(row.email || '').trim().toLowerCase() === email) : [];
    const candidates = matchingBoth.length ? matchingBoth : [...emailMatches, ...phoneMatches];
    candidates.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || String(b.id).localeCompare(String(a.id)));
    if (candidates[0]) return { customerId: String(candidates[0].id), created: false, phone, email };

    const customerId = `CUS-${crypto.randomBytes(12).toString('base64url')}`;
    const gender = typeof customer?.gender === 'string' ? customer.gender.trim().toLowerCase() : '';
    const normalizedGender = ['male', 'nam'].includes(gender) ? 'male' : ['female', 'nữ', 'nu'].includes(gender) ? 'female' : null;
    const row: Record<string, unknown> = {
        id: customerId,
        fullName: typeof customer?.name === 'string' ? customer.name.trim() || 'Guest' : 'Guest',
        phone: phone || `GUEST-${bookingId}`,
        email: email || `guest-${bookingId}@no-email.com`,
        ...(normalizedGender && { gender: normalizedGender }),
        createdAt,
        updatedAt: createdAt,
    };
    if (vatInvoice && typeof vatInvoice.taxCode === 'string' && vatInvoice.taxCode) Object.assign(row, {
        taxCode: vatInvoice.taxCode,
        companyName: vatInvoice.companyName || null,
        companyAddress: vatInvoice.companyAddress || null,
        companyEmail: vatInvoice.companyEmail || null,
        companyPhone: vatInvoice.companyPhone || null,
    });
    const { error } = await db.from('Customers').insert(row);
    if (error) throw error;
    return { customerId, created: true, phone, email };
}

export async function removeFailedBookingCustomer(db: Admin, customerId: string) {
    const { error } = await db.from('Customers').delete().eq('id', customerId);
    if (error) throw new Error(`Booking failed and customer cleanup failed: ${error.message}`);
}

export async function removeFailedBooking(db: Admin, bookingId: string, customerId: string, created: boolean) {
    // ponytail: REST cleanup is not atomic; move creation into a DB transaction if network-failure rollback must be guaranteed.
    const { error: itemsError } = await db.from('BookingItems').delete().eq('bookingId', bookingId);
    if (itemsError) throw itemsError;
    const { error: bookingError } = await db.from('Bookings').delete().eq('id', bookingId);
    if (bookingError) throw bookingError;
    if (created) await removeFailedBookingCustomer(db, customerId);
}

export async function findVisitorByContact(db: Admin, phone: string, email: string) {
    const field = phone ? 'phone' : 'email';
    const value = phone || email;
    let matches;
    if (phone) matches = await rowsForPhone(db, 'Customers', 'phone', 'id,phone,fullName', phone);
    else {
        const result = await db.from('Customers').select('fullName').ilike(field, literalLike(value)).limit(2);
        if (result.error) throw result.error;
        matches = result.data;
    }
    const customer = matches.length === 1 ? matches[0] : null;
    // Existing customerId links may belong to another person; match the booking contact itself.
    const ids = phone ? await bookingIdsForPhone(db, phone) : [];
    const bookingQuery = db.from('Bookings').select('customerName, customerLang');
    const { data: booking, error: bookingError } = phone && !ids.length
        ? { data: null, error: null }
        : await (phone ? bookingQuery.in('id', ids) : bookingQuery.ilike('customerEmail', literalLike(email)))
            .order('bookingDate', { ascending: false }).limit(1).maybeSingle();
    if (bookingError) throw bookingError;
    if (!matches.length && !booking) return null;
    return {
        fullName: matches.length > 1 ? '' : booking?.customerName || customer?.fullName || '',
        phone,
        email,
        lang: booking?.customerLang || null,
    };
}

export async function bookingIdsForPhone(db: Admin, phone: string) {
    return (await rowsForPhone(db, 'Bookings', 'customerPhone', 'id,customerPhone', phone)).map(row => row.id as string);
}

async function rowsForPhone(db: Admin, table: 'Bookings' | 'Customers', field: 'customerPhone' | 'phone', columns: string, phone: string) {
    if (!/\d{4}$/.test(phone)) return [];
    // ponytail: suffix scan; add an indexed normalized phone column if this grows slow.
    const rows: Record<string, unknown>[] = [];
    for (let start = 0; ; start += 1000) {
        const { data, error } = await db.from(table).select(columns)
            .like(field, `%${phone.slice(-4).split('').join('%')}%`).order('id').range(start, start + 999);
        if (error) throw error;
        const candidates = data as unknown as Record<string, unknown>[];
        rows.push(...candidates.filter(row => normalizePhone(String(row[field] || '')) === phone));
        if (data.length < 1000) return rows;
    }
}
