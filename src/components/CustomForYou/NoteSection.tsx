import React from 'react';
import { Tag } from 'lucide-react';
import { LanguageCode, ServiceData } from './types';
import { getText } from './utils';

interface NoteSectionProps {
    lang: LanguageCode;
    serviceData: ServiceData;
    notes: {
        tag0: boolean;
        tag1: boolean;
        content: string;
    };
    onChange: (key: string, value: any) => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({ lang, serviceData, notes, onChange }) => {
    // Lấy Tag Data từ Service (nếu có)
    const tags = serviceData.TAGS || [];

    // Tag 0 (Pregnant)
    const tag0Data = tags[0];
    // Tag 1 (Allergy)
    const tag1Data = tags[1];

    return (
        <div className="w-full mt-4">
            <h4 className="flex items-center gap-2 text-[10px] sm:text-sm font-bold text-[#C9A96E]/80 uppercase tracking-widest mb-3">
                <Tag size={16} className="sm:w-5 sm:h-5" />
                {getText({ en: 'Notes', vi: 'Ghi chú', jp: 'ノート', kr: '참고', cn: '笔记' }, lang)}
            </h4>

            {/* Tags Selection */}
            <div className="flex gap-2 mb-3">
                {tag0Data && (
                    <button
                        onClick={() => onChange('tag0', !notes.tag0)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${notes.tag0
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
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${notes.tag1
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
                className="w-full h-20 sm:h-28 p-3 sm:p-4 text-sm sm:text-base text-white border border-white/10 rounded-xl bg-[#1c1c1e] focus:bg-[#2c2c2e] focus:border-[#C9A96E]/50 focus:outline-none transition-colors resize-none placeholder-gray-500"
            />
        </div>
    );
};

export default NoteSection;
