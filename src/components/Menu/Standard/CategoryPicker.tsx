import React, { useMemo, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Category, Service } from '@/components/Menu/types';
import { ArrowLeft, History, Loader2, Search, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { languages } from '@/app/(intro)/LanguageSelector.lang';
import { checkUserEmail } from '@/services/user';
import { useAuthStore } from '@/lib/authStore.logic';
import { GoogleLoginBtn } from '@/components/Auth/GoogleLoginBtn';
import { useMenuData } from '@/components/Menu/MenuContext';
import { rememberCustomerVisit } from '@/lib/customerVisit';

// 🔧 UI CONFIGURATION
// Cấu hình thời gian và hiệu ứng chuyển cảnh của màn hình Chọn Danh Mục
const UI_ANIMATION_CONFIG = {
    PICKER_EXIT_DURATION: 0.25,        // Thời gian (giây) để màn hình Picker mờ đi khi chuyển trang
    CARDS_STAGGER_DELAY: 0.06,         // Độ trễ (giây) xuất hiện LẦN LƯỢT giữa các thẻ (0.01 là cực nhanh)
    CARDS_START_DELAY: 0.15,           // Chờ bao nhiêu giây mới bắt đầu hiện thẻ đầu tiên
    CARD_EXIT_DURATION: 0.2,           // Thời gian thẻ thu nhỏ trước khi biến mất
};

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: UI_ANIMATION_CONFIG.CARDS_STAGGER_DELAY,
            delayChildren: UI_ANIMATION_CONFIG.CARDS_START_DELAY,
        },
    },
    exit: {
        opacity: 0,
        transition: { duration: UI_ANIMATION_CONFIG.PICKER_EXIT_DURATION },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    exit: {
        opacity: 0,
        scale: 0.85,
        transition: { duration: UI_ANIMATION_CONFIG.CARD_EXIT_DURATION },
    },
};

interface Props {
    categories: Category[];
    lang: string;
    onSelect: (ids: string[]) => void;
    onBack: () => void;
    showBack?: boolean;
    showQuickActions?: boolean;
    onBestSellerSelect?: (service: Service) => void;
}

const marqueeText: Record<string, string> = {
    en: 'Random Staff. Random Room.',
    vi: 'Nhân viên ngẫu nhiên. Phòng ngẫu nhiên.',
    jp: 'スタッフはランダム。部屋はランダム。',
    kr: '랜덤 직원. 랜덤 룸.',
    cn: '随机员工。随机房间。'
};

const bestSellerText: Record<string, { label: string }> = {
    en: { label: 'Best Seller' },
    vi: { label: 'Bán chạy' },
    jp: { label: '人気' },
    kr: { label: '인기' },
    cn: { label: '热卖' },
};

