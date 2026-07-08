'use client';

import React, { useState } from 'react';
import { ServiceItem } from '@/components/Journey/useJourneyRealtime';
import { TIMER_CONFIG, CHANGE_STAFF_TIMEOUT_MINUTES } from './Journey.constants';
import { useServiceTimer, useViolations, useRemindersCustomer } from './Journey.logic';
import { translations } from './Journey.i18n';

interface ActiveServiceProps {
    items: ServiceItem[];
    totalDuration: number; // in minutes
    timeStart?: string | null;
    timeEnd?: string | null;
    lang?: string;
    bookingId?: string;
    roomName?: string;
    bedId?: string;
    // Fallback for single-service orders
    fallbackStaffName?: string;
    fallbackStaffAvatar?: string;
    // [SOS PROPS]
    onSOS?: () => void;
    isSosLoading?: boolean;
    sosSent?: boolean;
    // [NEW PROPS]
    isAuthUser?: boolean;
    onAddService?: () => void;
    onChangeStaff?: () => void;
    isActionLoading?: boolean;
    actionSuccess?: string | null;
}



// Sub-component: Timer display for a single service
const ServiceTimer = ({ item, timeEnd, lang = 'vi' }: { item: ServiceItem; timeEnd?: string | null; lang?: string }) => {
    const { progress, formattedTime, isStarted } = useServiceTimer(
        item.duration,
        item.computedTimeStart,
        timeEnd,
        undefined,
        item.pausedSeconds || 0
    );

    const circumference = 2 * Math.PI * TIMER_CONFIG.RADIUS;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const t = translations[lang] || translations['en'];
    const waitingLabel = t.waiting || 'Waiting';

    return (
        <div className="relative flex items-center justify-center mb-6">
            <svg className="absolute -rotate-90 transform drop-shadow-xl"
                 width={TIMER_CONFIG.CIRCULAR_SIZE}
                 height={TIMER_CONFIG.CIRCULAR_SIZE}
                 viewBox="0 0 280 280">
                <circle
                    cx="140" cy="140" r={TIMER_CONFIG.RADIUS}
                    fill="none"
                    stroke={isStarted ? TIMER_CONFIG.AMBER_LIGHT : '#F3F4F6'}
                    strokeWidth="8"
                />
                <circle
                    cx="140" cy="140" r={TIMER_CONFIG.RADIUS}
                    fill="none"
                    stroke={isStarted ? TIMER_CONFIG.AMBER_MAIN : '#D1D5DB'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>

            <div
                className={`rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.2)] flex flex-col items-center justify-center ${isStarted ? 'bg-amber-50' : 'bg-gray-50'}`}
                style={{ width: TIMER_CONFIG.INNER_SIZE, height: TIMER_CONFIG.INNER_SIZE }}
            >
                <span className={`text-6xl font-black tracking-tighter ${isStarted ? TIMER_CONFIG.AMBER_DARK : 'text-gray-400'}`}>{formattedTime}</span>
                {!isStarted && (
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 animate-pulse">{waitingLabel}</span>
                )}
            </div>
        </div>
    );
};

export default function ActiveService({
    items,
    totalDuration,
    timeStart,
    timeEnd,
    lang = 'vi',
    bookingId,
    roomName,
    bedId,
    fallbackStaffName,
    fallbackStaffAvatar,
    onSOS,
    isSosLoading,
    sosSent,
    isAuthUser,
    onAddService,
    onChangeStaff,
    isActionLoading,
    actionSuccess
}: ActiveServiceProps) {

    const [selectedIndex, setSelectedIndex] = useState(0);
    const hasMultipleServices = items.length > 1;

    // Current selected service
    const currentItem = items[selectedIndex] || items[0];
    const currentStaffName = currentItem?.staffName || currentItem?.technicianCode || fallbackStaffName;
    const currentStaffAvatar = currentItem?.staffAvatar || fallbackStaffAvatar;

    // Timer logic for the selected service (for bottom action controls elapsed check)
    const { elapsedMinutes } = useServiceTimer(
        currentItem?.duration || totalDuration,
        currentItem?.computedTimeStart || timeStart,
        timeEnd,
        undefined,
        currentItem?.pausedSeconds || 0
    );

    const violations = useRemindersCustomer(lang || 'vi');
    const t = translations[lang || 'vi'] || translations['en'];

    const currentItemId = currentItem?.id || '0';
    const { selectedViolations, sentViolations: sentViolationsForItem, sendingViolation, toggleViolation } = useViolations(
        bookingId,
        currentItemId,
        violations,
        roomName,
        bedId,
        currentItem?.service_name,
    );

    // Logic: Disable change staff after threshold
    const isChangeStaffDisabled = elapsedMinutes >= CHANGE_STAFF_TIMEOUT_MINUTES;

    return (
        <div className={`flex flex-col items-center w-full animate-in fade-in duration-${TIMER_CONFIG.ANIMATION_DURATION} justify-center py-6`} style={{ minHeight: TIMER_CONFIG.MIN_HEIGHT }}>
            <h2 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-6">{t.activeService}</h2>

            {/* Service Tabs (only show if multiple services) */}
            {hasMultipleServices && (
                <div className="w-full max-w-sm mb-8">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {items.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedIndex(idx)}
                                className={`flex-shrink-0 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 border-2 ${
                                    selectedIndex === idx
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]'
                                        : 'bg-white text-gray-600 border-gray-100 hover:border-amber-200 hover:bg-amber-50'
                                }`}
                                style={{ minHeight: TIMER_CONFIG.TAB_HEIGHT }}
                            >
                                <div className="flex flex-col items-start gap-0.5">
                                    <span className="whitespace-nowrap">{item.service_name}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                        selectedIndex === idx ? 'text-amber-100' : 'text-gray-400'
                                    }`}>
                                        {item.duration} {t.minutes}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Circular Progress Indicator - per selected service */}
            {currentItem && (
                <ServiceTimer item={currentItem} timeEnd={timeEnd} lang={lang} />
            )}

            {/* Service Info */}
            <div className="text-center mb-10 border-b border-gray-100 pb-10 w-full max-w-sm">
                <h1 className="text-3xl font-black text-gray-800 mb-2">{currentItem?.service_name || 'Dịch vụ Spa'}</h1>
                {hasMultipleServices && (
                    <p className="text-sm text-gray-400 font-medium">
                        {selectedIndex + 1} / {items.length} {t.services}
                    </p>
                )}
            </div>

            {/* Quick feedback */}
            <div className="w-full max-w-sm mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-800 font-bold text-lg">{t.feedbackTitle}</h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">{t.optional}</span>
                </div>
                <div className="space-y-3">
                    {violations.map((v, idx) => {
                        const isSelected = selectedViolations.includes(idx);
                        const isSent = sentViolationsForItem.has(idx);
                        const isSending = sendingViolation === idx;

                        return (
                            <div key={idx}
                                onClick={() => toggleViolation(idx)}
                                className={`flex items-start gap-4 p-4 bg-white rounded-3xl cursor-pointer transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] border hover:shadow-md ${
                                    isSelected ? (isSent ? 'border-green-200 bg-green-50/30' : 'border-amber-200') : 'border-gray-100'
                                }`}
                            >
                                <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                    isSelected ? (isSent ? 'border-green-500 bg-green-500' : 'border-amber-500 bg-amber-500') : 'border-gray-300 bg-white'
                                }`}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    )}
                                </div>
                                <span className={`text-xl leading-snug font-medium pr-2 flex-1 ${
                                    isSelected ? (isSent ? 'text-green-800' : 'text-amber-900') : 'text-gray-500'
                                }`}>{v}</span>
                                {isSending && (
                                    <svg className="animate-spin w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                )}
                                {isSelected && isSent && !isSending && (
                                    <span className="text-[11px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 uppercase tracking-wider whitespace-nowrap">
                                        {t.sent}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Therapist Info & Actions */}
            <div className="w-full max-w-sm space-y-4">
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-14 h-14 bg-amber-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                            src={currentStaffAvatar || "https://i.pravatar.cc/150?img=32"} 
                            alt="Therapist" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <div className="flex-1">
                        <span className="text-sm text-gray-400 font-bold uppercase tracking-widest block mb-0.5">{t.therapistLabel}</span>
                        <span className="text-lg font-bold text-gray-800">{currentStaffName || "Đang cập nhật..."}</span>
                    </div>
                </div>


                <div className="flex flex-col gap-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* ADD SERVICE BUTTON */}
                        <button 
                            onClick={onAddService}
                            disabled={isActionLoading || actionSuccess === 'ADD_SERVICE'}
                            className={`py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                                actionSuccess === 'ADD_SERVICE' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white hover:bg-amber-600'
                            }`}
                        >
                            {actionSuccess === 'ADD_SERVICE' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            )}
                            {actionSuccess === 'ADD_SERVICE' ? t.notified : t.addService}
                        </button>

                        {/* Change therapist button removed (Task C2c) */}
                    </div>

                    {/* SOS / Emergency Button */}
                    <button
                        onClick={onSOS}
                        disabled={isSosLoading || sosSent}
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                            isSosLoading ? 'bg-gray-200 text-gray-400' : 
                            sosSent ? 'bg-green-500 text-white shadow-green-200' : 
                            'bg-red-600 text-white shadow-red-200 hover:bg-red-700 animate-pulse'
                        }`}
                    >
                        {isSosLoading ? (
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                        ) : sosSent ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                        )}
                        <span className="tracking-widest uppercase">{sosSent ? t.sosSentBtn : t.sosBtn}</span>
                    </button>
                    {sosSent && (
                       <p className="text-[10px] text-green-600 font-bold text-center mt-1 uppercase tracking-tighter">🔔 {t.sosSentBtn}</p>
                    )}
                </div>

            </div>
        </div>
    );
}
