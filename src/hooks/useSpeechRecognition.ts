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
    const finalResultsMap = useRef<Map<number, string>>(new Map());

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
                finalResultsMap.current.clear();

                recognition.onstart = () => {
                    isListeningRef.current = true;
                    startTimeRef.current = Date.now();
                    setState('listening');
                    setTranscript('');
                };

                recognition.onresult = (event: any) => {
                    let currentInterim = '';
                    let hasFinal = false;

                    for (let i = 0; i < event.results.length; ++i) {
                        const result = event.results[i];
                        const text = result[0]?.transcript || '';
                        
                        if (result.isFinal) {
                            // Only store finalized segments in a map to guarantee NO duplication
                            finalResultsMap.current.set(i, text.trim());
                            hasFinal = true;
                        } else {
                            // On buggy Android devices, interim updates are incorrectly pushed as new array items
                            // instead of updating the current index. By only taking the VERY LAST interim result,
                            // we completely eliminate the duplicate text accumulation bug.
                            if (i === event.results.length - 1) {
                                currentInterim = text;
                            }
                        }
                    }

                    // Rebuild the completely clean text: all finalized segments + the latest interim
                    let fullFinalText = '';
                    const sortedKeys = Array.from(finalResultsMap.current.keys()).sort((a, b) => a - b);
                    for (const key of sortedKeys) {
                        const seg = finalResultsMap.current.get(key);
                        if (seg) {
                            fullFinalText += seg + ' ';
                        }
                    }

                    const currentFullText = (fullFinalText + currentInterim).trim();
                    latestTranscriptRef.current = currentFullText;

                    if (currentFullText) {
                        setTranscript(currentFullText);
                        onResult?.(currentFullText, hasFinal);
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
        finalResultsMap.current.clear();
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
