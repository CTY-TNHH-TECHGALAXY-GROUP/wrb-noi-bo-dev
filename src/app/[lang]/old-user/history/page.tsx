"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDictionary } from '@/lib/dictionaries';
import { formatCurrency } from '@/components/Menu/utils';
import { useMenuData } from '@/components/Menu/MenuContext';
import { LoginGate } from '@/components/Auth/LoginGate';

// 🔧 UI CONFIGURATION
const HISTORY_CONFIG = {
    ITEM_BORDER_RADIUS: 'rounded-3xl',
    BOTTOM_BAR_PADDING: 'pb-[calc(1rem+env(safe-area-inset-bottom))]',
    LIST_BOTTOM_PADDING: 'pb-28',
    HEADER_BG: 'bg-[#000000]/90',
    ITEM_BG: 'bg-[#131722]',
    ITEM_BORDER: 'border-[#1f2430]',
};

const POPUP_I18N: Record<string, any> = {
    vi: {
        title: "Chọn Hình Thức Rebook",
        desc: "Bạn đang thực hiện đặt lại đơn này để làm tại tiệm hay đặt trước online?",
        walkin: "Tại Tiệm",
        booking: "Booking"
    },
    en: {
        title: "Select Rebook Method",
        desc: "Are you rebooking this order for a Walk-in or Advance Booking?",
        walkin: "Walk-in",
        booking: "Booking"
    },
    cn: {
        title: "选择重新预订方式",
        desc: "您是作为到店订单还是提前预约来重新预订此订单？",
        walkin: "到店下单",
        booking: "预约"
    },
    jp: {
        title: "再予約方法の選択",
        desc: "この注文をご来店として再予約しますか、それとも事前予約として再予約しますか？",
        walkin: "ご来店",
        booking: "予約"
    },
    kr: {
        title: "재예약 방법 선택",
        desc: "이 주문을 현장 주문으로 재예약하시겠습니까, 아니면 사전 예약으로 하시겠습니까?",
        walkin: "현장 주문",
        booking: "예약"
    }
};

