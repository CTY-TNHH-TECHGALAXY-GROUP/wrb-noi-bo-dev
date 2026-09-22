require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const rawTags = `
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body"
"body","fourhand"
"body","fourhand"
"body","fourhand"
"body","fourhand"
"body","fourhand"
"body","fourhand"
"body"
"body"
"body"
"body"
"body"
"body"
"foot"
"foot"
"foot"
"foot"
"foot"
"foot"
"foot"
"foot"
"hairwash"
"hairwash"
"hairwash"
"hairwash", "foot"
"hairwash", "foot"
"hairwash","body"
"hairwash","body"
"hairwash","body","ear"
"face"
"face"
"face","foot","hairwash"
"face","body","hairwash"
"face","body","hairwash"
"foot",  "heel"
"foot",  "heel"
"heel","body"
"heel","body"
"nail", "foot"
"nail", "foot"
"nail", "body"
"nail", "body"
"ear"
"ear"
"ear"
"ear", "foot"
"ear", "foot"
"ear", "body"
"ear", "body"
"ear", "body","hairwash","face"
"shave"
"barber"
"shave","barber","hairwash"
"shave","barber","hairwash","ear"
"barber" ,"shave","nail", "hairwash"
"body", "ear", "hairwash", "nail","shave"
"body", "ear", "hairwash", "nail","shave","heel"
"body", "face", "ear", "foot", "hairwash","private","fourhand"
"barber"
"shave"
"face"
"heel"
"nail"
"foot"
"body"
"body"
"hairwash"
"private"
`.trim();

const tagRows = rawTags.split('\n'); // BẮT BUỘC KHÔNG FILTER ĐỂ GIỮ INDEX
const parsedTags = tagRows.map(line => {
    if (!line.trim()) return [];
    return line.split(',').map(t => t.replace(/"/g, '').trim()).filter(Boolean);
});

async function main() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Services?select=id,nameVN&order=id.asc`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    
    const dbRows = await res.json();
    console.log(`DB Count: ${dbRows.length}`);
    console.log(`Tags Count: ${parsedTags.length}`);
    
    // Sắp xếp lại dbRows theo ID đảm bảo đúng thứ tự NHS0000 -> NHS0100
    // ID có dạng NHS0001, nên sort string .localeCompare là chuẩn xác nhất
    const sortedDbRows = [...dbRows].sort((a, b) => a.id.localeCompare(b.id));

    let sql = '-- 1. Thêm cột comboTags (nếu chưa có)\n';
    sql += 'ALTER TABLE public."Services" ADD COLUMN IF NOT EXISTS "comboTags" jsonb;\n\n';
    sql += '-- 2. Cập nhật dữ liệu từ row id...\n';

    sortedDbRows.forEach((row, index) => {
        let tagStr = '[]';
        if (index < parsedTags.length) {
             tagStr = JSON.stringify(parsedTags[index]);
        }
        sql += `UPDATE public."Services" SET "comboTags" = '${tagStr}'::jsonb WHERE id = '${row.id}';\n`;
    });

    fs.writeFileSync('scripts/migrate-combo-tags.sql', sql);
    console.log('Regenerated scripts/migrate-combo-tags.sql using real IDs.');
    console.log('Bạn hãy copy nội dung file .sql này dán lên Supabase nhé!');
}

main();
