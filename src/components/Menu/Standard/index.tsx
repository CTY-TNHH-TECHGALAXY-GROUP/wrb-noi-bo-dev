/*
 * File: Standard/index.tsx
 * Chức năng: Component gốc (Root) của Menu Standard.
 * Logic chi tiết:
 * - Quản lý state toàn cục: cart (giỏ hàng), sheet (trạng thái hiển thị popup), activeCategory.
 * - Fetch dữ liệu service từ getServices.
 * - Tính toán tổng tiền (VND/USD) và tổng item thông qua useMemo.
 * - Điều phối hiển thị các Sheet: MainSheet (chọn giờ), ReviewSheet (sửa món), CartDrawer (giỏ hàng).
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// 🔧 UI CONFIGURATION
export const PAGE_TRANSITION_CONFIG = {
    // Thời gian trượt vào của Menu (spring animation)
    MENU_SPRING_STIFFNESS: 350, // Càng lớn càng giật nhanh (mặc định cũ 260)
    MENU_SPRING_DAMPING: 25,    // Độ nảy (mặc định 25)

    // Thời gian đợi (ms) sau khi Menu đã trượt xong thì mới thực hiện cuộn đến mục Dịch vụ
    // Chỉnh xuống 50ms hoặc 0ms nếu muốn cuộn ngay lập tức
    SCROLL_DELAY_AFTER_ANIMATION_MS: 30,

    // Hiệu ứng cuộn. 
    // - 'auto': Nhảy cái rụp đến mục được chọn (nhanh nhất)
    // - 'smooth': Trình duyệt tự cuộn từ từ (thường ở các đt cũ hoặc vuốt xa sẽ rất châm)
    SCROLL_BEHAVIOR: 'auto' as ScrollBehavior,
};

// 1. Import Components con
import Header from './Header';
import ServiceList from './ServiceList';
import Footer from './Footer';

// Import các Sheet
import MainSheet from './Sheets/MainSheet';
import ReviewSheet from './Sheets/ReviewSheet';
import CartDrawer from './Sheets/CartDrawer';
import CustomForYouModal from '@/components/CustomForYou';
import { CustomPreferences } from '@/components/CustomForYou/types';

// Import Category Picker
import CategoryPicker from './CategoryPicker';

// 2. Import Logic & Data
import { CATEGORIES } from '@/components/Menu/constants';
import { Category, Service, SheetState } from '@/components/Menu/types';
import { useMenuData } from '@/components/Menu/MenuContext'; // Import Hook Context

interface StandardMenuProps {
    lang: string;
    menuType?: string;
    onBack: () => void;
    onCheckout: () => void;
    onSwitchToVip?: () => void;
    showHiddenServices?: boolean;
    showEntryActions?: boolean;
    showPickerBack?: boolean;
}

const DESIGN_JOURNEY_CATEGORY: Category = {
    id: 'DesignJourney',
    names: {
        en: 'VIP',
        vi: 'VIP',
        jp: 'VIP',
        kr: 'VIP',
        cn: 'VIP'
    },
    image: '/assets/icons/design-journey-key.png'
};

const getUniqueServiceOptions = (group: Service[]) => (
    group
        .filter((svc, idx, arr) => arr.findIndex(s => s.timeValue === svc.timeValue && s.priceVND === svc.priceVND) === idx)
        .sort((a, b) => a.timeValue - b.timeValue)
);

const isPrivateRoomAddonService = (service: Service) => {
    const name = `${service.names?.en || ''} ${service.names?.vi || ''}`.toLowerCase();
    return service.priceVND === 105000 && (name.includes('private room') || name.includes('phòng riêng') || name.includes('phong rieng'));
};

const stripCartOnlyCustomFlags = (prefs: CustomPreferences): CustomPreferences => ({
    ...prefs,
    notes: {
        ...prefs.notes,
        privateRoom: false
    }
});

export default function StandardMenu({ lang, menuType = 'standard', onBack, onCheckout, onSwitchToVip, showHiddenServices = false, showEntryActions = false, showPickerBack = true }: StandardMenuProps) {
    // --- STATE DỮ LIỆU ---
    // Remove local loading state (duplicate)
    const [services, setServices] = useState<Service[]>([]);

    // --- STATE GIAO DIỆN ---
    const [mode, setMode] = useState<'PICKER' | 'MENU'>('PICKER');
    const [activeCategory, setActiveCategory] = useState<string>('Body');
    const [slideDirection, setSlideDirection] = useState<number>(1);
    const [pendingScrollCategory, setPendingScrollCategory] = useState<string | null>(null);
    const [showIntroSplash, setShowIntroSplash] = useState(true);

    // State quản lý Sheet
    const [sheet, setSheet] = useState<SheetState>({
        isOpen: false,
        type: null,
        data: null
    });

    const [lastAddedCartIds, setLastAddedCartIds] = useState<string[]>([]);

    // --- 1. LẤY DATA TỪ CONTEXT ---
    const { services: allServices, loading: contextLoading, error: contextError, refreshData, cart, addToCart: contextAddToCart, updateCartItem, updateCartItemOptions, removeFromCart } = useMenuData();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setShowIntroSplash(false);
        }, 850);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!contextLoading) {
            // Filter đúng loại (Standard: NHS..., Spa: NHT...)
            const standardServices = allServices.filter(s => s.menuType === menuType);
            setServices(standardServices);
        }
    }, [allServices, contextLoading]);

    // Check query string for auto-opening cart (e.g. from Modify Order) or sessionStorage for state persistence
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = sessionStorage.getItem('standard_menu_mode');
            const savedCategory = sessionStorage.getItem('standard_menu_category');

            if (savedMode === 'MENU') {
                setMode('MENU');
                if (savedCategory) {
                    setActiveCategory(savedCategory);
                }
                // Clear so it doesn't affect subsequent normal visits
                sessionStorage.removeItem('standard_menu_mode');
                sessionStorage.removeItem('standard_menu_category');
            } else {
                const params = new URLSearchParams(window.location.search);
                if (params.get('cart') === 'open') {
                    setMode('MENU');
                    setSheet({ isOpen: true, type: 'CART', data: null });
                }
            }
        }
    }, []);

    // --- 2. LOGIC TÍNH TOÁN CART ---
    const standardCartItems = useMemo(
        () => cart.filter(item => item.itemType !== 'vip'),
        [cart]
    );

    // a. Tính tổng tiền & số lượng (cho Footer)
    const { totalVND, totalUSD, totalItems, maxMinutes } = useMemo(() => {
        let vnd = 0, usd = 0, items = 0, maxMin = 0;

        standardCartItems.forEach(item => {
            vnd += (item.priceVND || 0) * item.qty;
            usd += (item.priceUSD || 0) * item.qty;
            items += item.qty;
            if (item.timeValue > maxMin) maxMin = item.timeValue;
        });

        return { totalVND: vnd, totalUSD: usd, totalItems: items, maxMinutes: maxMin };
    }, [standardCartItems]);

    // b. Tạo Lookup Map (ID -> Qty) để truyền xuống ServiceList và MainSheet (để hiện Badge)
    const cartLookup = useMemo(() => {
        const lookup: Record<string, number> = {};
        cart.forEach(item => {
            // Cộng dồn qty của các item có cùng ID (dù khác options)
            lookup[item.id] = (lookup[item.id] || 0) + item.qty;
        });
        return lookup;
    }, [cart]);

    // Array categories gốc (hiển thị đủ trên Header)
    const allCategories = CATEGORIES;
    const pickerCategories = showEntryActions ? [...CATEGORIES, DESIGN_JOURNEY_CATEGORY] : CATEGORIES;
    // Array dành cho phần thân: CHỈ hiển thị category đang được chọn
    const filteredCategories = CATEGORIES.filter(cat => cat.id === activeCategory);
    const privateRoomAddonService = useMemo(
        () => allServices.find(isPrivateRoomAddonService),
        [allServices]
    );

    // --- 3. XỬ LÝ TƯƠNG TÁC ---

    // [QUAN TRỌNG] Khi bấm vào Card ở List -> Nhận vào 1 NHÓM (Service[])
    const handleServiceClick = (group: Service[]) => {
        setSheet({ isOpen: true, type: 'MAIN', data: group });
    };

    const handleBestSellerSelect = (service: Service) => {
        const sourceServices = services.length > 0
            ? services
            : allServices.filter(s => s.menuType === menuType);
        const targetName = service.names.en.trim().toLowerCase();
        const targetGroup = sourceServices.filter(svc =>
            svc.ACTIVE !== false &&
            (svc.cat === service.cat || (svc.cats && svc.cats.includes(service.cat))) &&
            svc.names.en.trim().toLowerCase() === targetName
        );

        setActiveCategory(service.cat);
        setMode('MENU');
        setPendingScrollCategory(null);

        window.setTimeout(() => {
            setSheet({
                isOpen: true,
                type: 'MAIN',
                data: targetGroup.length > 0 ? targetGroup : [service]
            });
        }, 90);
    };

    // Hàm cập nhật Cart (Dùng cho cả MainSheet và ReviewSheet)
    const handleUpdateCart = (cartId: string, qty: number) => {
        updateCartItem(cartId, qty);
    };

    const handleAddToCart = (id: string, qty: number, options?: any) => {
        const service = services.find(s => s.id === id);
        if (service) {
            const newAddedIds: string[] = [];

            flushSync(() => {
                // Thêm mới từng item riêng để cùng service nhưng custom/note khác nhau vẫn nằm thành các dòng riêng trong cart.
                for (let i = 0; i < qty; i++) {
                    const newId = contextAddToCart(service, 1, options);
                    newAddedIds.push(newId);
                }

                // 4. CHUYỂN SANG BƯỚC CUSTOM (hoặc skip nếu không cần)
                setLastAddedCartIds(newAddedIds);

                // Task E2: Skip Custom modal for services that don't need it (e.g., Private Room)
                if (service.SHOW_CUSTOM_FOR_YOU === false) {
                    setSheet({ isOpen: false, type: null, data: null });
                } else {
                    setSheet({ isOpen: true, type: 'CUSTOM', data: service });
                }
            });
        }
    };

    const handleQuickAddService = (service: Service) => {
        handleAddToCart(service.id, 1);
    };

    const handleQuickRemoveService = (service: Service) => {
        const item = [...standardCartItems].reverse().find(cartItem => cartItem.id === service.id);
        if (!item) return;

        if (item.qty <= 1) {
            standardCartItems
                .filter(cartItem => cartItem.options?.addonForCartId === item.cartId)
                .forEach(cartItem => removeFromCart(cartItem.cartId));
            removeFromCart(item.cartId);
            return;
        }

        updateCartItem(item.cartId, item.qty - 1);
    };

    const handleDuplicateCartItem = (item: typeof cart[number]) => {
        contextAddToCart(item, 1, item.options);
        closeSheet();
    };

    const handleSetCartGroupQuantity = (item: typeof cart[number], nextQty: number) => {
        const optionsKey = JSON.stringify(item.options || {});
        const matchingItems = standardCartItems.filter(cartItem =>
            cartItem.id === item.id && JSON.stringify(cartItem.options || {}) === optionsKey
        );
        const currentQty = matchingItems.reduce((sum, cartItem) => sum + cartItem.qty, 0);

        if (nextQty > currentQty) {
            for (let i = 0; i < nextQty - currentQty; i++) {
                contextAddToCart(item, 1, item.options);
            }
            return;
        }

        let remainingQty = nextQty;
        matchingItems.forEach(cartItem => {
            if (remainingQty <= 0) {
                updateCartItem(cartItem.cartId, 0);
                return;
            }

            const keptQty = Math.min(cartItem.qty, remainingQty);
            if (keptQty !== cartItem.qty) {
                updateCartItem(cartItem.cartId, keptQty);
            }
            remainingQty -= keptQty;
        });
    };

    const maybeOpenSingleGroupDurationDrawer = (categoryId: string) => {
        const categoryServices = services.filter(s => 
            (s.cat === categoryId || (s.cats && s.cats.includes(categoryId))) && 
            s.ACTIVE !== false
        );
        const groups: Record<string, Service[]> = {};

        categoryServices.forEach(svc => {
            const key = svc.names.en.trim().toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(svc);
        });

        const groupValues = Object.values(groups);
        if (groupValues.length !== 1) {
            setPendingScrollCategory(categoryId);
            return;
        }

        const uniqueOptions = getUniqueServiceOptions(groupValues[0]);
        if (uniqueOptions.length > 1) {
            setTimeout(() => {
                setSheet({ isOpen: true, type: 'MAIN', data: groupValues[0] });
            }, 80);
            return;
        }

        setPendingScrollCategory(categoryId);
    };

    const applyCustomToLastAddedItems = (prefs: CustomPreferences) => {
        const wantsPrivateRoom = !!prefs.notes?.privateRoom;
        const servicePrefs = stripCartOnlyCustomFlags(prefs);

        // Áp dụng cho danh sách các item mới
        lastAddedCartIds.forEach(cartId => {
            updateCartItemOptions(cartId, {
                strength: servicePrefs.strength,
                therapist: servicePrefs.therapist,
                bodyParts: servicePrefs.bodyParts,
                notes: servicePrefs.notes
            });

            if (wantsPrivateRoom && privateRoomAddonService) {
                const alreadyAdded = standardCartItems.some(item =>
                    item.options?.addonType === 'private-room' && item.options?.addonForCartId === cartId
                );

                if (!alreadyAdded) {
                    contextAddToCart(privateRoomAddonService, 1, {
                        addonType: 'private-room',
                        addonForCartId: cartId,
                        notes: { tag0: false, tag1: false, privateRoom: false, content: '' }
                    });
                }
            }
        });
    };

    // Hàm lưu custom cho các item vừa thêm
    const handleSaveCustom = (prefs: CustomPreferences) => {
        applyCustomToLastAddedItems(prefs);
        closeSheet();
    };

    const handleSaveCustomAndCheckout = (prefs: CustomPreferences) => {
        flushSync(() => {
            applyCustomToLastAddedItems(prefs);
            setSheet({ isOpen: false, type: null, data: null });
        });
        onCheckout();
    };

    // Mở giỏ hàng tổng (Sẽ làm CartDrawer sau)
    const handleOpenCart = () => {
        setSheet({ isOpen: true, type: 'CART', data: null });
    };

    // Đóng Sheet
    const closeSheet = () => {
        setSheet(prev => ({ ...prev, isOpen: false }));
        setTimeout(() => setSheet({ isOpen: false, type: null, data: null }), 300);
    };

    return (
        <>
            {/* Background Video chung cho toàn bộ luồng Menu */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <video
                    src="/Video/From Klickpin.com- Copy this guide to clever herb garden ideas everyone will ask you about using simple ideas you can actually pull off and turn s.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-100 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/60 z-10" />
            </div>

            <AnimatePresence mode="wait">
                {mode === 'PICKER' && showIntroSplash ? (
                    <motion.div
                        key="intro-splash"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.03 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                        <motion.div
                            className="flex flex-col items-center gap-5"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.38, ease: 'easeOut' }}
                        >
                            <img
                                src="/Image/oria-spa-logo.png"
                                alt="Oria Spa"
                                className="h-28 w-auto object-contain brightness-0 invert sm:h-36 md:h-44 drop-shadow-[0_0_22px_rgba(232,201,122,0.18)]"
                            />
                        </motion.div>
                    </motion.div>
                ) : mode === 'PICKER' ? (
                    <CategoryPicker
                        key="picker"
                        categories={pickerCategories}
                        lang={lang}
                        onSelect={(ids) => {
                            const selectedId = ids[0] || 'Body';

                            if (selectedId === DESIGN_JOURNEY_CATEGORY.id) {
                                if (onSwitchToVip) {
                                    onSwitchToVip();
                                }
                                return;
                            }
                            
                            setActiveCategory(selectedId);
                            setMode('MENU');
                            maybeOpenSingleGroupDurationDrawer(selectedId);
                        }}
                        onBack={onBack}
                        showBack={showPickerBack}
                        showQuickActions={showEntryActions}
                        onBestSellerSelect={handleBestSellerSelect}
                    />
                ) : (
                    <motion.div
                        key="menu"
                        className="relative inset-0 z-20 bg-transparent flex flex-col h-[100dvh] w-full overflow-hidden font-sans"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', stiffness: PAGE_TRANSITION_CONFIG.MENU_SPRING_STIFFNESS, damping: PAGE_TRANSITION_CONFIG.MENU_SPRING_DAMPING }}
                    onAnimationComplete={() => {
                        if (pendingScrollCategory) {
                            setTimeout(() => {
                                const el = document.getElementById(`cat-${pendingScrollCategory}`);
                                if (el) el.scrollIntoView({ behavior: PAGE_TRANSITION_CONFIG.SCROLL_BEHAVIOR });
                                setPendingScrollCategory(null);
                            }, PAGE_TRANSITION_CONFIG.SCROLL_DELAY_AFTER_ANIMATION_MS); // Chỉnh thời gian delay cuộn ở đầu file
                        }
                    }}
                >

                    {/* A. HEADER (Vẫn đưa vào toàn bộ cat để user có thể tab qua lại) */}
                    <Header
                        categories={allCategories}
                        activeCategory={activeCategory}
                        lang={lang}
                        onSelectCategory={(id) => {
                            if (id !== activeCategory) {
                                const oldIdx = allCategories.findIndex(c => c.id === activeCategory);
                                const newIdx = allCategories.findIndex(c => c.id === id);
                                setSlideDirection(newIdx > oldIdx ? 1 : -1);
                                setActiveCategory(id);
                                
                                maybeOpenSingleGroupDurationDrawer(id);
                            }
                        }}
                    />

                    {/* B. LIST (Chỉ truyền category đã lọc) */}
                    {contextLoading ? (
                        <div className="flex-1 px-4 pt-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                            {/* Loading Skeleton */}
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-full h-[120px] bg-white/5 rounded-3xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : contextError || (services.length === 0 && !contextLoading) ? (
                        <div className="flex-1 px-4 flex flex-col items-center justify-center text-center gap-4 overflow-y-auto pb-40">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500/80 mb-2">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-[#e6c487] font-semibold text-lg">{lang === 'vi' ? 'Lỗi Tải Dữ Liệu' : 'Failed to Load'}</h3>
                            <p className="text-sm text-gray-400 max-w-[80%]">
                                {lang === 'vi' ? 'Đường truyền không ổn định hoặc máy chủ phản hồi chậm. Vui lòng thử lại.' : 'Connection is unstable or server is slow. Please try again.'}
                            </p>
                            <button 
                                onClick={() => refreshData()}
                                className="mt-2 px-6 py-3 bg-[#e6c487] text-black font-bold rounded-xl active:scale-95 transition-transform"
                            >
                                {lang === 'vi' ? 'Tải Lại Dữ Liệu' : 'Retry Now'}
                            </button>
                        </div>
                    ) : (
                        <ServiceList
                            categories={filteredCategories}
                            services={services}
                            cart={cartLookup}
                            direction={slideDirection}
                            lang={lang}
                            onItemClick={handleServiceClick}
                            onQuickAdd={handleQuickAddService}
                            onQuickRemove={handleQuickRemoveService}
                            showHiddenServices={showHiddenServices}
                        />
                    )}

                    <Footer
                        totalVND={totalVND}
                        totalUSD={totalUSD}
                        totalItems={totalItems}
                        maxMinutes={maxMinutes}
                        lang={lang}
                        activeCategory={activeCategory}
                        onBack={() => setMode('PICKER')}
                        onToggleCart={handleOpenCart}
                    />

                    {/* D. KHU VỰC CÁC SHEET */}

                    {/* 1. Main Sheet (Chọn thời gian) - Nhận data là Array (Group) */}
                    {sheet.isOpen && sheet.type === 'MAIN' && Array.isArray(sheet.data) && (
                        <MainSheet
                            group={sheet.data} // Truyền data (là mảng) vào prop group
                            cart={cartLookup} // Truyền Lookup Map để check sl
                            cartItems={standardCartItems}
                            isOpen={sheet.isOpen}
                            lang={lang}
                            onClose={closeSheet}
                            onAddToCart={handleAddToCart}
                            onDuplicateCartItem={handleDuplicateCartItem}
                            onSetCartGroupQuantity={handleSetCartGroupQuantity}
                        />
                    )}

                    {/* 2. Review Sheet (Xem lại món đơn lẻ) - Nhận data là 1 Service */}
                    {sheet.isOpen && sheet.type === 'REVIEW' && !Array.isArray(sheet.data) && sheet.data && (
                        <ReviewSheet
                            service={sheet.data}
                            cart={cartLookup} // Truyền Lookup Map
                            isOpen={sheet.isOpen}
                            lang={lang}
                            onClose={closeSheet}
                            onUpdateCart={handleUpdateCart}
                        />
                    )}

                    {/* 3. Cart Drawer (Giỏ hàng) */}
                    {sheet.isOpen && sheet.type === 'CART' && (
                        <CartDrawer
                            cart={standardCartItems}
                            services={services}
                            lang={lang}
                            isOpen={sheet.isOpen}
                            onClose={closeSheet}
                            onUpdateCart={handleUpdateCart}
                            onCheckout={onCheckout}
                        />
                    )}

                    {/* 4. Custom For You Modal (Mới tích hợp vào quy trình) */}
                    {sheet.isOpen && sheet.type === 'CUSTOM' && !Array.isArray(sheet.data) && sheet.data && (
                        <CustomForYouModal
                            isOpen={sheet.isOpen}
                            onClose={closeSheet}
                            onSave={handleSaveCustom}
                            onSaveAndCheckout={handleSaveCustomAndCheckout}
                            serviceData={{
                                ID: sheet.data.id,
                                NAMES: sheet.data.names as Record<string, string>,
                                CAT: sheet.data.cat,
                                FOCUS_POSITION: sheet.data.FOCUS_POSITION as any,
                                TAGS: sheet.data.TAGS as any,
                                SHOW_STRENGTH: sheet.data.SHOW_STRENGTH,
                                HINT: sheet.data.HINT as Record<string, string>,
                                PRICE_VN: sheet.data.priceVND,
                                PRICE_USD: sheet.data.priceUSD,
                                // Task E3: Pass visibility flags
                                SHOW_NOTES: sheet.data.SHOW_NOTES,
                                SHOW_PREFERENCES: sheet.data.SHOW_PREFERENCES,
                                SHOW_GENDER: sheet.data.SHOW_GENDER,
                                SHOW_FOCUS: sheet.data.SHOW_FOCUS,
                            }}
                            lang={lang as any}
                            privateRoomAddon={privateRoomAddonService ? {
                                priceVND: privateRoomAddonService.priceVND,
                                priceUSD: privateRoomAddonService.priceUSD
                            } : undefined}
                        />
                    )}

                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