export default function HistoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const [lang, setLang] = useState<string>('en');
    const [dict, setDict] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unrated'>('all');
    const [actionContext, setActionContext] = useState<{ action: 'rebook' | 'modify' | 'new', order?: any } | null>(null);
    const router = useRouter();
    const { addToCart, clearCart, services } = useMenuData();

    // Check if user has auth info in localStorage
    const checkAuth = useCallback(() => {
        const email = localStorage.getItem('currentUserEmail');
        const phone = localStorage.getItem('currentUserPhone');
        return !!(email || phone);
    }, []);

    // Fetch orders using email and/or phone
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const email = localStorage.getItem('currentUserEmail');
            const phone = localStorage.getItem('currentUserPhone');

            const queryParams = new URLSearchParams();
            if (email) queryParams.set('email', email);
            if (phone) queryParams.set('phone', phone);

            const res = await fetch(`/api/orders?${queryParams.toString()}`);
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            } else {
                console.error("Failed to fetch orders:", data.error);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const p = await params;
            setLang(p.lang);
            const d = getDictionary(p.lang);
            setDict(d);

            // Check auth and fetch if authenticated
            if (checkAuth()) {
                setIsAuthenticated(true);
                await fetchOrders();
            } else {
                setLoading(false);
            }
        };

        init();
    }, [params, checkAuth, fetchOrders]);

    // Handle successful login from LoginGate
    const handleLoginSuccess = async (info: { email?: string; phone?: string; fullName?: string }) => {
        setIsAuthenticated(true);
        await fetchOrders();
    };

    // Helper to Restore Cart
    const restoreCart = (order: any) => {
        clearCart();
        // Fix: Check length because [] is truthy
        const itemsToRestore = (order.raw_items && order.raw_items.length > 0)
            ? order.raw_items
            : order.items;

        console.log("Restoring Cart. Available Services:", services.length);
        console.log("Items to restore:", itemsToRestore);
        
        let detectedMenuType = 'standard';

        itemsToRestore.forEach((item: any) => {
            // 1. Try to find service by ID first
            let service = services.find((s: any) => String(s.id).toLowerCase() === String(item.id).toLowerCase());

            // 2. Fallback: Find by Name (exact match EN or VN) if ID not found
            if (!service && item.name) {
                const cleanName = item.name.trim().toLowerCase();
                service = services.find((s: any) =>
                    s.names?.en?.toLowerCase() === cleanName ||
                    s.names?.vn?.toLowerCase() === cleanName
                );
            }

            console.log(`Checking item ${item.id || item.name} -> Found?`, !!service);

            if (service) {
                if (service.menuType === 'vip' || item.itemType === 'vip') detectedMenuType = 'vip';
                // 3. Construct Options
                // If raw_items (has .options), use directly.
                // If processedItems (has flat fields strength/therapist in VN/EN), map back to codes.
                let options = item.options ? { ...item.options } : {};

                // Reverse map helper for values that might be stored in Vietnamese
                const mapVal = (val: string): any => {
                    if (!val) return undefined;
                    const v = val.toLowerCase();
                    if (v.includes('vừa') || v === 'medium') return 'medium';
                    if (v.includes('lẹ') || v.includes('nhẹ') || v === 'light') return 'light'; 
                    if (v.includes('mạnh') || v === 'strong') return 'strong';

                    if (v.includes('nam') || v === 'male') return 'male';
                    if (v.includes('nữ') || v === 'female') return 'female';
                    if (v.includes('ngẫu nhiên') || v === 'random') return 'random';
                    return val;
                };

                const mapBodyPart = (val: string): string => {
                    if (!val) return val;
                    const v = val.toLowerCase();
                    if (v.includes('đầu') || v === 'head') return 'HEAD';
                    if (v.includes('cổ') || v === 'neck') return 'NECK';
                    if (v.includes('vai') || v === 'shoulder') return 'SHOULDER';
                    if (v.includes('tay') || v === 'arm') return 'ARM';
                    if (v.includes('lưng') || v === 'back') return 'BACK';
                    if (v.includes('thắt lưng') || v === 'waist') return 'BACK'; 
                    if (v.includes('đùi') || v === 'thigh') return 'THIGH';
                    if (v.includes('bắp chân') || v === 'calf') return 'CALF';
                    if (v.includes('bàn chân') || v === 'foot') return 'FOOT';
                    return val;
                };

                // Map strength and therapist back to standard keys regardless
                if (options.strength) options.strength = mapVal(options.strength);
                if (options.therapist) options.therapist = mapVal(options.therapist);

                // Handle legacy flat structure or mapped structure for focus/avoid
                if (options.focus || options.avoid) {
                    options.bodyParts = options.bodyParts || { focus: [], avoid: [] };
                    if (options.focus && Array.isArray(options.focus)) {
                        options.bodyParts.focus = options.focus.map(mapBodyPart);
                    }
                    if (options.avoid && Array.isArray(options.avoid)) {
                        options.bodyParts.avoid = options.avoid.map(mapBodyPart);
                    }
                } else if (options.bodyParts) {
                    if (options.bodyParts.focus) options.bodyParts.focus = options.bodyParts.focus.map(mapBodyPart);
                    if (options.bodyParts.avoid) options.bodyParts.avoid = options.bodyParts.avoid.map(mapBodyPart);
                }

                if (!item.options) {
                    options = {
                        strength: mapVal(item.strength),
                        therapist: mapVal(item.therapist || item.therapist_name), 
                    };
                }

                // Gán mã KTV từ đơn hàng nếu đây là đơn VIP
                if (order.technicianCode) {
                    options.vipStaffId = options.vipStaffId || order.technicianCode;
                }

                const isVip = service.menuType === 'vip' || item.itemType === 'vip' || String(item.id).startsWith('NHP') || String(item.id).startsWith('NHS0800');
                if (isVip) detectedMenuType = 'vip';

                // Chép đè giá trị service bằng giá tiền thực tế khách đã thanh toán trong lịch sử
                // Vì đơn VIP được lưu ngầm dưới mã Combo King, nếu không đè giá sẽ bị lấy giá gốc của Combo King.
                const serviceToRestore = {
                    ...service,
                    priceVND: item.price !== undefined ? item.price : service.priceVND,
                    priceUSD: item.price !== undefined ? Math.round(item.price / 25000) : service.priceUSD,
                    ...(isVip ? {
                        itemType: 'vip',
                        vipStaffId: options.vipStaffId,
                        vipDuration: options.vipDuration || service.timeValue,
                        vipDisplayName: options.displayName,
                        vipCustomerNotes: options.customerNotes,
                        vipSkillIds: options.selectedSkills
                    } : {})
                };

                addToCart(serviceToRestore, item.qty || 1, options);
            } else {
                console.warn(`Service ${item.id || item.name} not found in current menu`);
            }
        });
        
        return detectedMenuType;
    };

    const handleCreateNew = () => {
        setActionContext({ action: 'new' });
    };

    const handleModify = (order: any) => {
        setActionContext({ action: 'modify', order });
    };

    const handleRebook = (order: any) => {
        setActionContext({ action: 'rebook', order });
    };

    const handleConfirmAction = (source: 'walk-in' | 'booking') => {
        if (!actionContext) return;
        const { action, order } = actionContext;
        setActionContext(null);

        setTimeout(() => {
            if (action === 'new') {
                clearCart();
                if (source === 'walk-in') {
                    router.push(`/${lang}/old-user/select-menu`);
                } else {
                    router.push(`/${lang}/old-user/booking/select-menu`);
                }
            } else if (action === 'modify') {
                if (!services || services.length === 0) return;
                const menuType = restoreCart(order);
                if (source === 'walk-in') {
                    router.push(`/${lang}/old-user/${menuType}/menu?cart=open`);
                } else {
                    router.push(`/${lang}/old-user/booking/${menuType}/menu?cart=open`);
                }
            } else if (action === 'rebook') {
                if (!services || services.length === 0 || !order) return;
                const menuType = restoreCart(order);
                
                if (source === 'walk-in') {
                    // Rebook walk-in: đã có giỏ hàng → nhảy thẳng checkout
                    router.push(`/${lang}/old-user/${menuType}/checkout`);
                } else {
                    // Rebook booking: đã có giỏ hàng → nhảy thẳng checkout
                    router.push(`/${lang}/old-user/booking/${menuType}/checkout`);
                }
            }
        }, 100);
    };

    if (!dict) return <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white"></div>;

    // 🔐 Show LoginGate if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans">
                {/* Header */}
                <div className={`flex items-center p-4 sticky top-0 ${HISTORY_CONFIG.HEADER_BG} backdrop-blur-md z-20 border-b border-white/5`}>
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-[#1f2430] rounded-full flex items-center justify-center hover:bg-[#2a3040] transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <h1 className="flex-1 text-center font-bold text-lg text-white pr-10">
                        {dict.history.page_title}
                    </h1>
                </div>
                <LoginGate lang={lang} onSuccess={handleLoginSuccess} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans">
            {/* Header */}
            <div className={`flex items-center p-4 sticky top-0 ${HISTORY_CONFIG.HEADER_BG} backdrop-blur-md z-20 border-b border-white/5`}>
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-[#1f2430] rounded-full flex items-center justify-center hover:bg-[#2a3040] transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <h1 className="flex-1 text-center font-bold text-lg text-white pr-10">
                    {dict.history.page_title}
                </h1>
            </div>

            {/* List */}
            <main className={`flex-1 p-4 space-y-4 overflow-y-auto ${HISTORY_CONFIG.LIST_BOTTOM_PADDING}`}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-20 text-gray-500 gap-2">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="text-sm">{dict.history.loading_visits}</span>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center pt-20 text-gray-500 italic">
                        {dict.history.no_visits}
                    </div>

                ) : (
                    orders.map((visit) => (
                        <div key={visit.id} className={`${HISTORY_CONFIG.ITEM_BG} ${HISTORY_CONFIG.ITEM_BORDER_RADIUS} p-5 border ${HISTORY_CONFIG.ITEM_BORDER}`}>
                            {/* Header Row: Date + Time | ID ---------- Price */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col text-sm">
                                    <span className="font-bold text-gray-300">{visit.date}</span>
                                    {visit.timeBooking && (
                                        <span className="text-purple-400 text-xs mt-0.5">🕐 Hẹn: {visit.timeBooking}</span>
                                    )}
                                    <span className="text-gray-600 text-xs mt-0.5">#{visit.id}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-[#D4AF37] text-lg">
                                        {formatCurrency(visit.total)} VND
                                    </div>
                                    {/* Overall Rating Stars */}
                                    {visit.rating && visit.rating > 0 && (
                                        <div className="flex items-center justify-end gap-0.5 mt-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} className={`w-3.5 h-3.5 ${star <= visit.rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items with per-item staff + rating */}
                            <div className="space-y-3 mb-4 mt-3">
                                {visit.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white/[0.03] rounded-xl px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-[#D4AF37] font-bold text-xs flex-shrink-0">#{idx + 1}</span>
                                                <span className="font-bold text-white truncate">{item.names?.[lang] || item.name || `Dịch vụ ${item.id}`}</span>
                                                {item.duration && (
                                                    <span className="text-gray-500 text-xs flex-shrink-0">{item.duration}p</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {item.qty > 1 && <span className="text-gray-500 text-xs">x{item.qty}</span>}
                                                <span className="text-gray-400 text-xs font-medium">{formatCurrency(item.price)} đ</span>
                                            </div>
                                        </div>

                                        {/* Per-item staff names */}
                                        {item.staffNames && item.staffNames.length > 0 && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
                                                <svg className="w-3 h-3 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                <span>{item.staffNames.join(', ')}</span>
                                            </div>
                                        )}

                                        {/* Per-item rating (overall) */}
                                        {item.itemRating && item.itemRating > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg key={star} className={`w-3 h-3 ${star <= item.itemRating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                        )}

                                        {/* Per-KTV individual ratings */}
                                        {item.ktvRatings && item.ktvRatings.length > 0 && (
                                            <div className="mt-1.5 space-y-1">
                                                {item.ktvRatings.map((ktv: any) => (
                                                    <div key={ktv.code} className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-400">{ktv.name}</span>
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <svg key={star} className={`w-2.5 h-2.5 ${star <= ktv.rating ? 'text-yellow-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Per-item feedback text */}
                                        {item.itemFeedback && (
                                            <p className="text-xs text-gray-500 italic mt-1.5 leading-relaxed">"{item.itemFeedback}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Staff Info (booking-level, legacy) */}
                            {(visit.staffName || visit.technicianCode) && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 border-t border-white/5 pt-3">
                                    <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <span className="font-semibold text-gray-300">{visit.staffName || visit.technicianCode}</span>
                                </div>
                            )}

                            {/* Note */}
                            {visit.note && (
                                <div className="text-xs text-gray-500 italic mb-3 border-t border-white/5 pt-2">
                                    📝 {dict.history.note_label}: <span className="text-gray-400">{visit.note}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-4">
                                {visit.status === 'DONE' ? (
                                    <>
                                        <button
                                            onClick={() => handleModify(visit)}
                                            className="flex-1 bg-[#252a37] hover:bg-[#2f3545] text-gray-300 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {dict.history.modify_btn}
                                        </button>
                                        <button
                                            onClick={() => handleRebook(visit)}
                                            className="flex-1 bg-[#B88700] hover:bg-[#D4AF37] text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-900/20"
                                        >
                                            <RefreshCw size={16} strokeWidth={3} />
                                            {dict.history.rebook_btn}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {['NEW', 'PREPARING', 'IN_PROGRESS'].includes(visit.status) ? (
                                            <button
                                                onClick={() => router.push(`/${lang}/journey/${visit.accessToken || visit.id}`)}
                                                className="flex-1 bg-[#252a37] hover:bg-[#2f3545] text-gray-300 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <ArrowLeft size={16} />
                                                {dict.history.resume_journey_btn}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => router.push(`/${lang}/journey/${visit.accessToken || visit.id}`)}
                                                className="flex-1 bg-[#B88700] hover:bg-[#D4AF37] text-black font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-900/20"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                                {dict.history.feedback_btn}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Bottom Button */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 ${HISTORY_CONFIG.BOTTOM_BAR_PADDING} bg-gradient-to-t from-black via-black/90 to-transparent z-20`}>
                <button
                    onClick={handleCreateNew}
                    className="w-full bg-[#1f2430] hover:bg-[#2a3040] border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all active:scale-[0.98]"
                >
                    <Plus size={20} />
                    {dict.history.create_new_btn}
                </button>
            </div>

            {/* Action Source Modal */}
            <AnimatePresence>
                {actionContext && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setActionContext(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-[#1c1c1e] rounded-3xl p-6 shadow-2xl border border-white/10"
                        >
                            <h3 className="text-xl font-bold text-white text-center mb-2">{(POPUP_I18N[lang] || POPUP_I18N['en']).title}</h3>
                            <p className="text-sm text-gray-400 text-center mb-6">{(POPUP_I18N[lang] || POPUP_I18N['en']).desc}</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleConfirmAction('walk-in')}
                                    className="py-3 px-4 bg-[#C9A96E] hover:bg-[#b89a64] text-white font-bold rounded-xl transition-colors text-center"
                                >
                                    {(POPUP_I18N[lang] || POPUP_I18N['en']).walkin}
                                </button>
                                <button
                                    onClick={() => handleConfirmAction('booking')}
                                    className="py-3 px-4 bg-transparent border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 font-bold rounded-xl transition-colors text-center"
                                >
                                    {(POPUP_I18N[lang] || POPUP_I18N['en']).booking}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
