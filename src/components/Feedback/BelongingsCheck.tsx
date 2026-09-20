'use client';

import React, { useState } from 'react';
import { t } from './BelongingsCheck.i18n';

// 🔧 UI CONFIGURATION
const PANEL_RADIUS = '20px';
const BUTTON_RADIUS = '14px';

export const BelongingsCheck = ({ lang = 'vi', onConfirm }: { lang?: 'vi' | 'en', onConfirm?: () => void }) => {
    const localeText = t[lang];
    const [isVisible, setIsVisible] = useState(true);

    const handleConfirm = () => {
        setIsVisible(false);
        if (onConfirm) onConfirm();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in">
            <div
                className="responsive-panel bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 items-center text-center"
                style={{ borderRadius: PANEL_RADIUS }}
            >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex justify-center items-center text-amber-600 mb-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 8h14"></path>
                        <path d="M7 8v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8"></path>
                        <path d="M10 12h4"></path>
                        <path d="M10 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-800">{localeText.title}</h2>
                    <p className="text-sm text-gray-600 font-medium">
                        {localeText.desc}
                    </p>
                </div>

                <button
                    onClick={handleConfirm}
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold py-4 transition-all shadow-sm mt-2"
                    style={{ borderRadius: BUTTON_RADIUS }}
                >
                    {localeText.confirmBtn}
                </button>
            </div>
        </div>
    );
};
