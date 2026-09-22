const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('Services')
    .select('id, nameVN, category, priceVND, isActive');

  if (error) {
    console.error('Error fetching services:', error);
    return;
  }

  console.log('--- SERVICES LIST ---');
  data.forEach(s => {
    console.log(`ID: ${s.id} | Name: ${s.nameVN} | Category: ${s.category} | Price: ${s.priceVND} | Active: ${s.isActive}`);
  });
}

main();
