'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ServiceItem } from '@/components/Journey/useJourneyRealtime';
import TipModal from '@/components/Journey/TipModal';
import { TIMER_CONFIG_COMPACT, RATING_OPTIONS, getRatingLabel } from './Journey.constants';
import { useServiceTimer, groupItemsByTech, groupItemsByService, useViolations, GroupedService, useRemindersCustomer } from './Journey.logic';
import AlertModal from '@/components/Shared/AlertModal';
import { translations } from './Journey.i18n';

// ─── Props ────────────────────────────────────────────────────────────────────
interface ServiceListProps {
    items: ServiceItem[];
    lang?: string;
    bookingId: string;
    roomName?: string;
    bedId?: string;
    fallbackStaffName?: string;
    fallbackStaffAvatar?: string;
    onSOS?: () => void;
    isSosLoading?: boolean;
    sosSent?: boolean;
    isAuthUser?: boolean;
    onAddService?: () => void;
    onChangeStaff?: () => void;
    isActionLoading?: boolean;
    actionSuccess?: string | null;
    addServiceNote?: string | null;
    onItemRated: (itemId: string, rating: number, feedback: string) => Promise<void>;
    isPaused?: boolean;
    onViewChange?: (view: 'TIMER' | 'CHECK_BELONGINGS' | 'RATING') => void;
    onAllRated?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW 1: Tab Timer — Grouped by technician
// ═══════════════════════════════════════════════════════════════════════════════
const TabTimerView = ({
    items, lang, bookingId, roomName, bedId,
    onSOS, isSosLoading, sosSent, isAuthUser,
    onAddService, onChangeStaff, isActionLoading, actionSuccess, addServiceNote, isPaused, onViewChange
}: Omit<ServiceListProps, 'onItemRated'>) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const t = translations[lang || 'vi'] || translations['en'];

    // Group items by technician
    const groups = groupItemsByTech(items || [], lang || 'vi');
    const currentGroup = groups[selectedIdx] || groups[0];
    if (!currentGroup) return null;

    const { formattedTime, progress: pct, isStarted, isFinished } = useServiceTimer(
        currentGroup.totalDuration, 
        currentGroup.earliestTimeStart, 
        currentGroup.earliestTimeEnd, 
        isPaused,
        currentGroup.items[0]?.pausedSeconds || 0
    );
    const circumference = 2 * Math.PI * TIMER_CONFIG_COMPACT.RADIUS;
    const isCompleted = currentGroup.isCompleted;
    const violations = useRemindersCustomer(lang || 'vi');

    // Use shared violations hook
    const currentGroupId = currentGroup.items[0]?.id || '0';
    const { selectedViolations, sentViolations, sendingViolation, toggleViolation } = useViolations(
        bookingId,
        currentGroupId,
        violations,
        currentGroup.roomName || roomName,
        currentGroup.bedId || bedId,
        currentGroup.combinedName,
    );

