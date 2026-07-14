import React, { useState } from 'react';
import { X, Check, CloudLightning, User, FileText } from 'lucide-react';
import { ServiceOptions, CartItem } from '@/components/Menu/types';

interface CustomRequestModalProps {
    item?: CartItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (options: ServiceOptions) => void;
    lang: string;
}

// Dummy data for body areas
const BODY_AREAS = [
    { id: 'neck', label: 'Neck / Cổ' },
    { id: 'shoulder', label: 'Shoulder / Vai' },
    { id: 'back_upper', label: 'Upper Back / Lưng trên' },
    { id: 'back_lower', label: 'Lower Back / Thắt lưng' },
    { id: 'arms', label: 'Arms / Tay' },
    { id: 'legs', label: 'Legs / Chân' },
    { id: 'feet', label: 'Feet / Bàn chân' },
];

export default function CustomRequestModal({ isOpen, onClose, onSave, lang, item }: CustomRequestModalProps) {
    const [tab, setTab] = useState<'BODY' | 'PREF' | 'NOTE'>('BODY');

    // State for options
    const [focusAreas, setFocusAreas] = useState<string[]>([]);
    const [strength, setStrength] = useState<'Light' | 'Medium' | 'Strong'>('Medium');
    const [therapist, setTherapist] = useState<'Male' | 'Female' | 'Random'>('Random');
    const [note, setNote] = useState('');

    const showGender = item?.SHOW_GENDER !== false;
    const showStrength = item?.SHOW_STRENGTH !== false;
    const showFocus = item?.SHOW_FOCUS !== false;
    const showNotes = item?.SHOW_NOTES !== false;
    const showPrefTab = showGender || showStrength;

    // Reset tab to the first available tab when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (showFocus) setTab('BODY');
            else if (showPrefTab) setTab('PREF');
            else setTab('NOTE');
        }
    }, [isOpen, showFocus, showPrefTab]);

    if (!isOpen) return null;

    const toggleArea = (id: string) => {
        setFocusAreas(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleSave = () => {
        onSave({
            strength: strength.toLowerCase() as 'light' | 'medium' | 'strong',
            therapist: therapist.toLowerCase() as 'male' | 'female' | 'random',
            bodyParts: {
                focus: focusAreas,
                avoid: []
            },
            notes: {
                tag0: false,
                tag1: false,
                content: note
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 pointer-events-auto" onClick={onClose} />

            {/* Modal Content */}
            <div className={`
                bg-[#1c1c1e] border border-white/5 w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-3xl shadow-2xl pointer-events-auto
                transform transition-all duration-300
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h3 className="text-xl font-bold text-[#C9A96E] uppercase tracking-widest">Custom Request</h3>
                    <button onClick={onClose} className="p-2 bg-[#0d0d0d] rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/5">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-white/10 bg-[#0d0d0d]">
                    {showFocus && (
                        <button
                            onClick={() => setTab('BODY')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'BODY' ? 'bg-[#C9A96E] text-black shadow-[0_0_10px_rgba(201,169,110,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <CloudLightning size={16} /> Body Focus
                        </button>
                    )}
                    {showPrefTab && (
                        <button
                            onClick={() => setTab('PREF')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'PREF' ? 'bg-[#C9A96E] text-black shadow-[0_0_10px_rgba(201,169,110,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <User size={16} /> Preferences
                        </button>
                    )}
                    {showNotes && (
                        <button
                            onClick={() => setTab('NOTE')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === 'NOTE' ? 'bg-[#C9A96E] text-black shadow-[0_0_10px_rgba(201,169,110,0.3)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <FileText size={16} /> Notes
                        </button>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* BODY TAB */}
                    {tab === 'BODY' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 italic mb-2">Select areas you want us to focus on:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {BODY_AREAS.map(area => (
                                    <button
                                        key={area.id}
                                        onClick={() => toggleArea(area.id)}
                                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${focusAreas.includes(area.id)
                                            ? 'bg-[#C9A96E]/10 border-[#C9A96E]/50 text-[#C9A96E]'
                                            : 'bg-[#0d0d0d] border-white/5 text-gray-400 hover:border-[#C9A96E]/30'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${focusAreas.includes(area.id) ? 'bg-[#C9A96E] border-[#C9A96E]' : 'border-[#3f3f46]'}`}>
                                            {focusAreas.includes(area.id) && <Check size={12} className="text-black" strokeWidth={3} />}
                                        </div>
                                        <span className="text-sm font-medium">{area.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PREF TAB */}
                    {tab === 'PREF' && showPrefTab && (
                        <div className="space-y-6">
                            {/* Strength */}
                            {showStrength && (
                                <div>
                                    <label className="block text-sm text-[#C9A96E] font-bold uppercase mb-3 text-center tracking-widest">Care Pressure</label>
                                    <div className="flex bg-[#0d0d0d] border border-white/5 rounded-xl p-1">
                                        {['Light', 'Medium', 'Strong'].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setStrength(s as any)}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${strength === s ? 'bg-[#1c1c1e] text-[#C9A96E] border border-[#C9A96E]/30 shadow-sm' : 'text-[#3f3f46] hover:text-gray-400'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Therapist */}
                            {showGender && (
                                <div>
                                    <label className="block text-sm text-[#C9A96E] font-bold uppercase mb-3 text-center tracking-widest">Therapist Gender</label>
                                    <div className="flex gap-3">
                                        {['Male', 'Female', 'Random'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTherapist(t as any)}
                                                className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-bold flex flex-col items-center gap-1 ${therapist === t
                                                    ? 'bg-[#C9A96E]/10 border-[#C9A96E]/50 text-[#C9A96E]'
                                                    : 'bg-[#0d0d0d] border-white/5 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <span>{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* NOTE TAB */}
                    {tab === 'NOTE' && (
                        <div>
                            <label className="block text-sm text-[#C9A96E] font-bold uppercase mb-3 text-center tracking-widest">Special Notes</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Any allergies, injuries, or special requests..."
                                className="w-full h-40 bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-[#C9A96E] resize-none placeholder-[#3f3f46]"
                            ></textarea>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-[#1c1c1e] rounded-b-3xl">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-[#C9A96E] text-black font-bold text-lg uppercase rounded-xl hover:bg-[#b09461] transition-colors shadow-[0_0_15px_rgba(201,169,110,0.3)] shadow-lg"
                    >
                        Save Requests
                    </button>
                </div>
            </div>
        </div>
    );
}
