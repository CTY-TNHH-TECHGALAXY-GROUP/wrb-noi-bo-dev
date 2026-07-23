'use client';

import React, { use } from 'react';
import { useRouter, notFound } from 'next/navigation';

import StandardMenu from '@/components/Menu/Standard';
import PremiumMenu from '@/components/Menu/Premium';

export default function OldUserBookingMenuPage({ params }: { params: Promise<{ lang: string; menuType: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();

    const menuType = resolvedParams.menuType;
    const lang = resolvedParams.lang || 'en';

    const handleBack = () => {
        router.back();
    };

    const handleCheckout = () => {
        router.push(`/${lang}/old-user/booking/${menuType}/checkout`);
    };

    const handleSwitchToVip = () => {
        router.push(`/${lang}/old-user/booking/vip/menu`);
    };
    const handleSwitchToStandard = () => {
        router.push(`/${lang}/old-user/booking/standard/menu`);
    };

    if (menuType === 'standard') {
        return <StandardMenu lang={lang} onBack={handleBack} onCheckout={handleCheckout} onSwitchToVip={handleSwitchToVip} />;
    }

    if (menuType === 'vip') {
        return <PremiumMenu lang={lang} isBookingFlow={true} onBack={handleBack} onCheckout={handleCheckout} onSwitchToStandard={handleSwitchToStandard} />;
    }

    return notFound();
}
