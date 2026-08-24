'use client';

import React, { useState, useEffect } from 'react';
import { PrintableInvoice, InvoiceConfig } from '@/components/invoice/PrintableInvoice';
import { Loader2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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

    const [isTabletDevice, setIsTabletDevice] = useState(false);
    const [tabletResetCountdown, setTabletResetCountdown] = useState(180);

    useEffect(() => {
        const checkDevice = async () => {
            const deviceId = localStorage.getItem('REGISTERED_DEVICE_ID');
            if (!deviceId) return;
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('RegisteredDevices')
                    .select('id')
                    .eq('device_id', deviceId)
                    .eq('is_active', true)
                    .single();
                if (data) setIsTabletDevice(true);
            } catch { /* not a tablet */ }
        };
        checkDevice();
    }, []);

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
                const supabase = createClient();
                const { data: configRows } = await supabase
                    .from('SystemConfigs')
                    .select('configValue')
                    .eq('configKey', 'SYSTEM_SETTINGS')
                    .single();
                
                const configData = configRows?.configValue;

                if (configData && configData.invoice_config) {
                    const loaded = configData.invoice_config;
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

    // Auto-reset countdown for TABLET devices
    useEffect(() => {
        if (isTabletDevice && !isLoading && !error) {
            const interval = setInterval(() => {
                setTabletResetCountdown(prev => {
                    if (prev <= 1) {
                        window.location.href = '/';
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isTabletDevice, isLoading, error]);

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
                        // Nếu trang có history, quay lại. Nếu không (mở từ tab mới), về trang chủ
                        if (window.history.length > 1) {
                            window.history.back();
                        } else {
                            window.location.href = `/${lang}`;
                        }
                    }}
                    className="flex items-center gap-2 bg-gray-900/80 hover:bg-black text-white px-4 py-2.5 rounded-full font-medium transition-all shadow-lg backdrop-blur-md active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                    {lang === 'en' ? 'Back' : lang === 'cn' ? '返回' : lang === 'jp' ? '戻る' : lang === 'kr' ? '뒤로' : 'Trở về'}
                </button>
            </div>
            
            {/* Auto reset indicator cho Tablet (ẩn khi in) */}
            {isTabletDevice && (
                <div className="print:hidden fixed bottom-4 right-4 z-50 bg-gray-900/80 text-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-md flex items-center gap-2 text-sm">
                    {lang === 'en' ? 'Auto-reset in' : lang === 'cn' ? '自动重置在' : lang === 'jp' ? '自動リセットまで' : lang === 'kr' ? '자동 재설정 시간' : 'Trở về trang chủ sau'} <span className="font-bold text-[#C9A96E]">{tabletResetCountdown}s</span>
                </div>
            )}
            
            <PrintableInvoice config={config} bookingData={bookingData} lang={lang} />
        </div>
    );
}
