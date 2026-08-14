'use client';
/*
 * File: Standard/ServiceList.tsx
 * Chức năng: Render danh sách nhóm dịch vụ theo Category.
 * Logic chi tiết:
 * - Nhận danh sách services và categories.
 * - Group services theo Category ID (Body, Foot...).
 * - Render từng section (Tiêu đề Category + Grid các ServiceItem).
 * - Sử dụng useMemo để tối ưu hóa việc nhóm dữ liệu.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight, ChevronLeft } from 'lucide-react';
import ServiceItem from '@/components/Menu/Standard/ServiceItem';
import { Category, Service, CartState } from '@/components/Menu/types';
import { NEW_USER_CONTROLLED_CATEGORIES, NEW_USER_ALLOWED_IDS } from '../constants';

interface ServiceListProps {
    categories: Category[];
    services: Service[]; // Đây là danh sách tất cả các món (bao gồm 60', 90', 120'...)
    cart: Record<string, number>; // Lookup Map (ID -> Qty)
    lang: string;
    selectedTags?: string[]; // [NEW] Truyền tag khách chọn xuống để List biết cách sort
    direction?: number; // Hướng trượt (1 là -> trái, -1 là <- phải)
    onItemClick: (services: Service[]) => void; // Thay đổi: Truyền vào 1 mảng các biến thể
    showHiddenServices?: boolean;
}

// 🔧 UI CONFIGURATION
const STAGGER_CONFIG = {
    ITEM_DELAY: 0.06,        // Delay between each item appearing (seconds)
    ITEM_START_DELAY: 0.1,   // Delay before first item appears
    ITEM_DURATION: 0.35,     // Duration of each item's entrance
    ITEM_Y_OFFSET: 20,       // How far items slide up from (pixels)
};

// Lập trình hiệu ứng variants linh động cho Slider
const listVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 30 : -30,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 30 : -30,
        opacity: 0
    })
};

// Stagger container for service items grid
const gridContainerVariants = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: STAGGER_CONFIG.ITEM_DELAY,
            delayChildren: STAGGER_CONFIG.ITEM_START_DELAY,
        },
    },
};

const gridItemVariants = {
    hidden: { opacity: 0, y: STAGGER_CONFIG.ITEM_Y_OFFSET, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: STAGGER_CONFIG.ITEM_DURATION,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], // easeOutQuad
        },
    },
};

const BODY_SUB_MENUS = [
    {
        id: 'Design your journey',
        img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=200&auto=format&fit=crop',
        names: { en: 'Design your journey', vi: 'Thiết kế hành trình', jp: 'ジャーニーをデザイン', kr: '여정 디자인', cn: '定制旅程' },
        descs: {
            en: 'Customize your own spa experience tailored to your specific needs.',
            vi: 'Tự thiết kế liệu trình spa riêng biệt theo nhu cầu của chính bạn.',
            jp: 'お客様のニーズに合わせた独自のスパ体験をカスタマイズ。',
            kr: '고객님의 요구에 맞춘 특별한 스파 경험을 직접 디자인하세요.',
            cn: '根据您的特定需求定制专属水疗体验。'
        }
    },
    {
        id: 'Therapy',
        img: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=200&auto=format&fit=crop',
        names: { en: 'Therapy', vi: 'Trị liệu', jp: 'セラピー', kr: '테라피', cn: '理疗' },
        descs: {
            en: 'Specialized treatments designed to heal, relieve pain and restore balance.',
            vi: 'Trị liệu chuyên sâu giúp giảm đau, phục hồi và cân bằng cơ thể.',
            jp: '痛みを和らげ、バランスを取り戻すために設計された専門的な治療。',
            kr: '통증 완화와 신체 균형 회복을 위해 고안된 전문 테라피.',
            cn: '旨在治愈、缓解疼痛和恢复平衡的专业护理。'
        }
    }
];

export default function ServiceList({ categories, services, cart, lang, selectedTags = [], direction = 1, onItemClick, showHiddenServices = false }: ServiceListProps) {
    const router = useRouter();

    // 1. Hàm Gộp nhóm: Gom các món có cùng Tên Tiếng Anh (names.en) vào chung 1 mảng
    const groupedServices: Record<string, Service[]> = useMemo(() => {
        const groups: Record<string, Service[]> = {};
        services.forEach(svc => {
            // [LOGIC NEW] Lọc dịch vụ rác cho luồng Khách Mới
            if (showHiddenServices) {
                // Nếu thuộc danh mục kiểm soát khắt khe (Body, Foot, Ear Clean...)
                if (NEW_USER_CONTROLLED_CATEGORIES.includes(svc.cat)) {
                    if (!NEW_USER_ALLOWED_IDS.includes(svc.id)) return;
                } else {
                    // Nếu thuộc danh mục tự do (VD: Dịch vụ lẻ), chỉ hiển thị món Đang Bán
                    if (svc.ACTIVE === false) return;
                }
            } else {
                // Luồng Main Branch: Chỉ hiển thị món Đang Bán
                if (svc.ACTIVE === false) return;
            }

            // Dùng tên tiếng Anh làm khóa để gộp nhóm (Normalize: Trim + Lowercase)
            const key = svc.names.en.trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(svc);
        });
        return groups;
    }, [services]);

    return (
        <div className="flex-1 overflow-y-auto px-4 pb-40 scroll-smooth no-scrollbar" id="service-list-container">
            <AnimatePresence mode="wait" custom={direction}>
                {categories.map(cat => {
                    // Phân loại NGHIÊM NGẶT theo category id (cat)
                    const categoryGroups = Object.values(groupedServices).filter(group => {
                        const rep = group[0];
                        return rep.cat === cat.id;
                    });

                    if (categoryGroups.length === 0) return null;

                    // [LOGIC NEW] Custom sort cho category 'Body': Đưa Mix 4 lên đầu, Tinh dầu xuống cuối
                    if (cat.id === 'Body') {
                        categoryGroups.sort((a, b) => {
                            const nameEnA = a[0].names.en.toLowerCase();
                            const nameEnB = b[0].names.en.toLowerCase();
                            const nameViA = (a[0].names.vi || '').toLowerCase();
                            const nameViB = (b[0].names.vi || '').toLowerCase();
                            
                            const isMixA = nameEnA.includes('mix of four') || nameViA.includes('kết hợp 4') || nameViA.includes('mix 4');
                            const isMixB = nameEnB.includes('mix of four') || nameViB.includes('kết hợp 4') || nameViB.includes('mix 4');
                            if (isMixA && !isMixB) return -1;
                            if (!isMixA && isMixB) return 1;
                            
                            const isAromaA = nameEnA.includes('aroma oil') || nameViA.includes('tinh dầu');
                            const isAromaB = nameEnB.includes('aroma oil') || nameViB.includes('tinh dầu');
                            if (isAromaA && !isAromaB) return 1;
                            if (!isAromaA && isAromaB) return -1;
                            
                            return 0; // Giữ nguyên thứ tự ban đầu cho các món khác
                        });
                    }

                    return (
                        <motion.div 
                            key={cat.id} 
                            custom={direction}
                            variants={listVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            id={`cat-${cat.id}`} 
                            className="mb-2 pt-2"
                        >

                            {/* Grid danh sách */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-7xl md:mx-auto lg:mx-auto"
                                variants={gridContainerVariants}
                                initial="hidden"
                                animate="visible"
                                key={cat.id}
                            >
                                {categoryGroups.map((group) => {
                                    const representative = group[0]; // Lấy món đầu tiên làm đại diện hiển thị

                                    // Tính tổng số lượng của tất cả các biến thể trong nhóm này
                                    // VD: Khách chọn 1 cái 60' + 1 cái 90' -> Tổng hiện thị ra ngoài là 2
                                    const totalQty = group.reduce((sum, item) => sum + (cart[item.id] || 0), 0);

                                    // [LOGIC NEW] Kiểm tra xem trong nhóm có item nào là Best Seller không
                                    const isBestSellerGroup = group.some(item => item.BEST_SELLER === true);

                                    return (
                                        <motion.div key={representative.id} variants={gridItemVariants}>
                                            <ServiceItem
                                                service={representative} // Chỉ cần truyền thông tin đại diện (Tên, Ảnh)
                                                quantity={totalQty}
                                                lang={lang}
                                                isBestSeller={isBestSellerGroup} // Truyền prop mới
                                                onClick={() => onItemClick(group)} // Quan trọng: Truyền CẢ NHÓM vào để MainSheet xử lý
                                            />
                                        </motion.div>
                                    );
                                })}

                                {/* 2 Thẻ to nằm cuối cùng của nhánh Body */}
                                {cat.id === 'Body' && BODY_SUB_MENUS.map((menu) => {
                                    const name = menu.names[lang as keyof typeof menu.names] || menu.names['en'];
                                    const desc = menu.descs[lang as keyof typeof menu.descs] || menu.descs['en'];
                                    
                                    return (
                                        <motion.div key={menu.id} variants={gridItemVariants}>
                                            <div
                                                onClick={() => {
                                                    sessionStorage.setItem('standard_menu_mode', 'MENU');
                                                    sessionStorage.setItem('standard_menu_category', 'Body');
                                                    router.push(`/${lang}/new-user/${menu.id === 'Therapy' ? 'spa' : 'vip'}/menu`);
                                                }}
                                                className="relative w-full rounded-2xl p-3 flex flex-row gap-4 items-center overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] bg-black/10 border border-white/10 backdrop-blur-sm shadow-lg hover:bg-black/20"
                                            >
                                                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-black/20 relative shadow-sm">
                                                    <img src={menu.img} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt={name} />
                                                </div>
                                                <div className="flex flex-col justify-center flex-1 min-w-0 pr-12 py-1">
                                                    <h3 className="font-bold text-white text-[26px] md:text-[28px] leading-[1.35] mb-1.5 line-clamp-2 font-luxury tracking-wide">
                                                        {name}
                                                    </h3>
                                                    <p className="text-[16px] md:text-[18px] text-gray-400 line-clamp-2 leading-[1.45] font-light">
                                                        {desc}
                                                    </p>
                                                </div>
                                                <div className="absolute bottom-3 right-3 z-10">
                                                    <div className="w-9 h-9 rounded-full bg-gray-700/80 text-[#C9A96E] flex items-center justify-center backdrop-blur-sm hover:bg-gray-600 hover:text-white transition-colors">
                                                        <ArrowRight size={18} strokeWidth={2.5} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
