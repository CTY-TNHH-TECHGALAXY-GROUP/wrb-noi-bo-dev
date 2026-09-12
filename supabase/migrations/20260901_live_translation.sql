-- =========================================================================
-- LIVE TRANSLATION & DICTIONARY SCHEMA FOR SUPABASE
-- =========================================================================

-- 1. Table: translation_conversations
CREATE TABLE IF NOT EXISTS public.translation_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_language VARCHAR(10) NOT NULL DEFAULT 'en',
    receptionist_language VARCHAR(10) NOT NULL DEFAULT 'vi',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'ended'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: translation_messages
CREATE TABLE IF NOT EXISTS public.translation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.translation_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'customer' | 'receptionist'
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    input_type VARCHAR(20) NOT NULL DEFAULT 'voice', -- 'voice' | 'text'
    speech_duration_ms INTEGER DEFAULT 0,
    translation_provider VARCHAR(50) DEFAULT 'google_cloud',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast query of conversation messages
CREATE INDEX IF NOT EXISTS idx_trans_msg_conv_id ON public.translation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_trans_msg_created_at ON public.translation_messages(created_at);

-- 3. Table: translation_terms (Internal Terminology Dictionary)
CREATE TABLE IF NOT EXISTS public.translation_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    vi TEXT NOT NULL,
    en TEXT NOT NULL,
    zh TEXT,
    ko TEXT,
    ja TEXT,
    th TEXT,
    category VARCHAR(50) DEFAULT 'service', -- 'service', 'facility', 'role', 'policy'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Default Spa Terminology (Initial Seed Data)
