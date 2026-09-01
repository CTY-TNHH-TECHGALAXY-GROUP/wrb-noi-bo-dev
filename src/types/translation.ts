export type SupportedLanguage = 'en' | 'vi' | 'zh' | 'ko' | 'ja' | 'th' | 'fr' | 'de';

export interface LanguageMeta {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
    speechCode: string; // e.g. 'en-US', 'vi-VN', 'zh-CN', 'ko-KR', 'ja-JP', 'th-TH', 'fr-FR', 'de-DE'
    holdToSpeak: string;
    speaking: string;
    typePlaceholder: string;
    customerLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        speechCode: 'en-US',
        holdToSpeak: 'HOLD TO TALK',
        speaking: 'LISTENING...',
        typePlaceholder: 'Or type in English...',
        customerLabel: 'CUSTOMER (ENGLISH)',
    },
    {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳',
        speechCode: 'zh-CN',
        holdToSpeak: '按住说话',
        speaking: '正在倾听...',
        typePlaceholder: '或输入中文...',
        customerLabel: '顾客 (中文)',
    },
    {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
        speechCode: 'ko-KR',
        holdToSpeak: '누르고 말하기',
        speaking: '듣는 중...',
        typePlaceholder: '또는 한국어로 입력...',
        customerLabel: '고객 (한국어)',
    },
    {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        speechCode: 'ja-JP',
        holdToSpeak: '長押しで話す',
        speaking: '聞き取り中...',
        typePlaceholder: 'または日本語で入力...',
        customerLabel: 'お客様 (日本語)',
    },
    {
        code: 'th',
        name: 'Thai',
        nativeName: 'ไทย',
        flag: '🇹🇭',
        speechCode: 'th-TH',
        holdToSpeak: 'กดค้างเพื่อพูด',
        speaking: 'กำลังฟัง...',
        typePlaceholder: 'หรือพิมพ์ภาษาไทย...',
        customerLabel: 'ลูกค้า (ภาษาไทย)',
    },
    {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        speechCode: 'fr-FR',
        holdToSpeak: 'MAINTENIR POUR PARLER',
        speaking: 'ÉCOUTE EN COURS...',
        typePlaceholder: 'Ou tapez en français...',
        customerLabel: 'CLIENT (FRANÇAIS)',
    },
    {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        speechCode: 'de-DE',
        holdToSpeak: 'HALTEN ZUM SPRECHEN',
        speaking: 'HÖRE ZU...',
        typePlaceholder: 'Oder auf Deutsch tippen...',
        customerLabel: 'KUNDE (DEUTSCH)',
    },
    {
        code: 'vi',
        name: 'Vietnamese',
        nativeName: 'Tiếng Việt',
        flag: '🇻🇳',
        speechCode: 'vi-VN',
        holdToSpeak: 'GIỮ ĐỂ NÓI',
        speaking: 'ĐANG NGHE...',
        typePlaceholder: 'Hoặc gõ tiếng Việt...',
        customerLabel: 'LỄ TÂN (TIẾNG VIỆT)',
    },
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
