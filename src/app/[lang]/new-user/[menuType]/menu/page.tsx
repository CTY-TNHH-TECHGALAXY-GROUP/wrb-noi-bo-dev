'use client';

import React, { useEffect } from 'react';
import { useParams, usePathname, useRouter, notFound } from 'next/navigation';

// --- IMPORT 2 GIAO DIá»†N Lá»šN ---
// Tá»± Ä‘á»™ng tÃ¬m file index.tsx trong thÆ° má»¥c tÆ°Æ¡ng á»©ng
import StandardMenu from '@/components/Menu/Standard';
import PremiumMenu from '@/components/Menu/Premium';

export default function MenuPage() {
    // 1. Láº¥y tham sá»‘ tá»« URL
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();

    // Catch Auto-fill tá»« Web Quáº£n Trá»‹ Dispatch Board
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
                // XoÃ¡ param trÃªn thanh Ä‘á»‹a chá»‰ cho sáº¡ch (Next.js way)
                router.replace(window.location.pathname, { scroll: false });
            }
        }
    }, [router]);

    // URL dáº¡ng: /en/new-user/standard/menu
    // -> lang = "en"
    // -> menuType = "standard"
    const pathnameSegments = pathname?.split('/').filter(Boolean) || [];
    const menuType = (params.menuType as string) || pathnameSegments[2];
    const lang = (params.lang as string) || pathnameSegments[0] || 'en';

    // 2. HÃ m xá»­ lÃ½ quay láº¡i (truyá»n xuá»‘ng cho con dÃ¹ng)
    const handleBack = () => {
        router.back(); // Quay láº¡i trang trÆ°á»›c Ä‘Ã³ (Galaxy hoáº·c Home)
    };

    // 3. HÃ m xá»­ lÃ½ Checkout
    const handleCheckout = () => {
        // Chuyá»ƒn hÆ°á»›ng sang trang checkout
        router.push(`/${lang}/new-user/${menuType}/checkout`);
    };

    // 4. Cross-menu navigation (cart giá»¯ nguyÃªn qua MenuContext)
    const handleSwitchToVip = () => {
        router.push(`/${lang}/new-user/vip/menu`);
    };
    const handleSwitchToStandard = () => {
        router.push(`/${lang}/new-user/standard/menu`);
    };

    // 5. LOGIC ÄIá»€U PHá»I (ROUTING)

    // TrÆ°á»ng há»£p 1: Menu ThÆ°á»ng & Spa
    if (menuType === 'standard' || menuType === 'spa') {
        return <StandardMenu lang={lang} menuType={menuType} onBack={handleBack} onCheckout={handleCheckout} onSwitchToVip={handleSwitchToVip} showHiddenServices={true} showEntryActions={menuType === 'standard'} showPickerBack={false} />;
    }

    // TrÆ°á»ng há»£p 2: Menu VIP (Premium)
    if (menuType === 'vip') {
        return <PremiumMenu lang={lang} isBookingFlow={false} onBack={handleBack} onCheckout={handleCheckout} onSwitchToStandard={handleSwitchToStandard} />;
    }

    // TrÆ°á»ng há»£p 3: NgÆ°á»i dÃ¹ng nháº­p báº­y báº¡ (vd: .../abc/menu) -> Tráº£ vá» 404
    return notFound();
}
