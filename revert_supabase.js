const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/ADMIN/OneDrive/Desktop/Ngan Ha/wrb-noi-bo-dev/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
1. Nhóm Body Care
NHS0022	Đá nóng	70'	685.000	🟢 Đang bán
NHS0023	Đá nóng	90'	840.000	🟢 Đang bán
NHS0024	Đá nóng	120'	1.050.000	🟢 Đang bán
NHS0025	Đá nóng	180'	1.890.000	🟢 Đang bán
NHS0026	Đá nóng	240'	2.520.000	🟢 Đang bán
NHS0027	Đá nóng	300'	3.150.000	🟢 Đang bán
NHS0034	Hai kỹ thuật viên	60'	895.000	🟢 Đang bán
NHS0035	Hai kỹ thuật viên	90'	1.155.000	🟢 Đang bán
NHS0036	Hai kỹ thuật viên	120'	1.420.000	🟢 Đang bán
NHS0037	Hai kỹ thuật viên	180'	2.680.000	🟢 Đang bán
NHS0038	Hai kỹ thuật viên	240'	3.570.000	🟢 Đang bán
NHS0039	Hai kỹ thuật viên	300'	4.465.000	🟢 Đang bán
NHS0040	Kết hợp 4 liệu trình	70'	685.000	🟢 Đang bán
NHS0041	Kết hợp 4 liệu trình	90'	840.000	🟢 Đang bán
NHS0042	Kết hợp 4 liệu trình	120'	1.050.000	🟢 Đang bán
NHS0043	Kết hợp 4 liệu trình	180'	1.890.000	🟢 Đang bán
NHS0044	Kết hợp 4 liệu trình	240'	2.520.000	🟢 Đang bán
NHS0045	Kết hợp 4 liệu trình	300'	3.150.000	🟢 Đang bán
NHS0049	Không dầu 120'	120'	1.050.000	🔴 Đang ẩn
NHS0050	Không dầu 180'	180'	1.890.000	🔴 Đang ẩn
NHS0051	Không dầu 240'	240'	2.520.000	🔴 Đang ẩn
NHS0052	Không dầu 300'	300'	3.150.000	🔴 Đang ẩn
NHS0046	Không dầu 60'	60'	630.000	🔴 Đang ẩn
NHS0047	Không dầu 70'	70'	685.000	🔴 Đang ẩn
NHS0048	Không dầu 90'	90'	840.000	🔴 Đang ẩn
NHS0008	Tinh dầu dừa	60'	580.000	🟢 Đang bán
NHS0009	Tinh dầu dừa	70'	630.000	🟢 Đang bán
NHS0010	Tinh dầu dừa	90'	790.000	🟢 Đang bán
NHS0011	Tinh dầu dừa	120'	1.050.000	🟢 Đang bán
NHS0012	Tinh dầu dừa	180'	1.735.000	🟢 Đang bán
NHS0013	Tinh dầu dừa	240'	2.310.000	🟢 Đang bán
NHS0014	Tinh dầu dừa	300'	2.890.000	🟢 Đang bán
2. Nhóm Foot Care
NHS0100	Ấn huyệt chân chuyên nghiệp	45'	370.000	🟢 Đang bán
NHS0101	Ấn huyệt chân chuyên nghiệp	60'	475.000	🟢 Đang bán
NHS0102	Ấn huyệt chân chuyên nghiệp	70'	525.000	🟢 Đang bán
NHS0103	Ấn huyệt chân chuyên nghiệp	90'	685.000	🟢 Đang bán
NHS0104	Ấn huyệt chân chuyên nghiệp	120'	945.000	🟢 Đang bán
NHS0105	Ấn huyệt chân chuyên nghiệp	180'	1.420.000	🟢 Đang bán
NHS0106	Ấn huyệt chân chuyên nghiệp	240'	1.890.000	🟢 Đang bán
NHS0107	Ấn huyệt chân chuyên nghiệp	300'	2.365.000	🟢 Đang bán
NHS1000	Mát-xa chân - Cắt móng - Chà gót 90	90'	790.000	🔴 Đang ẩn
3. Nhóm Điều trị Therapy
NHT0001	Điều trị Therapy 60	60'	720.000	🔴 Đang ẩn
NHT0002	Điều trị Therapy 70	70'	840.000	🔴 Đang ẩn
NHT0003	Điều trị Therapy 90	90'	1.080.000	🔴 Đang ẩn
NHT0004	Điều trị Therapy 120	120'	1.440.000	🔴 Đang ẩn
NHT0005	Điều trị Therapy 150	150'	1.800.000	🔴 Đang ẩn
NHT0006	Điều trị Therapy 180	180'	2.160.000	🔴 Đang ẩn
4. Nhóm Ráy Tai
NHS0600	Lấy ráy tai	30'	315.000	🟢 Đang bán
NHS0601	Lấy ráy tai	45'	420.000	🟢 Đang bán
NHS0602	Lấy ráy tai	60'	630.000	🟢 Đang bán
NHS1001	Ráy tai - Gội đầu - Cổ vai gáy 70	70'	685.000	🔴 Đang ẩn
NHS1002	Ráy tai - Gội đầu - Cổ vai gáy 90	90'	790.000	🔴 Đang ẩn
NHS1003	Ráy tai - Cổ vai gáy - Mát-xa chân 70	70'	685.000	🔴 Đang ẩn
NHS1004	Ráy tai - Cổ vai gáy - Mát-xa chân 90	90'	790.000	🔴 Đang ẩn
NHS1005	Ráy tai - Cổ vai gáy - Body 70	70'	705.000	🔴 Đang ẩn
NHS1006	Ráy tai - Cổ vai gáy - Body 90	90'	810.000	🔴 Đang ẩn
NHS1007	Ráy tai - Body - Cổ vai gáy - Gội đầu 120	120'	1.105.000	🔴 Đang ẩn
5. Nhóm Package Combo
NHS1009	Gội đầu - Cổ vai gáy - Mát-xa chân 70	70'	685.000	🔴 Đang ẩn
NHS1010	Gội đầu - Cổ vai gáy - Mát-xa chân 90	90'	790.000	🔴 Đang ẩn
NHS1011	Gội đầu - Cổ vai gáy - Body 70	70'	705.000	🔴 Đang ẩn
NHS1012	Gội đầu - Cổ vai gáy - Body 90	90'	810.000	🔴 Đang ẩn
NHS1013	Gội đầu - Facial - Cổ vai gáy - Chân - Body 120	120'	1.105.000	🔴 Đang ẩn
NHS1014	Facial - Cạo râu - Cổ vai gáy - Body - Gội nhanh 90	90'	840.000	🔴 Đang ẩn
NHS1015	Facial - Cạo râu - Cổ vai gáy - Body - Gội nhanh 120	120'	1.105.000	🔴 Đang ẩn
NHS1016	Chà gót - Cắt móng - Mát-xa chân 90	90'	790.000	🔴 Đang ẩn
NHS1017	Chà gót - Cắt móng - Mát-xa chân 120	120'	1.085.000	🔴 Đang ẩn
NHS1018	Chà gót - Cắt móng - Body 90	90'	810.000	🔴 Đang ẩn
NHS1019	Chà gót - Cắt móng - Body 120	120'	1.105.000	🔴 Đang ẩn
6. Nhóm VIP Package
NHS0800	Gói dịch vụ cao cấp	120'	1.575.000	🟢 Đang bán
`;

async function run() {
    const lines = rawData.split('\n');
    const updates = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        if (line.startsWith('NHS') || line.startsWith('NHT')) {
            const parts = line.split('\t');
            if (parts.length >= 5) {
                const id = parts[0].trim();
                const isActive = parts[4].includes('🟢 Đang bán');

                updates.push({ id, isActive });
            }
        }
    }

    console.log(`Found ${updates.length} services to REVERT.`);

    for (const u of updates) {
        const { error } = await supabase
            .from('Services')
            .update({ isActive: u.isActive })
            .eq('id', u.id);
            
        if (error) {
            console.error(`Failed to revert ${u.id}: `, error);
        } else {
            console.log(`Reverted ${u.id} -> ${u.isActive}`);
        }
    }
    
    // Unhide old services (We assume all others that are inactive were actually hidden by my previous script)
    // To be safe, we just set isActive = true for all NHS and NHT not in this list
    const validIds = updates.map(u => u.id);
    const { data: allServices } = await supabase.from('Services').select('id, isActive');
    let unhiddenCount = 0;
    for (const s of allServices) {
        if (!validIds.includes(s.id) && !s.isActive && (s.id.startsWith('NHS') || s.id.startsWith('NHT'))) {
            await supabase.from('Services').update({ isActive: true }).eq('id', s.id);
            unhiddenCount++;
        }
    }
    console.log(`Unhidden ${unhiddenCount} old services to restore main branch.`);
}

run();
