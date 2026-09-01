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
    const isListeningRef = useRef(false);
    const startTimeRef = useRef<number>(0);
    const latestTranscriptRef = useRef<string>('');

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

    const startListening = useCallback(
        (speechLanguageCode: string) => {
            if (typeof window === 'undefined') return;

            const SpeechRecognition =
                (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setIsSupported(false);
                onError?.('Trình duyệt chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Chrome/Safari.');
                return;
            }

            // Abort any existing instance
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore
                }
            }

            try {
                const recognition = new SpeechRecognition();
                recognition.lang = speechLanguageCode;
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                latestTranscriptRef.current = '';

                recognition.onstart = () => {
                    isListeningRef.current = true;
                    startTimeRef.current = Date.now();
                    setState('listening');
                    setTranscript('');
                };

                recognition.onresult = (event: any) => {
                    // Canonical Web Speech API: The browser maintains all parts in event.results array
                    let fullText = '';
                    let hasFinal = false;

                    for (let i = 0; i < event.results.length; ++i) {
                        const item = event.results[i];
                        if (item[0]?.transcript) {
                            fullText += item[0].transcript;
                        }
                        if (item.isFinal) {
                            hasFinal = true;
                        }
                    }

                    const cleanText = fullText.trim();
                    latestTranscriptRef.current = cleanText;

                    if (cleanText) {
                        setTranscript(cleanText);
                        onResult?.(cleanText, hasFinal);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.warn('[SpeechRecognition] Event error:', event.error);
                    if (event.error === 'not-allowed') {
                        onError?.('Vui lòng cấp quyền Microphone trên trình duyệt để nói chuyện.');
                        setState('error');
                    } else if (event.error === 'network') {
                        onError?.('Lỗi kết nối mạng khi nhận diện giọng nói.');
                        setState('error');
                    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        onError?.(`Lỗi nhận diện âm thanh (${event.error})`);
                        setState('error');
                    }
                };

                recognition.onend = () => {
                    isListeningRef.current = false;
                    if (state === 'listening') {
                        setState('idle');
                    }
                };

                recognitionRef.current = recognition;
                recognition.start();
            } catch (err: any) {
                console.error('[SpeechRecognition] Start exception:', err);
                onError?.('Không thể khởi động Microphone.');
                setState('error');
            }
        },
        [onResult, onError, state]
    );

    const stopListening = useCallback((): { durationMs: number; text: string } => {
        const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        const recordedText = latestTranscriptRef.current.trim();

        if (recognitionRef.current && isListeningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore
            }
        }
        isListeningRef.current = false;
        setState('idle');

        return {
            durationMs,
            text: recordedText,
        };
    }, []);

    const abortListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {
                // Ignore
            }
        }
        isListeningRef.current = false;
        setState('idle');
        setTranscript('');
        latestTranscriptRef.current = '';
    }, []);

    return {
        state,
        setState,
        transcript,
        isSupported,
        startListening,
        stopListening,
        abortListening,
        getLatestText: () => latestTranscriptRef.current.trim(),
    };
}
