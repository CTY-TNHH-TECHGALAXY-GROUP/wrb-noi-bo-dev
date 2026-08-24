'use client';

import React from 'react';

// 🔧 UI CONFIGURATION
const ANIMATION_DURATION = '6s';
const GLOW_OPACITY = 0.15;

interface ComingSoonProps {
    title: string;
    subtitle?: string;
    lang?: string;
}

/**
 * ComingSoon — Premium "Coming Soon" page for unreleased features
 * Used for: Books (Premium, HomeSpa) that are not yet designed
 */
const ComingSoon = ({ title, subtitle, lang = 'vi' }: ComingSoonProps) => {
    const t = {
        comingSoon: lang === 'vi' ? 'Sắp Ra Mắt' : 'Coming Soon',
        stayTuned: lang === 'vi'
            ? 'Chúng tôi đang chuẩn bị nội dung tuyệt vời cho bạn'
            : 'We are preparing amazing content for you',
        backBtn: lang === 'vi' ? 'Quay Lại' : 'Go Back',
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center px-6">
            {/* Galaxy Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/assets/backgrounds/galaxy.webp"
                    alt="Galaxy"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
            </div>

            {/* Animated Glow Ring */}
            <div
                className="absolute w-[300px] h-[300px] rounded-full border border-[#B38728]/20"
                style={{
                    animation: `pulse ${ANIMATION_DURATION} ease-in-out infinite`,
                    boxShadow: `0 0 60px rgba(179,135,40,${GLOW_OPACITY})`,
                }}
            />
            <div
                className="absolute w-[220px] h-[220px] rounded-full border border-[#D4AF37]/15"
                style={{
                    animation: `pulse ${ANIMATION_DURATION} ease-in-out infinite 1s`,
                }}
            />

            {/* Shooting Stars */}
            <div className="shooting-star star-1"></div>
            <div className="shooting-star star-2"></div>
            <div className="shooting-star star-3"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                {/* Logo */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
                    <div
                        className="w-24 h-24 relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                        style={{
                            backgroundColor: "#f7ebc7",
                            WebkitMaskImage: "url('/Image/oria-spa-logo.png')",
                            WebkitMaskSize: "contain",
                            WebkitMaskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskImage: "url('/Image/oria-spa-logo.png')",
                            maskSize: "contain",
                            maskRepeat: "no-repeat",
                            maskPosition: "center",
                        }}
                    />
                </div>

                {/* Lotus Divider */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#B38728]/50" />
                    <span className="text-2xl">🪷</span>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#B38728]/50" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black uppercase tracking-[0.15em] gold-text-shiny mb-3 drop-shadow-md">
                    {t.comingSoon}
                </h1>

                {/* Book Title */}
                <h2 className="text-xl font-bold text-white/90 mb-2">
                    {title}
                </h2>

                {subtitle && (
                    <p className="text-sm text-gray-400 mb-6 font-medium leading-relaxed">
                        {subtitle}
                    </p>
                )}

                <p className="text-sm text-[#B38728]/80 font-medium tracking-wide mb-10">
                    {t.stayTuned}
                </p>

                {/* Animated dots */}
                <div className="flex gap-2 mb-10">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-[#D4AF37]"
                            style={{
                                animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>

                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-[#B38728]/40 text-[#D4AF37] font-bold text-sm uppercase tracking-widest transition-all active:scale-95 backdrop-blur-sm"
                >
                    {t.backBtn}
                </button>
            </div>

            {/* Bounce keyframe */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-8px); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ComingSoon;
