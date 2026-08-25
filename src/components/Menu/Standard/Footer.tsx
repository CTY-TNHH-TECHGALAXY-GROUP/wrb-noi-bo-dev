/*
 * File: Standard/Footer.tsx
 * Chức năng: Thanh trạng thái (Status Bar) dưới cùng.
 * Logic chi tiết:
 * - Hiển thị tổng tiền (VND & USD) và tổng số lượng items trong cart.
 * - Nút "Back": Quay lại trang Home/Lựa chọn Menu.
 * - Nút "Cart": Mở CartDrawer để xem chi tiết giỏ hàng.
 * - Sử dụng animation slide-up nhe khi xuất hiện.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/components/Menu/utils';
import { languages } from '@/app/(intro)/LanguageSelector.lang';
import { useRouter, usePathname } from 'next/navigation';

interface FooterProps {
    totalVND: number;
    totalUSD: number;
    totalItems: number;
    maxMinutes: number;
    lang: string;
    activeCategory: string;
    onBack: () => void;
    onToggleCart: () => void;
}

const TEXT = {
    total_est: { vi: 'TỔNG DỰ KIẾN', en: 'TOTAL ESTIMATED', cn: '预计总额', jp: '合計(推定)', kr: '예상 합계' },
    back: { vi: 'QUAY LẠI', en: 'BACK', cn: '返回', jp: '戻る', kr: '뒤로' },
    mins: { vi: 'phút', en: 'mins', cn: '分钟', jp: '分', kr: '분' },
};

export default function Footer({ totalVND, totalUSD, totalItems, maxMinutes, lang, activeCategory, onBack, onToggleCart }: FooterProps) {
    const t = (key: keyof typeof TEXT) => TEXT[key][lang as keyof typeof TEXT['total_est']] || TEXT[key]['en'];

    const router = useRouter();
    const pathname = usePathname();
    const [isLangOpen, setIsLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    const handleLanguageChange = (newLang: string) => {
        if (!pathname) return;
        
        // Save current view state before hard navigation
        sessionStorage.setItem('standard_menu_mode', 'MENU');
        sessionStorage.setItem('standard_menu_category', activeCategory);

        const segments = pathname.split('/');
        segments[1] = newLang; // /[lang]/...
        router.push(segments.join('/'));
        setIsLangOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setIsLangOpen(false);
            }
        };
        if (isLangOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLangOpen]);

    const currentLang = languages.find(l => l.id === lang) || languages[0];

    return (
        <>
            <AnimatePresence>
                {isLangOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsLangOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div
                className="glass-footer w-full max-w-[100vw] box-border px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 flex items-center justify-between gap-2 sm:gap-3 animate-[slide-up_0.3s_ease-out] bg-black/90 backdrop-blur-xl border-t border-gray-800 overflow-visible"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: isLangOpen ? 90 : 35,
                    paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' // 1.25rem = 20px. Đảm bảo luôn cách đáy 20px + tai thỏ
                }}
            >

                {/* Nút Back */}
                <button onClick={onBack} className="w-[clamp(48px,7vw,72px)] h-[clamp(48px,7vw,72px)] shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg backdrop-blur-md">
                    <ArrowLeft className="w-[clamp(20px,3vw,30px)] h-[clamp(20px,3vw,30px)]" />
                </button>

                {/* Language Flags Dropup (Thay thế VIP) */}
                <div className="relative z-[100] shrink-0 flex items-center" ref={langRef}>
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="w-[clamp(52px,8vw,86px)] h-[clamp(52px,8vw,86px)] rounded-full overflow-hidden flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentLang.flag} alt={currentLang.name} className="w-full h-full object-cover" />
                    </button>

                    <AnimatePresence>
                        {isLangOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                                className="absolute bottom-[calc(100%+16px)] left-0 z-[110] flex flex-col gap-4 p-2"
                            >
                                {languages.map((l) => (
                                    <button
                                        key={l.id}
                                        onClick={() => handleLanguageChange(l.id)}
                                        className={`w-[clamp(44px,6vw,64px)] h-[clamp(44px,6vw,64px)] rounded-full overflow-hidden flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0 shadow-md ${
                                            lang === l.id ? 'opacity-100 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            {/* Thông tin Tiền & Thời gian */}
            <div className="flex-1 flex flex-col items-start md:items-center justify-center min-w-0 overflow-hidden px-1 sm:px-2">
                {maxMinutes > 0 && (
                    <div className="max-w-full text-[clamp(9px,1.8vw,15px)] text-gray-400 font-bold tracking-[0.14em] uppercase mb-1 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {t('total_est')} <span className="text-[#C9A96E] font-bold ml-1">• {maxMinutes} {t('mins')}</span>
                    </div>
                )}
                <div className="w-full flex items-baseline justify-start md:justify-center gap-1 whitespace-nowrap overflow-hidden">
                    <span className="text-[clamp(22px,4.4vw,42px)] font-bold text-white tracking-wide tabular-nums leading-none">{formatCurrency(totalVND)}</span>
                    <span className="text-[clamp(10px,1.7vw,16px)] text-gray-500 font-bold mb-0.5 ml-0.5">VND</span>

                    <span className="text-gray-600 mx-1 text-[clamp(12px,2vw,18px)] font-light">/</span>

                    <span className="text-[clamp(18px,3.8vw,36px)] font-bold text-emerald-600 tracking-wide tabular-nums leading-none">{totalUSD}</span>
                    <span className="text-[clamp(10px,1.7vw,16px)] text-emerald-600 font-bold mb-0.5 ml-0.5">USD</span>
                </div>
            </div>

            {/* Nút Giỏ hàng */}
            <button onClick={onToggleCart} className="h-[clamp(56px,8vw,76px)] w-[clamp(96px,18vw,156px)] shrink-0 bg-[#D4AF37] hover:bg-[#C5A028] text-white font-bold rounded-[clamp(16px,2.2vw,24px)] shadow-lg active:scale-95 transition-all text-sm tracking-wide uppercase flex items-center justify-center gap-[clamp(12px,2vw,24px)] relative overflow-hidden">
                <ShoppingCart className="w-[clamp(24px,3.8vw,38px)] h-[clamp(24px,3.8vw,38px)]" />
                <ArrowRight className="w-[clamp(24px,3.8vw,38px)] h-[clamp(24px,3.8vw,38px)] animate-slide-right" />
                <span className={`absolute top-1 right-1 bg-red-600 text-white text-[clamp(10px,1.6vw,14px)] font-bold w-[clamp(20px,3.2vw,30px)] h-[clamp(20px,3.2vw,30px)] flex items-center justify-center rounded-full border-2 border-black transition-all transform duration-300 ${totalItems > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>{totalItems}</span>
            </button>
        </div>
        </>
    );
}
