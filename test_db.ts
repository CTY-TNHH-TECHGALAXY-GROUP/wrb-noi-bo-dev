
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
async function run() {
  const { data: turn } = await supabase.from('TurnQueue').select('employee_id, status, date').eq('status', 'working').in('employee_id', ['NH018', 'NH002', 'NH021']);
  console.log('Working in TurnQueue for VIPs:', turn);
}
run();

