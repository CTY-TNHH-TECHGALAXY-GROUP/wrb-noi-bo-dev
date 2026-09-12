// =============================================
// 🌿 DEEP BODY TREATMENT — MASTER DATA & CONSTANTS
// Specialized Therapeutic Body Treatments
// Full 5 Languages: vi, en, cn, jp, kr
// =============================================

export type DeepBodyLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';

export interface DeepBodyTechnique {
  id: string;
  name: Record<DeepBodyLang, string>;
  shortDesc: Record<DeepBodyLang, string>;
  fullDesc: Record<DeepBodyLang, string>;
  badge: Record<DeepBodyLang, string>;
  thumbnail: string;
  techniqueGallery: string[];
  intensity: 1 | 2 | 3 | 4 | 5; // Độ sâu tác động (1-5)
  recommendedFor: Record<DeepBodyLang, string>;
  contraindications?: Record<DeepBodyLang, string>;
}

export const DEEP_BODY_TECHNIQUES: DeepBodyTechnique[] = [
  {
    id: 'deepTissue',
    name: {
      vi: 'Trị Liệu Giải Cơ Sâu (Deep Tissue)',
      en: 'Deep Tissue Myofascial Release',
      cn: '深层肌筋膜深度理疗',
      jp: 'ディープティシュー筋膜リリース',
      kr: '딥티슈 근막 이완 테라피',
    },
    shortDesc: {
      vi: 'Tác động sâu vào các bó cơ và màng cơ bị co thắt mãn tính, giảm đau nhức cổ vai gáy tức thì.',
      en: 'Targeted pressure on deep muscle layers and chronic knots to relieve severe tension and fatigue.',
      cn: '针对深层肌肉束和慢性结节，深层释放肩颈及全身僵硬酸痛。',
      jp: '深層筋と筋膜のコリに的確にアプローチし、慢性的な首・肩・腰の痛みを解消。',
      kr: '만성 근육 뭉침과 근막을 깊숙이 자극하여 극심한 피로와 통증을 완화합니다.',
    },
    fullDesc: {
      vi: 'Phương pháp sử dụng lực khuỷu tay và đầu ngón tay tác động chậm rãi nhưng cực sâu vào từng thớ cơ sâu dưới bề mặt da. Phù hợp cho người bị căng cứng cơ lâu năm, ngồi máy tính nhiều hoặc tập thể thao cường độ cao.',
      en: 'Employs slow, firm forearm and thumb pressure to penetrate deep sub-layer muscles, breaking down adhesions and restoring postural balance.',
      cn: '运用肘部与拇指的深透力道，缓慢而有力地穿透表层直达深层肌群，瓦解筋膜粘连，恢复身体轻盈与平衡。',
      jp: '肘や指圧による持続的な強い圧で表層筋をくぐり抜け、深層のコリを的確に解きほぐします。長時間のデスクワークや運動後のケアに最適。',
      kr: '팔꿈치와 엄지 압박을 통해 표층 근육을 지나 심부 근육까지 도달하여 근육 유착을 풀고 만성 뻐근함을 해소합니다.',
    },
    badge: {
      vi: 'Chuyên Sâu Bó Cơ',
      en: 'Deep Knots Focus',
      cn: '深度解肌',
      jp: '深層筋特化',
      kr: '심부 근육 특화',
    },
    thumbnail: '/assets/images/treatments/deep-tissue-thumb.jpg',
    techniqueGallery: [
      '/assets/images/treatments/deep-tissue-1.jpg',
      '/assets/images/treatments/deep-tissue-2.jpg',
      '/assets/images/treatments/deep-tissue-3.jpg',
    ],
    intensity: 5,
    recommendedFor: {
      vi: 'Người đau mỏi vai gáy kinh niên, đau thắt lưng, vận động viên',
      en: 'Chronic back/neck stiffness, desk-workers, athletes',
      cn: '长期肩颈腰部酸痛者、久坐办公族、高强度运动人群',
      jp: '慢性的な肩こり・腰痛、長時間のPC作業者、アスリート',
      kr: '만성 어깨·목 결림, 허리 통증, 좌식 생활 직장인, 운동선수',
    },
  },
  {
    id: 'thaiTherapy',
    name: {
      vi: 'Trị Liệu Kéo Giãn & Bấm Huyệt Thái',
      en: 'Thai Therapeutic Stretch & Acupressure',
      cn: '泰式深层拉伸与穴位疏通',
      jp: 'タイ伝統整体ストレッチ＆ツボ指圧',
      kr: '타이 스트레칭 & 경혈 지압 테라피',
    },
    shortDesc: {
      vi: 'Kết hợp bấm dọc theo hệ kinh lạc Sen và các động tác yoga thụ động giúp mở khớp, kéo giãn tối đa.',
      en: 'Dynamic combination of acupressure along Sen energy lines and passive yoga stretches to restore mobility.',
      cn: '沿人体经络穴位施压，配合被动瑜伽拉伸，舒展全身关节与紧绷筋骨。',
      jp: 'セン（経絡）に沿ったツボ刺激とパッシブヨガのストレッチで、関節可動域を広げ柔軟性を回復。',
      kr: '에너지 라인을 따라 지압하고 수동적 요가 스트레칭으로 굳은 관절과 근육을 유연하게 늘려줍니다.',
    },
    fullDesc: {
      vi: 'Được thực hiện trên thảm hoặc giường trị liệu chuyên dụng. Kỹ thuật viên dùng bàn tay, đầu gối, cùi chỏ và bàn chân để nâng đỡ cơ thể bạn vào các tư thế kéo giãn sâu, kích thích dòng chảy năng lượng và tái tạo độ linh hoạt cho cột sống.',
      en: 'Performed with expert positioning using hands, elbows, knees, and feet to guide the body into restorative yoga stretches, relieving spinal compression.',
      cn: '理疗师精准运用双手、肘、膝和脚部作为支点，引导身体完成深层柔和的舒展动作，释放脊柱压力。',
      jp: '「2人で行うヨガ」とも呼ばれ、セラピストの手足や膝を使って全身を気持ちよく伸ばし、体内の巡りを改善します。',
      kr: '테라피스트의 손, 팔꿈치, 무릎을 활용하여 몸을 깊이 스트레칭시키고 척추 압박을 완화해 드립니다.',
    },
    badge: {
      vi: 'Mở Khớp & Cột Sống',
      en: 'Spine & Joints',
      cn: '开背展筋',
      jp: '関節・背骨ケア',
      kr: '관절 & 척추 이완',
    },
    thumbnail: '/assets/images/treatments/thai-therapy-thumb.jpg',
    techniqueGallery: [
      '/assets/images/treatments/thai-therapy-1.jpg',
      '/assets/images/treatments/thai-therapy-2.jpg',
    ],
    intensity: 4,
    recommendedFor: {
      vi: 'Cột sống kém linh hoạt, cơ thể nặng nề, tuần hoàn khí huyết kém',
      en: 'Stiff spine, reduced mobility, low circulation',
      cn: '脊柱僵直、肢体沉重不适、血液循环不畅者',
      jp: '背骨の硬さ、運動不足、身体の重だるさを感じる方',
      kr: '유연성 부족, 몸이 붓고 무거운 분, 혈액 순환 개선 필요',
    },
  },
  {
    id: 'japaneseShiatsu',
    name: {
      vi: 'Bấm Huyệt Đả Thông Shiatsu Nhật',
      en: 'Japanese Shiatsu Meridian Alignment',
      cn: '日式指压经络调理',
      jp: '日本式伝統指圧・経絡アライメント',
      kr: '정통 일본식 시아추 경락 조율',
    },
    shortDesc: {
      vi: 'Bấm huyệt định chuẩn bằng đầu ngón cái, cân bằng hệ thần kinh tự chủ và giải tỏa áp lực nội tạng.',
      en: 'Precise rhythmic thumb pressure along meridian pathways to balance nervous system and relieve chronic stress.',
      cn: '精准拇指节律性压穴，调和自主神经，舒缓深层神经紧绷与疲惫。',
      jp: '親指と手のひらによるリズミカルで正確な圧で経絡を整え、自律神経のバランスと深い安らぎをもたらします。',
      kr: '경락을 따라 정교한 엄지 압박을 가하여 자율신경 균형과 심신 안정, 피로 해소를 돕습니다.',
    },
    fullDesc: {
      vi: 'Trị liệu không dầu truyền thống của Nhật Bản. Lực ấn thẳng góc và giữ nhịp thở chính xác giúp tác động sâu tới các huyệt đạo nội tạng, đặc biệt hiệu quả trong việc hỗ trợ giấc ngủ ngon và giảm đau nửa đầu.',
      en: 'Traditional non-oil Japanese bodywork using perpendicular thumb pressure synchronized with breathing, promoting deep cellular restoration.',
      cn: '不使用精油的传统日式理疗，配合呼吸进行垂直渗透式按压，对于改善睡眠障碍及偏头痛效果卓著。',
      jp: 'オイルを使用せず、呼吸に合わせた垂直指圧で経穴を深く刺激。睡眠の質の向上や頭痛・目の疲れの緩和に特に効果的です。',
      kr: '오일을 사용하지 않는 전통 기법으로 호흡과 맞춘 수직 압박을 통해 깊은 수면 유도와 두통 완화에 탁월합니다.',
    },
    badge: {
      vi: 'Cân Bằng Thần Kinh',
      en: 'Nervous Harmony',
      cn: '神经安抚',
      jp: '自律神経調整',
      kr: '자율신경 밸런스',
    },
    thumbnail: '/assets/images/treatments/shiatsu-thumb.jpg',
    techniqueGallery: [
      '/assets/images/treatments/shiatsu-1.jpg',
      '/assets/images/treatments/shiatsu-2.jpg',
    ],
    intensity: 4,
    recommendedFor: {
      vi: 'Mất ngủ, đau đầu stress, suy nhược cơ thể, căng thẳng kéo dài',
      en: 'Insomnia, migraine, high stress, mental exhaustion',
      cn: '失眠多梦、偏头痛、压力巨大、身心慢性疲劳者',
      jp: '不眠症、頭痛、ストレス過多、精神的疲労を感じる方',
      kr: '불면증, 만성 스트레스, 두통, 정신적 피로감이 큰 분',
    },
  },
  {
    id: 'hotStoneBazan',
    name: {
      vi: 'Nhiệt Trị Liệu Đá Nóng Núi Lửa Bazan',
      en: 'Volcanic Basalt Deep Heat Therapy',
      cn: '火山玄武岩深层热能量理疗',
      jp: '玄武岩ホットストーン温熱ディープセラピー',
      kr: '화산 현무암 딥 히트 온열 테라피',
    },
    shortDesc: {
      vi: 'Sử dụng đá bazan giàu khoáng chất giữ nhiệt 55°C truyền nhiệt sâu vào từng tế bào, trục xuất hàn khí.',
      en: 'Mineral-rich basalt stones heated to 55°C glide along muscle fibers, dispersing cold moisture and soreness.',
      cn: '精选富矿火山玄武岩恒温55°C热疗，深层温经散寒，驱除体内湿滞与肌肉酸楚。',
      jp: 'ミネラル豊富な玄武岩を約55℃に温め、温熱効果で深層筋の緊張を瞬時に和らげ、冷えやコリを解消。',
      kr: '55℃로 달군 천연 현무암 스톤이 근육 깊숙이 열기를 전달하여 한기를 몰아내고 혈류를 촉진합니다.',
    },
    fullDesc: {
      vi: 'Nhiệt lượng từ đá bazan tự nhiên kết hợp cùng tinh dầu trị liệu hữu cơ giúp mở rộng mao mạch, làm tan các tinh thể axit lactic gây nhức mỏi. Đem lại cảm giác ấm áp, thư thái tuyệt đối từ trong xương tủy.',
      en: 'Synergy of thermodynamic basalt stones and organic warming oils dilates capillaries, flushing lactic acid and restoring cellular vitality.',
      cn: '天然玄武石的持续温热与温性植物精油相结合，扩张毛细血管，加速乳酸分解，带来由内而外的通透温暖。',
      jp: '温かいストーンとオイルの滑らかなストロークが血流を促し、溜まった乳酸を速やかに排出。芯から温まる極上の癒し。',
      kr: '따뜻한 온열 스톤과 천연 에센셜 오일의 조화로 젖산을 빠르게 분해하고 몸 깊은 곳까지 훈훈한 온기를 전합니다.',
    },
    badge: {
      vi: 'Trừ Hàn & Ấm Khớp',
      en: 'Cold Expulsion',
      cn: '祛湿散寒',
      jp: '冷え・温活ケア',
      kr: '한기 배출 & 온열',
    },
    thumbnail: '/assets/images/treatments/hotstone-thumb.jpg',
    techniqueGallery: [
      '/assets/images/treatments/hotstone-1.jpg',
      '/assets/images/treatments/hotstone-2.jpg',
    ],
    intensity: 3,
    recommendedFor: {
      vi: 'Lạnh tay chân, đau khớp do hàn ẩm, đau mỏi khi thời tiết thay đổi',
      en: 'Cold extremities, rheumatic joint pains, weather-sensitive aches',
      cn: '手脚冰凉、风湿寒气引起的骨节酸痛、畏寒体质人群',
      jp: '手足の冷え、血行不良、気圧や天候の変化で関節が痛む方',
      kr: '수족냉증, 관절 쑤심, 환절기 몸살 기운 및 피로 회복',
    },
  },
];
