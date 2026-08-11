import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Category } from '@/components/Menu/types';
import { dictionary } from './CategoryPicker.i18n';
import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { languages } from '@/app/(intro)/LanguageSelector.lang';

// 🔧 UI CONFIGURATION
const TOKENS = {
    bg: 'bg-transparent',
    cardBg: 'bg-black/10 backdrop-blur-sm',
    textGold: 'text-[#C9A96E]',
    borderLight: 'border-white/10',
    cardBorder: 'border-white/10',
};

// Cấu hình giao diện để người dùng dễ thay đổi bằng số Pixel (Dựa theo the rule)
const UI_LAYOUT_CONFIG = {
    TITLE_SIZE: 'text-3xl',        // Cỡ chữ Select Category 
    LINE_WIDTH: 'w-32',            // Độ dài của dải ánh kim bên dưới chữ
    GRID_PADDING_TOP_PX: 40,       // Khoảng cách từ trên cùng xuống danh sách thẻ menu (chừa chỗ cho nút Back)
};

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

const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 200, damping: 20, delay: 0.05 },
    },
};

interface Props {
    categories: Category[];
    lang: string;
    onSelect: (ids: string[]) => void;
    onBack: () => void;
}

const CategoryPicker = ({ categories, lang, onSelect, onBack }: Props) => {
    const tTitle = dictionary.title[lang as keyof typeof dictionary.title] || dictionary.title.en;
    const tBack = dictionary.back[lang as keyof typeof dictionary.back] || dictionary.back.en;

    const router = useRouter();
    const pathname = usePathname();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const currentLangObj = languages.find(l => l.id === lang) || languages[0];

    const changeLanguage = (newLang: string) => {
        setShowLangMenu(false);
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

    return (
        <motion.div
            className={`fixed inset-0 z-[100] flex flex-col ${TOKENS.bg} font-sans`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Back Button (Fixed at top-left) */}
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
                }
                .wheel-node {
                    animation: wheelCounterSpin 36s linear infinite;
                }
                /* Tạm dừng quay khi hover vào vùng vòng quay */
                .wheel-container:hover .wheel-ring,
                .wheel-container:hover .wheel-node {
                    animation-play-state: paused;
                }
            `}</style>

            {/* Circular Area */}
            <motion.div
                className={`flex-1 w-full h-full flex flex-col items-center justify-center pb-12 md:pb-24 wheel-container relative`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Vùng chứa Vòng quay (Căn giữa) */}
                <div className="relative w-full max-w-[800px] aspect-square flex items-center justify-center">
                    <div className="wheel-ring absolute inset-0 rounded-full origin-center">
                        {categories.map((cat, index) => {
                            const name = cat.names[lang as keyof typeof cat.names] || cat.names['en'];
                            // Xóa bỏ offset 90 độ, để Nút số 1 luôn nằm ở đỉnh (12h)
                            // Khi có 7 danh mục (số lẻ), việc nằm ở đỉnh sẽ giúp vòng tròn đối xứng hoàn hảo 2 bên trái/phải, không bị cảm giác "nghiêng"
                            const angle = index * (360 / categories.length);
                            
                            // Tăng mạnh đường kính vòng tròn để giãn cách các nút xa nhau ra, dễ bấm hơn
                            const radius = 'min(38vw, 38vh, 320px)';
                            
                            return (
                                <div 
                                    key={cat.id}
                                    className="absolute left-1/2 top-1/2 w-0 h-0"
                                    style={{ 
                                        transform: `rotate(${angle}deg) translateY(calc(-1 * ${radius}))` 
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
                                                    whileHover={{ scale: 1.05, borderColor: 'rgba(201,169,110,0.5)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`flex flex-col items-center justify-center gap-1 md:gap-3 px-1 py-3 md:py-4 rounded-3xl ${TOKENS.cardBg} ${TOKENS.cardBorder} border hover:border-[#C9A96E]/50 transition-colors relative overflow-hidden group shadow-lg w-28 h-28 sm:w-[150px] sm:h-[150px] md:w-[180px] md:h-[180px] lg:w-[210px] lg:h-[210px]`}
                                                >
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
                                            <div className="w-14 h-14 sm:w-[80px] sm:h-[80px] md:w-[95px] md:h-[95px] lg:w-[110px] lg:h-[110px] flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
                                                <img
                                                    src={cat.image}
                                                    alt={name}
                                                    className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                />
                                            </div>
                                            <span className="font-medium text-[11px] sm:text-[14px] md:text-[16px] lg:text-[18px] tracking-wide text-center leading-snug relative z-10 w-full text-white/90 group-hover:text-white px-2">
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
                </div>
            </motion.div>

            {/* --- LANGUAGE SELECTOR (FLAGS) --- */}
            <div className="absolute bottom-12 md:bottom-20 left-0 right-0 flex justify-center items-center gap-4 z-[110] pointer-events-none">
                {languages.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => changeLanguage(l.id)}
                        className={`pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${
                            lang === l.id 
                                ? 'border-[#f5df8b] scale-110 shadow-[0_0_15px_rgba(245,223,139,0.5)]' 
                                : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                        <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

        </motion.div>
    );
};

export default CategoryPicker;
