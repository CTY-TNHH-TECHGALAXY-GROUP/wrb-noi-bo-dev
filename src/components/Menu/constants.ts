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
        id: 'VIP',
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