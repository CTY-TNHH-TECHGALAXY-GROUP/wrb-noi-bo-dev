import React from 'react';
import { Check, DoorOpen, Tag } from 'lucide-react';
import { LanguageCode, ServiceData } from './types';
import { getText } from './utils';

interface NoteSectionProps {
    lang: LanguageCode;
    serviceData: ServiceData;
    notes: {
        tag0: boolean;
        tag1: boolean;
        privateRoom?: boolean;
        content: string;
    };
    onChange: (key: string, value: any) => void;
    privateRoomAddon?: { priceVND: number; priceUSD?: number };
}

const NoteSection: React.FC<NoteSectionProps> = ({ lang, serviceData, notes, onChange, privateRoomAddon }) => {
    // Lấy Tag Data từ Service (nếu có)
    const tags = serviceData.TAGS || [];

    // Tag 0 (Pregnant)
    const tag0Data = tags[0];
    // Tag 1 (Allergy)
    const tag1Data = tags[1];

    return (
        <div className="w-full mt-4">
            <h4 className="flex items-center gap-2.5 text-base sm:text-xl md:text-2xl font-bold text-[#C9A96E]/80 uppercase tracking-widest mb-4">
                <Tag className="w-6 h-6 md:w-7 md:h-7" />
                {getText({ en: 'Notes', vi: 'Ghi chú', jp: 'ノート', kr: '참고', cn: '笔记' }, lang)}
            </h4>

            {/* Tags Selection */}
            <div className="flex gap-3 md:gap-4 mb-4 flex-wrap">
                {tag0Data && (
                    <button
                        onClick={() => onChange('tag0', !notes.tag0)}
                        className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-full text-lg sm:text-xl md:text-2xl font-semibold border transition-all ${notes.tag0
                                ? 'bg-[#1c1c1e] border-red-500/50 text-red-500 shadow-sm'
                                : 'bg-[#1c1c1e] border-white/10 text-gray-400 hover:bg-[#2c2c2e]'
                            }`}
                    >
                        {getText(tag0Data, lang)}
                    </button>
                )}

                {tag1Data && (
                    <button
                        onClick={() => onChange('tag1', !notes.tag1)}
                        className={`px-5 py-3 sm:px-6 sm:py-3.5 rounded-full text-lg sm:text-xl md:text-2xl font-semibold border transition-all ${notes.tag1
                                ? 'bg-[#1c1c1e] border-yellow-500/50 text-yellow-500 shadow-sm'
                                : 'bg-[#1c1c1e] border-white/10 text-gray-400 hover:bg-[#2c2c2e]'
                            }`}
                    >
                        {getText(tag1Data, lang)}
                    </button>
                )}
            </div>

            {/* Textarea */}
            <textarea
                value={notes.content}
                onChange={(e) => onChange('content', e.target.value)}
                placeholder={getText(serviceData.HINT || { en: 'Other notes...', vi: 'Ghi chú khác...' }, lang)}
                className="w-full h-28 sm:h-36 p-4 sm:p-5 text-xl sm:text-2xl text-white border border-white/10 rounded-2xl bg-[#1c1c1e] focus:bg-[#2c2c2e] focus:border-white/20 focus:outline-none transition-colors resize-none placeholder-gray-500"
            />

            <button
                type="button"
                onClick={() => onChange('privateRoom', !notes.privateRoom)}
                className={`mt-4 w-full rounded-2xl px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 text-left transition-all border ${
                    notes.privateRoom
                        ? 'bg-[#2a2111] border-[#F2C96B]/40 text-[#F2C96B] shadow-[0_0_18px_rgba(210,137,42,0.18)]'
                        : 'bg-[#1c1c1e] border-white/10 text-gray-300 hover:bg-[#242426]'
                }`}
            >
                <span className="flex items-center gap-3">
                    <DoorOpen className={`w-7 h-7 sm:w-8 sm:h-8 ${notes.privateRoom ? 'text-[#F2C96B]' : 'text-gray-400'}`} />
                    <span>
                        <span className="block text-xl sm:text-2xl font-bold">
                            {getText({ en: 'Private room', vi: 'Phòng riêng', jp: '個室', kr: '개인실', cn: '私人房间' }, lang)}
                        </span>
                        <span className="block text-sm sm:text-base text-gray-400 mt-1">
                            {privateRoomAddon
                                ? `+ ${privateRoomAddon.priceVND.toLocaleString('vi-VN')} VND${privateRoomAddon.priceUSD ? ` / ${privateRoomAddon.priceUSD} USD` : ''}`
                                : getText({ en: '+ 105,000 VND', vi: '+ 105.000 VND', jp: '+ 105,000 VND', kr: '+ 105,000 VND', cn: '+ 105,000 VND' }, lang)
                            }
                        </span>
                    </span>
                </span>
                <span className={`h-9 w-9 rounded-full border flex items-center justify-center text-lg font-bold ${
                    notes.privateRoom ? 'border-[#F2C96B] bg-[#D2892A] text-black' : 'border-white/20 text-gray-500'
                }`}>
                    {notes.privateRoom ? <Check className="h-5 w-5" /> : '+'}
                </span>
            </button>
        </div>
    );
};

export default NoteSection;
