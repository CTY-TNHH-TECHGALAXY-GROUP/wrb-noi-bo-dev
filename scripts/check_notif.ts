import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking StaffNotifications table...");
    const { data, error } = await supabase.from('StaffNotifications').select('*').limit(1);
    console.log("StaffNotifications:", { data, error: error?.message });
    
    console.log("Checking Notifications table...");
    const { data: d2, error: e2 } = await supabase.from('Notifications').select('*').limit(1);
    console.log("Notifications:", { data: d2, error: e2?.message });
}
check();
