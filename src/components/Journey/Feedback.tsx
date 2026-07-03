'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import TipModal from '@/components/Journey/TipModal';
import { ServiceItem } from '@/components/Journey/useJourneyRealtime';
import { getRatingLabel } from './Journey.constants';
import { useRemindersCustomer } from './Journey.logic';
import { translations } from './Journey.i18n';
import AlertModal from '@/components/Shared/AlertModal';

interface FeedbackProps {
    onComplete: (result: { rating: number, violations: number[], tipAmount: number, feedbackNote?: string }) => void;
    items?: ServiceItem[];
    lang?: string;
    // Fallbacks for single-service or legacy usage
    staffName?: string;
    staffAvatar?: string;
    serviceName?: string;
    duration?: number;
}

export default function Feedback({ 
    onComplete, 
    items,
    lang = 'vi',
    staffName, 
    staffAvatar, 
    serviceName, 
    duration 
}: FeedbackProps) {
    const t = translations[lang] || translations['en'];
    const [rating, setRating] = useState<number | null>(null);
    const [showTip, setShowTip] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    // Checkbox state for violations
    const violations = useRemindersCustomer(lang);

    const [selectedViolations, setSelectedViolations] = useState<number[]>([]);

    // 🔧 UI CONFIGURATION
    const UI_CONFIG = {
        SELECTED_BG: 'bg-gray-400/90 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] border-gray-400', // Darker gray for selected
        UNSELECTED_BG: 'bg-gray-100 hover:bg-gray-200',
        TRANSITION: 'transition-all duration-300',
        SUCCESS_DELAY: 800,
    };

    // Restore from localStorage on mount (from ActiveService)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('spa_wrb_violations');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Handle both formats: Record<string, number[]> (from useViolations) or flat number[]
                let parsedViolations: number[] = [];
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const allViolations = new Set<number>();
                    Object.values(parsed).forEach((arr: any) => {
                        if (Array.isArray(arr)) arr.forEach((n: number) => allViolations.add(n));
                    });
                    parsedViolations = Array.from(allViolations);
                } else if (Array.isArray(parsed)) {
                    parsedViolations = parsed;
                }
                setSelectedViolations(parsedViolations);

                // Pre-calculate rating constraints based on restored violations
                const count = parsedViolations.length;
                if (count >= 3) setRating(1);
                else if (count >= 2) setRating(2);
                else if (count >= 1) setRating(3);
            }
        } catch (e) { }
    }, []);

    const toggleViolation = (index: number) => {
        setSelectedViolations(prevViolations => {
            const newViolations = prevViolations.includes(index)
                ? prevViolations.filter(i => i !== index)
                : [...prevViolations, index];

            const count = newViolations.length;
            setRating(prevRating => {
                if (count >= 3 && prevRating !== null && prevRating > 1) return 1;
                if (count >= 2 && prevRating !== null && prevRating > 2) return 2;
                if (count >= 1 && prevRating === 4) return 3;
                return prevRating;
            });

            // Sync any new changes to localStorage just in case of reload
            try {
                localStorage.setItem('spa_wrb_violations', JSON.stringify(newViolations));
            } catch (e) { }

            return newViolations;
        });
    };

    const clearStorageAndComplete = async (data: { rating: number, violations: number[], tipAmount: number, feedbackNote?: string }) => {
        setIsLoading(true);
        try {
            // 1. Actually wait for the API call in parent to complete
            await onComplete(data);
            
            // 2. Success path
            setIsLoading(false);
            setIsSuccess(true);
            
            try {
                localStorage.removeItem('spa_wrb_violations');
            } catch (e) { }

            // No need for long delay, parent state change will unmount this
        } catch (error) {
            setIsLoading(false);
            console.error("Feedback submission error:", error);
            setAlertState({
                isOpen: true,
                message: lang === 'vi' ? 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.' : 'An error occurred while submitting your review. Please try again.',
                type: 'error'
            });
        }
    };

    const handleSubmit = () => {
        if (rating === 4) { // 4 is 'Xuất sắc'
            setShowTip(true);
        } else {
            clearStorageAndComplete({ rating: rating!, violations: selectedViolations, tipAmount: 0 });
        }
    };

    // Group items by KTV
    const groupedKTVs = items ? Object.values(items.reduce((acc, item) => {
        const ktvId = item.technicianCode || item.staffName || item.id;
        if (!acc[ktvId]) {
            acc[ktvId] = {
                ...item,
                serviceNames: [item.service_names?.[lang] || item.service_name],
                totalDuration: item.duration || 0,
            };
        } else {
            const sName = item.service_names?.[lang] || item.service_name;
            if (!acc[ktvId].serviceNames.includes(sName)) {
                acc[ktvId].serviceNames.push(sName);
            }
            acc[ktvId].totalDuration += (item.duration || 0);
        }
        return acc;
    }, {} as Record<string, any>)) : [];

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-5 duration-500 pb-20">
            {/* Header / Service Cards */}
            {groupedKTVs.length > 0 ? (
                <div className="w-full space-y-3 mb-6">
                    {groupedKTVs.map((ktv, idx) => (
                        <div key={ktv.id} className="w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
                            {idx === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10"></div>}
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-100 flex-shrink-0 z-10">
                                <img 
                                    src={ktv.staffAvatar || "https://i.pravatar.cc/150?img=32"} 
                                    alt="Therapist" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="flex-1 z-10 min-w-0">
                                <h3 className="text-base font-black text-gray-800 truncate">{ktv.staffName || ktv.technicianCode || (lang === 'vi' ? 'Đang cập nhật...' : 'Updating...')}</h3>
                                <p className="text-gray-500 font-medium text-xs truncate">
                                    {lang === 'vi' ? 'Kỹ thuật viên' : 'Therapist'}
                                </p>
                            </div>
                            <div className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-100 z-10 flex-shrink-0">
                                #{idx + 1}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-100 flex-shrink-0 z-10">
                        <img 
                            src={staffAvatar || "https://i.pravatar.cc/150?img=32"} 
                            alt="Therapist" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="flex-1 z-10">
                        <h2 className="text-xl font-black text-gray-800">{staffName || (lang === 'vi' ? 'Đang cập nhật...' : 'Updating...')}</h2>
                        <p className="text-gray-500 font-medium text-sm">
                            {serviceName || (lang === 'vi' ? 'Dịch vụ' : 'Service')} {duration ? `• ${duration} min` : ""}
                        </p>
                        <div className="flex text-amber-500 text-sm mt-1">
                            ★ ★ ★ ★ ★ <span className="text-gray-400 text-xs ml-1">(5.0)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Assessment Box */}
            <div className="w-full bg-gradient-to-br from-amber-200 to-amber-300 rounded-3xl p-6 shadow-md mb-8">
                <p className="text-amber-950 font-semibold text-base leading-relaxed mb-4 text-justify">
                    {lang === 'vi'
                        ? 'Xin quý khách vui lòng đánh giá chất lượng dịch vụ để chúng tôi có cơ hội thấu hiểu và hoàn thiện trải nghiệm của bạn tốt hơn mỗi ngày. Sự hài lòng của bạn chính là phần thưởng quý giá nhất mà đội ngũ chúng tôi luôn trân trọng và biết ơn.'
                        : 'Please rate the quality of service so we can understand and improve your experience every day. Your satisfaction is the most valuable reward our team always cherishes and appreciates.'}
                </p>
            </div>

            {/* Violations Checklist */}
            <div className="w-full mb-10">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${selectedViolations.length > 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-gray-800 font-bold text-lg">{t.violationsSectionTitle || 'Service feedback (if any)'}</h3>
                    </div>
                </div>

                <div className="space-y-3 px-1">
                    {violations.map((v, idx) => (
                        <div key={idx}
                            onClick={() => toggleViolation(idx)}
                            className={`flex items-start gap-4 p-4 bg-white rounded-2xl cursor-pointer transition-all border ${selectedViolations.includes(idx) ? 'border-amber-200 shadow-sm ring-1 ring-amber-100' : 'border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]'}`}
                        >
                            <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selectedViolations.includes(idx) ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'}`}>
                                {selectedViolations.includes(idx) && (
                                    <svg className="w-3.2 h-3.2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                )}
                            </div>
                            <span className={`text-[15px] leading-snug font-medium ${selectedViolations.includes(idx) ? 'text-amber-900' : 'text-gray-500'}`}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ratings */}
            <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">{t.yourExperience || 'Your experience?'}</h3>

            <div className="grid grid-cols-2 gap-4 w-full mb-10">
                <button
                    disabled={isLoading || isSuccess}
                    onClick={() => setRating(1)}
                    className={`p-4 rounded-3xl flex flex-col items-center justify-center gap-2 ${UI_CONFIG.TRANSITION} ${rating === 1 ? 'bg-red-200 border-2 border-red-400 scale-105 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]' : rating !== null ? UI_CONFIG.UNSELECTED_BG : 'bg-gray-50 opacity-70'}`}
                >
                    <span className="text-4xl text-gray-900">😡</span>
                    <span className="font-extrabold text-red-700 text-base">{getRatingLabel(lang, 1)}</span>
                </button>
                <button
                    disabled={selectedViolations.length >= 3 || isLoading || isSuccess}
                    onClick={() => setRating(2)}
                    className={`p-4 rounded-3xl flex flex-col items-center justify-center gap-2 ${UI_CONFIG.TRANSITION} ${selectedViolations.length >= 3 ? 'bg-gray-100 opacity-40 grayscale cursor-not-allowed' : rating === 2 ? 'bg-gray-400 border-2 border-gray-600 scale-105 shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]' : UI_CONFIG.UNSELECTED_BG}`}
                >
                    <span className="text-4xl text-gray-900">😐</span>
                    <span className="font-extrabold text-gray-800 text-base">{getRatingLabel(lang, 2)}</span>
                </button>
                <button
                    disabled={selectedViolations.length >= 2 || isLoading || isSuccess}
                    onClick={() => setRating(3)}
                    className={`p-4 rounded-3xl flex flex-col items-center justify-center gap-2 ${UI_CONFIG.TRANSITION} ${selectedViolations.length >= 2 ? 'bg-gray-100 opacity-40 grayscale cursor-not-allowed' : rating === 3 ? 'bg-amber-300 border-2 border-amber-500 scale-105 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]' : UI_CONFIG.UNSELECTED_BG}`}
                >
                    <span className="text-4xl text-gray-900">🙂</span>
                    <span className="font-extrabold text-amber-800 text-base">{getRatingLabel(lang, 3)}</span>
                </button>
                <button
                    disabled={selectedViolations.length >= 1 || isLoading || isSuccess}
                    onClick={() => setRating(4)}
                    className={`relative p-4 rounded-3xl flex flex-col items-center justify-center gap-2 ${UI_CONFIG.TRANSITION} ${selectedViolations.length >= 1 ? 'bg-gray-100 opacity-40 grayscale cursor-not-allowed' : rating === 4 ? 'bg-amber-400 border-2 border-amber-600 shadow-md scale-105 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]' : UI_CONFIG.UNSELECTED_BG}`}
                >
                    <div className="absolute -top-3 -right-2 bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-sm transform rotate-12">Top</div>
                    <span className="text-4xl text-gray-900">🤩</span>
                    <span className="font-extrabold text-amber-900 text-base">{getRatingLabel(lang, 4)}</span>
                </button>
            </div>

            {/* Sticky Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
                <div className="max-w-md mx-auto">
                    <button
                        disabled={rating === null || isLoading || isSuccess}
                        onClick={handleSubmit}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isSuccess ? 'bg-green-600 text-white' : rating !== null ? 'bg-gray-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-black' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                        {isSuccess ? (
                            <>{t.thankYou || 'Submitted!'} <CheckCircle2 size={24} /></>
                        ) : isLoading ? (
                            <><Loader2 className="animate-spin" size={24} /> {t.processing || 'Processing...'}</>
                        ) : (
                            rating !== null ? (t.submitRating || 'Submit') : (t.selectToSubmit || 'Select to submit')
                        )}
                    </button>
                </div>
            </div>

            {/* Tip Modal Overlay */}
            {showTip && <TipModal onClose={(tip) => {
                setShowTip(false);
                clearStorageAndComplete({ rating: rating!, violations: selectedViolations, tipAmount: tip });
            }} />}

            {/* Alert Modal Overlay */}
            <AlertModal
                isOpen={alertState.isOpen}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
