/* src/app/[lang]/new-user/select-menu/page.tsx */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Import Component tái sử dụng
// 👇 SỬA DÒNG NÀY: Thêm "/index" vào cuối đường dẫn
import MenuTypeSelector from "@/components/MenuTypeSelector";

export default function SelectMenuPage({ params }: { params: Promise<{ lang: string }> }) {
    const router = useRouter();
    const [lang, setLang] = useState("en");

    // Lấy lang từ params
    useEffect(() => {
        params.then((p) => setLang(p.lang));
    }, [params]);

    // Hàm xử lý khi user chọn gói
    const handleSelectMenu = (type: string) => {
        // 1. Lưu loại menu vào localStorage (để sau này dùng lại nếu cần)
        localStorage.setItem('selected_menu_type', type);

        // 2. Chuyển hướng đến trang Menu chi tiết
        // Ví dụ: /vn/new-user/standard/menu hoặc /vn/new-user/vip/menu
        router.push(`/${lang}/new-user/${type}/menu`);
    };

    return (
        <div className="w-full h-[var(--app-height)] bg-black flex flex-col items-center justify-center relative overflow-hidden p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <video
                    src="/Video/From Klickpin.com- Copy this guide to clever herb garden ideas everyone will ask you about using simple ideas you can actually pull off and turn s.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-100"
                />
                <div className="absolute inset-0 bg-black/50 z-10" />
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