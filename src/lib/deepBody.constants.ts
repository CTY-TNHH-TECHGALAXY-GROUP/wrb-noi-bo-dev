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
    id: 'coconutOil',
    name: {
      vi: 'Tinh Dầu Dừa',
      en: 'Coconut Oil',
      cn: '椰子精油',
      jp: 'ココナッツオイル',
      kr: '코코넛 오일',
    },
    shortDesc: {
      vi: 'Dưỡng ẩm sâu, xoa dịu căng thẳng và phục hồi làn da mịn màng với tinh dầu dừa tự nhiên ép lạnh.',
      en: 'Deeply hydrates skin, relieves muscle fatigue, and nurtures body circulation with natural cold-pressed coconut oil.',
      cn: '冷榨纯天然椰子油深层滋润肌肤，舒缓肌肉紧绷，促进全身柔和气血循环。',
      jp: 'コールドプレス製法の天然ココナッツオイルが肌を深部から潤し、筋肉の疲れを優しく癒します。',
      kr: '천연 냉압착 코코넛 오일로 피부에 깊은 보습을 전하고 뭉친 근육을 부드럽게 이완합니다.',
    },
    fullDesc: {
      vi: 'Phương pháp massage sử dụng tinh dầu dừa tự nhiên với các đường miết dài êm ái, thẩm thấu khoáng chất và axit béo có lợi vào da, nuôi dưỡng làn da mịn màng đồng thời giải phóng sự mệt mỏi tích tụ.',
      en: 'Features soothing long-stroke Swedish and therapeutic massage techniques using organic cold-pressed coconut oil, delivering rich nutrients and lasting relaxation.',
      cn: '融合舒缓的长推抚手法与天然有机椰子油，将有益脂质与微量元素送达肌底，焕活肌肤光泽并彻底舒解日常劳顿。',
      jp: '天然ココナッツオイルの豊かな香りと滑らかなストロークで、心身の緊張をゆっくりと解きほぐす極上の癒しトリートメント。',
      kr: '유기농 코코넛 오일을 활용한 부드럽고 깊은 스트로크로 영양을 공급하고 쌓인 피로를 편안하게 날려줍니다.',
    },
    badge: {
      vi: 'Dưỡng Ẩm & Thư Giãn',
      en: 'Hydration & Glow',
      cn: '滋养润肤',
      jp: '保湿・リラックス',
      kr: '보습 & 릴랙스',
    },
    thumbnail: '/assets/images/treatments/coconut-thumb.jpg',
    techniqueGallery: [
      '/assets/images/treatments/coconut-1.jpg',
      '/assets/images/treatments/coconut-2.jpg',
    ],
    intensity: 3,
    recommendedFor: {
      vi: 'Da khô ráp, mệt mỏi nhẹ, người thích lực vừa phải và thư giãn sâu',
      en: 'Dry skin, gentle tension, clients preferring medium pressure and relaxation',
      cn: '皮肤干燥、日常轻度疲劳、偏好适中力道与深度放松者',
      jp: '乾燥肌、日常の疲れ、適度な圧で心地よく癒されたい方',
      kr: '건조한 피부, 부드러운 압과 깊은 휴식을 원하는 고객',
    },
  },
  {
    id: 'thaiTherapy',
    name: {
      vi: 'Thái',
      en: 'Thai Therapy',
      cn: '泰式理疗',
      jp: 'タイ古式',
      kr: '타이 테라피',
    },
    shortDesc: {
      vi: 'Bấm huyệt dọc hệ kinh lạc Sen kết hợp các động tác kéo giãn yoga thụ động giúp mở khớp, kéo giãn tối đa.',
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
      vi: 'Shiatsu',
      en: 'Shiatsu',
      cn: '指压理疗',
      jp: '指圧',
      kr: '시아추',
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
      vi: 'Đá Nóng',
      en: 'Hot Stone',
      cn: '热石理疗',
      jp: 'ホットストーン',
      kr: '핫스톤',
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
