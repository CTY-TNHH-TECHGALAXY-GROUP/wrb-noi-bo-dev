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
        logoUrl: '/Image/ria Spa-2.png'
    });

    const [bookingData, setBookingData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div className="bg-white min-h-screen">
            <PrintableInvoice config={config} bookingData={bookingData} lang={lang} />
        </div>
    );
}
