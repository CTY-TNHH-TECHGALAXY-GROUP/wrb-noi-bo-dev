'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';
import { GoogleLoginBtn } from '@/components/Auth/GoogleLoginBtn';
import { useAuthStore } from '@/lib/authStore.logic';

// 🔧 UI CONFIGURATION
const LAYOUT = {
    headerHeight: '60px',
    imageSize: '160px', // Circular image size
    btnGap: '16px',
    bottomPadding: 'pb-32', // Adjust button vertical position
};

const t = {
    vi: {
        welcome: 'Welcome to Ngân Hà',
        askLogin: 'Bạn có muốn đăng nhập không? Tại sao ?',
        benefit: 'Nếu đăng nhập bạn sẽ được đổi KTV 01 lần duy nhất trong vòng 15 phút đầu',
        skip: 'Bỏ qua',
    },
    en: {
        welcome: 'Welcome to Ngân Hà',
        askLogin: 'Do you want to sign in? Why ?',
        benefit: 'By signing in, you are eligible for 1 free staff switch within the first 15 minutes of your session',
        skip: 'Skip',
    },
    jp: {
        welcome: 'Ngan Ha へようこそ',
        askLogin: 'ログインしますか？その理由は？',
        benefit: 'ログインすると、最初の15分間に1回無料でスタッフの変更が可能です',
        skip: 'スキップ',
    },
    kr: {
        welcome: 'Ngan Ha 에 오신 것을 환영합니다',
        askLogin: '로그인하시겠습니까? 이유는 무엇인가요?',
        benefit: '로그인하시면 첫 15분 내에 1회 무료 직원 변경이 가능합니다',
        skip: '건너뛰기',
    },
    cn: {
        welcome: '欢迎来到 Ngan Ha',
        askLogin: '您要登录吗？为什么？',
        benefit: '登录后，您有资格在开始的前15分钟内免费更换一次技师',
        skip: '跳过',
    }
};

export default function AuthPage() {
    const router = useRouter();
    const params = useParams();
    const lang = (params?.lang as string) || 'en';
    const { loginAsGuest, isAuthUser } = useAuthStore();
    // Default to 'en' texts if the selected language is not explicitly defined in `t`
    const localeText = t[lang as keyof typeof t] || t['en'];

    // Handle flow when they are ALREADY authenticated (from Google Login callback/redirect)
    useEffect(() => {
        // Chỉ push nếu user thật sự là AuthUser
        if (!isAuthUser) return;

        // Timeout nhỏ giúp NextJS hoàn tất quá trình render hoặc xóa hash trước khi sang màn khác
        const timer = setTimeout(() => {
            router.push(`/${lang}/customer-type`);
        }, 500);

        return () => clearTimeout(timer);
    }, [isAuthUser, lang, router]);

    const handleSkip = () => {
        loginAsGuest();
        // Chạy thẳng vô menu như hình
        router.push(`/${lang}/new-user/select-menu`);
    };

    const handleBack = () => {
        router.push('/'); // Quay lại intro
    };


    return (
        <div className="w-full h-[100dvh] flex flex-col items-center bg-[#FAF9F6] relative overflow-hidden font-sans pb-[env(safe-area-inset-bottom)]">

            {/* Background soft glow / texture (optional) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply bg-gradient-to-b from-[#FDFCF8] to-[#F1EDE4]" />

            <div className="z-10 w-full max-w-md md:max-w-lg flex flex-col px-6 md:px-10 h-full text-center">

                {/* HEADER */}
                <div
                    className="w-full flex items-center justify-between pt-[calc(env(safe-area-inset-top)+20px)] relative"
                    style={{ minHeight: LAYOUT.headerHeight }}
                >
                    <button onClick={handleBack} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full active:scale-95 transition-all">
                        <X size={24} strokeWidth={2.5} />
                    </button>

                    <span className="absolute left-1/2 -translate-x-1/2 font-luxury text-lg tracking-[0.2em] font-bold text-gray-800 uppercase">
                        Ngân Hà
                    </span>

                    <div className="w-10"></div> {/* Spacer for flex balance */}
                </div>

                {/* IMAGE HERO */}
                <div className="flex-1 flex flex-col justify-center items-center py-4 gap-8">
                    <div
                        className="rounded-full overflow-hidden shadow-xl border-4 border-white animate-fade-in-up md:w-[220px] md:h-[220px]"
                        style={{ width: LAYOUT.imageSize, height: LAYOUT.imageSize, aspectRatio: '1/1' }}
                    >
                        {/* 
                  Using placeholder random spa image or static 
                  In reality you might have an image in public/assets/
                */}
                        <img
                            src="/assets/backgrounds/galaxy.webp"
                            alt="Spa Stones"
                            className="w-full h-full object-cover scale-150 grayscale-[20%]"
                            onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&auto=format&fit=crop';
                            }}
                        />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight animate-fade-in-up delay-100">
                        {localeText.welcome}
                    </h1>

                    <div className="space-y-3 animate-fade-in-up delay-200">
                        <p className="font-bold text-gray-800 text-[15px]">
                            {localeText.askLogin}
                        </p>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed px-4 md:px-8">
                            {localeText.benefit}
                        </p>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className={`w-full flex flex-col animate-fade-in-up delay-300 ${LAYOUT.bottomPadding}`} style={{ gap: LAYOUT.btnGap }}>
                    <div className="w-full shadow-lg rounded-[8px]">
                        <GoogleLoginBtn lang={lang} />
                    </div>

                    <button
                        onClick={handleSkip}
                        className="w-full h-[44px] bg-[#EAB308] hover:bg-[#D9A507] active:scale-[0.98] text-gray-900 font-bold rounded-[8px] transition-all shadow-md mt-1"
                    >
                        {localeText.skip}
                    </button>

                </div>

            </div>
        </div>
    );
}
