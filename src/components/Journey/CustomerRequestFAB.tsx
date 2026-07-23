'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface CustomerRequestFABProps {
    realBookingId: string;
    accessToken: string;
    lang: string;
}

type RequestType = 'WATER' | 'SUPPORT' | 'EMERGENCY' | 'CHECKOUT';

interface RequestState {
    status: 'IDLE' | 'LOADING' | 'PENDING' | 'CONFIRMED';
    cooldown: number; // seconds left
    note?: string;
    id?: string;
}

const INITIAL_STATE: Record<RequestType, RequestState> = {
    WATER: { status: 'IDLE', cooldown: 0 },
    SUPPORT: { status: 'IDLE', cooldown: 0 },
    EMERGENCY: { status: 'IDLE', cooldown: 0 },
    CHECKOUT: { status: 'IDLE', cooldown: 0 },
};

export default function CustomerRequestFAB({ realBookingId, accessToken, lang }: CustomerRequestFABProps) {
    const [requests, setRequests] = useState<Record<RequestType, RequestState>>(INITIAL_STATE);

    // Translate texts
    const t = {
        WATER: ({ vi: 'Gọi nước', en: 'Water', kr: '물', cn: '水', jp: '水' } as Record<string, string>)[lang] || 'Water',
        SUPPORT: ({ vi: 'Hỗ trợ', en: 'Support', kr: '지원', cn: '支持', jp: 'サポート' } as Record<string, string>)[lang] || 'Support',
        EMERGENCY: ({ vi: 'Khẩn cấp', en: 'Emergency', kr: '비상', cn: '紧急', jp: '緊急' } as Record<string, string>)[lang] || 'Emergency',
        CHECKOUT: ({ vi: 'Thanh toán', en: 'Checkout', kr: '체크아웃', cn: '结账', jp: 'お会計' } as Record<string, string>)[lang] || 'Checkout',
        PENDING: ({ vi: 'Đang chờ...', en: 'Waiting...', kr: '대기 중...', cn: '等待中...', jp: '待機中...' } as Record<string, string>)[lang] || 'Waiting...',
        CONFIRMED: ({ vi: 'Đã xác nhận', en: 'Confirmed', kr: '확인됨', cn: '已确认', jp: '確認済み' } as Record<string, string>)[lang] || 'Confirmed',
    };

    const icons = {
        WATER: '🥤',
        SUPPORT: '🔔',
        EMERGENCY: '🚨',
        CHECKOUT: '💳',
    };

    // Cooldown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setRequests(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(k => {
                    const type = k as RequestType;
                    if (next[type].cooldown > 0) {
                        next[type] = { ...next[type], cooldown: next[type].cooldown - 1 };
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Realtime subscription
    useEffect(() => {
        const supabase = createClient();
        const requestIds = Object.values(requests).map(r => r.id).filter(Boolean);
        
        if (requestIds.length === 0) return;

        const channel = supabase
            .channel(`customer-requests-${realBookingId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'StaffNotifications',
                filter: `bookingId=eq.${realBookingId}`,
            }, (payload: any) => {
                if (payload.new.acknowledgedAt) {
                    const typeMatch = (payload.new.type as string).replace('CUSTOMER_', '') as RequestType;
                    if (requests[typeMatch]) {
                        setRequests(prev => ({
                            ...prev,
                            [typeMatch]: {
                                ...prev[typeMatch],
                                status: 'CONFIRMED',
                                note: payload.new.acknowledgedNote
                            }
                        }));
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [realBookingId, requests]);

    const handleRequest = async (type: RequestType) => {
        if (requests[type].status === 'LOADING' || requests[type].status === 'PENDING' || requests[type].cooldown > 0) return;

        setRequests(prev => ({ ...prev, [type]: { ...prev[type], status: 'LOADING' } }));

        try {
            const res = await fetch('/api/customer/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: realBookingId, accessToken, type }),
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => ({
                    ...prev,
                    [type]: { status: 'PENDING', cooldown: 180, id: data.requestId }
                }));
            } else {
                alert(data.error || 'Failed to send request');
                setRequests(prev => ({ ...prev, [type]: { ...prev[type], status: 'IDLE' } }));
            }
        } catch (err) {
            console.error(err);
            setRequests(prev => ({ ...prev, [type]: { ...prev[type], status: 'IDLE' } }));
        }
    };

    const formatCooldown = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <div className="bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 p-3 rounded-3xl shadow-2xl flex gap-2 pointer-events-auto items-center overflow-x-auto overflow-y-hidden max-w-full hide-scrollbar">
                {(Object.keys(INITIAL_STATE) as RequestType[]).map(type => {
                    const r = requests[type];
                    const isPending = r.status === 'PENDING';
                    const isConfirmed = r.status === 'CONFIRMED';
                    const isCooldown = r.cooldown > 0;
                    const isDisabled = r.status === 'LOADING' || isPending || isCooldown;

                    let bgClass = 'bg-[#0d0d0d] hover:bg-[#2c2c2e] border-white/10 text-white';
                    if (isConfirmed) bgClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
                    else if (isPending) bgClass = 'bg-amber-500/20 border-amber-500/30 text-amber-400 animate-pulse';

                    return (
                        <button
                            key={type}
                            disabled={isDisabled}
                            onClick={() => handleRequest(type)}
                            className={`flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl border transition-all relative ${bgClass} ${isDisabled && !isPending && !isConfirmed ? 'opacity-50 grayscale' : ''}`}
                        >
                            {r.status === 'LOADING' ? (
                                <svg className="animate-spin w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                            ) : (
                                <span className="text-2xl mb-1">{icons[type]}</span>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center px-1">
                                {isConfirmed ? t.CONFIRMED : isPending ? t.PENDING : t[type]}
                            </span>
                            {isCooldown && !isPending && !isConfirmed && (
                                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1c1c1e]">
                                    {formatCooldown(r.cooldown)}
                                </span>
                            )}
                            {isConfirmed && r.note && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 truncate max-w-[120px]">
                                    {r.note}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
