'use client';

import React from 'react';
import { translations } from './Journey.i18n';

interface CheckBelongingsProps {
    onConfirm: () => void;
    lang?: string;
}

export default function CheckBelongings({ onConfirm, lang = 'vi' }: CheckBelongingsProps) {
    const t = translations[lang] || translations['vi'];

    return (
        <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in-95 duration-500 min-h-[85vh] py-10">
            {/* Elegant Header Logo */}
            <div className="mb-14 text-center">
                <span className="text-amber-600 font-black tracking-[0.2em] text-lg uppercase">Ngân Hà Spa</span>
                <div className="w-8 h-0.5 bg-amber-200 mx-auto mt-3"></div>
            </div>

            {/* Reminder Card */}
            <div className="bg-amber-100/50 border border-amber-200 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-sm relative overflow-hidden mb-16">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300"></div>
                <h2 className="text-xl md:text-2xl font-bold text-amber-900 leading-relaxed">
                    {t.check_message}
                </h2>
            </div>

            {/* Icons Grid */}
            <div className="flex justify-center gap-8 mb-20 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 bg-white shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.check_phone}</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 bg-white shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.check_wallet}</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 bg-white shadow-sm">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745V20a2 2 0 002 2h14a2 2 0 002-2v-6.745zM16 8V5a2 2 0 00-2-2H10a2 2 0 00-2 2v2"></path></svg>
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.check_belongings}</span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={onConfirm}
                className="w-full max-w-sm py-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black tracking-widest uppercase rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:from-amber-500 hover:to-amber-600 transition-all border border-amber-300 animate-scale-pulse"
            >
                {t.check_confirm}
            </button>
            <p className="text-xs text-gray-400 italic mt-6">{lang === 'vi' ? 'Cảm ơn quý khách đã sử dụng dịch vụ tại Ngân Hà' : 'Thank you for visiting Ngan Ha Spa'}</p>
        </div>
    );
}
