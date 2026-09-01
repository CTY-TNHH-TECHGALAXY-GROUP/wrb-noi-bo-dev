import { TranslationTerm, TranslationMessage } from '@/types/translation';
import { DEFAULT_TRANSLATION_TERMS } from '@/constants/translationTerms';
import { supabase } from '@/lib/supabase';

interface TranslateOptions {
    text: string;
    sourceLang: string; // e.g. 'en', 'vi', 'ko', 'zh', 'ja', 'th', 'fr', 'de'
    targetLang: string;
    conversationId?: string;
    sender: 'customer' | 'receptionist';
    inputType?: 'voice' | 'text';
    speechDurationMs?: number;
}

interface TranslateResult {
    originalText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    matchedTerms: string[];
    messageId?: string;
}

/**
 * Fetch all custom terminology terms from Supabase (or fallback to default terms)
 */
export async function getTerminologyTerms(): Promise<TranslationTerm[]> {
    try {
        const { data, error } = await (supabase as any)
            .from('translation_terms')
            .select('*');

        if (error || !data || data.length === 0) {
            return DEFAULT_TRANSLATION_TERMS;
        }

        return data as TranslationTerm[];
    } catch (err) {
        console.warn('[TranslationService] Error fetching terms from Supabase, using defaults:', err);
        return DEFAULT_TRANSLATION_TERMS;
    }
}

/**
 * Match and replace internal terminology before/after translation to guarantee consistent terminology.
 */
function applyTerminologyPreProcess(
    text: string,
    sourceLang: string,
    targetLang: string,
    terms: TranslationTerm[]
): { processedText: string; replacements: Map<string, string>; matchedTerms: string[] } {
    let processedText = text;
    const replacements = new Map<string, string>();
    const matchedTerms: string[] = [];

    // Sort terms by length descending to match longer phrases first (e.g. "Massage 4 Tay" before "Massage")
    const sortedTerms = [...terms].sort((a, b) => {
        const aLen = ((a as any)[sourceLang] || a.en || '').length;
        const bLen = ((b as any)[sourceLang] || b.en || '').length;
        return bLen - aLen;
    });

    let placeholderIndex = 0;

    for (const term of sortedTerms) {
        const sourceWord = (term as any)[sourceLang] || (sourceLang === 'vi' ? term.vi : term.en);
        const targetWord = (term as any)[targetLang] || (targetLang === 'vi' ? term.vi : term.en);

        if (!sourceWord || !targetWord) continue;

        // Escape regex special chars
        const escaped = sourceWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

        if (regex.test(processedText)) {
            const placeholder = `__TERM_${placeholderIndex}__`;
            processedText = processedText.replace(regex, placeholder);
            replacements.set(placeholder, targetWord);
            matchedTerms.push(`${sourceWord} ➔ ${targetWord}`);
            placeholderIndex++;
        }
    }

    return { processedText, replacements, matchedTerms };
}

/**
 * Restore translated terminology into the final text
 */
function applyTerminologyPostProcess(
    translatedText: string,
    replacements: Map<string, string>
): string {
    let result = translatedText;
    replacements.forEach((targetWord, placeholder) => {
        // Handle variations that Google might return (e.g. spaces around underscores)
        const placeholderRegex = new RegExp(`${placeholder}`, 'gi');
        result = result.replace(placeholderRegex, targetWord);

        // Fallback for cases like "__ TERM_0 __"
        const cleanNumber = placeholder.replace(/[^0-9]/g, '');
        const spacedRegex = new RegExp(`__\\s*TERM_${cleanNumber}\\s*__`, 'gi');
        result = result.replace(spacedRegex, targetWord);
    });
    return result;
}

/**
 * Core Translation method using Google Cloud Translation API with Terminology protection & DB Logging
 */
export async function translateText({
    text,
    sourceLang,
    targetLang,
    conversationId,
    sender,
    inputType = 'voice',
    speechDurationMs = 0,
}: TranslateOptions): Promise<TranslateResult> {
    if (!text || !text.trim()) {
        return {
            originalText: '',
            translatedText: '',
            sourceLang,
            targetLang,
            matchedTerms: [],
        };
    }

    // If source and target are the same, return as is
    if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
        return {
            originalText: text,
            translatedText: text,
            sourceLang,
            targetLang,
            matchedTerms: [],
        };
    }

    // 1. Fetch internal terminology
    const terms = await getTerminologyTerms();

    // 2. Pre-process text with dictionary
    const { processedText, replacements, matchedTerms } = applyTerminologyPreProcess(
        text,
        sourceLang,
        targetLang,
        terms
    );

    // 3. Call Translation Engine
    let rawTranslatedText = '';
    const apiKey =
        process.env.GOOGLE_TRANSLATE_API_KEY ||
        process.env.GOOGLE_CLOUD_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (apiKey) {
        try {
            // Google Cloud Translation Basic v2 API endpoint
            const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: processedText,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                rawTranslatedText = data.data?.translations?.[0]?.translatedText || '';
            } else {
                const errBody = await res.text();
                console.warn('[Google Translation API] Error response:', errBody);
                throw new Error(`Google API error: ${res.status}`);
            }
        } catch (e) {
            console.warn('[TranslationService] Google API call failed, attempting fallback...', e);
            rawTranslatedText = await freeTranslationFallback(processedText, sourceLang, targetLang);
        }
    } else {
        // Fallback for development/testing when key is not yet in .env
        rawTranslatedText = await freeTranslationFallback(processedText, sourceLang, targetLang);
    }

    // 4. Post-process to restore internal terminology
    const finalTranslatedText = applyTerminologyPostProcess(
        rawTranslatedText || processedText,
        replacements
    );

    // 5. Log to Supabase (if available)
    let messageId: string | undefined;
    try {
        if (conversationId) {
            const { data } = await (supabase as any)
                .from('translation_messages')
                .insert({
                    conversation_id: conversationId,
                    sender,
                    source_language: sourceLang,
                    target_language: targetLang,
                    original_text: text,
                    translated_text: finalTranslatedText,
                    input_type: inputType,
                    speech_duration_ms: speechDurationMs,
                    translation_provider: apiKey ? 'google_cloud' : 'fallback',
                })
                .select('id')
                .single();

            if (data?.id) {
                messageId = data.id;
            }
        }
    } catch (dbErr) {
        console.warn('[TranslationService] Could not log message to Supabase:', dbErr);
    }

    return {
        originalText: text,
        translatedText: finalTranslatedText,
        sourceLang,
        targetLang,
        matchedTerms,
        messageId,
    };
}

/**
 * Lightweight public fallback translation for local dev when no Google API key is configured
 */
async function freeTranslationFallback(
    text: string,
    source: string,
    target: string
): Promise<string> {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(
            text
        )}`;
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json?.[0])) {
                return json[0].map((item: any) => item[0]).join('');
            }
        }
    } catch (e) {
        console.warn('[FreeTranslationFallback] Failed:', e);
    }
    return text;
}
