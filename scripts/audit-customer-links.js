const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
});

async function readAll(table, columns) {
    const rows = [];
    for (let start = 0; ; start += 1000) {
        const { data, error } = await db.from(table).select(columns).order('id').range(start, start + 999);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 1000) return rows;
    }
}

async function main() {
    const [bookings, customers] = await Promise.all([
        readAll('Bookings', 'id,customerId,customerEmail,customerPhone'),
        readAll('Customers', 'id,email,phone'),
    ]);
    const customerById = new Map(customers.map(customer => [customer.id, customer]));
    const bookingsById = new Map();
    const guestPhones = new Map();
    const realPhones = new Map();
    const report = { generatedAt: new Date().toISOString(), bookingCount: bookings.length, customerCount: customers.length,
        mixedCaseBookingEmails: 0, formattedBookingPhones: 0, mixedCaseCustomerEmails: 0, formattedCustomerPhones: 0, guestPhoneCustomers: 0,
        mismatchedLinks: [], partialMatches: [], bookingsWithoutCustomerId: [], brokenCustomerLinks: [], unverifiableLinks: [], duplicateBookingIds: [], duplicateGuestPhones: [], duplicateRealPhoneCustomers: [] };

    for (const booking of bookings) {
        const count = (bookingsById.get(booking.id) || 0) + 1;
        bookingsById.set(booking.id, count);
        const customer = customerById.get(booking.customerId);
        if (booking.customerEmail && booking.customerEmail !== booking.customerEmail.toLowerCase()) report.mixedCaseBookingEmails++;
        if (booking.customerPhone && /[\s\-()]/.test(booking.customerPhone)) report.formattedBookingPhones++;
        if (!booking.customerId) {
            report.bookingsWithoutCustomerId.push({ bookingId: booking.id });
            continue;
        }
        if (!customer) {
            report.brokenCustomerLinks.push({ bookingId: booking.id, customerId: booking.customerId });
            continue;
        }
        const email = String(booking.customerEmail || '').trim().toLowerCase();
        const phone = String(booking.customerPhone || '').trim().replace(/[\s\-()]/g, '');
        const emailMatches = !!email && email === String(customer.email || '').trim().toLowerCase();
        const phoneMatches = !!phone && phone === String(customer.phone || '').trim().replace(/[\s\-()]/g, '');
        if (!email && !phone) report.unverifiableLinks.push({ bookingId: booking.id, customerId: booking.customerId });
        else if (!emailMatches && !phoneMatches) report.mismatchedLinks.push({ bookingId: booking.id, customerId: booking.customerId });
        else if (email && phone && emailMatches !== phoneMatches) report.partialMatches.push({ bookingId: booking.id, customerId: booking.customerId });
    }
    for (const [id, count] of bookingsById) if (count > 1) report.duplicateBookingIds.push({ bookingId: id, count });
    for (const customer of customers) {
        if (customer.email && customer.email !== customer.email.toLowerCase()) report.mixedCaseCustomerEmails++;
        if (String(customer.phone || '').startsWith('GUEST-')) {
            report.guestPhoneCustomers++;
        } else if (customer.phone && /[\s\-()]/.test(customer.phone)) report.formattedCustomerPhones++;
        if (!String(customer.phone || '').startsWith('GUEST-')) {
            const normalized = String(customer.phone || '').replace(/[\s\-()]/g, '');
            if (normalized) realPhones.set(normalized, [...(realPhones.get(normalized) || []), customer.id]);
            continue;
        }
        const ids = guestPhones.get(customer.phone) || [];
        ids.push(customer.id);
        guestPhones.set(customer.phone, ids);
    }
    for (const [phone, customerIds] of guestPhones) if (customerIds.length > 1) report.duplicateGuestPhones.push({ phone, customerIds });
    for (const customerIds of realPhones.values()) if (customerIds.length > 1) report.duplicateRealPhoneCustomers.push({ customerIds });

    const emailSample = bookings.find(row => row.customerEmail?.includes('_')) ||
        bookings.find(row => row.customerEmail && row.customerEmail !== row.customerEmail.toLowerCase());
    if (emailSample) {
        const email = emailSample.customerEmail.toLowerCase();
        const escaped = email.replace(/[\\%_]/g, '\\$&');
        const { data, error } = await db.from('Bookings').select('id,customerEmail').ilike('customerEmail', escaped);
        if (error) throw error;
        const expected = bookings.filter(row => row.customerEmail?.toLowerCase() === email).map(row => row.id).sort();
        report.emailLookupProbe = { passed: JSON.stringify(data.map(row => row.id).sort()) === JSON.stringify(expected), wildcardSample: email.includes('_') };
    }
    const phoneSample = bookings.find(row => row.customerPhone && /[\s\-()]/.test(row.customerPhone));
    if (phoneSample) {
        const phone = phoneSample.customerPhone.replace(/[\s\-()]/g, '');
        const { data, error } = await db.from('Bookings').select('id,customerPhone').like('customerPhone', `%${phone.slice(-4).split('').join('%')}%`);
        if (error) throw error;
        const expected = bookings.filter(row => row.customerPhone?.replace(/[\s\-()]/g, '') === phone).map(row => row.id).sort();
        report.phoneLookupProbe = { passed: JSON.stringify(data.filter(row => row.customerPhone.replace(/[\s\-()]/g, '') === phone).map(row => row.id).sort()) === JSON.stringify(expected) };
    }

    const output = path.join(process.cwd(), 'scratch', 'customer-link-audit-2026-09-23.json');
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ output, bookings: bookings.length, customers: customers.length,
        mixedCaseBookingEmails: report.mixedCaseBookingEmails, formattedBookingPhones: report.formattedBookingPhones,
        mixedCaseCustomerEmails: report.mixedCaseCustomerEmails, formattedCustomerPhones: report.formattedCustomerPhones, guestPhoneCustomers: report.guestPhoneCustomers,
        emailLookupProbe: report.emailLookupProbe, phoneLookupProbe: report.phoneLookupProbe,
        mismatchedLinks: report.mismatchedLinks.length, partialMatches: report.partialMatches.length,
        bookingsWithoutCustomerId: report.bookingsWithoutCustomerId.length, brokenCustomerLinks: report.brokenCustomerLinks.length,
        unverifiableLinks: report.unverifiableLinks.length,
        duplicateBookingIds: report.duplicateBookingIds.length, duplicateGuestPhones: report.duplicateGuestPhones.length,
        duplicateRealPhoneCustomers: report.duplicateRealPhoneCustomers.length }));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
