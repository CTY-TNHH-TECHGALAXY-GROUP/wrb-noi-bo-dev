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
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, X } from 'lucide-react';
import ServiceItem from '@/components/Menu/Standard/ServiceItem';
import { Category, Service } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';
import { NEW_USER_CONTROLLED_CATEGORIES, NEW_USER_ALLOWED_IDS } from '../constants';

interface ServiceListProps {
    categories: Category[];
    services: Service[]; // Đây là danh sách tất cả các món (bao gồm 60', 90', 120'...)
    cart: Record<string, number>; // Lookup Map (ID -> Qty)
    lang: string;
    selectedTags?: string[]; // [NEW] Truyền tag khách chọn xuống để List biết cách sort
    direction?: number; // Hướng trượt (1 là -> trái, -1 là <- phải)
    onItemClick: (services: Service[]) => void; // Thay đổi: Truyền vào 1 mảng các biến thể
    onQuickAdd?: (service: Service) => void;
    onQuickRemove?: (service: Service) => void;
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

const getUniqueServiceOptions = (group: Service[]) => (
    group
        .filter((svc, idx, arr) => arr.findIndex(s => s.timeValue === svc.timeValue && s.priceVND === svc.priceVND) === idx)
        .sort((a, b) => a.timeValue - b.timeValue)
);

const canAddQuantityDirectly = (service: Service) => service.SHOW_CUSTOM_FOR_YOU === false;
const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const hasMeaningfulDescription = (service: Service, lang: string) => {
    const name = service.names[lang as keyof typeof service.names] || service.names.en || '';
    const description = service.descriptions[lang as keyof typeof service.descriptions] || service.descriptions.en || '';

    return !!description.trim() && normalizeText(description) !== normalizeText(name);
};

export default function ServiceList({ categories, services, cart, lang, direction = 1, onItemClick, onQuickAdd, onQuickRemove, showHiddenServices = false }: ServiceListProps) {
    const router = useRouter();

    const [comingSoon, setComingSoon] = useState<string | null>(null);
    const [detailService, setDetailService] = useState<Service | null>(null);

    const csText: Record<string, { title: string; desc: string; close: string; add: string; mins: string }> = {
        en: { title: 'Coming Soon', desc: 'This service is being prepared. Stay tuned!', close: 'Close', add: 'Add Service', mins: 'mins' },
        vi: { title: 'Sắp Ra Mắt', desc: 'Dịch vụ đang được chuẩn bị. Hãy đón chờ nhé!', close: 'Đóng', add: 'Chọn dịch vụ', mins: 'phút' },
        kr: { title: '곧 출시', desc: '서비스를 준비 중입니다. 기대해 주세요!', close: '닫기', add: '서비스 선택', mins: '분' },
        cn: { title: '即将推出', desc: '服务正在筹备中，敬请期待！', close: '关闭', add: '选择服务', mins: '分钟' },
        jp: { title: '近日公開', desc: 'サービス準備中です。お楽しみに！', close: '閉じる', add: 'サービスを選択', mins: '分' },
    };
    const cs = csText[lang] || csText['en'];
    const detailName = detailService?.names[lang as keyof typeof detailService.names] || detailService?.names.en || '';
    const detailDescription = detailService?.descriptions[lang as keyof typeof detailService.descriptions] || detailService?.descriptions.en || '';

    // 1. Hàm Gộp nhóm: Gom các món có cùng Tên Tiếng Anh (names.en) vào chung 1 mảng
    const groupedServices: Record<string, Service[]> = useMemo(() => {
        const groups: Record<string, Service[]> = {};
        services.forEach(svc => {
            // Luôn chặn dịch vụ ngừng bán trước tiên, áp dụng cho mọi luồng.
            if (svc.ACTIVE === false) return;

            // Sau đó mới áp dụng whitelist riêng cho luồng Khách Mới.
            if (
                showHiddenServices &&
                NEW_USER_CONTROLLED_CATEGORIES.includes(svc.cat) &&
                !NEW_USER_ALLOWED_IDS.includes(svc.id)
            ) {
                return;
            }

            // Dùng tên tiếng Anh làm khóa để gộp nhóm (Normalize: Trim + Lowercase)
            const key = svc.names.en.trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(svc);
        });
        return groups;
    }, [services, showHiddenServices]);

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
                                className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 w-full max-w-5xl mx-auto"
                                variants={gridContainerVariants}
                                initial="hidden"
                                animate="visible"
                                key={cat.id}
                            >
                                {categoryGroups.map((group) => {
                                    const representative = group[0]; // Lấy món đầu tiên làm đại diện hiển thị
                                    const uniqueOptions = getUniqueServiceOptions(group);
                                    const singleOption = uniqueOptions.length === 1 ? uniqueOptions[0] : undefined;

                                    // Tính tổng số lượng của tất cả các biến thể trong nhóm này
                                    // VD: Khách chọn 1 cái 60' + 1 cái 90' -> Tổng hiện thị ra ngoài là 2
                                    const totalQty = group.reduce((sum, item) => sum + (cart[item.id] || 0), 0);
                                    const selectedServicesInGroup = group.filter(item => (cart[item.id] || 0) > 0);

                                    // [LOGIC NEW] Kiểm tra xem trong nhóm có item nào là Best Seller không
                                    const isBestSellerGroup = group.some(item => item.BEST_SELLER === true);

                                    return (
                                        <motion.div key={representative.id} variants={gridItemVariants}>
                                            <ServiceItem
                                                service={representative} // Chỉ cần truyền thông tin đại diện (Tên, Ảnh)
                                                singleOption={singleOption}
                                                quantity={totalQty}
                                                lang={lang}
                                                isBestSeller={isBestSellerGroup} // Truyền prop mới
                                                onClick={() => {
                                                    if (singleOption) {
                                                        if (totalQty > 0) {
                                                            if (canAddQuantityDirectly(singleOption)) {
                                                                onQuickAdd?.(singleOption);
                                                                return;
                                                            }
                                                            onItemClick(group);
                                                            return;
                                                        }
                                                        if (!hasMeaningfulDescription(singleOption, lang)) {
                                                            onQuickAdd?.(singleOption);
                                                            return;
                                                        }
                                                        setDetailService(singleOption);
                                                        return;
                                                    }
                                                    onItemClick(group);
                                                }}
                                                onQuickAdd={() => {
                                                    if (singleOption) {
                                                        onQuickAdd?.(singleOption);
                                                        return;
                                                    }
                                                    onItemClick(group);
                                                }}
                                                onQuickRemove={() => {
                                                    if (selectedServicesInGroup.length > 1) {
                                                        onItemClick(group);
                                                        return;
                                                    }
                                                    if (selectedServicesInGroup[0]) {
                                                        onQuickRemove?.(selectedServicesInGroup[0]);
                                                    }
                                                }}
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
                                                    if (menu.id === 'Therapy') {
                                                        setComingSoon('therapy');
                                                        return;
                                                    }
                                                    sessionStorage.setItem('standard_menu_mode', 'MENU');
                                                    sessionStorage.setItem('standard_menu_category', 'Body');
                                                    router.push(`/${lang}/new-user/vip/menu`);
                                                }}
                                                className="relative w-full min-h-[132px] sm:min-h-[148px] md:min-h-[168px] rounded-2xl p-4 sm:p-5 md:p-6 flex flex-row gap-4 sm:gap-5 md:gap-6 items-center overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.98] bg-black/10 border border-white/10 backdrop-blur-sm shadow-lg hover:bg-black/20"
                                            >
                                                <div className="w-[104px] h-[104px] sm:w-[118px] sm:h-[118px] md:w-[136px] md:h-[136px] shrink-0 rounded-xl overflow-hidden bg-black/20 relative shadow-sm">
                                                    <img src={menu.img} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt={name} />
                                                </div>
                                                <div className="flex flex-col justify-center flex-1 min-w-0 pr-14 sm:pr-16 py-1">
                                                    <h3 className="font-bold text-white text-[30px] sm:text-[34px] md:text-[40px] leading-[1.18] mb-2 line-clamp-2 font-luxury tracking-wide">
                                                        {name}
                                                    </h3>
                                                    <p className="text-[18px] sm:text-[20px] md:text-[24px] text-gray-400 line-clamp-2 leading-[1.35] font-light">
                                                        {desc}
                                                    </p>
                                                </div>
                                                <div className="absolute bottom-4 right-4 z-10">
                                                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-700/80 text-[#C9A96E] flex items-center justify-center backdrop-blur-sm hover:bg-gray-600 hover:text-white transition-colors">
                                                        <ArrowRight className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
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

            {/* COMING SOON OVERLAY */}
            {comingSoon && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setComingSoon(null)}></div>
                    <div className="bg-[#1a1412] border border-white/10 p-8 rounded-2xl z-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 mx-auto mb-4 border border-white/10 rounded-full flex items-center justify-center bg-[#d4af37]/10">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className="text-[#d4af37] font-bold text-2xl mb-3">{cs.title}</h3>
                        <p className="text-[#c8bfb2] mb-6">{cs.desc}</p>
                        <button
                            onClick={() => setComingSoon(null)}
                            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa8022] text-black font-bold rounded-xl active:scale-95 transition-transform"
                        >
                            {cs.close}
                        </button>
                    </div>
                </div>
            )}

            {detailService && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDetailService(null)} />
                    <div className="relative z-10 w-full sm:max-w-2xl rounded-t-[30px] sm:rounded-[30px] border border-white/10 bg-[#0d0d0d] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setDetailService(null)}
                            className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={cs.close}
                        >
                            <X size={28} />
                        </button>
                        <div className="flex gap-5 pr-8">
                            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-black/30 sm:h-36 sm:w-36">
                                <img src={detailService.img} alt={detailName} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{detailName}</h3>
                                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    {detailService.timeValue > 0 && (
                                        <span className="rounded-full border border-white/12 px-4 py-1.5 text-xl font-black text-[#f3d889]">
                                            {detailService.timeValue} {cs.mins}
                                        </span>
                                    )}
                                    <span className="text-3xl font-black text-[#C9A96E]">{formatCurrency(detailService.priceVND)} <span className="text-base text-gray-500">VND</span></span>
                                    <span className="text-2xl font-bold text-emerald-500">{detailService.priceUSD} USD</span>
                                </div>
                            </div>
                        </div>
                        {detailDescription && detailDescription.trim().toLowerCase() !== detailName.trim().toLowerCase() && (
                            <p className="mt-6 max-h-[30vh] overflow-y-auto whitespace-pre-line text-xl leading-relaxed text-gray-300 custom-scrollbar sm:text-2xl">
                                {detailDescription}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                onQuickAdd?.(detailService);
                                setDetailService(null);
                            }}
                            className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#b6965b] to-[#C9A96E] py-4 text-xl font-black uppercase text-black shadow-lg transition-transform active:scale-[0.98] sm:py-5 sm:text-2xl"
                        >
                            <Plus size={28} />
                            <span>{cs.add}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
