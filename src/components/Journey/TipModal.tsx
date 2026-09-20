'use client';

import React from 'react';
import { translations } from './Journey.i18n';

// 🔧 UI CONFIGURATION
const AUTO_CLOSE_DELAY = 20000; // Auto-close after 20 seconds

interface TipModalProps {
    onClose: (tipAmount: number) => void;
    lang?: string;
}

/**
 * TipModal — Appreciation popup for Excellent rating
 * Shows a thank-you message to the customer. No tip selection.
 * Auto-closes after a delay or user can dismiss manually.
 */
export default function TipModal({ onClose, lang = 'vi' }: TipModalProps) {
    const t = translations[lang] || translations['en'];

    // Auto-close after delay
    React.useEffect(() => {
        const timer = setTimeout(() => onClose(0), AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="responsive-panel bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/5">
                {/* Close X */}
                <button onClick={() => onClose(0)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center mt-2">
                    <div className="w-16 h-16 bg-[#C9A96E]/10 rounded-full flex items-center justify-center text-[#C9A96E] mb-4 border border-[#C9A96E]/20 shadow-[0_0_15px_rgba(201,169,110,0.2)]">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                    </div>

                    <h3 className="text-2xl font-black text-[#C9A96E] mb-4">{t.tipExcellent}</h3>

                    <div className="bg-[#0d0d0d] text-gray-300 text-base p-5 rounded-2xl mb-6 leading-relaxed border border-[#C9A96E]/20">
                        {t.tipMessage}
                    </div>

                    {/* Continue button */}
                    <button
                        onClick={() => onClose(0)}
                        className="w-full py-4 rounded-2xl font-bold text-lg bg-[#C9A96E] text-black shadow-[0_5px_20px_rgba(201,169,110,0.3)] hover:bg-[#b09461] transition-all flex items-center justify-center gap-2"
                    >
                        {t.continueBtn || (lang === 'vi' ? 'Tiếp Tục' : 'Continue')}
                    </button>
                </div>
            </div>
        </div>
    );
}
