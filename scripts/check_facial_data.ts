/**
 * Script: Check Facial service data in Supabase
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/check_facial_data.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔍 Checking Facial services...\n');

    // 1. Query all Facial category services
    const { data: facialServices, error } = await supabase
        .from('Services')
        .select('id, code, nameEN, nameVN, category, duration, priceVND, priceUSD, isActive')
        .eq('category', 'Facial')
        .order('duration', { ascending: true });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`📋 Found ${facialServices?.length || 0} Facial services:\n`);
    console.log('ID\t\tCode\t\tName\t\t\tDuration\tPrice VND\tPrice USD\tActive');
    console.log('─'.repeat(110));

    facialServices?.forEach((svc: any) => {
        console.log(
            `${svc.id}\t\t${svc.code || '-'}\t\t${(svc.nameEN || '').padEnd(20)}\t${svc.duration}min\t\t${svc.priceVND}\t\t${svc.priceUSD}\t\t${svc.isActive}`
        );
    });

    // 2. Check duplicates
    console.log('\n🔍 Checking for duplicate durations...');
    const durationMap = new Map<number, any[]>();
    facialServices?.forEach((svc: any) => {
        const dur = svc.duration;
        if (!durationMap.has(dur)) durationMap.set(dur, []);
        durationMap.get(dur)!.push(svc);
    });

    let hasDuplicates = false;
    durationMap.forEach((services, duration) => {
        if (services.length > 1) {
            hasDuplicates = true;
            console.log(`\n⚠️ DUPLICATE: ${services.length} services with duration = ${duration} minutes:`);
            services.forEach(s => console.log(`   - ${s.id}: ${s.nameEN} | ${s.priceVND} VND / ${s.priceUSD} USD | Active: ${s.isActive}`));
        }
    });

    if (!hasDuplicates) {
        console.log('✅ No duplicate durations found.');
    }

    // 3. Also check all services in the same group name pattern
    console.log('\n\n🔍 Checking ALL services for potential grouping issues...');
    const { data: allData, error: allErr } = await supabase
        .from('Services')
        .select('id, nameEN, nameVN, category, duration, priceVND, priceUSD, isActive')
        .order('category', { ascending: true })
        .order('duration', { ascending: true });

    if (allErr) {
        console.error('❌', allErr.message);
        return;
    }

    // Group by nameEN (which is how the Menu groups them)
    const nameGroupMap = new Map<string, any[]>();
    allData?.forEach((svc: any) => {
        const key = `${svc.category}::${svc.nameEN}`;
        if (!nameGroupMap.has(key)) nameGroupMap.set(key, []);
        nameGroupMap.get(key)!.push(svc);
    });

    console.log('\nGroups with potential issues (duplicate durations within same group):');
    nameGroupMap.forEach((services, groupKey) => {
        const durSet = new Set(services.map((s: any) => s.duration));
        if (durSet.size < services.length) {
            console.log(`\n⚠️ Group "${groupKey}" has ${services.length} services but only ${durSet.size} unique durations:`);
            services.forEach((s: any) => console.log(`   - ${s.id}: ${s.duration}min | ${s.priceVND} VND / ${s.priceUSD} USD | Active: ${s.isActive}`));
        }
    });

    console.log('\n✅ Check complete.');
}

main().catch(console.error);
