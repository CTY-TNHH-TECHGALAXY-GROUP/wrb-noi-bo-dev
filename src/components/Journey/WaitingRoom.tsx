'use client';

import React from 'react';
import { ServiceItem } from '@/components/Journey/useJourneyRealtime';
import { translations } from '@/components/Journey/Journey.i18n';

// 🔧 UI CONFIGURATION
const SHORT_CODE_REGEX = /^.*?-(\d{3})-.*$/; // "11NDK-020-17032026" → "020"

interface WaitingRoomProps {
    orderId: string;
    lang?: string;
    items?: ServiceItem[];
    roomName?: string | null;
    bedId?: string | null;
    currentStep?: number; // Task C2b: Index of current active step (0-based)
}

export default function WaitingRoom({ orderId, lang = 'vi', items = [], roomName, bedId, currentStep = 0 }: WaitingRoomProps) {
    const t = translations[lang] || translations['en'];

    // Rút gọn mã đơn: "11NDK-020-17032026" → "020"
    const shortOrderCode = orderId.replace(SHORT_CODE_REGEX, '$1') || orderId;

    // Lộ trình steps
    const journeySteps = [
        { emoji: '🛁', title: t.step1Title, sub: t.step1Sub },
        { emoji: '💆', title: t.step2Title, sub: t.step2Sub },
        { emoji: '👜', title: t.step3Title, sub: t.step3Sub },
        { emoji: '⭐', title: t.step4Title, sub: t.step4Sub },
    ];

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in duration-500">
            {/* Hero Card: Mã đơn rút gọn */}
            <div className="relative w-full aspect-[4/3] bg-[#1c1c1e] rounded-3xl overflow-hidden shadow-sm mb-6 border border-white/5">
                <img
                    src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop"
                    alt="Spa Relax"
                    className="object-cover w-full h-full opacity-60"
                />
                <div className="absolute top-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl py-4 flex flex-col items-center justify-center shadow-md border border-[#C9A96E]/20">
                    <span className="text-[#C9A96E] font-bold text-xs uppercase tracking-wider">
                        {t.orderId}
                    </span>
                    <span className="text-5xl font-black text-white mt-1 tracking-wider">{shortOrderCode}</span>
                </div>
                <div className="absolute bottom-4 left-4 bg-[#0d0d0d]/90 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] animate-pulse"></div>
                    <span className="text-[#C9A96E] font-bold text-xs uppercase tracking-wider">
                        {t.preparing}
                    </span>
                </div>
            </div>

            {/* Welcome Message */}
            <div className="text-center px-4 mb-6">
                <h2 className="text-xl font-bold text-white/90 leading-relaxed">
                    {t.welcomeMessage}
                </h2>
            </div>

            {/* ─── Dịch vụ hôm nay ─── */}
            {items.length > 0 && (
                <div className="w-full mb-6">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2 mb-3 block">
                        {t.todayServices || "Today's Services"}
                    </span>
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={item.id || idx} className="bg-[#1c1c1e] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-[#0d0d0d] border border-white/5 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">💆</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-base leading-tight truncate">
                                        {item.service_names?.[lang] || item.service_name}
                                    </p>
                                    <p className="text-xs text-[#C9A96E] font-medium mt-0.5">
                                        {item.duration} {t.minutes || 'min'}
                                        {item.technicianCode && <span className="text-gray-500">{` · ${t.staff || 'NV'}: ${item.technicianCode}`}</span>}
                                    </p>
                                </div>
                                {/* Room/Bed info hidden from customer view (Task C2a) */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Lộ trình dịch vụ ─── */}
            <div className="w-full">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2 mb-3 block">
                    {t.yourJourney}
                </span>
                <div className="bg-[#1c1c1e] rounded-3xl p-5 border border-white/5">
                    {journeySteps.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;
                        return (
                            <div key={idx} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${
                                        isCompleted
                                            ? 'bg-[#C9A96E] border-2 border-[#C9A96E] shadow-[#C9A96E]/20 shadow-md'
                                            : isActive
                                                ? 'bg-[#1c1c1e] border-2 border-[#C9A96E] shadow-[0_0_10px_rgba(201,169,110,0.3)]'
                                                : 'bg-[#0d0d0d] border border-white/10 grayscale opacity-50'
                                    }`}>
                                        {isCompleted ? (
                                            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            step.emoji
                                        )}
                                    </div>
                                    {idx < journeySteps.length - 1 && (
                                        <div className={`w-0.5 h-8 my-1 transition-all duration-500 ${
                                            isCompleted ? 'bg-[#C9A96E]' : 'bg-white/10'
                                        }`}></div>
                                    )}
                                </div>
                                <div className="pt-1.5 flex-1 min-w-0">
                                    <p className={`font-bold text-base transition-colors ${
                                        isCompleted ? 'text-[#C9A96E] line-through opacity-60' :
                                        isActive ? 'text-[#C9A96E]' : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </p>
                                    <p className={`text-sm font-medium mt-0.5 ${
                                        isCompleted ? 'text-[#C9A96E]/40' :
                                        isActive ? 'text-gray-400' : 'text-gray-600'
                                    }`}>{step.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
