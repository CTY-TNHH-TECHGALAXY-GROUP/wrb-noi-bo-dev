'use client';
import React, { useState, useRef, useEffect } from 'react';
import { languages } from '@/app/(intro)/LanguageSelector.lang';

interface Props {
    activeLang: string;
    onSelect: (langId: string) => void;
}

export default function CheckoutLanguageDropdown({ activeLang, onSelect }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeLanguage = languages.find(l => l.id === activeLang) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-[#f5df8b] shadow-[0_0_10px_rgba(245,223,139,0.3)] flex items-center justify-center transition-all active:scale-95"
                aria-label="Select language"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeLanguage.flag} alt={activeLanguage.name} className="w-full h-full object-cover" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 flex flex-col gap-2 bg-[#1a1412] border border-[#d4af37]/30 p-2 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {languages.map((l) => {
                        if (l.id === activeLang) return null;
                        return (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                    onSelect(l.id);
                                    setIsOpen(false);
                                }}
                                className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border-2 border-white/10 opacity-70 hover:opacity-100 hover:scale-105 hover:border-white/30 transition-all flex items-center justify-center"
                                aria-label={l.name}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
