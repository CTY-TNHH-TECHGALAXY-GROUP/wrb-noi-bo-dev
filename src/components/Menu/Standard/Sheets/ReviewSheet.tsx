/*
 * File: Standard/Sheets/ReviewSheet.tsx
 * Chức năng: Popup xem lại và chỉnh sửa một món đơn lẻ.
 * Logic chi tiết:
 * - Load số lượng hiện tại của món từ Cart.
 * - Cho phép tăng/giảm số lượng hoặc xóa hẳn (Remove).
 * - Gọi callback updateCart và tự động đóng Sheet sau khi lưu.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus } from 'lucide-react';
import { Service, CartState } from '../../types'; // Dùng đường dẫn tương đối
import { formatCurrency } from '../../utils';

interface ReviewSheetProps {
    service: Service; // Nhận vào 1 món cụ thể (VD: Aroma Oil 60')
    cart: Record<string, number>;
    isOpen: boolean;
    lang: string;
    onClose: () => void;
    onUpdateCart: (id: string, quantity: number) => void;
}

export default function ReviewSheet({ service, cart, isOpen, lang, onClose, onUpdateCart }: ReviewSheetProps) {
    const [qty, setQty] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    // Khi mở lên, lấy số lượng hiện tại trong giỏ đổ vào state
    useEffect(() => {
        if (isOpen && service) {
            setQty(cart[service.id] || 0);
            setIsClosing(false);
        }
    }, [isOpen, service, cart]);

    if (!service || !isOpen) return null;

    // Xử lý đóng có animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    // Xử lý lưu thay đổi
    const handleSave = () => {
        onUpdateCart(service.id, qty);
        // Lưu ý: handleClose sẽ được gọi bên index.tsx hoặc gọi ở đây tùy logic
        // Ở đây mình để index.tsx quyết định đóng sau khi update
        handleClose(); // Tự đóng sau khi lưu (Vì index.tsx không còn tự đóng nữa)
    };

    // Lấy tên/mô tả
    const name = service.names[lang as keyof typeof service.names] || service.names['en'];

    return (
        <>
            {/* 1. Màn đen mờ (Backdrop) */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* 2. Nội dung bảng (Sheet Content) */}
            <div
                className={`
          responsive-sheet fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-50 shadow-2xl
          transform transition-transform duration-300 ease-out pb-safe
          ${isClosing ? 'translate-y-full' : 'translate-y-0'}
        `}
            >
                {/* Header: Nút Xóa & Đóng */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    {/* Nút Xóa nhanh */}
                    <button
                        onClick={() => setQty(0)}
                        className="text-red-400 flex items-center gap-1 text-sm font-medium active:scale-95 transition-transform px-2 py-1 rounded hover:bg-red-500/10"
                    >
                        <Trash2 size={16} />
                        <span>Remove</span>
                    </button>

                    {/* Thanh nắm kéo (trang trí) */}
                    <div className="w-12 h-1.5 bg-gray-600 rounded-full opacity-30 absolute left-1/2 -translate-x-1/2 top-3"></div>

                    {/* Nút Đóng */}
                    <button onClick={handleClose} className="w-8 h-8 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body: Thông tin món */}
                <div className="p-5">
                    <div className="flex gap-4 mb-6">
                        {/* Ảnh nhỏ */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#1c1c1e] shrink-0 border border-gray-600 shadow-sm">
                            <img
                                src={service.img}
                                className="w-full h-full object-cover"
                                alt={name}
                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=SPA')}
                            />
                        </div>
                        {/* Tên & Giá */}
                        <div className="flex-1 flex flex-col justify-center">
                            <h2 className="text-xl font-bold text-white leading-tight mb-1 font-luxury">{name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-300 border border-gray-600">
                                    {service.timeValue} mins
                                </span>
                                <span className="text-[#C9A96E] font-mono font-bold text-lg">
                                    {formatCurrency(service.priceVND)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bộ điều khiển số lượng */}
                    <div className="bg-[#1c1c1e]/50 rounded-2xl p-4 flex items-center justify-between border border-gray-700 mb-6">
                        <button
                            onClick={() => setQty(q => Math.max(0, q - 1))}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${qty === 0 ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-gray-700 text-white active:scale-90 hover:bg-gray-600'}`}
                        >
                            {qty === 0 ? <Trash2 size={20} /> : <Minus size={20} />}
                        </button>

                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white font-mono">{qty}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Quantity</span>
                        </div>

                        <button
                            onClick={() => setQty(q => q + 1)}
                            className="w-12 h-12 rounded-xl bg-[#C9A96E] text-white flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-[#C9A96E]/20 hover:bg-[#dfc599]"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Nút Xác nhận thay đổi */}
                    <button
                        onClick={handleSave}
                        className={`
                    w-full py-4 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider text-sm mb-2 flex items-center justify-center gap-2
                    ${qty === 0
                                ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/20'
                                : 'bg-white text-black hover:bg-gray-200'
                            }
                `}
                    >
                        {qty === 0 ? (
                            <>
                                <Trash2 size={18} /> Confirm Remove
                            </>
                        ) : (
                            <>
                                Update Cart <span className="opacity-40">|</span> {formatCurrency(service.priceVND * qty)}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
