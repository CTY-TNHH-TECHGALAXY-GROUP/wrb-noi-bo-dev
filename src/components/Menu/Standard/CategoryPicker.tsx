import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Category } from '@/components/Menu/types';
import { dictionary } from './CategoryPicker.i18n';
import { ArrowLeft } from 'lucide-react';

// 🔧 UI CONFIGURATION
const TOKENS = {
    bg: 'bg-[#0d0d0d]',
    cardBg: 'bg-[#1c1c1e]',
    textGold: 'text-[#C9A96E]',
    borderLight: 'border-white/10',
    cardBorder: 'border-white/5',
};

// Cấu hình giao diện để người dùng dễ thay đổi bằng số Pixel (Dựa theo the rule)
const UI_LAYOUT_CONFIG = {
    HEADER_MARGIN_TOP_PX: 40,      // Thụt lề đầu trang xuống bao nhiêu Pixel 
    TITLE_SIZE: 'text-3xl',        // Cỡ chữ Select Category 
    LINE_WIDTH: 'w-32',            // Độ dài của dải ánh kim bên dưới chữ
    GRID_PADDING_TOP_PX: 20,       // Khoảng cách từ Header xuống danh sách thẻ menu 
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
            {/* Header / Title */}
            <motion.div
                className={`pt-safe-top pb-4 flex flex-col items-center justify-center relative w-full`}
                style={{ paddingTop: `${UI_LAYOUT_CONFIG.HEADER_MARGIN_TOP_PX}px` }}
                variants={headerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Wrapper chứa nút back và title cùng 1 hàng */}
                <div className="w-full flex items-center justify-center relative">
                    <motion.div
                        className="absolute left-4 p-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity flex items-center"
                        onClick={onBack}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowLeft className="text-white w-6 h-6" strokeWidth={1.5} />
                    </motion.div>

                    <h1 className={`${UI_LAYOUT_CONFIG.TITLE_SIZE} font-serif font-medium tracking-wide ${TOKENS.textGold} text-center`}>
                        {tTitle}
                    </h1>
                </div>

                <div className={`h-[1px] ${UI_LAYOUT_CONFIG.LINE_WIDTH} bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mt-4 opacity-30`}></div>
            </motion.div>

            {/* Grid Area - Auto-fit Height */}
            <motion.div
                className={`flex-1 overflow-y-auto px-6 pb-28 hide-scrollbar flex flex-col`}
                style={{ paddingTop: `${UI_LAYOUT_CONFIG.GRID_PADDING_TOP_PX}px` }}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-sm md:max-w-2xl w-full mx-auto flex-1">
                    {categories.map((cat) => {
                        const name = cat.names[lang as keyof typeof cat.names] || cat.names['en'];

                        return (
                            <motion.button
                                key={cat.id}
                                variants={cardVariants}
                                onClick={() => handleSelect(cat.id)}
                                whileHover={{ scale: 1.04, borderColor: 'rgba(201,169,110,0.5)' }}
                                whileTap={{ scale: 0.96 }}
                                className={`w-full h-full flex flex-col items-center justify-center gap-3 px-3 rounded-2xl ${TOKENS.cardBg} ${TOKENS.cardBorder} border hover:border-[#C9A96E]/50 transition-colors relative overflow-hidden group shadow-lg`}
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="w-14 h-14 flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
                                    <img
                                        src={cat.image}
                                        alt={name}
                                        className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                                <span className="font-medium text-[13px] tracking-wide text-center leading-snug relative z-10 w-full text-white">
                                    {name}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

        </motion.div>
    );
};

export default CategoryPicker;
