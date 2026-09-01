'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export function useSpeechSynthesis() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        } else {
            setIsSupported(false);
        }
    }, []);

    const speak = useCallback(
        (text: string, languageCode: string, onEnd?: () => void) => {
            if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                return;
            }

            const synth = window.speechSynthesis;
            // Cancel any ongoing speech
            synth.cancel();

            if (!text.trim()) return;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = languageCode;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Try to find a matching voice if available
            const voices = synth.getVoices();
            const matchingVoice = voices.find((v) =>
                v.lang.toLowerCase().startsWith(languageCode.toLowerCase().slice(0, 2))
            );
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                onEnd?.();
            };

            utterance.onerror = (e) => {
                console.warn('[SpeechSynthesis] Utterance error:', e);
                setIsSpeaking(false);
            };

            synth.speak(utterance);
        },
        []
    );

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isSupported,
    };
}