    return (
        <div className="flex flex-col w-full pb-6">
            {/* Service Group Tab Bar — hiện per-group */}
            {groups.length > 1 && (
                <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-3 px-1 mb-2 scrollbar-hide snap-x">
                    {groups.map((group, idx) => {
                        const isActive = idx === selectedIdx;
                        const isDone = group.isCompleted;
                        return (
                            <button key={group.technicianCode || idx} onClick={() => setSelectedIdx(idx)}
                                className={`flex-shrink-0 snap-start px-4 py-2.5 rounded-2xl border transition-all text-left ${
                                    isActive ? 'bg-[#1c1c1e] border-[#C9A96E] shadow-[0_0_10px_rgba(201,169,110,0.3)]' :
                                    isDone ? 'bg-[#1c1c1e] border-[#C9A96E]/20 opacity-80' :
                                    'bg-[#0d0d0d] border-white/5 hover:border-white/10'
                                }`}>
                                <p className={`text-xs font-black leading-tight truncate max-w-[150px] ${isActive ? 'text-[#C9A96E]' : isDone ? 'text-[#C9A96E]/60' : 'text-gray-500'}`}>
                                    {group.combinedName}
                                </p>
                                <p className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-[#C9A96E]/80' : isDone ? 'text-[#C9A96E]/50' : 'text-gray-600'}`}>
                                    {isDone
                                        ? `✅ ${t.done}`
                                        : `${group.totalDuration} ${t.minutes}${group.itemCount > 1 ? ` · ${group.itemCount} ${t.services}` : ''}`
                                    }
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Timer Circle */}
            <div className="flex flex-col items-center mb-4">
                <div className="relative flex items-center justify-center">
                    <svg className="-rotate-90 drop-shadow-lg" width={TIMER_CONFIG_COMPACT.TIMER_SIZE} height={TIMER_CONFIG_COMPACT.TIMER_SIZE} viewBox="0 0 260 260">
                        <circle cx="130" cy="130" r={TIMER_CONFIG_COMPACT.RADIUS} fill="none" stroke={isStarted ? 'rgba(201,169,110,0.1)' : '#1c1c1e'} strokeWidth="8" />
                        <circle cx="130" cy="130" r={TIMER_CONFIG_COMPACT.RADIUS} fill="none"
                            stroke={isCompleted ? '#C9A96E' : isStarted ? '#C9A96E' : '#333'}
                            strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={isCompleted ? 0 : circumference - (pct / 100) * circumference}
                            className="transition-all duration-1000 ease-linear" />
                    </svg>
                    <div className={`absolute rounded-full flex flex-col items-center justify-center shadow-lg transition-colors ${
                        isCompleted ? 'bg-[#1c1c1e] shadow-[#C9A96E]/20 border border-[#C9A96E]/30' : isStarted ? 'bg-[#1c1c1e] shadow-[#C9A96E]/20' : 'bg-[#0d0d0d] border border-white/5'
                    }`} style={{ width: TIMER_CONFIG_COMPACT.INNER_SIZE, height: TIMER_CONFIG_COMPACT.INNER_SIZE }}>
                        {isCompleted ? (
                            <>
                                <span className="text-4xl">✅</span>
                                <span className="text-sm font-black text-[#C9A96E] mt-1">{t.done}</span>
                            </>
                        ) : (
                            <>
                                <span className={`text-5xl font-black tracking-tighter ${isStarted ? 'text-[#C9A96E]' : 'text-gray-600'}`}>{formattedTime}</span>
                                {!isStarted && <span className="text-xs font-bold text-gray-600 uppercase tracking-wider animate-pulse">{t.waiting}</span>}
                                {isStarted && isPaused && <span className="text-[9px] font-bold text-[#C9A96E] uppercase tracking-tighter animate-pulse bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-2 py-0.5 rounded-full mt-1">ĐỢI CHUYỂN PHÒNG</span>}
                            </>
                        )}
                    </div>
                </div>

                {/* Service Info — grouped */}
                <div className="text-center mt-3">
                    <p className="font-black text-white/90 text-lg">{currentGroup.combinedName}</p>
                    <p className="text-gray-500 text-sm font-medium">
                        {currentGroup.technicianCode && `${t.staff}: ${currentGroup.technicianCode}`}
                        {/* Room/Bed info hidden from customer view (Task C2a) */}
                    </p>
                    {currentGroup.totalSegments > 1 && currentGroup.activeSegmentIndex >= 0 && !isCompleted && (
                        <p className="text-[10px] font-black text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 rounded-full uppercase tracking-widest inline-flex mt-2">
                            Đang làm chặng {currentGroup.activeSegmentIndex + 1}/{currentGroup.totalSegments}
                        </p>
                    )}
                    {currentGroup.itemCount > 1 && (
                        <p className="text-xs font-bold text-[#C9A96E] mt-1">
                            {currentGroup.totalDuration} {t.minutes} · {currentGroup.itemCount} {t.services}
                        </p>
                    )}
                </div>

                {/* Progress: X/N groups */}
                {groups.length > 1 && (
                    <p className="text-xs font-bold text-gray-400 mt-2">
                        {selectedIdx + 1} / {groups.length} {t.serviceGroups}
                    </p>
                )}
            </div>

            {/* Quick Violations */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-bold text-white/90 text-xl">{t.quickFeedback}</h3>
                    <span className="text-xs font-black uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/10 px-3 py-1 rounded-full border border-[#C9A96E]/20">
                        {t.optional}
                    </span>
                </div>
                <div className="space-y-3">
                    {violations.map((v, idx) => {
                        const isSel = selectedViolations.includes(idx);
                        const isSent = sentViolations.has(idx);
                        return (
                            <div key={idx} onClick={() => toggleViolation(idx)}
                                className={`flex items-start gap-4 p-4 bg-[#1c1c1e] rounded-2xl cursor-pointer border transition-all ${
                                    isSel ? (isSent ? 'border-[#C9A96E]/50 bg-[#C9A96E]/5' : 'border-[#C9A96E]') : 'border-white/5'
                                }`}>
                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center ${
                                    isSel ? (isSent ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-[#C9A96E] bg-[#C9A96E]') : 'border-gray-600'
                                }`}>
                                    {isSel && <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`text-lg leading-tight font-medium flex-1 ${isSel ? (isSent ? 'text-[#C9A96E]/80' : 'text-[#C9A96E]') : 'text-gray-400'}`}>{v}</span>
                                {isSel && isSent && <span className="text-xs font-bold text-black bg-[#C9A96E] px-2 py-1 rounded-full flex-shrink-0">{t.sent}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <button onClick={onAddService} disabled={isActionLoading || actionSuccess === 'ADD_SERVICE_PENDING' || actionSuccess === 'ADD_SERVICE_CONFIRMED'}
                        className={`w-full py-4 font-black rounded-2xl text-lg transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                            actionSuccess === 'ADD_SERVICE_CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            actionSuccess === 'ADD_SERVICE_PENDING' ? 'bg-[#C9A96E]/20 text-[#C9A96E] animate-pulse border border-[#C9A96E]/30' :
                            'bg-[#C9A96E] text-black hover:bg-[#b09461]'
                        }`}>
                        {actionSuccess === 'ADD_SERVICE_CONFIRMED' ? '✅' : actionSuccess === 'ADD_SERVICE_PENDING' ? '⏳' : '+'}
                        <span>
                            {actionSuccess === 'ADD_SERVICE_CONFIRMED' 
                                ? (addServiceNote || t.confirmed) 
                                : actionSuccess === 'ADD_SERVICE_PENDING' 
                                    ? t.pending 
                                    : t.addServiceShort}
                        </span>
                    </button>
                    {/* Change staff button removed (Task C2c) */}
                </div>
                <button onClick={onSOS} disabled={isSosLoading || sosSent}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                        isSosLoading ? 'bg-[#1c1c1e] text-gray-500 border border-white/5' : sosSent ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'
                    }`}>
                    {sosSent ? '✓ ' : '🚨 '}<span className="tracking-widest uppercase">{sosSent ? t.sosSentBtn : t.sosBtn}</span>
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW 2: Check Belongings
// ═══════════════════════════════════════════════════════════════════════════════
const CheckBelongingsView = ({ lang = 'vi', onConfirm }: { lang?: string; onConfirm: () => void }) => {
    const t = translations[lang || 'vi'] || translations['en'];
    const checkItems = [t.checkPhone, t.checkWallet, t.checkWatch, t.checkKeys];

    return (
        <div className="flex flex-col items-center w-full py-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="w-20 h-20 bg-[#1c1c1e] rounded-full flex items-center justify-center text-4xl border border-[#C9A96E]/30 mb-6 shadow-[#C9A96E]/10 shadow-lg">
                👜
            </div>
            <h2 className="text-2xl font-black text-[#C9A96E] text-center mb-2">
                {t.beforeYouLeave}
            </h2>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-xs">
                {t.checkBeforeLeave}
            </p>
            <div className="w-full space-y-3 mb-8">
                {checkItems.map((item) => (
                    <div key={item} className="flex items-center gap-4 bg-[#1c1c1e] rounded-2xl px-5 py-4 border border-white/5 shadow-sm">
                        <span className="font-bold text-white/90 text-base">{item}</span>
                    </div>
                ))}
            </div>
            <button onClick={onConfirm}
                className="w-full py-4 bg-[#C9A96E] hover:bg-[#b09461] text-black font-black rounded-2xl text-base shadow-xl active:scale-95 transition-all">
                {t.checkedRateNow}
            </button>
        </div>
    );
};

// -------------------------------------------------------------------------------
// VIEW 3: Combined Rating � T?t c? NV g?p 1 trang (H? tr? d�nh gi� chung & l?)
// -------------------------------------------------------------------------------
const CombinedRatingView = ({
    items, lang = 'vi', bookingId, onItemRated, onAllRated,
}: {
    items: ServiceItem[]; lang?: string; bookingId: string;
    onItemRated: (itemId: string, rating: number, feedback: string) => Promise<void>;
    onAllRated?: () => void;
}) => {
    const [submitted, setSubmitted] = useState<Set<string>>(new Set());
    const [commonRating, setCommonRating] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showTipFor, setShowTipFor] = useState<boolean>(false);
    const [savedViolations, setSavedViolations] = useState<number[]>([]);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });
    const t = translations[lang || 'vi'] || translations['en'];

    const [showDetailed, setShowDetailed] = useState<boolean>(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const groups = useMemo(() => groupItemsByService(items, lang || 'vi'), [items, lang]);

    const hasAnyRating = items.some(i => i.itemRating !== null && i.itemRating !== undefined) || submitted.size > 0;

    useEffect(() => {
        if (hasAnyRating) {
            setShowDetailed(true);
        }
    }, [hasAnyRating]);

    const getMaxRating = (violationCount: number): number => {
        if (violationCount >= 3) return 1;
        if (violationCount >= 2) return 2;
        if (violationCount >= 1) return 3;
        return 4;
    };
    const maxAllowedRating = getMaxRating(savedViolations.length);

    const storageKey = `spa_wrb_violations_${bookingId || 'default'}`;
    const violations = useRemindersCustomer(lang || 'vi');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const allViolations = new Set<number>();
                    Object.values(parsed).forEach((arr: any) => {
                        if (Array.isArray(arr)) arr.forEach((n: number) => allViolations.add(n));
                    });
                    setSavedViolations(Array.from(allViolations));
                } else if (Array.isArray(parsed)) {
                    setSavedViolations(parsed);
                }
            }
        } catch { /* silent */ }
    }, [storageKey]);

    const isAllRated = items.length > 0 && items.every(i => (i.itemRating !== null && i.itemRating !== undefined) || submitted.has(i.id));

    useEffect(() => {
        if (isAllRated) {
            try { localStorage.removeItem(storageKey); } catch { /* silent */ }
            onAllRated?.();
        }
    }, [isAllRated, storageKey, onAllRated]);

    const handleAutoSubmitAll = async (rating: number) => {
        if (submitting) return;

        setCommonRating(rating);

        if (rating === 4) {
            setShowTipFor(true);
            return;
        }

        setSubmitting(true);
        try {
            const newSubmitted = new Set(submitted);
            for (const item of items) {
                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                    await onItemRated(item.id, rating, '');
                    newSubmitted.add(item.id);
                }
            }
            setSubmitted(newSubmitted);
        } catch (err: any) {
            console.error('Rating submit error:', err);
            setAlertState({
                isOpen: true,
                message: lang === 'vi' ? 'G?i d�nh gi� th?t b?i. Vui l�ng th? l?i.' : 'Failed to submit rating. Please try again.',
                type: 'error'
            });
            setCommonRating(null);
        }
        finally { setSubmitting(false); }
    };

    const handleTipClose = async (tipAmount: number) => {
        setShowTipFor(false);
        setSubmitting(true);
        try {
            const newSubmitted = new Set(submitted);
            let first = true;
            for (const item of items) {
                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                    await onItemRated(item.id, 4, first ? `tip:${tipAmount}` : '');
                    newSubmitted.add(item.id);
                    first = false;
                }
            }
            setSubmitted(newSubmitted);
        } catch (err: any) {
            console.error('Rating submit error:', err);
            setAlertState({
                isOpen: true,
                message: lang === 'vi' ? 'G?i d�nh gi� th?t b?i. Vui l�ng th? l?i.' : 'Failed to submit rating. Please try again.',
                type: 'error'
            });
            setCommonRating(null);
        }
        finally { setSubmitting(false); }
    };

    const ratedOpt = RATING_OPTIONS.find(r => r.value === commonRating || (!hasAnyRating && items.some(i => i.itemRating === r.value)));

    return (
        <div className="flex flex-col w-full py-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1c1c1e] rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-[#C9A96E]/30 shadow-[0_0_15px_rgba(201,169,110,0.2)]">
                    ?
                </div>
                <h2 className="text-2xl font-black text-[#C9A96E]">
                    {t.rateTitle}
                </h2>
                <p className="text-gray-400 text-base mt-2">
                    {t.rateSub}
                </p>
            </div>

            {/* Violations Checklist */}
            <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-4 mb-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 className="text-base font-black text-[#C9A96E]">
                        {t.violationsSectionTitle}
                    </h3>
                </div>
                <div className="space-y-2">
                    {violations.map((v, idx) => {
                        const isChecked = savedViolations.includes(idx);
                        return (
                            <div key={idx}
                                onClick={() => {
                                    const updated = isChecked
                                        ? savedViolations.filter(i => i !== idx)
                                        : [...savedViolations, idx];
                                    setSavedViolations(updated);
                                    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* silent */ }

                                    const newMax = getMaxRating(updated.length);
                                    if (commonRating && commonRating > newMax) {
                                        setCommonRating(null);
                                    }
                                }}
                                className={`flex items-start gap-3 p-3 bg-[#0d0d0d] rounded-2xl cursor-pointer border transition-all ${
                                    isChecked ? 'border-[#C9A96E] shadow-[#C9A96E]/10 shadow-sm ring-1 ring-[#C9A96E]/20' : 'border-white/5'
                                }`}>
                                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                    isChecked ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-gray-600 bg-transparent'
                                }`}>
                                    {isChecked && <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`text-base leading-snug font-medium flex-1 ${isChecked ? 'text-[#C9A96E]' : 'text-gray-400'}`}>{v}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Single Order Card */}
            <div className="space-y-3">
                <div className={`bg-[#1c1c1e] rounded-3xl border-2 transition-all overflow-hidden ${
                    isAllRated ? 'border-white/5 opacity-80' : 'border-[#C9A96E] shadow-[#C9A96E]/20 shadow-lg'
                }`}>
                    {/* Accordion Header */}
                    <div className="w-full text-left p-4 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                            isAllRated ? 'bg-[#0d0d0d] border border-white/5' : 'bg-[#0d0d0d] border border-[#C9A96E]/30 text-[#C9A96E]'
                        }`}>
                            {isAllRated ? '?' : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-black text-base leading-tight truncate ${isAllRated ? 'text-gray-400' : 'text-white/90'}`}>
                                To�n b? li?u tr�nh
                            </p>
                            <p className="text-gray-500 text-sm font-medium truncate mt-1">
                                {items.length} {t.services}
                            </p>
                        </div>
                        {isAllRated && !hasAnyRating && ratedOpt && (
                            <div className="flex items-center gap-1.5 bg-[#C9A96E]/20 text-[#C9A96E] px-3 py-1.5 rounded-full border border-[#C9A96E]/30">
                                <span className="text-xl leading-none">{ratedOpt?.emoji || '?'}</span>
                                <span className="text-xs font-black">{t.ratedSent}</span>
                            </div>
                        )}
                        {isAllRated && hasAnyRating && (
                            <div className="flex items-center gap-1.5 bg-green-900/20 text-green-500 px-3 py-1.5 rounded-full border border-green-500/30">
                                <span className="text-xs font-black">Ho�n t?t</span>
                            </div>
                        )}
                    </div>

                    {/* Expanded Rating Area (Ch? hi?n th? khi CHUA c� d�nh gi� l? n�o) */}
                    {!isAllRated && !hasAnyRating && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-[#0d0d0d]/50">
                            <div className="mb-4">
                                <div className="flex items-center justify-center relative mb-4">
                                    <p className="text-base font-bold text-[#C9A96E]">
                                        {t.yourExperience}
                                    </p>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                {RATING_OPTIONS.map((opt) => {
                                    const isDisabled = opt.value > maxAllowedRating;
                                    const isSel = commonRating === opt.value;
                                    let bgClass = "bg-[#1c1c1e] border-white/5 hover:border-white/10";
                                    if (isSel) {
                                        if (opt.value === 4) bgClass = "bg-green-900/40 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
                                        else if (opt.value === 3) bgClass = "bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
                                        else if (opt.value === 2) bgClass = "bg-[#C9A96E]/20 border-[#C9A96E] shadow-[0_0_10px_rgba(201,169,110,0.2)]";
                                        else bgClass = "bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                                    }

                                    return (
                                        <button key={opt.value}
                                            disabled={isDisabled || submitting}
                                            onClick={() => {
                                                if (isDisabled || submitting) return;
                                                handleAutoSubmitAll(opt.value);
                                            }}
                                            className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all ${
                                                isDisabled || submitting
                                                    ? 'opacity-40 grayscale cursor-not-allowed bg-[#0d0d0d] border-transparent'
                                                    : `active:scale-95 ${bgClass}`
                                            }`}>
                                            <span className="text-3xl mb-1">{opt.emoji}</span>
                                            <span className={`text-xs font-bold leading-tight text-center ${isSel ? 'text-white' : 'text-gray-500'}`}>
                                                {getRatingLabel(lang || 'vi', opt.value)}
                                            </span>
                                        </button>
                                    );
                                })}
                                </div>
                            </div>
                            
                            {/* Submitting indicator */}
                            {submitting && (
                                <div className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-[#C9A96E]">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    <span className="text-base font-bold">{t.submitting}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Detailed Button */}
            {!isAllRated && !hasAnyRating && !showDetailed && (
                <button
                    onClick={() => setShowDetailed(true)}
                    className="w-full py-3 mt-4 rounded-2xl font-bold text-sm text-[#C9A96E] bg-[#1c1c1e] border border-white/5 hover:border-[#C9A96E]/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    Ho?c d�nh gi� chi ti?t t?ng d?ch v? ??
                </button>
            )}

            {/* Detailed Per-Service Accordions */}
            {showDetailed && groups.length > 0 && (
                <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider text-center mb-3">��nh gi� chi ti?t</h3>
                    {groups.map((g: any, i: number) => {
                        const isGroupRated = g.items.every((item: any) => (item.itemRating !== null && item.itemRating !== undefined) || submitted.has(item.id));
                        const isExpanded = expandedGroups.has(i) || (!isGroupRated && groups.findIndex((gr: any) => !gr.items.every((it: any) => (it.itemRating !== null && it.itemRating !== undefined) || submitted.has(it.id))) === i);
                        const groupOpt = RATING_OPTIONS.find(r => r.value === g.items[0]?.itemRating);

                        return (
                            <div key={i} className={`bg-[#1c1c1e] rounded-3xl border transition-all overflow-hidden ${
                                isGroupRated ? 'border-white/5 opacity-80' : 'border-[#C9A96E]/50 shadow-[#C9A96E]/5'
                            }`}>
                                {/* Accordion Header */}
                                <div onClick={() => {
                                    if (isGroupRated) return;
                                    const next = new Set(expandedGroups);
                                    if (next.has(i)) next.delete(i);
                                    else next.add(i);
                                    setExpandedGroups(next);
                                }} className="w-full text-left p-4 flex items-center gap-3 cursor-pointer">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                                        isGroupRated ? 'bg-[#0d0d0d] border border-white/5' : 'bg-[#0d0d0d] border border-[#C9A96E]/30 text-[#C9A96E]'
                                    }`}>
                                        {isGroupRated ? '?' : '??'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm leading-tight truncate ${isGroupRated ? 'text-gray-400' : 'text-white/90'}`}>
                                            {g.serviceName}
                                        </p>
                                        <p className="text-gray-500 text-xs font-medium truncate mt-1">
                                            KTV: {g.technicians.join(', ')}
                                        </p>
                                    </div>
                                    {isGroupRated && groupOpt && (
                                        <div className="flex items-center justify-center w-8 h-8 bg-black/20 rounded-full">
                                            <span className="text-lg leading-none">{groupOpt.emoji}</span>
                                        </div>
                                    )}
                                    {!isGroupRated && (
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    )}
                                </div>

                                {/* Expanded Area */}
                                {!isGroupRated && isExpanded && (
                                    <div className="px-4 pb-4 border-t border-white/5 pt-3 bg-[#0d0d0d]/50">
                                        <div className="grid grid-cols-4 gap-2">
                                            {RATING_OPTIONS.map((opt) => {
                                                const isDisabled = opt.value > maxAllowedRating;
                                                const isSel = g.items.some((item: any) => item.itemRating === opt.value);
                                                let bgClass = "bg-[#1c1c1e] border-white/5";
                                                if (isSel) bgClass = "bg-[#C9A96E]/20 border-[#C9A96E]";

                                                return (
                                                    <button key={opt.value}
                                                        disabled={isDisabled || submitting}
                                                        onClick={async () => {
                                                            if (isDisabled || submitting) return;
                                                            setSubmitting(true);
                                                            try {
                                                                const newSubmitted = new Set(submitted);
                                                                for (const item of g.items) {
                                                                    if (!newSubmitted.has(item.id)) {
                                                                        await onItemRated(item.id, opt.value, '');
                                                                        newSubmitted.add(item.id);
                                                                    }
                                                                }
                                                                setSubmitted(newSubmitted);
                                                                
                                                                const nextExpanded = new Set(expandedGroups);
                                                                nextExpanded.delete(i);
                                                                setExpandedGroups(nextExpanded);
                                                            } catch (err) {
                                                                console.error(err);
                                                            } finally {
                                                                setSubmitting(false);
                                                            }
                                                        }}
                                                        className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                                                            isDisabled || submitting
                                                                ? 'opacity-40 grayscale cursor-not-allowed bg-[#0d0d0d] border-transparent'
                                                                : `active:scale-95 ${bgClass}`
                                                        }`}>
                                                        <span className="text-2xl mb-1">{opt.emoji}</span>
                                                        <span className={`text-[10px] font-bold leading-tight text-center ${isSel ? 'text-white' : 'text-gray-500'}`}>
                                                            {getRatingLabel(lang || 'vi', opt.value)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Skip Button */}
            {!isAllRated && (
                <button
                    onClick={async () => {
                        setSubmitting(true);
                        try {
                            const newSubmitted = new Set(submitted);
                            for (const item of items) {
                                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                                    await onItemRated(item.id, 0, 'skipped');
                                    newSubmitted.add(item.id);
                                }
                            }
                            setSubmitted(newSubmitted);
                        } catch { /* noop */ }
                        finally { setSubmitting(false); }
                    }}
                    disabled={submitting}
                    className="w-full py-3 mt-4 rounded-2xl font-bold text-sm text-gray-400 bg-[#1c1c1e] border border-white/5 hover:border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>{t.processing}</>
                    ) : (
                        <>{t.skipRating}</>
                    )}
                </button>
            )}

            {/* All-done message */}
            {isAllRated && (
                <div className="mt-6 text-center animate-in fade-in zoom-in-95">
                    <p className="text-green-600 font-black text-lg">{t.thankYou}</p>
                    <p className="text-gray-400 text-sm mt-1">{t.allDoneRedirecting}</p>
                </div>
            )}

            {/* TipModal */}
            {showTipFor && <TipModal onClose={handleTipClose} lang={lang} />}

            {/* Alert Modal Overlay */}
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

// MAIN COMPONENT — State machine
// ═══════════════════════════════════════════════════════════════════════════════
type ViewState = 'TIMER' | 'CHECK_BELONGINGS' | 'RATING';

const ServiceList = (props: ServiceListProps) => {
    const { items, lang = 'vi', isPaused } = props;
    const [view, setView] = useState<ViewState>('TIMER');

    // Auto-transition: TIMER → CHECK_BELONGINGS when all items TRULY finished
    // ⚠️ CRITICAL: Only DONE/FEEDBACK count as "completed". 
    // CLEANING = KTV vừa kết thúc, đang dọn phòng (chưa xong thật sự)
    // COMPLETED = KTV kết thúc chặng nhưng có thể còn chặng tiếp theo
    // Nếu dùng CLEANING/COMPLETED ở đây → đơn 2KTV sẽ nhảy khi KTV1 vừa xong
    const allCompleted = items.length > 0 && items.every(i =>
        ['CLEANING', 'DONE', 'FEEDBACK'].includes(i.status || '')
    );
    const allRated = items.length > 0 && items.every(i =>
        i.itemRating !== null && i.itemRating !== undefined
    );

    const [timeIsUp, setTimeIsUp] = useState(false);
    
    // Auto-transition when overall timer runs out
    useEffect(() => {
        if (items.length === 0) return;
        
        const checkTimer = () => {
            const now = Date.now();
            let allFinished = true;
            
            const groups = groupItemsByTech(items, lang);
            for (const g of groups) {
                if (!g.isStarted) {
                    allFinished = false;
                    break;
                }
                
                let normalizedStart = g.earliestTimeStart!;
                if (typeof normalizedStart === 'string' && !normalizedStart.includes('Z') && !normalizedStart.includes('+')) {
                    normalizedStart = normalizedStart.replace(' ', 'T');
                }
                const start = new Date(normalizedStart).getTime();
                const durationMs = g.totalDuration * 60 * 1000;
                const pausedMs = (g.items[0]?.pausedSeconds || 0) * 1000;
                
                const elapsedMs = now - start - pausedMs;
                
                if (!g.earliestTimeEnd && elapsedMs < durationMs) {
                    allFinished = false;
                    break;
                }
            }
            
            if (allFinished) {
                setTimeIsUp(true);
            }
        };

        checkTimer(); // Check initially
        const interval = setInterval(checkTimer, 1000);
        return () => clearInterval(interval);
    }, [items, lang]);

    useEffect(() => {
        if ((allCompleted || timeIsUp) && view === 'TIMER') {
            setView('CHECK_BELONGINGS');
            props.onViewChange?.('CHECK_BELONGINGS');
        }
    }, [allCompleted, timeIsUp, view, props.onViewChange]);

    return (
        <div className="w-full">
            {view === 'TIMER' && <TabTimerView {...props} />}
            {view === 'CHECK_BELONGINGS' && (
                <CheckBelongingsView lang={lang} onConfirm={() => {
                    setView('RATING');
                    props.onViewChange?.('RATING');
                }} />
            )}
            {view === 'RATING' && (
                <CombinedRatingView
                    items={items}
                    lang={lang}
                    bookingId={props.bookingId}
                    onItemRated={props.onItemRated}
                    onAllRated={props.onAllRated}
                />
            )}
        </div>
    );
};

export default ServiceList;
