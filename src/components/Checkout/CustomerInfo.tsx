'use client';
import React, { useState, useRef, useEffect } from 'react';
import { COUNTRY_CODES, type CountryCodeData, getDefaultCountryCode } from '@/lib/countryCodes';

const SearchableCountrySelect = ({
    value,
    onChange
}: {
    value: string;
    onChange: (country: CountryCodeData) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const currentCountry = COUNTRY_CODES.find(c => c.code === value) || COUNTRY_CODES[0];
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = COUNTRY_CODES.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.dialCode.includes(searchQuery) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div ref={containerRef} className="w-[120px] shrink-0 relative">
            <div 
                className="w-full h-full bg-[#0d0d0d] border border-white/10 rounded-xl pl-4 pr-10 py-4 text-white cursor-pointer focus-within:border-[#C9A96E] transition-colors shadow-sm relative flex items-center"
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        setSearchQuery('');
                    }
                }}
            >
                {isOpen ? (
                    <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent w-full focus:outline-none text-white text-sm"
                        placeholder="Search..."
                    />
                ) : (
                    <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
                        <span>{currentCountry?.flag}</span>
                        <span className="truncate">{currentCountry?.dialCode}</span>
                    </div>
                )}
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            {isOpen && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[250px] overflow-y-auto bg-[#1c1c1e] border border-white/10 rounded-xl shadow-xl py-1" style={{ scrollbarWidth: 'thin' }}>
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => (
                            <li 
                                key={c.code}
                                onClick={() => {
                                    onChange(c);
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-3 hover:bg-[#2a2a2c] cursor-pointer flex items-center gap-2 text-sm transition-colors ${value === c.code ? 'bg-[#2a2a2c] text-[#C9A96E] font-medium' : 'text-gray-300'}`}
                            >
                                <span>{c.flag}</span>
                                <span>{c.dialCode}</span>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-3 text-sm text-gray-500 text-center">No match</li>
                    )}
                </ul>
            )}
        </div>
    );
};


interface CustomerInfoProps {
    lang: string;
    dict: { checkout: Record<string, string> };
    info: { name: string; email: string; phone: string; gender: string; room?: string };
    onChange: (field: string, value: string) => void;
    isBookingFlow?: boolean;
}

const getDefaultCountryIso = (lang: string) => {
    const languageDefaults: Record<string, string> = {
        en: 'US',
        vi: 'VN',
        jp: 'JP',
        kr: 'KR',
        cn: 'CN',
    };

    const languageDefault = languageDefaults[lang.toLowerCase()];
    if (languageDefault) return languageDefault;

    const defaultDialCode = getDefaultCountryCode(lang);
    return COUNTRY_CODES.find(c => c.dialCode === defaultDialCode)?.code || 'VN';
};

const normalizeLocalPhone = (value: string) => value.replace(/[\s-]/g, '');