const quickActionText: Record<string, { history: string; findHistory: string; desc: string; placeholder: string; search: string; cancel: string; notFound: string; notFoundDesc: string; lookupError: string; retry: string; register: string; continueOrder: string; orManual: string }> = {
    en: {
        history: 'History',
        findHistory: 'Find History',
        desc: 'Enter your phone number or email to retrieve past visits.',
        placeholder: 'Phone number or Email',
        search: 'Search',
        cancel: 'Cancel',
        notFound: 'Not Found',
        notFoundDesc: 'This phone number or email has not been used before.',
        lookupError: 'Unable to check right now. Please try again.',
        retry: 'Try Another Phone/Email',
        register: 'Register New Customer',
        continueOrder: 'Use this info for a new order',
        orManual: 'or enter manually',
    },
    vi: {
        history: 'Lịch sử',
        findHistory: 'Tìm lịch sử',
        desc: 'Nhập số điện thoại hoặc email để tìm lại lịch sử ghé thăm.',
        placeholder: 'Số điện thoại hoặc Email',
        search: 'Tìm kiếm',
        cancel: 'Hủy',
        notFound: 'Không tìm thấy',
        notFoundDesc: 'Số điện thoại hoặc email này chưa từng sử dụng dịch vụ.',
        lookupError: 'Chưa thể tra cứu lúc này. Vui lòng thử lại.',
        retry: 'Thử số/email khác',
        register: 'Đăng ký khách mới',
        continueOrder: 'Dùng thông tin này tạo đơn',
        orManual: 'hoặc nhập thủ công',
    },
    jp: {
        history: '履歴',
        findHistory: '履歴検索',
        desc: '過去の履歴を検索するには電話番号またはメールを入力してください。',
        placeholder: '電話番号またはメール',
        search: '検索',
        cancel: 'キャンセル',
        notFound: '見つかりません',
        notFoundDesc: 'この電話番号またはメールアドレスは登録されていません。',
        lookupError: '現在確認できません。もう一度お試しください。',
        retry: '別の電話番号/メールを試す',
        register: '新規登録',
        continueOrder: 'この情報で新しい注文を作成',
        orManual: 'または手動入力',
    },
    kr: {
        history: '내역',
        findHistory: '기록 찾기',
        desc: '이전 방문 기록을 확인하려면 전화번호 또는 이메일을 입력하세요.',
        placeholder: '전화번호 또는 이메일',
        search: '검색',
        cancel: '취소',
        notFound: '찾을 수 없음',
        notFoundDesc: '이 전화번호 또는 이메일은 사용된 적이 없습니다.',
        lookupError: '지금은 조회할 수 없습니다. 다시 시도해 주세요.',
        retry: '다른 전화번호/이메일 시도',
        register: '신규 고객 등록',
        continueOrder: '이 정보로 새 주문 만들기',
        orManual: '또는 직접 입력',
    },
    cn: {
        history: '历史',
        findHistory: '查找记录',
        desc: '请输入您的电话号码或电子邮件以检索过往记录。',
        placeholder: '电话号码或邮箱',
        search: '搜索',
        cancel: '取消',
        notFound: '未找到',
        notFoundDesc: '此电话号码或电子邮件尚未使用过。',
        lookupError: '暂时无法查询，请重试。',
        retry: '尝试其他电话/邮箱',
        register: '注册新客户',
        continueOrder: '使用此信息创建新订单',
        orManual: '或手动输入',
    },
};

