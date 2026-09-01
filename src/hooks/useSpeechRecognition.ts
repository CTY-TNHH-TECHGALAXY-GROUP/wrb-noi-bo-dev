'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SpeechState } from '@/types/translation';

interface UseSpeechRecognitionProps {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
}

export function useSpeechRecognition({ onResult, onError }: UseSpeechRecognitionProps) {
    const [state, setState] = useState<SpeechState>('idle');
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);
    const startTimeRef = useRef<number>(0);

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
                onError?.('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API).');
                return;
            }

            // If already listening, stop first
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                    // Ignore abort error
                }
            }

            try {
                const recognition = new SpeechRecognition();
                recognition.lang = speechLanguageCode;
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    isListeningRef.current = true;
                    startTimeRef.current = Date.now();
                    setState('listening');
                    setTranscript('');
                };

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const word = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += word;
                        } else {
                            interimTranscript += word;
                        }
                    }

                    const current = finalTranscript || interimTranscript;
                    if (current) {
                        setTranscript(current);
                        onResult(current, !!finalTranscript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.warn('[SpeechRecognition] Error:', event.error);
                    if (event.error === 'not-allowed') {
                        onError?.('Vui lòng cấp quyền sử dụng Microphone trên trình duyệt.');
                        setState('error');
                    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                        onError?.(`Lỗi nhận diện âm thanh: ${event.error}`);
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
                console.error('[SpeechRecognition] Start error:', err);
                onError?.('Không thể khởi động Microphone.');
                setState('error');
            }
        },
        [onResult, onError, state]
    );

    const stopListening = useCallback((): number => {
        const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        if (recognitionRef.current && isListeningRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore stop error
            }
        }
        isListeningRef.current = false;
        setState('idle');
        return duration;
    }, []);

    const abortListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) {
                // Ignore abort error
            }
        }
        isListeningRef.current = false;
        setState('idle');
        setTranscript('');
    }, []);

    return {
        state,
        setState,
        transcript,
        isSupported,
        startListening,
        stopListening,
        abortListening,
    };
}
