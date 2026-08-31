'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';

// --- IMPORT 2 GIAO DIỆN LỚN ---
// Tự động tìm file index.tsx trong thư mục tương ứng
import StandardMenu from '@/components/Menu/Standard';
import PremiumMenu from '@/components/Menu/Premium';

export default function MenuPage() {
    // 1. Lấy tham số từ URL
    const params = useParams();
    const router = useRouter();

    // Catch Auto-fill từ Web Quản Trị Dispatch Board
    useEffect(() => {
        if (window.location.search) {
            const urlParams = new URLSearchParams(window.location.search);
            const preBookingId = urlParams.get('preBookingId');
            if (preBookingId) {
                localStorage.setItem('contactedFirstInfo', JSON.stringify({
                    preBookingId,
                    customerName: urlParams.get('name') || '',
                    customerPhone: urlParams.get('phone') || '',
                    customerEmail: urlParams.get('email') || '',
                    guestCount: Number(urlParams.get('guests')) || 1,
                    notes: urlParams.get('notes') || ''
                }));
                // Xoá param trên thanh địa chỉ cho sạch (Next.js way)
                router.replace(window.location.pathname, { scroll: false });
            }
        }
    }, [router]);

    // URL dạng: /en/new-user/standard/menu
    // -> lang = "en"
    // -> menuType = "standard"
    const menuType = params.menuType as string;
    const lang = (params.lang as string) || 'en';

    // 2. Hàm xử lý quay lại (truyền xuống cho con dùng)
    const handleBack = () => {
        router.back(); // Quay lại trang trước đó (Galaxy hoặc Home)
    };

    // 3. Hàm xử lý Checkout
    const handleCheckout = () => {
        // Chuyển hướng sang trang checkout
        router.push(`/${lang}/new-user/${menuType}/checkout`);
    };

    // 4. Cross-menu navigation (cart giữ nguyên qua MenuContext)
    const handleSwitchToVip = () => {
        router.push(`/${lang}/new-user/vip/menu`);
    };
    const handleSwitchToStandard = () => {
        router.push(`/${lang}/new-user/standard/menu`);
    };

    // 5. LOGIC ĐIỀU PHỐI (ROUTING)

    // Trường hợp 1: Menu Thường & Spa
    if (menuType === 'standard' || menuType === 'spa') {
        return <StandardMenu lang={lang} menuType={menuType} onBack={handleBack} onCheckout={handleCheckout} onSwitchToVip={handleSwitchToVip} showHiddenServices={true} />;
    }

    // Trường hợp 2: Menu VIP (Premium)
    if (menuType === 'vip') {
        return <PremiumMenu lang={lang} isBookingFlow={false} onBack={handleBack} onCheckout={handleCheckout} onSwitchToStandard={handleSwitchToStandard} />;
    }

    // Trường hợp 3: Người dùng nhập bậy bạ (vd: .../abc/menu) -> Trả về 404
    return notFound();
}