const CategoryPicker = ({ categories, lang, onSelect, onBack, showBack = true, showQuickActions = false, onBestSellerSelect }: Props) => {
    const quickText = quickActionText[lang] || quickActionText.en;
    const marquee = marqueeText[lang] || marqueeText.en;
    const designJourneyCategory = categories.find(cat => cat.id === 'DesignJourney');
    const wheelCategories = categories.filter(cat => cat.id !== 'DesignJourney');

    const router = useRouter();
    const pathname = usePathname();
    const [showHistoryPopup, setShowHistoryPopup] = useState(false);
    const [historyStep, setHistoryStep] = useState<'input' | 'not_found' | 'error'>('input');
    const [historyInput, setHistoryInput] = useState('');
    const [failedInput, setFailedInput] = useState('');
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const { user } = useAuthStore();
    const { services, clearCart, updateCustomerInfo, resetCustomerInfo } = useMenuData();
    const bestSeller = bestSellerText[lang] || bestSellerText.en;
    const barberBestSeller = useMemo(() => {
        const activeBarberServices = services.filter((svc) => svc.ACTIVE !== false && svc.cat === 'Barber');

        return activeBarberServices.find((svc) =>
            (svc.names.en || '').trim().toLowerCase() === 'barber package 4'
        ) || activeBarberServices.find((svc) =>
            (svc.names.en || '').trim().toLowerCase().includes('package 4')
        );
    }, [services]);

    const changeLanguage = (newLang: string) => {
        if (!pathname) return;
        const segments = pathname.split('/');
        if (segments.length > 1) {
            segments[1] = newLang; // Giả sử route là /[lang]/...
            router.replace(segments.join('/')); // Dùng replace để back button không bị kẹt
        }
    };

    const handleSelect = (id: string) => {
        // Single-select: immediately navigate to menu
        onSelect([id]);
    };

    const handleCheckUserEmail = async (inputValue: string) => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue) return;

        setIsHistoryLoading(true);
        const result = await checkUserEmail(trimmedValue);
        setIsHistoryLoading(false);

        if (result.exists && result.customer) {
            rememberCustomerVisit(trimmedValue, result.customer.name);
            router.push(`/${lang}/old-user/history`);
        } else {
            setFailedInput(trimmedValue);
            setHistoryStep(result.status === 'error' ? 'error' : 'not_found');
        }
    };

    const handleHistory = () => {
        if (user?.email) {
            handleCheckUserEmail(user.email);
            return;
        }
        setHistoryStep('input');
        setShowHistoryPopup(true);
    };

    const handleRegisterNewCustomer = () => {
        setShowHistoryPopup(false);
        clearCart();
        rememberCustomerVisit(failedInput);
        resetCustomerInfo();
        updateCustomerInfo(failedInput.includes('@') ? 'email' : 'phone', failedInput);
        router.replace(`/${lang}/standard/menu`);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col justify-between overflow-y-auto overflow-x-hidden bg-transparent font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* CSS Animation cho Vòng quay và bố cục chuyển đổi */}
            <style>{`
                @keyframes wheelSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes wheelCounterSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .wheel-ring {
                    animation: wheelSpin 36s linear infinite;
                    animation-iteration-count: infinite;
                    animation-fill-mode: none;
                    will-change: transform;
                }
                .wheel-node {
                    animation: wheelCounterSpin 36s linear infinite;
                    animation-iteration-count: infinite;
                    animation-fill-mode: none;
                    will-change: transform;
                }
                .category-wheel-stage {
                    --wheel-size: min(92vw, calc(100dvh - 160px), 520px);
                    --wheel-radius: calc(var(--wheel-size) * 0.37);
                    --node-size: clamp(92px, 24vw, 135px);
                    --icon-size: clamp(56px, 15.5vw, 80px);
                    --center-size: clamp(120px, 30vw, 185px);
                    --center-icon-size: clamp(72px, 19vw, 120px);
                    width: var(--wheel-size);
                }
                @media (min-width: 640px) {
                    .category-wheel-stage {
                        --wheel-size: min(86vw, calc(100dvh - 160px), 720px);
                        --wheel-radius: calc(var(--wheel-size) * 0.365);
                        --node-size: clamp(152px, 19.5vw, 190px);
                        --icon-size: clamp(88px, 11.5vw, 110px);
                        --center-size: clamp(195px, 24.5vw, 250px);
                        --center-icon-size: clamp(126px, 16vw, 165px);
                    }
                }
                @media (min-width: 768px) {
                    .category-wheel-stage {
                        --wheel-size: min(88vw, calc(100dvh - 160px), 760px);
                        --wheel-radius: calc(var(--wheel-size) * 0.365);
                        --node-size: clamp(165px, 20.5vw, 200px);
                        --icon-size: clamp(98px, 12.5vw, 120px);
                        --center-size: clamp(210px, 25.5vw, 260px);
                        --center-icon-size: clamp(138px, 16.5vw, 175px);
                    }
                }
                @media (min-width: 1024px) {
                    .category-wheel-stage {
                        --wheel-size: min(76vw, calc(100dvh - 170px), 840px);
                        --wheel-radius: calc(var(--wheel-size) * 0.375);
                        --node-size: clamp(185px, 18.5vw, 220px);
                        --icon-size: clamp(110px, 11.5vw, 135px);
                        --center-size: clamp(240px, 23.5vw, 285px);
                        --center-icon-size: clamp(156px, 15.5vw, 190px);
                    }
                }
            `}</style>

            {/* --- ZONE 1: TOP HEADER (Back, Best Seller, History) --- */}
            <header className="relative z-[110] flex items-center justify-between w-full px-3 sm:px-6 pt-3 sm:pt-4 min-h-[52px] shrink-0 gap-2">
                {/* Back Button */}
                <div className="w-20 sm:w-28 flex items-center justify-start">
                    {showBack && (
                        <motion.button
                            type="button"
                            className="p-2 sm:p-2.5 cursor-pointer opacity-75 hover:opacity-100 transition-opacity flex items-center bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm border border-white/10"
                            onClick={onBack}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            aria-label="Back"
                        >
                            <ArrowLeft className="text-white w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                        </motion.button>
                    )}
                </div>

                {/* Center: Best Seller Ribbon Banner */}
                <div className="flex-1 min-w-0 flex justify-center items-center">
                    {showQuickActions && barberBestSeller && (
                        <motion.button
                            type="button"
                            onClick={() => onBestSellerSelect ? onBestSellerSelect(barberBestSeller) : handleSelect('Barber')}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: -14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="relative w-full max-w-[150px] xs:max-w-[180px] sm:max-w-[220px] focus-visible:outline-none cursor-pointer"
                            style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))' }}
                        >
                            <motion.div
                                className="relative flex items-center justify-center w-full"
                                animate={{ scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            >
                                {/* Left Tail */}
                                <div className="absolute top-1 -bottom-2 -left-4 sm:-left-5 w-8 sm:w-10 bg-gradient-to-b from-[#dca038] to-[#9a6210] -z-20" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0)' }}></div>

                                {/* Right Tail */}
                                <div className="absolute top-1 -bottom-2 -right-4 sm:-right-5 w-8 sm:w-10 bg-gradient-to-b from-[#dca038] to-[#9a6210] -z-20" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%, 75% 50%, 100% 0)' }}></div>

                                {/* Left Fold */}
                                <div className="absolute -bottom-2 left-0 w-3 h-2 bg-[#6a4006] -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>

                                {/* Right Fold */}
                                <div className="absolute -bottom-2 right-0 w-3 h-2 bg-[#6a4006] -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>

                                {/* Main Banner */}
                                <div className="relative w-full bg-gradient-to-b from-[#fce895] to-[#dca038] px-3 sm:px-4 py-1.5 sm:py-2 z-10 border-t border-white/50 border-b border-black/10">
                                    <span className="block text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-[#034a2e] text-center truncate">
                                        {bestSeller.label}
                                    </span>
                                </div>

                                {/* Sparkle */}
                                <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-16 sm:w-20 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffebb5] to-transparent z-20 pointer-events-none"></div>
                                <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,235,181,0.9)] z-20 animate-pulse pointer-events-none"></div>
                            </motion.div>
                        </motion.button>
                    )}
                </div>

                {/* Right: History Action (Clean text + icon link, no button frame) */}
                <div className="w-20 sm:w-28 flex items-center justify-end">
                    {showQuickActions && (
                        <motion.button
                            type="button"
                            onClick={handleHistory}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group flex items-center gap-1.5 sm:gap-2 px-1 py-1 cursor-pointer focus-visible:outline-none transition-colors"
                        >
                            <History size={16} className="sm:w-[18px] sm:h-[18px] text-[#FFE38A]/80 group-hover:text-[#FFE38A] transition-colors shrink-0" strokeWidth={2} />
                            <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#FFE38A]/80 group-hover:text-[#FFE38A] transition-colors whitespace-nowrap">
                                {quickText.history}
                            </span>
                        </motion.button>
                    )}
                </div>
            </header>

            {/* --- ZONE 2: CIRCULAR WHEEL (Intact On All Screens) --- */}
            <motion.div
                className="category-wheel-container flex-1 w-full flex flex-col items-center justify-center py-2 relative min-h-0 overflow-visible"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="category-wheel-stage relative aspect-square flex items-center justify-center"
                >
                    <div className="wheel-ring absolute inset-0 rounded-full origin-center">
                        {wheelCategories.map((cat, index) => {
                            const name = cat.names[lang as keyof typeof cat.names] || cat.names['en'];
                            const angle = index * (360 / wheelCategories.length);
                            
                            return (
                                <div 
                                    key={cat.id}
                                    className="absolute left-1/2 top-1/2 w-0 h-0"
                                    style={{ 
                                        transform: `rotate(${angle}deg) translateY(calc(-1 * var(--wheel-radius)))`
                                    }}
                                >
                                    <div className="absolute left-0 top-0 w-0 h-0" style={{ transform: `rotate(-${angle}deg)` }}>
                                        <div className="wheel-node absolute left-0 top-0 w-0 h-0">
                                            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                                                <motion.button
                                                    variants={cardVariants}
                                                    onClick={() => handleSelect(cat.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{ 
                                                        width: 'var(--node-size)',
                                                        minHeight: 'var(--node-size)',
                                                    }}
                                                    className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-1 py-1 sm:py-1.5 transition-colors relative group overflow-visible"
                                                >
                                                    <div
                                                        style={{
                                                            width: 'var(--icon-size)',
                                                            height: 'var(--icon-size)'
                                                        }}
                                                        className="shrink-0 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110"
                                                    >
                                                        <span
                                                            className="gold-mask-icon h-full w-full opacity-90 transition-all duration-300 group-hover:opacity-100"
                                                            style={{ '--icon-url': `url("${cat.image}")` } as React.CSSProperties}
                                                            aria-label={name}
                                                        />
                                                    </div>
                                                    <span
                                                        className="shrink-0 font-bold tracking-wide text-center leading-tight relative z-10 w-full bg-gradient-to-b from-[#FFE38A] via-[#E3A51F] to-[#9A5A07] bg-clip-text text-transparent drop-shadow-[0_2px_5px_rgba(116,50,4,0.88)] group-hover:brightness-125 transition-all duration-300 px-0.5 text-[13px] xs:text-sm sm:text-lg md:text-2xl lg:text-[26px] xl:text-[28px] whitespace-normal break-words"
                                                    >
                                                        {name}
                                                    </span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {showQuickActions && designJourneyCategory && (
                        <motion.button
                            type="button"
                            variants={cardVariants}
                            onClick={() => handleSelect(designJourneyCategory.id)}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.96 }}
                            className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center p-2 sm:p-3 text-center transition-transform cursor-pointer overflow-visible"
                            style={{
                                width: 'var(--center-size)',
                                height: 'var(--center-size)',
                            }}
                        >
                            <span
                                className="mb-1 shrink-0 flex items-center justify-center"
                                style={{
                                    width: 'var(--center-icon-size)',
                                    height: 'var(--center-icon-size)',
                                }}
                            >
                                <img
                                    src={designJourneyCategory.image}
                                    alt={designJourneyCategory.names[lang as keyof typeof designJourneyCategory.names] || designJourneyCategory.names.en}
                                    className="h-full w-full object-contain drop-shadow-[0_10px_26px_rgba(255,227,138,0.28)]"
                                />
                            </span>
                            <span className="max-w-[95%] shrink-0 text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-[44px] font-black leading-tight text-[#FFE38A] drop-shadow-[0_2px_6px_rgba(116,50,4,0.85)]">
                                {designJourneyCategory.names[lang as keyof typeof designJourneyCategory.names] || designJourneyCategory.names.en}
                            </span>
                        </motion.button>
                    )}
                </motion.div>
            </motion.div>

            {/* --- MARQUEE (RANDOM STAFF & ROOM) --- */}
            <div className="w-full overflow-hidden opacity-85 py-1 pointer-events-none shrink-0 my-0.5">
                <div className="animate-scroll flex w-max">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-xs sm:text-sm md:text-base font-bold text-[#FFE38A] uppercase tracking-[0.15em] whitespace-nowrap px-6 md:px-12">
                            {marquee}
                        </span>
                    ))}
                </div>
            </div>

            {/* --- ZONE 3: LANGUAGE SELECTOR (FLAGS) --- */}
            <footer className="w-full shrink-0 pb-[max(12px,env(safe-area-inset-bottom))] pt-1 px-3 z-[110] flex justify-center">
                <div className="grid grid-cols-5 gap-1.5 xs:gap-2 sm:gap-3 max-w-[340px] sm:max-w-md w-full justify-items-center items-center">
                    {languages.map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            onClick={() => changeLanguage(l.id)}
                            aria-label={l.name}
                            className={`pointer-events-auto aspect-square w-full max-w-[44px] xs:max-w-[48px] sm:max-w-[56px] rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${
                                lang === l.id
                                    ? 'border-white/90 scale-105 shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                                    : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                            <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </footer>

            {/* History Popup */}
            {showHistoryPopup && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="responsive-panel relative w-full max-w-[400px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[32px] border border-white/10 bg-[#0f1218] p-5 sm:p-7 text-center shadow-2xl"
                    >
                        <button
                            type="button"
                            onClick={() => setShowHistoryPopup(false)}
                            className="absolute right-4 top-4 rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={quickText.cancel}
                        >
                            <X size={20} />
                        </button>

                        {historyStep === 'input' ? (
                            <div className="flex flex-col items-center">
                                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#8B6E40]/30">
                                    <History size={46} className="text-[#E3A51F]" strokeWidth={2.5} />
                                    <div className="absolute inset-0 rounded-full bg-[#E3A51F] opacity-20 blur-3xl" />
                                </div>

                                <h3 className="mb-2 text-2xl font-bold text-white">{quickText.findHistory}</h3>
                                <p className="mb-6 text-sm font-medium text-gray-400">{quickText.desc}</p>

                                <div className="mb-4 w-full rounded-[8px] shadow-lg">
                                    <GoogleLoginBtn lang={lang} nextPath={`/${lang}/standard/menu`} />
                                </div>

                                <div className="mb-4 flex w-full items-center gap-3">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{quickText.orManual}</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <input
                                    type="text"
                                    placeholder={quickText.placeholder}
                                    className="mb-4 w-full rounded-2xl border border-[#2a3040] bg-[#161b26] p-4 text-center text-lg font-bold text-white outline-none transition-all placeholder:text-gray-600 focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]"
                                    value={historyInput}
                                    onChange={(e) => setHistoryInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckUserEmail(historyInput)}
                                    autoFocus
                                />

                                <button
                                    type="button"
                                    onClick={() => handleCheckUserEmail(historyInput)}
                                    disabled={isHistoryLoading || !historyInput.trim()}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FFF8E1] via-[#E8C97A] to-[#B8860B] py-4 font-black uppercase tracking-widest text-black shadow-[0_16px_36px_rgba(212,175,55,0.32)] ring-1 ring-[#F4E2B3]/45 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:from-[#8D5A1B] disabled:via-[#D4AF37] disabled:to-[#F4E2B3] disabled:text-black disabled:opacity-95 disabled:shadow-[0_12px_30px_rgba(212,175,55,0.22)]"
                                >
                                    {isHistoryLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} strokeWidth={3} />}
                                    {quickText.search}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                                    <X size={42} />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-white">{historyStep === 'error' ? quickText.lookupError : quickText.notFound}</h3>
                                {historyStep === 'not_found' && <p className="mb-6 text-sm text-gray-400">{quickText.notFoundDesc}</p>}
                                <div className="flex w-full flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setHistoryStep('input')}
                                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                                    >
                                        {quickText.retry}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRegisterNewCustomer}
                                        className="w-full rounded-2xl bg-gradient-to-r from-[#E3A51F] to-[#FFE38A] py-3 font-black text-black transition-transform active:scale-95"
                                    >
                                        {historyStep === 'not_found' ? quickText.register : quickText.continueOrder}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

        </motion.div>
    );
};

export default CategoryPicker;
