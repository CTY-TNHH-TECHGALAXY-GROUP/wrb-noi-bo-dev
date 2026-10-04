'use client';

import React, { useState, useEffect } from 'react';
import { PrintableInvoice, InvoiceConfig } from '@/components/invoice/PrintableInvoice';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// 🔧 UI CONFIGURATION
// Tablet đã đăng ký (localStorage REGISTERED_DEVICE_ID) tự quay về menu sau ngần này giây
// để không kẹt ở hoá đơn của khách trước (plans/plan_dao_nguoc_luong_qr_hoa_don.md — Bước 3,
// trước đây chưa làm). Máy thường (điện thoại khách quét QR) không đếm ngược.
const TABLET_RESET_SECONDS = 180;

export default function InvoicePrintPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    
    const orderId = params?.id as string;
    const lang = searchParams.get('lang') || 'vi';

    const [config, setConfig] = useState<InvoiceConfig>({
        spaName: 'ORIA SPA',
        slogan: 'Wellness • Beauty • Therapy',
        address: '11 Ngô Đức Kế, P. Sài Gòn, TP. Hồ Chí Minh',
        phone: '0964090277',
        email: 'cskhoria@techgalaxygroup.com',
        hotline: '0964090277',
        note1: 'Cảm ơn Quý khách đã sử dụng dịch vụ tại ORIA SPA.',
        note2: 'Vui lòng giữ hóa đơn để thuận tiện đối chiếu khi cần hỗ trợ.',
        logoUrl: '/Image/oria-spa-logo.png'
    });

    const [bookingData, setBookingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // null = không phải tablet → không hiện đếm ngược
    const [tabletCountdown, setTabletCountdown] = useState<number | null>(null);

    const menuUrl = `/${lang}/standard/menu`;

    // Auto-reset tablet về menu cho khách kế tiếp
    useEffect(() => {
        let isTablet = false;
        try { isTablet = !!localStorage.getItem('REGISTERED_DEVICE_ID'); } catch { /* storage bị chặn */ }
        if (!isTablet) return;
        setTabletCountdown(TABLET_RESET_SECONDS);
        const startedAt = Date.now();
        const interval = setInterval(() => {
            const left = TABLET_RESET_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
            if (left <= 0) {
                clearInterval(interval);
                window.location.href = menuUrl;
                return;
            }
            setTabletCountdown(left);
        }, 1000);
        return () => clearInterval(interval);
    }, [menuUrl]);

    useEffect(() => {
        const init = async () => {
            if (!orderId) {
                setError("Mã đơn hàng không hợp lệ");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                // Fetch config
                // SystemConfigs là key-value: cột `key` / `value` (jsonb). Trước đây đọc
                // `configKey = 'SYSTEM_SETTINGS'` — cột không tồn tại nên luôn rơi về cấu hình
                // mặc định, admin đổi địa chỉ/logo trên hoá đơn không có tác dụng ở đây.
                const supabase = createClient();
                const { data: configRow } = await supabase
                    .from('SystemConfigs')
                    .select('value')
                    .eq('key', 'invoice_config')
                    .maybeSingle();

                const loaded = configRow?.value;
                if (loaded && typeof loaded === 'object') {
                    setConfig(prev => ({ 
                        ...prev, 
                        ...loaded,
                        phone: loaded.phone === '0900 000 000' ? '0964090277' : (loaded.phone || prev.phone),
                        hotline: loaded.hotline === '0900 000 000' ? '0964090277' : (loaded.hotline || prev.hotline),
                        email: loaded.email || prev.email,
                        logoUrl: loaded.logoUrl || prev.logoUrl,
                    }));
                }

                // Fetch booking
                const response = await fetch(`/api/finance/invoice/${orderId}`);
                const bData = await response.json();
                
                if (bData && bData.data) {
                    setBookingData(bData.data);
                } else {
                    setError("Không tìm thấy đơn hàng");
                }
            } catch (err: any) {
                setError(err.message || "Lỗi tải dữ liệu hóa đơn");
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [orderId]);

    // Remove auto print as requested by user

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="text-red-500 font-bold">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen relative pb-10">
            {/* Nút quay lại (ẩn khi in) */}
            <div className="print:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => {
                        window.location.href = menuUrl;
                    }}
                    className="flex items-center gap-2 bg-gray-900/80 hover:bg-black text-white px-4 py-2.5 rounded-full font-medium transition-all shadow-lg backdrop-blur-md active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    {lang === 'en' ? 'Back' : lang === 'cn' ? '返回' : lang === 'jp' ? '戻る' : lang === 'kr' ? '뒤로' : 'Trở về'}
                </button>
            </div>
            
            {tabletCountdown !== null && (
                <div className="print:hidden fixed top-4 right-4 z-50 bg-gray-900/80 text-white text-xs font-medium px-3 py-2 rounded-full shadow-lg backdrop-blur-md">
                    {({ vi: 'Tự về menu sau', en: 'Back to menu in', cn: '返回菜单', jp: 'メニューに戻るまで', kr: '메뉴로 돌아가기' } as Record<string, string>)[lang] || 'Back to menu in'}{' '}
                    {Math.floor(tabletCountdown / 60)}:{String(tabletCountdown % 60).padStart(2, '0')}
                </div>
            )}

            <PrintableInvoice config={config} bookingData={bookingData} lang={lang} />
        </div>
    );
}
