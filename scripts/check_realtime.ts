import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY! || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.rpc('get_realtime_publications' as any) || await supabase.from('pg_publication_tables').select('*');
    if (error) {
        console.error("Direct query failed, trying raw sql if possible via rest...", error.message);
    }
    console.log(JSON.stringify(data, null, 2));
}
check();
