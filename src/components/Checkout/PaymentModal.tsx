'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import PaymentMethods from '@/components/Checkout/PaymentMethods';
import AlertModal from '@/components/Shared/AlertModal';
import VatInvoiceSection, { type VatInvoiceData } from '@/components/Checkout/VatInvoiceSection';
import { getBookingT } from '@/components/Booking/BookingCheckout.i18n';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext: (data: { paymentMethod: string; amountPaid: string; changeDenominations: number[]; vatInvoice?: VatInvoiceData | null }) => void;
    lang: string;
    dict: any;
    totalVND: number;
    totalUSD: number;
    initialVatInvoice?: VatInvoiceData | null; // 5B persist
    
    // Props cho Booking Flow
    isBookingFlow?: boolean;
    isAgreedTerms?: boolean;
    onAgreeTermsChange?: (agreed: boolean) => void;
    bookingReminder?: string;
    termsText?: React.ReactNode;
}

export default function PaymentModal({
    isOpen,
    onClose,
    onNext,
    lang,
    dict,
    totalVND,
    totalUSD,
    initialVatInvoice,
    isBookingFlow,
    isAgreedTerms,
    onAgreeTermsChange,
    bookingReminder,
    termsText
}: PaymentModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // State for payment picking
    const [paymentMethod, setPaymentMethod] = useState('');
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isWarningClosing, setIsWarningClosing] = useState(false);
    const [vatInvoice, setVatInvoice] = useState<VatInvoiceData | null>(initialVatInvoice || null);

    const t = getBookingT(lang);
    const paymentWarning = dict.checkout?.pay_warning || 'Please pay before entering the service room.';

    // Modal Animation logic
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false);
            setIsClosing(false);
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            // reset on real close
            setPaymentMethod('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleConfirmNext = () => {
        console.log('[PaymentModal] handleConfirmNext called. vatInvoice:', JSON.stringify(vatInvoice));
        if (!paymentMethod) {
            setAlertState({
                isOpen: true,
                message: dict.checkout?.alerts?.select_payment || 'Please select a payment method',
                type: 'error'
            });
            return;
        }

        // Validate VAT invoice: if checked and looked up, email + phone are required
        if (vatInvoice && (!vatInvoice.companyEmail?.trim() || !vatInvoice.companyPhone?.trim())) {
            setAlertState({
                isOpen: true,
                message: dict.vat_invoice?.required_fields || (dict.vat_invoice ? 'Vui lòng nhập Email và SĐT công ty' : 'Please enter company Email and Phone'),
                type: 'error'
            });
            return;
        }

        // Validate Terms (nếu là luồng Đặt lịch)
        if (isBookingFlow && !isAgreedTerms) {
            setAlertState({
                isOpen: true,
                message: t.error_agree_terms || 'Vui lòng đồng ý với Điều Khoản & Chính Sách',
                type: 'error'
            });
            return;
        }
        
        // Pass data up to Checkout Page state
        console.log('[PaymentModal] Calling onNext with vatInvoice:', vatInvoice ? 'HAS DATA' : 'NULL');
        onNext({
            paymentMethod,
            amountPaid: '',
            changeDenominations: [],
            vatInvoice,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-full max-w-lg bg-[#1c1c1e] border border-white/5 md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col
                transform transition-transform duration-300
                pb-safe max-h-[90vh]
                ${(isClosing || !isVisible) ? 'translate-y-full md:scale-95 md:translate-y-0 md:opacity-0' : 'translate-y-0 md:scale-100 md:opacity-100'}
            `}>
                
                {/* Header handle bar (Mobile) */}
                <div className="w-full flex justify-center pt-3 pb-2 md:hidden bg-[#1c1c1e] rounded-t-3xl">
                    <div className="w-12 h-1.5 bg-[#3f3f46] rounded-full"></div>
                </div>

                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1c1c1e]">
                    <h2 className="text-xl font-bold text-[#C9A96E] uppercase tracking-widest">{dict.checkout?.payment_method_title || (lang === 'vi' ? 'Thanh toán' : 'Payment')}</h2>
                    <button 
                        onClick={handleClose}
                        className="w-8 h-8 rounded-full bg-[#0d0d0d] flex items-center justify-center text-gray-400 hover:text-[#C9A96E] hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* Pay Warning Banner */}
                    <div
                        className="relative overflow-hidden rounded-2xl border border-[#E8C97A]/35 bg-gradient-to-br from-[#2a1d0c] via-[#15110a] to-[#080808] p-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.18)]"
                        onClick={() => setShowWarningModal(true)}
                    >
                        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#FFF8E1]/70 to-transparent" />
                        <div className="flex items-center justify-center gap-2">
                            <AlertCircle size={20} className="shrink-0 text-red-500 animate-payment-warning-blink" />
                            <span className="text-sm font-black uppercase tracking-[0.16em] text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.30)] animate-payment-warning-blink">
                                {paymentWarning}
                            </span>
                        </div>
                    </div>

                    {isBookingFlow && bookingReminder && (
                        <div className="bg-[#e6c487]/10 border border-[#e6c487]/30 rounded-xl p-4 text-center mb-2">
                            <p className="text-[#e6c487] text-xs font-medium leading-relaxed">
                                {bookingReminder}
                            </p>
                        </div>
                    )}

                    {/* VAT Invoice Section */}
                    <div className="bg-[#0d0d0d] p-4 rounded-2xl border border-white/5">
                        <VatInvoiceSection
                            lang={lang}
                            dict={dict}
                            invoiceData={vatInvoice}
                            onInvoiceChange={setVatInvoice}
                        />
                    </div>

                    <PaymentMethods
                        lang={lang}
                        dict={dict}
                        selected={paymentMethod}
                        onChange={setPaymentMethod}
                        onInfoContinue={handleConfirmNext}
                    />
                </div>

                {/* Footer Action (Terms Checkbox & Submit Button) */}
                <div className="p-4 bg-[#1c1c1e] border-t border-white/10 space-y-4">
                    {/* Terms Checkbox for Booking Flow */}
                    {isBookingFlow && (
                        <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onAgreeTermsChange && onAgreeTermsChange(!isAgreedTerms)}
                                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                        isAgreedTerms ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600'
                                    }`}
                                >
                                    {isAgreedTerms && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </button>
                                <span className="text-sm text-gray-400">
                                    {termsText}
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Alert Modal Overlay */}
            <AlertModal
                isOpen={alertState.isOpen}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                lang={lang}
            />

            {/* Payment Regulation Popup */}
            {showWarningModal && (
                <div
                    className={`fixed inset-0 z-[140] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 ${isWarningClosing ? 'animate-out fade-out' : 'animate-in fade-in duration-200'}`}
                    onClick={() => {
                        setIsWarningClosing(true);
                        setTimeout(() => { setShowWarningModal(false); setIsWarningClosing(false); }, 200);
                    }}
                >
                    <div
                        className={`bg-[#1c1c1e] w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/5 p-6 flex flex-col items-center text-center gap-4 ${isWarningClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95 duration-200'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center mb-1">
                            <AlertCircle size={32} className="text-[#C9A96E]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#C9A96E] leading-tight">
                            {dict.payment_methods?.payment_regulation?.title || "Payment Regulation"}
                        </h3>
                        <p className="text-gray-400 text-[15px] leading-relaxed">
                            {dict.payment_methods?.payment_regulation?.content || paymentWarning}
                        </p>
                        <button
                            onClick={() => {
                                setIsWarningClosing(true);
                                setTimeout(() => { setShowWarningModal(false); setIsWarningClosing(false); }, 200);
                            }}
                            className="w-full bg-[#C9A96E] hover:bg-[#b09461] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider transition-colors shadow-lg shadow-[#C9A96E]/20 mt-2"
                        >
                            {dict.payment_methods?.payment_regulation?.btn || "UNDERSTOOD"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
