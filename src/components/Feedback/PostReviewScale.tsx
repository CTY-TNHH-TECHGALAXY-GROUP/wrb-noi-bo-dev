'use client';

import React from 'react';
import { usePostReviewLogic, ReviewScore } from './PostReviewScale.logic';
import { t } from './PostReviewScale.i18n';
import AlertModal from '@/components/Shared/AlertModal';

// 🔧 UI CONFIGURATION
const ICON_SIZE = '48px';
const BORDER_RADIUS = '24px';
const MODAL_RADIUS = '20px';

const FACES = [
    {
        score: 1,
        color: '#EF4444',
        svg: '<circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
    {
        score: 2,
        color: '#F97316',
        svg: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
    {
        score: 3,
        color: '#FBBF24',
        svg: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
    {
        score: 4,
        color: '#84CC16',
        svg: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
    {
        score: 5,
        color: '#10B981',
        svg: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
    },
] as const;

export const PostReviewScale = ({ lang = 'vi' }: { lang?: 'vi' | 'en' }) => {
    const [alertState, setAlertState] = React.useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });

    const { score, showTipping, setShowTipping, handleScoreSelect, submitReview } = usePostReviewLogic(
        lang, 
        (msg) => setAlertState({ isOpen: true, message: msg, type: 'success' })
    );
    const localeText = t[lang];

    return (
        <div className="w-full flex justify-center items-center py-8">
            <div
                className="w-full max-w-sm bg-white p-6 shadow-sm flex flex-col items-center gap-6 animate-fade-in-up"
                style={{ borderRadius: BORDER_RADIUS }}
            >
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-gray-800">{localeText.title}</h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{localeText.subtitle}</p>
                </div>

                {/* 5 Faces Icons */}
                <div className="flex flex-wrap justify-center w-full gap-3">
                    {FACES.map((face) => {
                        const isSelected = score === face.score;
                        let label = '';
                        if (face.score === 1) label = localeText.score1;
                        else if (face.score === 2) label = localeText.score2;
                        else if (face.score === 3) label = localeText.score3;
                        else if (face.score === 4) label = localeText.score4;
                        else label = localeText.score5;

                        return (
                            <button
                                key={face.score}
                                onClick={() => handleScoreSelect(face.score as ReviewScore)}
                                className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                            >
                                <div
                                    className={`flex items-center justify-center transition-all duration-300 rounded-full ${isSelected ? 'scale-110 shadow-md' : 'scale-100 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                                    style={{ width: ICON_SIZE, height: ICON_SIZE, backgroundColor: isSelected ? face.color : '#F3F4F6', color: isSelected ? 'white' : '#9CA3AF' }}
                                >
                                    <svg
                                        width="28" height="28" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        dangerouslySetInnerHTML={{ __html: face.svg }}
                                    />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-semibold max-w-[50px] text-center leading-tight transition-colors ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tipping Modal */}
                {showTipping && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in">
                        <div
                            className="responsive-panel bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95"
                            style={{ borderRadius: MODAL_RADIUS }}
                        >
                            <div className="flex justify-center">
                                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                    <span className="text-3xl animate-bounce">💖</span>
                                </div>
                            </div>

                            <div className="text-center space-y-2 mt-2">
                                <h3 className="text-lg font-bold text-gray-800">{localeText.tipTitle}</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    {localeText.tipDesc}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    onClick={() => { setShowTipping(false); submitReview(); }}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm"
                                >
                                    {localeText.tipSubmit}
                                </button>
                                <button
                                    onClick={() => { setShowTipping(false); submitReview(); }}
                                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl transition-all border border-gray-200"
                                >
                                    {localeText.noThanks}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                lang={lang}
            />
        </div>
    );
};
