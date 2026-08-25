'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRightLeft, Banknote, CreditCard, DollarSign, QrCode } from 'lucide-react';
import { VND_DENOMINATIONS, USD_INFO, ACCEPTED_CARDS } from '@/lib/paymentConstants';
import { formatCurrency } from '@/components/Menu/utils';

interface PaymentMethodsProps {
    lang: string;
    dict: any;
    selected: string;
    onChange: (methodId: string) => void;
    onInfoContinue?: () => void;
}

const PaymentMethods = ({ lang, dict, selected, onChange, onInfoContinue }: PaymentMethodsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSelect = (id: string) => {
        onChange(id);
        setModalContent(id);
        setShowModal(true);
    };

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setIsClosing(false);
        }, 200);
    };

    const handleInfoContinue = () => {
        if (!onInfoContinue) {
            closeModal();
            return;
        }

        setIsClosing(true);
        setTimeout(() => {
            setShowModal(false);
            setIsClosing(false);
            onInfoContinue();
        }, 200);
    };

    const METHODS = [
        {
            id: 'cash_vnd',
            icon: Banknote,
            label: dict.payment_methods.cash_vnd,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-500'
        },
        {
            id: 'cash_usd',
            icon: DollarSign,
            label: dict.payment_methods.cash_usd,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-500'
        },
        {
            id: 'card',
            icon: CreditCard,
            label: dict.payment_methods.card,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-500'
        },
        {
            id: 'transfer',
            icon: QrCode,
            label: dict.payment_methods.transfer,
            color: 'text-gray-700',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-500'
        },
    ];

    return (
        <div className="bg-[#1c1c1e] p-1 rounded-3xl border border-white/5 overflow-hidden shadow-sm">
            <h2 className="text-[#C9A96E] font-bold uppercase tracking-widest text-xs p-4 pb-2">
                {dict.checkout.payment_method}
            </h2>

            {/* Horizontal Scroll Selector */}
            {/* Horizontal Scroll Selector */}
            <div className="flex overflow-x-auto gap-3 p-4 pt-2 pb-4 hide-scrollbar snap-x">
                {METHODS.map(method => {
                    const isSelected = selected === method.id;
                    return (
                        <button
                            key={method.id}
                            onClick={() => handleSelect(method.id)}
                            className={`flex-none w-[100px] snap-start flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all duration-200 ${isSelected
                                ? `border-[#C9A96E] bg-[#C9A96E]/10 shadow-[0_0_10px_rgba(201,169,110,0.2)]`
                                : 'border-white/5 bg-[#0d0d0d] hover:border-[#C9A96E] hover:bg-white/5'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#C9A96E]' : 'bg-[#1c1c1e]'}`}>
                                <method.icon size={24} className={isSelected ? 'text-black' : 'text-gray-400'} strokeWidth={2.5} />  {/* icon size */}
                            </div>
                            <span className={`text-[11px] font-bold text-center leading-tight px-1 ${isSelected ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                                {method.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* INFO MODAL */}
            {(showModal && mounted) && createPortal(
                <div
                    className={`fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in duration-200'}`}
                    onClick={closeModal}
                >
                    <div
                        className={`bg-[#1c1c1e] w-full max-w-sm max-h-[85vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl border border-white/5 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95 duration-200'}`}
                    >

                        {/* Modal Header */}
                        <div className="p-6 pb-2 text-center relative shrink-0">
                            <button
                                onClick={closeModal}
                                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label={lang === 'vi' ? 'Quay lại chọn phương thức' : 'Back to payment methods'}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <h3 className="text-xl font-bold text-white">
                                {METHODS.find(m => m.id === modalContent)?.label}
                            </h3>
                            {modalContent === 'cash_vnd' && (
                                <p className="text-sm text-gray-500 mt-1">{dict.payment_methods.denominations}</p>
                            )}
                            {modalContent === 'cash_usd' && (
                                <p className="text-sm text-gray-500 mt-1">{dict.payment_methods.exchange_rules}</p>
                            )}
                            {modalContent === 'card' && (
                                <p className="text-sm text-gray-500 mt-1">{dict.payment_methods.cards_desc}</p>
                            )}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar min-h-0">

                            {/* VND Content */}
                            {modalContent === 'cash_vnd' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {VND_DENOMINATIONS.map((denom) => (
                                        <div key={denom.amount} className="flex flex-col items-center gap-1">
                                            <div className="rounded-lg overflow-hidden border border-white/10 shadow-sm aspect-[2/1] w-full relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={denom.imgUrl} alt={formatCurrency(denom.amount)} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">{formatCurrency(denom.amount)} VND</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* USD Content */}
                            {modalContent === 'cash_usd' && (
                                <div className="space-y-4">
                                    <div className="bg-[#0d0d0d] border border-[#C9A96E]/30 rounded-2xl p-4 text-center">
                                        <div className="text-sm text-[#C9A96E] font-bold uppercase mb-1">Exchange Rate</div>
                                        <div className="text-2xl font-black text-[#C9A96E]">1 USD = {formatCurrency(USD_INFO.exchangeRate)} VND</div>
                                    </div>

                                    <div className="bg-[#1c1c1e] border border-blue-500/30 rounded-2xl p-3 flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <ArrowRightLeft size={16} className="text-blue-400" />
                                        </div>
                                        <p className="text-sm text-blue-400 font-medium leading-tight">
                                            {dict.payment_methods.refund_note}
                                        </p>
                                    </div>

                                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={USD_INFO.imgUrl} alt="USD" className="w-full h-auto object-cover" />
                                    </div>
                                </div>
                            )}

                            {/* Card Content */}
                            {modalContent === 'card' && (
                                <div>
                                    <p className="text-center text-sm font-bold text-white mb-4 uppercase tracking-wider">{dict.payment_methods.accepted_cards}</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {ACCEPTED_CARDS.map((card) => (
                                            <div key={card.name} className="flex flex-col items-center gap-2">
                                                <div className="w-full aspect-[4/3] flex items-center justify-center p-2 rounded-xl border border-white/5 shadow-sm bg-white overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={card.img} alt={card.name} className="w-full h-full object-contain mix-blend-multiply" />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 text-center">{card.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Transfer Content */}
                            {modalContent === 'transfer' && (
                                <div className="text-center py-8 text-gray-400">
                                    <QrCode size={64} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-medium">Scan QR Code functionality coming soon.</p>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-[#0d0d0d] shrink-0">
                            <button
                                onClick={handleInfoContinue}
                                className="w-full bg-[#C9A96E] hover:bg-[#b09461] text-black font-bold py-3.5 rounded-xl uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(201,169,110,0.3)]"
                            >
                                {dict.checkout?.continue || dict.payment_methods.understood}
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default PaymentMethods;
