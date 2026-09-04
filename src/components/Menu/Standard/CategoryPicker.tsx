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

const quickActionText: Record<string, { history: string; findHistory: string; desc: string; placeholder: string; search: string; cancel: string; notFound: string; notFoundDesc: string; retry: string; register: string; orManual: string }> = {
    en: {
        history: 'History',
        findHistory: 'Find History',
        desc: 'Enter your phone number or email to retrieve past visits.',
        placeholder: 'Phone number or Email',
        search: 'Search',
        cancel: 'Cancel',
        notFound: 'Not Found',
        notFoundDesc: 'This phone number or email has not been used before.',
        retry: 'Try Another Phone/Email',
        register: 'Register New Customer',
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
        retry: 'Thử số/email khác',
        register: 'Đăng ký khách mới',
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
        retry: '別の電話番号/メールを試す',
        register: '新規登録',
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
        retry: '다른 전화번호/이메일 시도',
        register: '신규 고객 등록',
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
        retry: '尝试其他电话/邮箱',
        register: '注册新客户',
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
    const [historyStep, setHistoryStep] = useState<'input' | 'error'>('input');
    const [historyInput, setHistoryInput] = useState('');
    const [failedInput, setFailedInput] = useState('');
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const { user } = useAuthStore();
    const { services, clearCart, updateCustomerInfo } = useMenuData();
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
            if (result.customer.email) {
                localStorage.setItem('currentUserEmail', result.customer.email);
            } else {
                localStorage.removeItem('currentUserEmail');
            }

            if (result.customer.phone) {
                localStorage.setItem('currentUserPhone', result.customer.phone);
            } else {
                localStorage.removeItem('currentUserPhone');
            }

            localStorage.setItem('currentUserInfo', JSON.stringify(result.customer));
            router.push(`/${lang}/old-user/history`);
        } else {
            setFailedInput(trimmedValue);
            setHistoryStep('error');
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
        updateCustomerInfo('email', failedInput);
        router.replace(`/${lang}/standard/menu`);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-transparent font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Back Button (Fixed at top-left) */}
            {showBack && (
                <motion.div
                    className="absolute top-4 left-4 p-4 md:top-6 md:left-6 cursor-pointer opacity-60 hover:opacity-100 transition-opacity flex items-center z-[110] bg-black/20 rounded-full backdrop-blur-sm"
                    onClick={onBack}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ArrowLeft className="text-white w-6 h-6" strokeWidth={2} />
                </motion.div>
            )}

            {/* CSS Animation cho Vòng quay */}
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
                    --wheel-size: min(94vw, 58vh, 760px);
                    --wheel-radius: calc(var(--wheel-size) * 0.4);
                    --node-size: 120px;
                    --icon-size: 66px;
                    --center-size: 168px;
                    --center-icon-size: 106px;
                    width: var(--wheel-size);
                    transform: translateY(-7vh);
                }
                .entry-marquee {
                    bottom: calc(23vh - 2cm);
                }
                .entry-history-action {
                    top: max(18px, env(safe-area-inset-top));
                    right: 16px;
                }
                .entry-best-seller {
                    top: max(22px, env(safe-area-inset-top));
                    left: 50%;
                    width: clamp(154px, 22vw, 250px);
                    transform: translateX(-50%);
                }
                .entry-language-flags {
                    bottom: max(18px, env(safe-area-inset-bottom));
                }
                @media (max-width: 380px) {
                    .category-wheel-stage {
                        --wheel-size: min(94vw, 50vh, 360px);
                        --node-size: 98px;
                        --icon-size: 52px;
                        --center-size: 136px;
                        --center-icon-size: 84px;
                        transform: translateY(-6vh);
                    }
                    .entry-marquee {
                        bottom: calc(25vh - 2cm);
                    }
                    .entry-history-action {
                        right: 12px;
                    }
                    .entry-best-seller {
                        top: max(16px, env(safe-area-inset-top));
                        width: clamp(142px, 38vw, 190px);
                    }
                }
                @media (min-width: 640px) {
                    .category-wheel-stage {
                        --wheel-size: min(90vw, 64vh, 700px);
                        --node-size: 166px;
                        --icon-size: 92px;
                        --center-size: 220px;
                        --center-icon-size: 144px;
                        transform: translateY(-8vh);
                    }
                    .entry-marquee {
                        bottom: calc(22vh - 2cm);
                    }
                    .entry-history-action {
                        top: max(24px, env(safe-area-inset-top));
                        right: 24px;
                    }
                    .entry-best-seller {
                        top: max(24px, env(safe-area-inset-top));
                        width: clamp(170px, 22vw, 250px);
                    }
                    .entry-language-flags {
                        bottom: max(24px, env(safe-area-inset-bottom));
                    }
                }
                @media (min-width: 1024px) {
                    .category-wheel-stage {
                        --wheel-size: min(78vw, 72vh, 840px);
                        --node-size: 190px;
                        --icon-size: 108px;
                        --center-size: 260px;
                        --center-icon-size: 172px;
                        transform: translateY(-10vh);
                    }
                    .entry-marquee {
                        bottom: calc(20vh - 2cm);
                    }
                    .entry-history-action {
                        top: max(28px, env(safe-area-inset-top));
                        right: 32px;
                    }
                    .entry-best-seller {
                        top: max(28px, env(safe-area-inset-top));
                        width: clamp(190px, 17vw, 270px);
                    }
                }
                @media (min-width: 1280px) {
                    .category-wheel-stage {
                        --wheel-size: min(66vw, 74vh, 860px);
                        --node-size: 202px;
                        --icon-size: 116px;
                        --center-size: 286px;
                        --center-icon-size: 190px;
                        transform: translateY(-11vh);
                    }
                }
            `}</style>

            {showQuickActions && barberBestSeller && (
                <motion.button
                    type="button"
                    onClick={() => onBestSellerSelect ? onBestSellerSelect(barberBestSeller) : handleSelect('Barber')}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: '-50%', y: -14 }}
                    animate={{ opacity: 1, x: '-50%', y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="entry-best-seller absolute z-[105] focus-visible:outline-none"
                    style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.5))' }}
                >
                    <motion.div 
                        className="relative flex items-center justify-center w-full"
                        animate={{ scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                        {/* Left Tail */}
                        <div className="absolute top-1 -bottom-2 -left-5 w-10 bg-gradient-to-b from-[#dca038] to-[#9a6210] -z-20" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 25% 50%, 0 0)' }}></div>
                        
                        {/* Right Tail */}
                        <div className="absolute top-1 -bottom-2 -right-5 w-10 bg-gradient-to-b from-[#dca038] to-[#9a6210] -z-20" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%, 75% 50%, 100% 0)' }}></div>
                        
                        {/* Left Fold */}
                        <div className="absolute -bottom-2 left-0 w-3 h-2 bg-[#6a4006] -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                        
                        {/* Right Fold */}
                        <div className="absolute -bottom-2 right-0 w-3 h-2 bg-[#6a4006] -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>

                        {/* Main Banner */}
                        <div className="relative w-full bg-gradient-to-b from-[#fce895] to-[#dca038] px-4 py-1.5 sm:py-2 z-10 border-t border-white/50 border-b border-black/10">
                            <span className="block text-[11px] sm:text-[13px] font-black uppercase tracking-widest text-[#034a2e] text-center">
                                {bestSeller.label}
                            </span>
                        </div>
                        
                        {/* Sparkle */}
                        <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-20 h-[1.5px] bg-gradient-to-r from-transparent via-[#ffebb5] to-transparent z-20"></div>
                        <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-[#fff] rounded-full shadow-[0_0_10px_3px_rgba(255,235,181,0.9)] z-20 animate-pulse"></div>
                    </motion.div>
                </motion.button>
            )}

            {/* Circular Area */}
            <motion.div
                className="flex-1 w-full h-full flex flex-col items-center justify-center pb-12 md:pb-24 wheel-container relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Vùng chứa Vòng quay (Căn giữa) */}
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
                            // Xóa bỏ offset 90 độ, để Nút số 1 luôn nằm ở đỉnh (12h)
                            // Khi có 7 danh mục (số lẻ), việc nằm ở đỉnh sẽ giúp vòng tròn đối xứng hoàn hảo 2 bên trái/phải, không bị cảm giác "nghiêng"
                            const angle = index * (360 / wheelCategories.length);
                            
                            // Thu nhỏ tỷ lệ chung của vòng quay theo yêu cầu
                            return (
                                <div 
                                    key={cat.id}
                                    className="absolute left-1/2 top-1/2 w-0 h-0"
                                    style={{ 
                                        transform: `rotate(${angle}deg) translateY(calc(-1 * var(--wheel-radius)))`
                                    }}
                                >
                                    {/* Bù trừ góc nghiêng ban đầu để Nút luôn thẳng đứng */}
                                    <div className="absolute left-0 top-0 w-0 h-0" style={{ transform: `rotate(-${angle}deg)` }}>
                                        {/* Wrapper quay ngược (bảo toàn tâm) chống lại trục quay của Ring */}
                                        <div className="wheel-node absolute left-0 top-0 w-0 h-0">
                                            {/* Wrapper Căn giữa tuyệt đối Nút vào tâm */}
                                            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
                                                {/* Component Nút */}
                                                <motion.button
                                                    variants={cardVariants}
                                                    onClick={() => handleSelect(cat.id)}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    style={{ 
                                                        width: 'var(--node-size)',
                                                        height: 'var(--node-size)',
                                                    }}
                                                    className="flex flex-col items-center justify-center gap-1 md:gap-2 px-1 py-2 transition-colors relative group"
                                                >
            
                                            <div 
                                                style={{ 
                                                    width: 'var(--icon-size)',
                                                    height: 'var(--icon-size)'
                                                }}
                                                className="flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110"
                                            >
                                                <span
                                                    className="gold-mask-icon h-full w-full opacity-90 transition-all duration-300 group-hover:opacity-100"
                                                    style={{ '--icon-url': `url("${cat.image}")` } as React.CSSProperties}
                                                    aria-label={name}
                                                />
                                            </div>
                                            <span 
                                                className="font-semibold tracking-wide text-center leading-tight relative z-10 w-full bg-gradient-to-b from-[#FFE38A] via-[#E3A51F] to-[#9A5A07] bg-clip-text text-transparent drop-shadow-[0_2px_5px_rgba(116,50,4,0.88)] group-hover:brightness-125 transition-all duration-300 px-1 text-sm sm:text-lg md:text-2xl lg:text-[28px]"
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
                            className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center p-3 text-center transition-transform"
                            style={{
                                width: 'var(--center-size)',
                                height: 'var(--center-size)',
                            }}
                        >
                            <span
                                className="mb-1 flex items-center justify-center"
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
                            <span className="max-w-[90%] text-2xl font-black leading-tight text-[#FFE38A] drop-shadow-[0_2px_6px_rgba(116,50,4,0.85)] sm:text-3xl md:text-4xl lg:text-[46px]">
                                {designJourneyCategory.names[lang as keyof typeof designJourneyCategory.names] || designJourneyCategory.names.en}
                            </span>
                        </motion.button>
                    )}
                </motion.div>
            </motion.div>

            {/* --- MARQUEE (RANDOM STAFF & ROOM) --- */}
            <div className="entry-marquee absolute left-0 right-0 overflow-hidden z-[100] opacity-90 py-1.5 md:py-2 pointer-events-none">
                <div className="animate-scroll flex w-max">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="text-sm sm:text-base md:text-lg font-bold text-[#FFE38A] uppercase tracking-[0.15em] whitespace-nowrap px-6 md:px-12">
                            {marquee}
                        </span>
                    ))}
                </div>
            </div>

            {showQuickActions && (
                <div className="entry-history-action absolute z-[110]">
                    <div className="flex justify-end">
                        <motion.button
                            type="button"
                            onClick={handleHistory}
                            whileTap={{ scale: 0.97 }}
                            className="group relative overflow-hidden rounded-full border border-white/10 bg-[#12100d]/45 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all hover:border-white/20 hover:bg-[#20170e]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-4 sm:py-3 md:px-5"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-[#E3A51F]/10 via-transparent to-[#FFE38A]/5 opacity-80" />
                            <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#FFE38A]/60 to-transparent" />
                            <span className="relative z-10 flex items-center justify-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3A51F]/15 text-[#FFE38A] ring-1 ring-white/10 sm:h-9 sm:w-9 md:h-10 md:w-10">
                                    <History size={17} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                                </span>
                                <span className="text-[13px] font-semibold leading-tight text-[#FFE38A] sm:text-sm md:text-base">{quickText.history}</span>
                            </span>
                        </motion.button>
                    </div>
                </div>
            )}

            {/* --- LANGUAGE SELECTOR (FLAGS) --- */}
            <div className="entry-language-flags absolute left-0 right-0 flex justify-center items-center gap-3 sm:gap-4 md:gap-5 z-[110] pointer-events-none">
                {languages.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => changeLanguage(l.id)}
                        className={`pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-[3px] flex items-center justify-center transition-all ${
                            lang === l.id 
                                ? 'border-white/80 scale-110 shadow-[0_0_18px_rgba(255,255,255,0.18)]'
                                : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                        <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {showHistoryPopup && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 px-5 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="relative w-full max-w-[400px] rounded-[32px] border border-white/10 bg-[#0f1218] p-7 text-center shadow-2xl"
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
                                <h3 className="mb-2 text-2xl font-bold text-white">{quickText.notFound}</h3>
                                <p className="mb-6 text-sm text-gray-400">{quickText.notFoundDesc}</p>
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
                                        {quickText.register}
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
