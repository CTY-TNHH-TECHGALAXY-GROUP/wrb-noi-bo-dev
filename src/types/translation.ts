export type SupportedLanguage = 'en' | 'vi' | 'zh' | 'ko' | 'ja' | 'th' | 'fr' | 'de';

export interface LanguageMeta {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
    speechCode: string; // e.g. 'en-US', 'vi-VN', 'zh-CN', 'ko-KR', 'ja-JP', 'th-TH', 'fr-FR', 'de-DE'
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-US' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', speechCode: 'zh-CN' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', speechCode: 'ko-KR' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', speechCode: 'th-TH' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', speechCode: 'vi-VN' },
];

export interface TranslationTerm {
    id?: string;
    key: string;
    vi: string;
    en: string;
    zh?: string;
    ko?: string;
    ja?: string;
    th?: string;
    category?: 'service' | 'facility' | 'role' | 'policy';
}

export interface TranslationMessage {
    id?: string;
    conversation_id?: string;
    sender: 'customer' | 'receptionist';
    source_language: string;
    target_language: string;
    original_text: string;
    translated_text: string;
    input_type: 'voice' | 'text';
    speech_duration_ms?: number;
    translation_provider?: string;
    created_at?: string;
    status?: 'sending' | 'success' | 'error';
}

export interface TranslationConversation {
    id: string;
    customer_language: string;
    receptionist_language: string;
    started_at: string;
    ended_at?: string;
    status: 'active' | 'ended';
    created_at: string;
}

export type SpeechState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
