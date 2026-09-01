'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Copy,
    Check,
    Edit3,
    Trash2,
    X,
    Maximize2,
    Minimize2,
    Send,
    BookOpen,
    Globe,
    Languages,
    Sparkles,
} from 'lucide-react';
import {
    SupportedLanguage,
    SUPPORTED_LANGUAGES,
    TranslationMessage,
    LanguageMeta,
} from '@/types/translation';
import { DEFAULT_TRANSLATION_TERMS } from '@/constants/translationTerms';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

export default function FloatingTranslator() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [customerLang, setCustomerLang] = useState<LanguageMeta>(SUPPORTED_LANGUAGES[0]); // English default
    const [receptionistLang] = useState<LanguageMeta>(
        SUPPORTED_LANGUAGES.find((l) => l.code === 'vi') || SUPPORTED_LANGUAGES[7]
    );

    const [messages, setMessages] = useState<TranslationMessage[]>([]);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [activeSpeaker, setActiveSpeaker] = useState<'customer' | 'receptionist' | null>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isDictModalOpen, setIsDictModalOpen] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Text inputs for fallback
    const [customerText, setCustomerText] = useState('');
    const [receptionistText, setReceptionistText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    // Editing message
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editText, setEditText] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const conversationIdRef = useRef<string>('');

    useEffect(() => {
        setMounted(true);
        conversationIdRef.current =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `conv-${Date.now()}`;
    }, []);

    const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis();

    // Scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTranslating]);

    // Handle speech recognition result
    const handleSpeechResult = (transcript: string, isFinal: boolean) => {
        if (!activeSpeaker) return;
        if (activeSpeaker === 'customer') {
            setCustomerText(transcript);
        } else {
            setReceptionistText(transcript);
        }
    };

    const handleSpeechError = (err: string) => {
        console.warn('[FloatingTranslator] Speech error:', err);
    };

    const {
        state: speechState,
        startListening,
        stopListening,
        transcript: liveTranscript,
    } = useSpeechRecognition({
        onResult: handleSpeechResult,
        onError: handleSpeechError,
    });

    // Start Push-To-Talk
    const handlePushToTalkStart = (speaker: 'customer' | 'receptionist') => {
        stopSpeech();
        setActiveSpeaker(speaker);
        const langCode =
            speaker === 'customer' ? customerLang.speechCode : receptionistLang.speechCode;
        startListening(langCode);
    };

    // End Push-To-Talk and trigger translation
    const handlePushToTalkEnd = async () => {
        if (!activeSpeaker) return;
        const currentSpeaker = activeSpeaker;
        const durationMs = stopListening();
        setActiveSpeaker(null);

        const textToTranslate =
            currentSpeaker === 'customer' ? customerText.trim() : receptionistText.trim();

        if (textToTranslate) {
            await executeTranslation({
                text: textToTranslate,
                sender: currentSpeaker,
                durationMs,
            });

            if (currentSpeaker === 'customer') {
                setCustomerText('');
            } else {
                setReceptionistText('');
            }
        }
    };

    // Execute translation via Backend Next.js API
    const executeTranslation = async ({
        text,
        sender,
        durationMs = 0,
    }: {
        text: string;
        sender: 'customer' | 'receptionist';
        durationMs?: number;
    }) => {
        if (!text.trim()) return;

        const sourceLang = sender === 'customer' ? customerLang.code : receptionistLang.code;
        const targetLang = sender === 'customer' ? receptionistLang.code : customerLang.code;
        const targetSpeechCode =
            sender === 'customer' ? receptionistLang.speechCode : customerLang.speechCode;

        setIsTranslating(true);

        // Optimistic message placeholder
        const tempMsg: TranslationMessage = {
            sender,
            source_language: sourceLang,
            target_language: targetLang,
            original_text: text,
            translated_text: '...',
            input_type: durationMs > 0 ? 'voice' : 'text',
            speech_duration_ms: durationMs,
            status: 'sending',
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMsg]);

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    sourceLang,
                    targetLang,
                    sender,
                    conversationId: conversationIdRef.current,
                    inputType: durationMs > 0 ? 'voice' : 'text',
                    speechDurationMs: durationMs,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const translated = data.data?.translatedText || text;

                setMessages((prev) => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0) {
                        next[lastIdx] = {
                            ...next[lastIdx],
                            translated_text: translated,
                            status: 'success',
                        };
                    }
                    return next;
                });

                // Auto speak if enabled
                if (autoSpeak && translated) {
                    speak(translated, targetSpeechCode);
                }
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            console.error('[Translation API Error]:', error);
            setMessages((prev) => {
                const next = [...prev];
                const lastIdx = next.length - 1;
                if (lastIdx >= 0) {
                    next[lastIdx] = {
                        ...next[lastIdx],
                        translated_text: '(Lỗi kết nối dịch thuật, vui lòng thử lại)',
                        status: 'error',
                    };
                }
                return next;
            });
        } finally {
            setIsTranslating(false);
        }
    };

    // Replay audio for a message
    const handleReplay = (msg: TranslationMessage) => {
        const speechCode =
            msg.sender === 'customer' ? receptionistLang.speechCode : customerLang.speechCode;
        speak(msg.translated_text, speechCode);
    };

    // Copy text
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Start editing message
    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditText(messages[index].original_text);
    };

    // Save edited message and re-translate
    const handleSaveEdit = async (index: number) => {
        const msg = messages[index];
        if (!editText.trim() || editText === msg.original_text) {
            setEditingIndex(null);
            return;
        }

        const sender = msg.sender;
        const sourceLang = msg.source_language;
        const targetLang = msg.target_language;
        const targetSpeechCode =
            sender === 'customer' ? receptionistLang.speechCode : customerLang.speechCode;

        setEditingIndex(null);
        setIsTranslating(true);

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: editText,
                    sourceLang,
                    targetLang,
                    sender,
                    conversationId: conversationIdRef.current,
                    inputType: 'text',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const translated = data.data?.translatedText || editText;

                setMessages((prev) => {
                    const next = [...prev];
                    next[index] = {
                        ...next[index],
                        original_text: editText,
                        translated_text: translated,
                        status: 'success',
                    };
                    return next;
                });

                if (autoSpeak && translated) {
                    speak(translated, targetSpeechCode);
                }
            }
        } catch (e) {
            console.error('[Edit Translate Error]:', e);
        } finally {
            setIsTranslating(false);
        }
    };

    // Clear session
    const handleClearSession = () => {
        if (confirm('Bạn có chắc muốn xóa lịch sử cuộc trò chuyện hiện tại?')) {
            setMessages([]);
            conversationIdRef.current =
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `conv-${Date.now()}`;
        }
    };

    if (!mounted) return null;

    return (
        <>
            {/* 1. FLOATING BUTTON TRIGGER */}
            {!isOpen && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2"
                >
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#1c1c1e] to-[#2c2c2e] hover:from-[#252528] hover:to-[#3a3a3d] border border-[#e6c487]/40 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all active:scale-95"
                    >
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#e6c487]/20 border border-[#e6c487]/50 text-[#e6c487]">
                            <Languages size={18} className="animate-pulse" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-black tracking-wider uppercase text-[#e6c487] flex items-center gap-1">
                                Phiên Dịch Trực Tiếp
                                <Sparkles size={11} className="text-amber-400" />
                            </span>
                            <span className="text-[10px] text-gray-300 font-medium">
                                Lễ Tân ↔ {customerLang.name}
                            </span>
                        </div>
                    </button>
                </motion.div>
            )}

            {/* 2. LIVE INTERPRETER MODAL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`fixed z-[9999] bg-[#121214]/98 border border-[#e6c487]/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden flex flex-col transition-all duration-300 ${
                            isExpanded
                                ? 'inset-3 sm:inset-6 rounded-3xl'
                                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[640px] max-h-[90vh] rounded-3xl'
                        }`}
                    >
                        {/* HEADER */}
                        <div className="p-4 border-b border-white/10 bg-[#1a1a1d] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-2xl bg-[#e6c487]/20 border border-[#e6c487]/40 flex items-center justify-center text-[#e6c487]">
                                    <Languages size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-[#e6c487] flex items-center gap-1.5">
                                        Live Voice Interpreter
                                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase font-bold">
                                            Google Cloud
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-gray-400">
                                        Lễ tân 🇻🇳 ↔ Khách {customerLang.flag} {customerLang.name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-gray-400">
                                {/* Terminology Dictionary button */}
                                <button
                                    onClick={() => setIsDictModalOpen(true)}
                                    title="Từ điển chuyên ngành Spa"
                                    className="p-2 hover:bg-white/10 hover:text-[#e6c487] rounded-xl transition-colors text-xs flex items-center gap-1"
                                >
                                    <BookOpen size={16} />
                                </button>

                                {/* Auto-Speak Toggle */}
                                <button
                                    onClick={() => setAutoSpeak(!autoSpeak)}
                                    title={autoSpeak ? 'Tắt tự động đọc loa' : 'Bật tự động đọc loa'}
                                    className={`p-2 rounded-xl transition-colors ${
                                        autoSpeak
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : 'text-gray-500 hover:bg-white/5'
                                    }`}
                                >
                                    {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                </button>

                                {/* Clear Session */}
                                <button
                                    onClick={handleClearSession}
                                    title="Xóa hội thoại"
                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Maximize / Minimize */}
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 hover:bg-white/10 hover:text-white rounded-xl transition-colors hidden sm:block"
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>

                                {/* Close */}
                                <button
                                    onClick={() => {
                                        stopSpeech();
                                        setIsOpen(false);
                                    }}
                                    className="p-2 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* CUSTOMER LANGUAGE SELECTOR BAR */}
                        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium">Ngôn ngữ của khách:</span>
                            <div className="relative">
                                <button
                                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-all"
                                >
                                    <span className="text-sm">{customerLang.flag}</span>
                                    <span>{customerLang.nativeName}</span>
                                    <Globe size={12} className="text-gray-400 ml-1" />
                                </button>

                                {/* Language dropdown */}
                                <AnimatePresence>
                                    {isLangMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-[#1f1f23] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 grid grid-cols-1 gap-1"
                                        >
                                            {SUPPORTED_LANGUAGES.filter((l) => l.code !== 'vi').map(
                                                (l) => (
                                                    <button
                                                        key={l.code}
                                                        onClick={() => {
                                                            setCustomerLang(l);
                                                            setIsLangMenuOpen(false);
                                                        }}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                                                            customerLang.code === l.code
                                                                ? 'bg-[#e6c487]/20 text-[#e6c487] font-bold'
                                                                : 'text-gray-300 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        <span className="text-base">{l.flag}</span>
                                                        <span className="flex-1">{l.nativeName}</span>
                                                        <span className="text-[10px] text-gray-500">
                                                            {l.name}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 3. CONVERSATION MESSAGE STREAM */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/30">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-3">
                                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                                        <Mic size={28} className="opacity-60" />
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-300">
                                        Sẵn sàng phiên dịch trực tiếp
                                    </h4>
                                    <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
                                        Nhấn giữ nút <span className="text-blue-400 font-bold">Khách ({customerLang.flag})</span> hoặc{' '}
                                        <span className="text-[#e6c487] font-bold">Lễ Tân (🇻🇳)</span> để nói chuyện.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isCustomer = msg.sender === 'customer';
                                    const isEditing = editingIndex === index;

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex flex-col ${
                                                isCustomer ? 'items-start' : 'items-end'
                                            }`}
                                        >
                                            {/* SENDER BADGE */}
                                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-gray-400 font-bold">
                                                <span>{isCustomer ? customerLang.flag : receptionistLang.flag}</span>
                                                <span>
                                                    {isCustomer
                                                        ? `Khách (${customerLang.name})`
                                                        : 'Lễ Tân (Tiếng Việt)'}
                                                </span>
                                            </div>

                                            {/* MESSAGE CARD */}
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 border transition-all ${
                                                    isCustomer
                                                        ? 'bg-[#1b2333]/90 border-blue-500/30 text-blue-100 rounded-tl-sm'
                                                        : 'bg-[#262118]/90 border-[#e6c487]/30 text-amber-100 rounded-tr-sm'
                                                }`}
                                            >
                                                {/* Original Text (or Edit input) */}
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="w-full bg-black/60 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#e6c487]"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={() => setEditingIndex(null)}
                                                                className="px-2 py-1 text-[10px] bg-white/10 rounded-lg text-gray-300"
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                onClick={() => handleSaveEdit(index)}
                                                                className="px-2.5 py-1 text-[10px] bg-[#e6c487] text-black font-bold rounded-lg"
                                                            >
                                                                Dịch lại
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-300 flex items-start justify-between gap-3">
                                                        <span className="italic opacity-80">
                                                            "{msg.original_text}"
                                                        </span>
                                                        <button
                                                            onClick={() => handleStartEdit(index)}
                                                            title="Sửa câu này để dịch lại"
                                                            className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5"
                                                        >
                                                            <Edit3 size={11} className="text-gray-400" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Translated Text (Highlight) */}
                                                <div className="font-bold text-sm leading-relaxed text-white">
                                                    {msg.translated_text}
                                                </div>

                                                {/* ACTION BAR (Replay, Copy) */}
                                                <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px] text-gray-400">
                                                    <span className="opacity-60 text-[9px]">
                                                        {msg.input_type === 'voice' ? '🎤 Voice' : '⌨️ Text'}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleReplay(msg)}
                                                            className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                                            title="Nghe lại bản dịch"
                                                        >
                                                            <Volume2 size={12} />
                                                            <span>Nghe</span>
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleCopy(msg.translated_text, index)
                                                            }
                                                            className="hover:text-white flex items-center gap-1 transition-colors"
                                                            title="Copy bản dịch"
                                                        >
                                                            {copiedIndex === index ? (
                                                                <Check size={12} className="text-emerald-400" />
                                                            ) : (
                                                                <Copy size={12} />
                                                            )}
                                                            <span>{copiedIndex === index ? 'Đã copy' : 'Copy'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* LIVE SPEECH RECOGNITION WAVE ANIMATION OVERLAY */}
                        <AnimatePresence>
                            {activeSpeaker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 15 }}
                                    className="px-4 py-3 bg-[#1e1e24] border-t border-[#e6c487]/40 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 animate-pulse">
                                            <Mic size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                                <span>Đang lắng nghe {activeSpeaker === 'customer' ? `Khách (${customerLang.name})` : 'Lễ Tân'}...</span>
                                                <span className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[#e6c487] font-medium max-w-[280px] truncate">
                                                {liveTranscript || 'Hãy nói vào micro...'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded-lg">
                                        Thả ra để dịch
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 4. DUAL PUSH-TO-TALK & INPUT CONTROLS */}
                        <div className="p-3.5 bg-[#17171a] border-t border-white/10 space-y-3 shrink-0">
                            {/* TOP: CUSTOMER PUSH-TO-TALK BUTTON */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold px-1">
                                    <span>{customerLang.flag} KHÁCH HÀNG ({customerLang.name.toUpperCase()})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Hoặc gõ bằng ${customerLang.nativeName}...`}
                                        value={customerText}
                                        onChange={(e) => setCustomerText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                executeTranslation({
                                                    text: customerText,
                                                    sender: 'customer',
                                                });
                                                setCustomerText('');
                                            }
                                        }}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition-all"
                                    />

                                    {/* Push to talk Customer button */}
                                    <button
                                        onMouseDown={() => handlePushToTalkStart('customer')}
                                        onMouseUp={handlePushToTalkEnd}
                                        onTouchStart={() => handlePushToTalkStart('customer')}
                                        onTouchEnd={handlePushToTalkEnd}
                                        disabled={isTranslating}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 select-none ${
                                            activeSpeaker === 'customer'
                                                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                        }`}
                                    >
                                        <Mic size={15} />
                                        <span>{activeSpeaker === 'customer' ? 'ĐANG NÓI...' : 'GIỮ ĐỂ NÓI'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* DIVIDER */}
                            <div className="border-t border-white/5" />

                            {/* BOTTOM: RECEPTIONIST PUSH-TO-TALK BUTTON */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-[#e6c487] font-bold px-1">
                                    <span>🇻🇳 LỄ TÂN (TIẾNG VIỆT)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Hoặc gõ tiếng Việt..."
                                        value={receptionistText}
                                        onChange={(e) => setReceptionistText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                executeTranslation({
                                                    text: receptionistText,
                                                    sender: 'receptionist',
                                                });
                                                setReceptionistText('');
                                            }
                                        }}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#e6c487]/50 placeholder:text-gray-600 transition-all"
                                    />

                                    {/* Push to talk Receptionist button */}
                                    <button
                                        onMouseDown={() => handlePushToTalkStart('receptionist')}
                                        onMouseUp={handlePushToTalkEnd}
                                        onTouchStart={() => handlePushToTalkStart('receptionist')}
                                        onTouchEnd={handlePushToTalkEnd}
                                        disabled={isTranslating}
                                        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 select-none ${
                                            activeSpeaker === 'receptionist'
                                                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                                                : 'bg-gradient-to-r from-[#d4af37] to-[#e6c487] text-black shadow-[0_0_15px_rgba(230,196,135,0.3)] hover:brightness-110'
                                        }`}
                                    >
                                        <Mic size={15} />
                                        <span>{activeSpeaker === 'receptionist' ? 'ĐANG NÓI...' : 'GIỮ ĐỂ NÓI'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 5. TERMINOLOGY DICTIONARY MODAL */}
                        <AnimatePresence>
                            {isDictModalOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col p-4"
                                >
                                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                        <div className="flex items-center gap-2 text-[#e6c487]">
                                            <BookOpen size={18} />
                                            <h4 className="font-bold text-sm">Từ Điển Chuyên Ngành Spa</h4>
                                        </div>
                                        <button
                                            onClick={() => setIsDictModalOpen(false)}
                                            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto py-3 space-y-2">
                                        <p className="text-[11px] text-gray-400">
                                            Các thuật ngữ này được hệ thống ép Google Cloud dịch chuẩn xác theo từ điển nội bộ:
                                        </p>

                                        <div className="grid grid-cols-1 gap-2 text-xs">
                                            {DEFAULT_TRANSLATION_TERMS.map((term) => (
                                                <div
                                                    key={term.key}
                                                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span className="font-bold text-[#e6c487]">
                                                            {term.vi}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 ml-2">
                                                            ({term.category})
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-300 font-medium">
                                                        {(term as any)[customerLang.code] || term.en}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/10 text-center">
                                        <button
                                            onClick={() => setIsDictModalOpen(false)}
                                            className="w-full py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
