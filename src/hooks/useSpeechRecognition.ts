'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeechState } from '@/types/translation';

interface UseSpeechRecognitionProps {
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
}

export function useSpeechRecognition({
    onResult,
    onError,
}: UseSpeechRecognitionProps = {}) {
    const [state, setState] = useState<SpeechState>('idle');
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false); // Is the user actively holding the button?
    const startTimeRef = useRef<number>(0);
    
    // Stores the fully finalized segments from previous bursts
    const accumulatedTextRef = useRef<string>('');
    // Stores the current active burst
    const currentBurstTextRef = useRef<string>('');
    
    // Track language to restart with correct language
    const langRef = useRef<string>('en-US');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setIsSupported(false);
            }
        }
    }, []);

    const initAndStartRecognition = useCallback(() => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) return;

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = langRef.current;
            // FORCE continuous=false to bypass ALL Android Chrome array duplication bugs.
            // We will auto-restart it if it stops while the user is still holding the button.
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setState('listening');
            };

            recognition.onresult = (event: any) => {
                let text = '';
                let isFinal = false;

                // Since continuous=false, event.results typically only has length 1 for the current burst
                for (let i = 0; i < event.results.length; ++i) {
                    text += event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        isFinal = true;
                    }
                }

                currentBurstTextRef.current = text.trim();
                const combinedText = (accumulatedTextRef.current + ' ' + currentBurstTextRef.current).trim();

                if (combinedText) {
                    setTranscript(combinedText);
                    onResult?.(combinedText, isFinal);
                }
            };

            recognition.onerror = (event: any) => {
                console.warn('[SpeechRecognition] Event error:', event.error);
                if (event.error === 'not-allowed') {
                    onError?.('Vui lòng cấp quyền Microphone trên trình duyệt để nói chuyện.');
                    setState('error');
                    isListeningRef.current = false;
                } else if (event.error === 'network') {
                    onError?.('Lỗi kết nối mạng khi nhận diện giọng nói.');
                    setState('error');
                    isListeningRef.current = false;
                }
                // Ignore "no-speech" or "aborted"
            };

            recognition.onend = () => {
                // The browser auto-stopped because continuous=false (user paused speaking)
                // If user is STILL holding the button, save the current burst and RESTART!
                if (isListeningRef.current) {
                    if (currentBurstTextRef.current) {
                        accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + currentBurstTextRef.current).trim();
                        currentBurstTextRef.current = '';
                    }
                    try {
                        recognition.start(); // Restart seamlessly
                    } catch (e) {
                        console.warn('Failed to restart recognition', e);
                    }
                } else {
                    setState('idle');
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err: any) {
            console.error('[SpeechRecognition] Start exception:', err);
            onError?.('Không thể khởi động Microphone.');
            setState('error');
            isListeningRef.current = false;
        }
    }, [onError, onResult]);

    const startListening = useCallback(
        (speechLanguageCode: string) => {
            if (!isSupported) {
                onError?.('Trình duyệt chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome/Safari.');
                return;
            }

            // Clean state for a brand new Push-to-Talk hold
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }

            isListeningRef.current = true;
            startTimeRef.current = Date.now();
            accumulatedTextRef.current = '';
            currentBurstTextRef.current = '';
            langRef.current = speechLanguageCode;
            setTranscript('');

            initAndStartRecognition();
        },
        [isSupported, initAndStartRecognition, onError]
    );

    const stopListening = useCallback((): { durationMs: number; text: string } => {
        const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        
        // Final text is whatever we accumulated + whatever is in the current burst
        const finalRecordedText = (accumulatedTextRef.current + ' ' + currentBurstTextRef.current).trim();

        isListeningRef.current = false; // Prevents auto-restart in onend

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }
        
        setState('idle');

        return {
            durationMs,
            text: finalRecordedText,
        };
    }, []);

    const abortListening = useCallback(() => {
        isListeningRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {}
        }
        setState('idle');
        setTranscript('');
        accumulatedTextRef.current = '';
        currentBurstTextRef.current = '';
    }, []);

    return {
        state,
        setState,
        transcript,
        isSupported,
        startListening,
        stopListening,
        abortListening,
        getLatestText: () => (accumulatedTextRef.current + ' ' + currentBurstTextRef.current).trim(),
    };
}