INSERT INTO public.translation_terms (key, vi, en, zh, ko, ja, th, category)
VALUES
    ('four_hands', 'Massage 4 Tay', '4 Hands Massage', '四手按摩', '포핸즈 마사지', 'フォーハンズマッサージ', 'นวด 4 มือ', 'service'),
    ('thai_body', 'Thai Body', 'Thai Body Massage', '泰式身体按摩', '타이 바디 마사지', 'タイ式ボディマッサージ', 'นวดแผนไทย', 'service'),
    ('mix_4_body', 'Mix 4 Body', 'Mix 4 Body Massage', '四合一全身按摩', '믹스 4 바디 마사지', 'ミックス4ボディマッサージ', 'มิกซ์ 4 บอดี้ มาสสาจ', 'service'),
    ('foot_massage', 'Massage Chân', 'Foot Massage', '足部按摩', '발 마사지', 'フットマッサージ', 'นวดเท้า', 'service'),
    ('body_massage', 'Massage Toàn Thân', 'Full Body Massage', '全身按摩', '전신 바디 마사지', '全身ボディマッサージ', 'นวดตัว', 'service'),
    ('head_spa', 'Gội Đầu Dưỡng Sinh', 'Head Spa', '养生洗头', '헤드 스파', 'ヘッドスパ', 'เฮดสปา', 'service'),
    ('ear_cleaning', 'Lấy Ráy Tai', 'Ear Cleaning', '采耳', '귀 청소', '耳かき', 'แคะหู', 'service'),
    ('barber', 'Cắt Tóc / Barber', 'Barber / Haircut', '理发服务', '바버 / 커트', '理髪 / カット', 'ตัดผมบาร์เบอร์', 'service'),
    ('haircut', 'Cắt tóc', 'Haircut', '理发', '커트', 'カット', 'ตัดผม', 'service'),
    ('facial', 'Chăm sóc da mặt', 'Facial Care', '面部护理', '페이셜 케어', 'フェイシャルケア', 'ดูแลผิวหน้า', 'service'),
    ('shave', 'Cạo râu', 'Shave', '剃须', '면도', '髭剃り', 'โกนหนวด', 'service'),
    ('heel_smoothing', 'Chà gót chân', 'Heel Smoothing', '修脚去角质', '발 뒤꿈치 각질 제거', 'かかと角質除去', 'ขัดส้นเท้า', 'service'),
    ('nail_care', 'Làm móng tay & chân', 'Manicure & Pedicure', '美甲与修脚', '매니큐어 & 페디큐어', 'マニキュア＆ペディキュア', 'ทำเล็บมือและเล็บเท้า', 'service'),
    ('co_vai_gay', 'Cổ vai gáy', 'Head, Neck & Shoulder', '头颈肩', '머리·목·어깨', 'ヘッド・ネック・ショルダー', 'คอ บ่า ไหล่', 'service'),
    ('hot_stone', 'Đá Nóng', 'Hot Stone', '热石', '핫스톤', 'ホットストーン', 'หินร้อน', 'service'),
    ('aromatherapy', 'Tinh Dầu Thơm', 'Aromatherapy Oil', '香薰精油', '아로마 테라피', 'アロマセラピー', 'อโรมาเธอราพี', 'service'),
    ('shiatsu', 'Bấm Huyệt Shiatsu', 'Shiatsu Acupressure', '指压按摩', '지압 시아츠', '指圧マッサージ', 'นวดกดจุดชิอัตสึ', 'service'),
    ('head', 'Đầu', 'Head', '头部', '머리', '頭', 'ศีรษะ', 'facility'),
    ('neck', 'Cổ', 'Neck', '颈部', '목', '首', 'คอ', 'facility'),
    ('shoulder', 'Vai', 'Shoulder', '肩膀', '어깨', '肩', 'ไหล่', 'facility'),
    ('back', 'Lưng', 'Back', '背部', '등', '背中', 'หลัง', 'facility'),
    ('upper_back', 'Lưng trên', 'Upper Back', '上背部', '상부 등', '背中上部', 'หลังส่วนบน', 'facility'),
    ('lower_back', 'Lưng dưới / Thắt lưng', 'Lower Back / Waist', '下背部 / 腰部', '하부 등 / 허리', '腰 / 背中下部', 'หลังส่วนล่าง / เอว', 'facility'),
    ('arm', 'Cánh tay', 'Arms', '手臂', '팔', '腕', 'แขน', 'facility'),
    ('hand', 'Bàn tay', 'Hands', '手部', '손', '手', 'มือ', 'facility'),
    ('thigh', 'Đùi', 'Thighs', '大腿', '허벅지', '太もも', 'ต้นขา', 'facility'),
    ('knee', 'Đầu gối', 'Knees', '膝盖', '무릎', '膝', 'หัวเข่า', 'facility'),
    ('calf', 'Bắp chân', 'Calves', '小腿', '종아리', 'ふくらはぎ', 'น่อง', 'facility'),
    ('foot_part', 'Bàn chân', 'Feet', '脚部', '발', '足', 'เท้า', 'facility'),
    ('ktv', 'KTV', 'Technician / Therapist', '技师', '테라피스트', 'セラピスト', 'พนักงานนวด', 'role'),
    ('ktv_nu', 'KTV nữ', 'Female Therapist', '女技师', '여성 테라피스트', '女性セラピスト', 'พนักงานนวดหญิง', 'role'),
    ('ktv_nam', 'KTV nam', 'Male Therapist', '男技师', '남성 테라피스트', '男性セラピスト', 'พนักงานนวดชาย', 'role'),
    ('luc_manh', 'Lực mạnh', 'Strong Pressure', '重力道', '강하게', '強め', 'น้ำหนักแรง', 'service'),
    ('luc_vua', 'Lực vừa', 'Medium Pressure', '适中力道', '보통', '普通', 'น้ำหนักปานกลาง', 'service'),
    ('luc_nhe', 'Lực nhẹ', 'Soft / Light Pressure', '轻柔力道', '부드럽게', '弱め', 'น้ำหนักเบา', 'service'),
    ('private_room', 'Phòng Riêng', 'Private Room', '单人包间', '개인실', '個室', 'ห้องส่วนตัว', 'facility'),
    ('couple_room', 'Phòng Đôi', 'Couple Room', '情侣双人房', '커플룸', 'カップルルーム', 'ห้องคู่', 'facility'),
    ('vip_package', 'Gói VIP', 'VIP Package', 'VIP 套餐', 'VIP 패키지', 'VIPパッケージ', 'แพ็กเกจ VIP', 'service'),
    ('add_on', 'Dịch vụ thêm', 'Add-on Service', '附加项目', '추가 서비스', '追加サービス', 'บริการเสริม', 'service'),
    ('pregnant', 'Có thai / Mang bầu', 'Pregnant', '孕妇', '임산부', '妊娠中', 'ตั้งครรภ์', 'policy'),
    ('allergy', 'Dị ứng', 'Allergy', '过敏', '알레르기', 'アレルギー', 'แพ้', 'policy')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security (RLS) - Allow public access for internal web
ALTER TABLE public.translation_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on translation_conversations" ON public.translation_conversations FOR ALL USING (true);
CREATE POLICY "Allow all on translation_messages" ON public.translation_messages FOR ALL USING (true);
CREATE POLICY "Allow all on translation_terms" ON public.translation_terms FOR ALL USING (true);
