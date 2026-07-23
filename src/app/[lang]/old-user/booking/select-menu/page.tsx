/* src/app/[lang]/old-user/booking/select-menu/page.tsx */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MenuTypeSelector from "@/components/MenuTypeSelector";

export default function OldUserBookingSelectMenuPage({ params }: { params: Promise<{ lang: string }> }) {
    const router = useRouter();
    const [lang, setLang] = useState("en");

    const resolvedParams = use(params);
    useEffect(() => {
        setLang(resolvedParams.lang);
    }, [resolvedParams.lang]);

    const handleSelectMenu = (type: string) => {
        localStorage.setItem('selected_menu_type', type);
        router.push(`/${lang}/old-user/booking/${type}/menu`);
    };

    return (
        <div className="w-full h-[var(--app-height)] bg-black flex flex-col items-center justify-center relative overflow-hidden p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/50 z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/backgrounds/bg-blur.webp" className="w-full h-full object-cover opacity-40" alt="background" />
            </div>
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
