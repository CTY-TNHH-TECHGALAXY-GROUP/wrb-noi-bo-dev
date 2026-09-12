'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import StandardMenu from '@/components/Menu/Standard';
import PremiumMenu from '@/components/Menu/Premium';

export default function OldUserMenuPage() {
    const params = useParams();
    const router = useRouter();

    const menuType = params.menuType as string;
    const lang = (params.lang as string) || 'en';

    const handleBack = () => {
        router.back();
    };

    const handleCheckout = () => {
        // Redirect to OLD USER checkout
        router.push(`/${lang}/old-user/${menuType}/checkout`);
    };

    const handleSwitchToVip = () => {
        router.push(`/${lang}/old-user/vip/menu?tab=deep_body`);
    };

    if (menuType === 'standard' || menuType === 'spa') {
        return <StandardMenu lang={lang} menuType={menuType} onBack={handleBack} onCheckout={handleCheckout} onSwitchToVip={handleSwitchToVip} />;
    }

    if (menuType === 'vip' || menuType === 'premium') {
        return (
            <Suspense fallback={null}>
                <PremiumMenu lang={lang} isBookingFlow={false} onBack={handleBack} onCheckout={handleCheckout} />
            </Suspense>
        );
    }

    return notFound();
}
