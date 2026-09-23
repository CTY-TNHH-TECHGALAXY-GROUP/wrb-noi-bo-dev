import assert from 'node:assert/strict';
import { realContact, literalLike, saveBookingCustomer, removeFailedBookingCustomer, removeFailedBooking, findVisitorByContact } from '../src/lib/bookingCustomer';
import { rememberCustomerVisit, startGuestVisit, shouldAutofillAuth } from '../src/lib/customerVisit';

/* eslint-disable @typescript-eslint/no-explicit-any */

const customers: any[] = [];
const bookings: any[] = [];
const items: any[] = [];
const db: any = {
    from(table: string) {
        const rows = table === 'Customers' ? customers : table === 'Bookings' ? bookings : items;
        return {
            select: () => {
                let filtered = rows;
                let count = rows.length;
                const query = {
                    eq: (field: string, value: string) => { filtered = filtered.filter(row => row[field] === value); return query; },
                    ilike: (field: string, value: string) => { const literal = value.replace(/\\([\\%_])/g, '$1').toLowerCase(); filtered = filtered.filter(row => String(row[field] || '').toLowerCase() === literal); return query; },
                    like: (field: string, value: string) => { const pattern = new RegExp('^' + value.split('%').join('.*') + '$'); filtered = filtered.filter(row => pattern.test(String(row[field] || ''))); return query; },
                    in: (field: string, values: string[]) => { filtered = filtered.filter(row => values.includes(row[field])); return query; },
                    order: () => query,
                    limit: (n: number) => { count = n; return query; },
                    range: async (start: number, end: number) => ({ data: filtered.slice(start, end + 1), error: null }),
                    maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
                    then: (resolve: (value: any) => void) => resolve({ data: filtered.slice(0, count), error: null }),
                };
                return query;
            },
            insert: async (row: any) => {
                if (rows.some(old => old.id === row.id || (table === 'Customers' && old.phone.startsWith('GUEST-') && old.phone === row.phone))) {
                    return { error: { message: 'duplicate key', code: '23505' } };
                }
                rows.push(row);
                return { error: null };
            },
            delete: () => ({ eq: async (field: string, value: string) => {
                for (let i = rows.length - 1; i >= 0; i--) if (rows[i][field] === value) rows.splice(i, 1);
                return { error: null };
            } }),
        };
    },
};

async function main() {
    assert.deepEqual(realContact({ phone: 'GUEST-BK-1', email: 'guest-BK-1@no-email.com' }), { phone: '', email: '' });
    assert.equal(literalLike('a_b%\\'), 'a\\_b\\%\\\\');
    const [first, second] = await Promise.all([
        saveBookingCustomer(db, { name: 'Hsiu', email: 'hsiu@example.com', id: 'old-id' }, 'BK-1', 'now'),
        saveBookingCustomer(db, { name: 'Dan', email: 'dan@example.com', id: 'old-id' }, 'BK-2', 'now'),
    ]);
    assert.notEqual(first.customerId, second.customerId);
    assert.deepEqual(customers.map(c => c.phone).sort(), ['GUEST-BK-1', 'GUEST-BK-2']);
    assert.equal(customers[0].fullName, 'Hsiu');
    const returning = await saveBookingCustomer(db, { name: 'Changed', email: 'hsiu@example.com' }, 'BK-3', 'later');
    assert.equal(returning.customerId, first.customerId);
    assert.equal(customers[0].fullName, 'Hsiu');
    customers.push({ id: 'formatted-customer', fullName: 'Formatted', phone: '090 888-7777', email: 'FORMAT@example.com' });
    assert.equal((await saveBookingCustomer(db, { phone: '0908887777' }, 'BK-FORMAT', 'now')).customerId, 'formatted-customer');
    assert.equal((await saveBookingCustomer(db, { email: 'format@example.com' }, 'BK-CASE', 'now')).customerId, 'formatted-customer');
    customers.push({ id: 'phone-owner', fullName: 'Phone owner', phone: '0901234567', email: 'phone@example.com' });
    await assert.rejects(saveBookingCustomer(db, { email: 'hsiu@example.com', phone: '0901234567' }, 'BK-4', 'now'), /different customers/);
    assert.equal(customers.length, 4);

    const sameId = await Promise.allSettled([
        saveBookingCustomer(db, { email: 'collision-a@example.com' }, 'BK-COLLISION', 'now'),
        saveBookingCustomer(db, { email: 'collision-b@example.com' }, 'BK-COLLISION', 'now'),
    ]);
    assert.equal(sameId.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(sameId.filter(result => result.status === 'rejected').length, 1);
    const survivor = sameId.find(result => result.status === 'fulfilled') as PromiseFulfilledResult<Awaited<ReturnType<typeof saveBookingCustomer>>>;
    await removeFailedBookingCustomer(db, survivor.value.customerId);
    assert.equal(customers.some(c => c.phone === 'GUEST-BK-COLLISION'), false);

    const collision = await saveBookingCustomer(db, { email: 'another@example.com' }, 'BK-5', 'now');
    await removeFailedBookingCustomer(db, collision.customerId);
    assert.equal(customers.some(c => c.phone === 'GUEST-BK-5'), false);
    bookings.push({ id: 'BK-6' });
    items.push({ bookingId: 'BK-6' });
    const failed = await saveBookingCustomer(db, { email: 'failed@example.com' }, 'BK-6', 'now');
    await removeFailedBooking(db, 'BK-6', failed.customerId, failed.created);
    assert.equal(customers.some(c => c.id === failed.customerId), false);
    assert.equal(bookings.length, 0);
    assert.equal(items.length, 0);

    bookings.push({ id: 'legacy', customerId: 'wrong-customer', customerEmail: 'old@example.com', customerName: 'Original', customerLang: 'jp' });
    assert.deepEqual(await findVisitorByContact(db, '', 'old@example.com'), {
        fullName: 'Original', phone: '', email: 'old@example.com', lang: 'jp',
    });
    assert.equal(await findVisitorByContact(db, '', 'missing@example.com'), null);
    bookings.push({ id: 'formatted', customerPhone: '090 123-4567', customerName: 'Formatted', customerLang: 'vi' });
    bookings.push({ id: 'other', customerPhone: '097 123-4567', customerName: 'Other', customerLang: 'vi' });
    assert.deepEqual(await findVisitorByContact(db, '0901234567', ''), {
        fullName: 'Formatted', phone: '0901234567', email: '', lang: 'vi',
    });
    bookings.push({ id: 'caps', customerEmail: 'MiXeD@example.com', customerName: 'Caps', customerLang: 'en' });
    assert.equal((await findVisitorByContact(db, '', 'mixed@example.com'))?.fullName, 'Caps');

    const values = new Map<string, string>();
    (globalThis as any).localStorage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
    };
    rememberCustomerVisit('Hsiu@Example.com', 'Hsiu');
    assert.equal(values.get('currentUserLookup'), 'email:hsiu@example.com');
    assert.equal(shouldAutofillAuth({ email: 'hsiu@example.com' }), true);
    rememberCustomerVisit('090 123-4567', 'Dan');
    assert.equal(values.get('currentUserEmail'), undefined);
    assert.equal(values.get('currentUserLookup'), 'phone:0901234567');
    assert.equal(shouldAutofillAuth({ email: 'hsiu@example.com' }), false);
    startGuestVisit();
    assert.equal(values.get('currentUserLookup'), undefined);
    assert.equal(shouldAutofillAuth({ email: 'hsiu@example.com' }), false);
    console.log('booking customer checks passed');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
