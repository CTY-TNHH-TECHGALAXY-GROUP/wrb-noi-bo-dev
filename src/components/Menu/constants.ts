/*
 * File: Menu/constants.ts
 * Chức năng: Chứa dữ liệu tĩnh (Static Data) và cấu hình mặc định.
 * Logic chi tiết:
 * - CATEGORIES: Danh sách các danh mục dịch vụ (Body, Foot, Facial, Package...).
 * - SERVICES: Dữ liệu mẫu (Dummy Data) dùng để hiển thị thử nghiệm hoặc fallback.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
import { Category, Service } from './types';

export const CATEGORIES: Category[] = [
    {
        id: 'Body',
        names: {
            en: 'Body Care',
            vi: 'Chăm sóc Body',
            jp: 'ボディケア',
            kr: '전신 케어',
            cn: '全身护理'
        },
        image: '/assets/icons/body.webp'
    },
    {
        id: 'Foot',
        names: {
            en: 'Foot Care',
            vi: 'Chăm sóc Chân',
            jp: 'フットケア',
            kr: '발 케어',
            cn: '足部护理'
        },
        image: '/assets/icons/foot.webp'
    },
    {
        id: 'Ear Clean',
        names: {
            en: 'Ear Clean',
            vi: 'Ráy Tai',
            jp: '耳掃除',
            kr: '귀 청소',
            cn: '采耳'
        },
        image: '/assets/icons/earclean.webp'
    },
    {
        id: 'Barber',
        names: {
            en: 'Barber',
            vi: 'Cắt Tóc Nam',
            jp: '理容',
            kr: '이발',
            cn: '男士理发'
        },
        image: '/assets/icons/haircut.webp'
    },
    {
        id: 'Package',
        names: {
            en: 'Package',
            vi: 'Gói Combo',
            jp: 'パッケージ',
            kr: '패키지',
            cn: '套餐'
        },
        image: '/assets/icons/add-more.webp'
    },
    {
        id: 'Premium',
        names: {
            en: 'VIP Package',
            vi: 'Gói VIP',
            jp: 'VIPコース',
            kr: 'VIP 코스',
            cn: 'VIP套餐'
        },
        image: '/assets/icons/combo-king.webp'
    },
    {
        id: 'Additional',
        names: {
            en: 'Add-on',
            vi: 'Dịch Vụ Lẻ',
            jp: '追加サービス',
            kr: '추가 서비스',
            cn: '额外服务'
        },
        image: '/assets/icons/adds-on.svg'
    }
];

// --- Cấu hình riêng cho Luồng Khách Mới (để lọc bỏ các dịch vụ cũ/rác mà không sửa DB) ---
export const NEW_USER_CONTROLLED_CATEGORIES = ['Body', 'Foot', 'Package', 'Ear Clean', 'Premium'];

export const NEW_USER_ALLOWED_IDS = [
    // Body Care
    'NHS0008', 'NHS0009', 'NHS0010', 'NHS0011', 'NHS0012', 'NHS0013', 'NHS0014', // Tinh dầu dừa
    'NHS0022', 'NHS0023', 'NHS0024', 'NHS0025', 'NHS0026', 'NHS0027',
    'NHS0034', 'NHS0035', 'NHS0036', 'NHS0037', 'NHS0038', 'NHS0039',
    'NHS0040', 'NHS0041', 'NHS0042', 'NHS0043', 'NHS0044', 'NHS0045', 'NHS0046', 'NHS0047', 'NHS0048', 'NHS0049',
    'NHS0050', 'NHS0051', 'NHS0052', 'NHS0053', 'NHS0054', 'NHS0055', 'NHS0056',
    'NHS0060', 'NHS0061', 'NHS0062', 'NHS0063', 'NHS0064', 'NHS0065', 'NHS0066', 'NHS0067',
    'NHS0090', 'NHS0091', 'NHS0092', 'NHS0093', 'NHS0094', 'NHS0095', 'NHS0096',
    // Foot Care
    'NHS0100', 'NHS0101', 'NHS0102', 'NHS0103', 'NHS0104', 'NHS0105', 'NHS0106', 'NHS0107',
    // Package Combo
    'NHS1000', 'NHS1009', 'NHS1010', 'NHS1011', 'NHS1012', 'NHS1013', 'NHS1014', 'NHS1015', 'NHS1016', 'NHS1017', 'NHS1018', 'NHS1019',
    // Ear Clean
    'NHS0600', 'NHS0601', 'NHS0602', 'NHS1001', 'NHS1002', 'NHS1003', 'NHS1004', 'NHS1005', 'NHS1006', 'NHS1007',
    // VIP Package
    'NHS0800'
];