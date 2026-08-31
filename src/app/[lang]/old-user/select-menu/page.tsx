"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuTypeSelector from "@/components/MenuTypeSelector/index";

export default function OldUserSelectMenuPage({ params }: { params: Promise<{ lang: string }> }) {
    const router = useRouter();
    const [lang, setLang] = useState("en");

    useEffect(() => {
        params.then((p) => {
            setLang(p.lang);
            // BYPASS SelectMenu -> Go straight to Standard Menu
            router.replace(`/${p.lang}/old-user/standard/menu`);
        });
    }, [params, router]);

    const handleSelectMenu = (type: string) => {
        localStorage.setItem('selected_menu_type', type);
        // Redirect to OLD USER menu path
        router.push(`/${lang}/old-user/${type}/menu`);
    };

    return (
        <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-6">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <video
                    src="/Video/From Klickpin.com- Copy this guide to clever herb garden ideas everyone will ask you about using simple ideas you can actually pull off and turn s.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-100 pointer-events-none"
                />
                <div className="absolute inset-0 bg-black/50 z-10" />
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
