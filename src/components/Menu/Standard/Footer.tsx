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
'use client';
import React from 'react';
import { ShoppingCart, ArrowLeft, ArrowRight, Crown } from 'lucide-react';
import { formatCurrency } from '@/components/Menu/utils';

interface FooterProps {
    totalVND: number;
    totalUSD: number;
    totalItems: number;
    maxMinutes: number;
    lang: string;
    onBack: () => void;
    onToggleCart: () => void;
    onSwitchToVip?: () => void;
}

const TEXT = {
    total_est: { vi: 'TỔNG DỰ KIẾN', en: 'TOTAL ESTIMATED', cn: '预计总额', jp: '合計(推定)', kr: '예상 합계' },
    back: { vi: 'QUAY LẠI', en: 'BACK', cn: '返回', jp: '戻る', kr: '뒤로' },
    mins: { vi: 'phút', en: 'mins', cn: '分钟', jp: '分', kr: '분' },
};

export default function Footer({ totalVND, totalUSD, totalItems, maxMinutes, lang, onBack, onToggleCart, onSwitchToVip }: FooterProps) {
    const t = (key: keyof typeof TEXT) => TEXT[key][lang as keyof typeof TEXT['total_est']] || TEXT[key]['en'];

    return (
        <div
            className="glass-footer w-full px-4 pt-6 flex items-center justify-between gap-3 animate-[slide-up_0.3s_ease-out] bg-black/90 backdrop-blur-xl border-t border-gray-800"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' // 1.25rem = 20px. Đảm bảo luôn cách đáy 20px + tai thỏ
            }}
        >

            {/* Nút Back */}
            <button onClick={onBack} className="w-12 h-12 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg backdrop-blur-md">
                <ArrowLeft size={20} />
            </button>

            {/* Nút VIP */}
            {onSwitchToVip && (
                <button onClick={onSwitchToVip} className="h-12 shrink-0 px-3 rounded-full bg-[#e6c487]/10 border border-[#e6c487]/30 flex items-center justify-center gap-1.5 hover:bg-[#e6c487]/20 active:scale-95 transition-all">
                    <Crown size={16} className="text-[#e6c487]" />
                    <span className="text-[10px] font-bold text-[#e6c487] tracking-wider">VIP</span>
                </button>
            )}

            {/* Thông tin Tiền & Thời gian */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                {maxMinutes > 0 && (
                    <div className="text-[10px] text-gray-400 font-bold tracking-[0.15em] uppercase mb-1 flex items-center gap-1 whitespace-nowrap">
                        {t('total_est')} <span className="text-[#C9A96E] font-bold ml-1">• {maxMinutes} {t('mins')}</span>
                    </div>
                )}
                <div className="flex items-end justify-center gap-1 whitespace-nowrap">
                    <span className="text-xl font-bold text-white tracking-wide tabular-nums leading-none">{formatCurrency(totalVND)}</span>
                    <span className="text-[10px] text-gray-500 font-bold mb-0.5 ml-0.5">VND</span>

                    <span className="text-gray-600 mx-1.5 text-sm font-light">/</span>

                    <span className="text-lg font-bold text-emerald-600 tracking-wide tabular-nums leading-none">{totalUSD}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mb-0.5 ml-0.5">USD</span>
                </div>
            </div>

            {/* Nút Giỏ hàng */}
            <button onClick={onToggleCart} className="h-12 shrink-0 bg-[#D4AF37] hover:bg-[#C5A028] text-white font-bold px-5 rounded-xl shadow-lg active:scale-95 transition-all text-sm tracking-wide uppercase flex items-center gap-2 relative overflow-visible">
                <ShoppingCart className="w-5 h-5" />
                <ArrowRight className="w-5 h-5 animate-slide-right" />
                <span className={`absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-black transition-all transform duration-300 ${totalItems > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>{totalItems}</span>
            </button>
        </div>
    );
}