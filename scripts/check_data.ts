import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("🧐 Fetching some services from Supabase...");

    const { data, error } = await supabase
        .from('services')
        .select('id, names')
        .limit(5);

    if (error) {
        console.error("❌ Error:", error.message);
    } else {
        console.log("✅ Data found:", JSON.stringify(data, null, 2));
        console.log(`📊 Number of records fetched: ${data?.length || 0}`);
    }
}

checkData();
