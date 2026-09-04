/* src/app/[lang]/booking/select-menu/page.tsx */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import MenuTypeSelector from "@/components/MenuTypeSelector";

export default function BookingSelectMenuPage({ params }: { params: Promise<{ lang: string }> }) {
    const router = useRouter();
    const [lang, setLang] = useState("en");

    // Lấy lang từ params (React 19)
    const resolvedParams = use(params);
    useEffect(() => {
        setLang(resolvedParams.lang);
        // BYPASS SelectMenu -> Go straight to Standard Menu
        router.replace(`/${resolvedParams.lang}/booking/standard/menu`);
    }, [resolvedParams.lang, router]);

    // Hàm xử lý khi user chọn gói
    const handleSelectMenu = (type: string) => {
        // Lưu loại menu vào localStorage (nếu cần cho component khác)
        localStorage.setItem('selected_menu_type', type);

        // Chuyển hướng đến trang Menu Booking chi tiết
        // Ví dụ: /vn/booking/standard/menu hoặc /vn/booking/vip/menu
        router.push(`/${lang}/booking/${type}/menu`);
    };

    return (
        <div className="w-full h-[var(--app-height)] bg-black flex flex-col items-center justify-center relative overflow-hidden p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/50 z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/backgrounds/bg-blur.webp" className="w-full h-full object-cover opacity-40" />
            </div>

            {/* Component Tái Sử Dụng */}
            <div className="relative z-10 w-full">
                <MenuTypeSelector
                    lang={lang}
                    onSelect={handleSelectMenu}
                    onBack={() => router.back()}
                />
            </div>

        </div>
    );
}
