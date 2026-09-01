export type SupportedLanguage =
    | 'en'
    | 'vi'
    | 'zh'
    | 'ko'
    | 'ja'
    | 'th'
    | 'fr'
    | 'de'
    | 'ru'
    | 'es'
    | 'it'
    | 'id'
    | 'ms'
    | 'hi'
    | 'ar'
    | 'pt'
    | 'nl'
    | 'tl'
    | 'sv'
    | 'pl'
    | 'tr'
    | 'km'
    | 'lo'
    | 'my';

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
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        speechCode: 'ru-RU',
        holdToSpeak: 'УДЕРЖИВАЙТЕ ДЛЯ ЗАПИСИ',
        speaking: 'СЛУШАЮ...',
        typePlaceholder: 'Или введите на русском...',
        customerLabel: 'КЛИЕНТ (РУССКИЙ)',
    },
    {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        speechCode: 'es-ES',
        holdToSpeak: 'MANTÉN PARA HABLAR',
        speaking: 'ESCUCHANDO...',
        typePlaceholder: 'O escribe en español...',
        customerLabel: 'CLIENTE (ESPAÑOL)',
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
        code: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        flag: '🇮🇹',
        speechCode: 'it-IT',
        holdToSpeak: 'TIENI PREMUTO PER PARLARE',
        speaking: 'IN ASCOLTO...',
        typePlaceholder: 'O scrivi in italiano...',
        customerLabel: 'CLIENTE (ITALIANO)',
    },
    {
        code: 'id',
        name: 'Indonesian',
        nativeName: 'Bahasa Indonesia',
        flag: '🇮🇩',
        speechCode: 'id-ID',
        holdToSpeak: 'TAHAN UNTUK BICARA',
        speaking: 'MENDENGARKAN...',
        typePlaceholder: 'Atau ketik bahasa Indonesia...',
        customerLabel: 'PELANGGAN (INDONESIA)',
    },
    {
        code: 'ms',
        name: 'Malay',
        nativeName: 'Bahasa Melayu',
        flag: '🇲🇾',
        speechCode: 'ms-MY',
        holdToSpeak: 'TEKAN UNTUK BERCAKAP',
        speaking: 'MENDENGAR...',
        typePlaceholder: 'Atau taip dalam bahasa Melayu...',
        customerLabel: 'PELANGGAN (MELAYU)',
    },
    {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        flag: '🇮🇳',
        speechCode: 'hi-IN',
        holdToSpeak: 'बोलने के लिए दबाए रखें',
        speaking: 'सुन रहा हूँ...',
        typePlaceholder: 'या हिंदी में टाइप करें...',
        customerLabel: 'ग्राहक (हिन्दी)',
    },
    {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦',
        speechCode: 'ar-SA',
        holdToSpeak: 'اضغط باستمرار للتحدث',
        speaking: 'جارٍ الاستماع...',
        typePlaceholder: 'أو اكتب بالعربية...',
        customerLabel: 'العميل (العربية)',
    },
    {
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇵🇹',
        speechCode: 'pt-PT',
        holdToSpeak: 'SEGURE PARA FALAR',
        speaking: 'A OUVIR...',
        typePlaceholder: 'Ou digite em português...',
        customerLabel: 'CLIENTE (PORTUGUÊS)',
    },
    {
        code: 'nl',
        name: 'Dutch',
        nativeName: 'Nederlands',
        flag: '🇳🇱',
        speechCode: 'nl-NL',
        holdToSpeak: 'INGEDRUKT HOUDEN',
        speaking: 'LUISTEREN...',
        typePlaceholder: 'Of typ in het Nederlands...',
        customerLabel: 'KLANT (NEDERLANDS)',
    },
    {
        code: 'tl',
        name: 'Filipino / Tagalog',
        nativeName: 'Filipino',
        flag: '🇵🇭',
        speechCode: 'fil-PH',
        holdToSpeak: 'DIINAN PARA MAGSALITA',
        speaking: 'NAKIKINIG...',
        typePlaceholder: 'O mag-type sa Tagalog...',
        customerLabel: 'KUSTOMER (FILIPINO)',
    },
    {
        code: 'sv',
        name: 'Swedish',
        nativeName: 'Svenska',
        flag: '🇸🇪',
        speechCode: 'sv-SE',
        holdToSpeak: 'HÅLL NED FÖR ATT TALA',
        speaking: 'LYSSNAR...',
        typePlaceholder: 'Eller skriv på svenska...',
        customerLabel: 'KUND (SVENSKA)',
    },
    {
        code: 'pl',
        name: 'Polish',
        nativeName: 'Polski',
        flag: '🇵🇱',
        speechCode: 'pl-PL',
        holdToSpeak: 'PRZYTRZYMAJ, ABY MÓWIĆ',
        speaking: 'SŁUCHAM...',
        typePlaceholder: 'Lub wpisz po polsku...',
        customerLabel: 'KLIENT (POLSKI)',
    },
    {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe',
        flag: '🇹🇷',
        speechCode: 'tr-TR',
        holdToSpeak: 'BASILI TUTUN',
        speaking: 'DİNLENİYOR...',
        typePlaceholder: 'Veya Türkçe yazın...',
        customerLabel: 'MÜŞTERİ (TÜRKÇE)',
    },
    {
        code: 'km',
        name: 'Khmer',
        nativeName: 'ភាសាខ្មែរ',
        flag: '🇰🇭',
        speechCode: 'km-KH',
        holdToSpeak: 'សង្កត់ដើម្បីនិយាយ',
        speaking: 'កំពុងស្តាប់...',
        typePlaceholder: 'ឬវាយជាភាសាខ្មែរ...',
        customerLabel: 'អតិថិជន (ខ្មែរ)',
    },
    {
        code: 'lo',
        name: 'Lao',
        nativeName: 'ພາສາລາວ',
        flag: '🇱🇦',
        speechCode: 'lo-LA',
        holdToSpeak: 'ກົດຄ້າງໄວ້ເພື່ອເວົ້າ',
        speaking: 'ກຳລັງຟັງ...',
        typePlaceholder: 'ຫຼືພິມເປັນພາສາລາວ...',
        customerLabel: 'ລູກຄ້າ (ລາວ)',
    },
    {
        code: 'my',
        name: 'Burmese',
        nativeName: 'မြန်မာ',
        flag: '🇲🇲',
        speechCode: 'my-MM',
        holdToSpeak: 'စကားပြောရန် ဖိထားပါ',
        speaking: 'နားထောင်နေသည်...',
        typePlaceholder: 'သို့မဟုတ် မြန်မာလို ရိုက်ထည့်ပါ...',
        customerLabel: 'ဧည့်သည် (မြန်မာ)',
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
