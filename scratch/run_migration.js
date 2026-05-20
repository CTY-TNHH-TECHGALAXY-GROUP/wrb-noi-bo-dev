const postgres = require('postgres');

const databaseUrl = "postgresql://postgres.adzfohfdindovfcpaizb:KldSnHk8nggpuhpS@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

async function main() {
  console.log('🔄 Bắt đầu chạy SQL migration...');
  try {
    // 1. Thêm cột source vào Bookings nếu chưa tồn tại
    await sql`
      ALTER TABLE "Bookings" 
      ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'STANDARD_MENU';
    `;
    console.log('✅ Đã thêm cột "source" vào bảng Bookings với giá trị mặc định là "STANDARD_MENU".');
  } catch (error) {
    console.error('❌ Lỗi khi thực thi SQL Migration:', error);
  } finally {
    await sql.end();
  }
}

main();
