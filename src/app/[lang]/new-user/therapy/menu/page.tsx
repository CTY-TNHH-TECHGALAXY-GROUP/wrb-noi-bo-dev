'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import TherapyMenu from '@/components/Menu/Therapy';

export default function TherapyMenuPage() {
    const params = useParams();
    const router = useRouter();
    const lang = (params.lang as string) || 'en';

    const handleBack = () => {
        router.back();
    };

    const handleCheckout = () => {
        router.push(`/${lang}/new-user/therapy/checkout`); // Thay đổi URL thanh toán nếu cần
    };

    return (
        <TherapyMenu
            lang={lang}
            isBookingFlow={false}
            onBack={handleBack}
            onCheckout={handleCheckout}
        />
    );
}