export default function CustomerInfo({ lang, dict, info, onChange, isBookingFlow }: CustomerInfoProps) {
    const [contactMethod, setContactMethod] = useState<'email' | 'phone'>(
        info.phone ? 'phone' : 'email'
    );

    const [countryIso, setCountryIso] = useState(() => getDefaultCountryIso(lang));
    const [localPhone, setLocalPhone] = useState('');
    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryIso) || COUNTRY_CODES[0];

    // Sync from parent if info.phone changes externally (e.g. history restore)
    React.useEffect(() => {
        if (info.phone) {
            setContactMethod('phone');
        }
        
        const combined = `${selectedCountry.dialCode} ${localPhone}`.trim();
        const combinedNoSpace = `${selectedCountry.dialCode}${localPhone}`.trim();
        
        if (info.phone && info.phone !== combined && info.phone !== combinedNoSpace) {
            // Sort by length to match longer prefix first (e.g. +1242 before +1)
            const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
            const currentCountry = COUNTRY_CODES.find(c => c.code === countryIso);
            const matchedCountry = currentCountry && info.phone.startsWith(currentCountry.dialCode)
                ? currentCountry
                : sortedCodes.find(c => info.phone.startsWith(c.dialCode));
            
            if (matchedCountry) {
                setCountryIso(matchedCountry.code);
                setLocalPhone(info.phone.substring(matchedCountry.dialCode.length).trim());
            } else {
                setLocalPhone(info.phone);
            }
        }
    // Only depend on info.phone to avoid re-parsing while the user is typing/selecting a country.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [info.phone]);

    const handlePhoneChange = (newLocalPhone: string) => {
        setLocalPhone(newLocalPhone);
        onChange('phone', `${selectedCountry.dialCode}${normalizeLocalPhone(newLocalPhone)}`);
    };

    const handleCountryCodeChange = (newCountry: CountryCodeData) => {
        setCountryIso(newCountry.code);
        onChange('phone', `${newCountry.dialCode}${normalizeLocalPhone(localPhone)}`);
    };

    // Extract raw labels for buttons
    const emailLabel = dict.checkout.email?.split('(')[0]?.trim() || 'Email';
    const phoneLabel = dict.checkout.phone?.split('(')[0]?.trim() || 'Phone No.';

    const renderPhoneInput = (placeholder: string) => (
        <div className="flex gap-4">
                        <SearchableCountrySelect 
                value={countryIso} 
                onChange={handleCountryCodeChange} 
            />
            
            <div className="flex-1 relative">
                <input
                    type="tel"
                    value={localPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full min-w-0 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors shadow-sm"
                />
            </div>
        </div>
    );

    return (
        <div className="bg-[#1c1c1e] text-white p-5 rounded-3xl shadow-sm border border-white/5">
            <h2 className="text-[#C9A96E] font-bold uppercase tracking-widest text-xs mb-4">
                {dict.checkout.customer_info}
            </h2>

            <div className="space-y-4">
                {/* Hàng 1: Full Name + Gender */}
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={info.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={dict.checkout.full_name + (isBookingFlow ? ' *' : '')}
                            className="w-full min-w-0 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors shadow-sm"
                        />
                    </div>

                    {/* Gender Dropdown */}
                    <div className="w-[100px] shrink-0 relative">
                        <select
                            value={info.gender}
                            onChange={(e) => onChange('gender', e.target.value)}
                            className="w-full h-full appearance-none bg-[#0d0d0d] border border-white/10 rounded-xl pl-4 pr-10 text-white focus:outline-none focus:border-[#C9A96E] transition-colors shadow-sm"
                        >
                            <option value="Male">{dict.checkout.male}</option>
                            <option value="Female">{dict.checkout.female}</option>
                            <option value="Other">{dict.checkout.other}</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                {isBookingFlow ? (
                    // Hiển thị cả 2 ô nếu là luồng đặt lịch
                    <div className="space-y-4 animate-[fade-in-up_0.2s_ease-out]">
                        {renderPhoneInput(phoneLabel + ' *')}
                        
                        <div className="relative">
                            <input
                                type="email"
                                value={info.email}
                                onChange={(e) => onChange('email', e.target.value)}
                                placeholder={emailLabel + ' *'}
                                className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors shadow-sm"
                            />
                        </div>
                    </div>
                ) : (
                    // Hiển thị dạng tabs nếu là luồng walk-in
                    <>
                        {/* Hàng 2: Navigation Tabs cho Contact Method */}
                        <div className="flex bg-[#0d0d0d] p-1.5 rounded-2xl border border-white/5 space-x-1">
                            <button
                                onClick={() => setContactMethod('email')}
                                className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${
                                    contactMethod === 'email' 
                                        ? 'bg-[#1c1c1e] text-[#C9A96E] shadow-sm border border-white/5' 
                                        : 'text-gray-500 hover:text-gray-300 bg-transparent'
                                }`}
                            >
                                {emailLabel}
                            </button>
                            <button
                                onClick={() => setContactMethod('phone')}
                                className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all ${
                                    contactMethod === 'phone' 
                                        ? 'bg-[#1c1c1e] text-[#C9A96E] shadow-sm border border-white/5' 
                                        : 'text-gray-500 hover:text-gray-300 bg-transparent'
                                }`}
                            >
                                {phoneLabel}
                            </button>
                        </div>

                        {/* Hàng 3: Input tuỳ theo phương thức đã chọn */}
                        <div className="animate-[fade-in-up_0.2s_ease-out]">
                            {contactMethod === 'email' ? (
                                <input
                                    type="email"
                                    value={info.email}
                                    onChange={(e) => onChange('email', e.target.value)}
                                    placeholder={dict.checkout.email}
                                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors shadow-sm"
                                />
                            ) : (
                                renderPhoneInput(dict.checkout.phone)
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
