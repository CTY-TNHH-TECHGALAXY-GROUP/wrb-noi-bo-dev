"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./style.module.css";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { languages } from "@/app/(intro)/LanguageSelector.lang";

interface Props {
    lang: string;
    onSelect: (type: 'standard' | 'vip' | 'homespa' | 'spa' | 'therapy') => void;
    onBack?: () => void;
}

const texts: Record<string, any> = {
    en: {
        pure_title: <React.Fragment>PURE<br/>RELAXATION</React.Fragment>,
        journey_title: <React.Fragment>DESIGN<br/>YOUR<br/>JOURNEY</React.Fragment>,
        spa_title: "Spa Therapy",
        home_title: <React.Fragment>HOME<br/>THERAPY</React.Fragment>,
        home_care: "HOME CARE"
    },
    vi: {
        pure_title: <React.Fragment>THƯ GIÃN<br/>TINH KHIẾT</React.Fragment>,
        journey_title: <React.Fragment>THIẾT KẾ<br/>HÀNH TRÌNH<br/>CỦA BẠN</React.Fragment>,
        spa_title: "Trị Liệu Spa",
        home_title: <React.Fragment>TRỊ LIỆU<br/>TẠI NHÀ</React.Fragment>,
        home_care: "CHĂM SÓC TẠI NHÀ"
    },
    kr: {
        pure_title: <React.Fragment>순수한<br/>휴식</React.Fragment>,
        journey_title: <React.Fragment>나만의<br/>여정<br/>디자인</React.Fragment>,
        spa_title: "스파 테라피",
        home_title: <React.Fragment>홈<br/>테라피</React.Fragment>,
        home_care: "홈 케어"
    },
    cn: {
        pure_title: <React.Fragment>纯粹<br/>放松</React.Fragment>,
        journey_title: <React.Fragment>设计<br/>您的<br/>旅程</React.Fragment>,
        spa_title: "水疗理疗",
        home_title: <React.Fragment>家庭<br/>理疗</React.Fragment>,
        home_care: "家庭护理"
    },
    jp: {
        pure_title: <React.Fragment>純粋な<br/>リラクゼーション</React.Fragment>,
        journey_title: <React.Fragment>あなたの<br/>旅を<br/>デザイン</React.Fragment>,
        spa_title: "スパセラピー",
        home_title: <React.Fragment>ホーム<br/>セラピー</React.Fragment>,
        home_care: "ホームケア"
    }
};

export default function MenuTypeSelector({ lang, onSelect, onBack }: Props) {
    const t = texts[lang] || texts['en'];
    const [comingSoon, setComingSoon] = useState<string | null>(null);
    const [vipEnabled, setVipEnabled] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();

    const handleLanguageChange = (newLang: string) => {
        if (!pathname) return;
        const segments = pathname.split('/');
        segments[1] = newLang;
        router.push(segments.join('/'));
    };
    
    // Fetch VIP config from SystemConfigs
    useEffect(() => {
        fetch('/api/config/menu-vip')
            .then(res => res.json())
            .then(data => setVipEnabled(data.enabled === true))
            .catch(() => setVipEnabled(false));
    }, []);

    // Coming Soon text
    const csText: Record<string, { title: string; desc: string; close: string }> = {
        en: { title: 'Coming Soon', desc: 'This service is being prepared. Stay tuned!', close: 'Close' },
        vi: { title: 'Sắp Ra Mắt', desc: 'Dịch vụ đang được chuẩn bị. Hãy đón chờ nhé!', close: 'Đóng' },
        kr: { title: '곧 출시', desc: '서비스를 준비 중입니다. 기대해 주세요!', close: '닫기' },
        cn: { title: '即将推出', desc: '服务正在筹备中，敬请期待！', close: '关闭' },
        jp: { title: '近日公開', desc: 'サービス準備中です。お楽しみに！', close: '閉じる' },
    };
    const cs = csText[lang] || csText['en'];

    return (
        <div className={styles.container}>
            {onBack && (
                <button 
                    className={styles.backBtn} 
                    aria-label="Back" 
                    onClick={onBack}
                >
                    <ArrowLeft className="w-5 h-5 md:w-8 md:h-8 text-white/80" strokeWidth={2} />
                </button>
            )}

            <main className={styles.grid} aria-label="Oria Spa service menu">
                
                {/* 1. Pure Relaxation -> standard */}
                <div 
                    className={styles.card}
                    onClick={() => onSelect('standard')}
                    aria-label="Pure Relaxation"
                >
                    <Image
                        className={styles.poster}
                        alt="Pure Relaxation"
                        src="/assets/logos/menu-pure-v5.png"
                        fill
                        priority
                        sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <div className={styles.textOverlayPure}>
                        {t.pure_title}
                    </div>
                </div>
                
                {/* 2. Design Your Journey -> vip */}
                <div 
                    className={styles.card}
                    onClick={() => {
                        if (vipEnabled) {
                            onSelect('vip');
                        } else {
                            setComingSoon('vip');
                        }
                    }}
                    aria-label="Design Your Journey"
                >
                    <Image
                        className={styles.poster}
                        alt="Design Your Journey"
                        src="/assets/logos/menu-journey-v5.png"
                        fill
                        priority
                        sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <div className={styles.textOverlayJourney}>
                        {t.journey_title}
                    </div>
                </div>
                
                {/* 3. Spa Therapy -> therapy */}
                <div 
                    className={styles.card}
                    onClick={() => onSelect('therapy')}
                    aria-label="Spa Therapy"
                >
                    <Image
                        className={styles.poster}
                        alt="Spa Therapy"
                        src="/assets/logos/menu-spa-v5.png"
                        fill
                        priority
                        sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <div className={styles.spaTitleFix}>{t.spa_title}</div>
                </div>
                
                {/* 4. Home Therapy -> homespa (coming soon) */}
                <div 
                    className={styles.card}
                    onClick={() => setComingSoon('homespa')}
                    aria-label="Home Therapy"
                >
                    <Image
                        className={styles.poster}
                        alt="Home Therapy"
                        src="/assets/logos/menu-home-v5.png"
                        fill
                        priority
                        sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <div className={styles.textOverlayHome}>
                        <span>{t.home_title}</span>
                        <div className={styles.divider}></div>
                        <span className={styles.homeCareText}>{t.home_care}</span>
                    </div>
                </div>

            </main>

            {/* --- LANGUAGE SELECTOR (FLAGS) --- */}
            <div className="mt-8 flex justify-center items-center gap-4">
                {languages.map((l) => (
                    <button
                        key={l.id}
                        onClick={() => handleLanguageChange(l.id)}
                        className={`w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${
                            lang === l.id 
                                ? 'border-[#f5df8b] scale-110 shadow-[0_0_15px_rgba(245,223,139,0.5)]' 
                                : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>

            {/* COMING SOON OVERLAY */}
            {comingSoon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setComingSoon(null)}></div>
                    <div className="bg-[#1a1412] border border-[#d4af37]/30 p-8 rounded-2xl z-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 mx-auto mb-4 border-2 border-[#d4af37] rounded-full flex items-center justify-center bg-[#d4af37]/10">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className="gold-text-shiny font-bold text-2xl mb-3">{cs.title}</h3>
                        <p className="text-[#c8bfb2] mb-6">{cs.desc}</p>
                        <button
                            onClick={() => setComingSoon(null)}
                            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa8022] text-black font-bold rounded-xl active:scale-95 transition-transform"
                        >
                            {cs.close}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}