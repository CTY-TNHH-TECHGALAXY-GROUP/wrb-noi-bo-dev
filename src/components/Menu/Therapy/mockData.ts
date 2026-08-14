/**
 * @deprecated This file is deprecated. Real data comes from:
 * - Staff: GET /api/staff/vip-available
 * - Pricing: GET /api/config/menu-vip  
 * - Skills: src/lib/vipSkills.constants.ts
 * 
 * DO NOT import from this file in new code.
 * Kept temporarily for reference only.
 */

export interface MockStaff {
  id: string;
  name: string;
  avatar: string;
  title: { vi: string; en: string };
  gender: 'male' | 'female';
  rating: number;
  reviewCount: number;
  isWorkingToday: boolean;
  availableAfter: string | null; // null = sẵn sàng, '15:30' = bận đến giờ đó
  nextWorkingDays: string[]; // Các ngày KTV có đi làm sắp tới (ISO date)
  skills: Record<string, boolean>;
}

export interface MockCategory {
  id: string;
  icon: string; // Material Symbols icon name
  vi: string;
  en: string;
}

export interface MockSkill {
  id: string;
  name: { vi: string; en: string };
  icon: string;
  duration: number; // phút
  cat: string;
}

// ---- DANH SÁCH NHÂN VIÊN (KTV) ----
export const mockStaff: MockStaff[] = [
  {
    id: 'NH001',
    name: 'Minh Anh',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8CjMbUGAiDeH8FOV-aFYwsMgXYMKhRzihUvDT4QfFemF1SeQayK_ht022P2_x2hnkzU09sXSvjX1hq0Ry7ldJMw29k9hmyr7NBLjhF90M1QHB0P7pN6zoPVYF2oDp1yO8r--xaAAyLFwNOpmMVfdIepRxhUN1zmvhiI9Ykgsg8oCePJkLtLJsdzy0YChZkXLBjOhP7qgFX9DSNsQ5AwMYSwKQjGEewOcnklpl1eqtEYOcnHLaRDsTkSJakwekJjYzLNWj9WxQkTc',
    title: { vi: 'Chuyên gia Chăm sóc Thụy Điển & Đá Nóng', en: 'Swedish & Hot Stone Specialist' },
    gender: 'female',
    rating: 4.9,
    reviewCount: 124,
    isWorkingToday: true,
    availableAfter: null,
    nextWorkingDays: ['2026-04-04', '2026-04-05', '2026-04-07'],
    skills: { body: true, facial: true, foot: false, hotstone: true }
  },
  {
    id: 'NH002',
    name: 'Tuấn Kiệt',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDv1BO05fmTERTJE8ClehvdWNRc5-DDVP-Aovf_N5Uk1HugvNo0gV7RhFSB1oizv6SNHpJDktwGI2h5-X9rEDB367LOfnRZa4pBrgtmUKgKdwd4EMpTI1Nrg9u4qobrKaAuncgD6TpOi-SIv63ezKS-ZAYm473jBeNU_hfUvjCxt93kGKd0SAlbK5VD_UogoGQPaxacPsd7GM_tmI3akaugXEEQCFA1Emw5taKwQEgyRnXlmMJzQe6CpeJ4mew1636KdOjGzeB2WuU',
    title: { vi: 'Trị liệu chuyên sâu & Bấm huyệt', en: 'Deep Tissue & Acupressure' },
    gender: 'male',
    rating: 4.8,
    reviewCount: 98,
    isWorkingToday: false,
    availableAfter: null,
    nextWorkingDays: ['2026-04-05', '2026-04-06', '2026-04-08'],
    skills: { body: true, facial: false, foot: true, hotstone: false }
  },
  {
    id: 'NH003',
    name: 'Hương Ly',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD--9-ma9e7Hb4zoRf236qXbPAET3ci5gUi0er1topSCkyKPT73qvbQDCxpO1_zCxEbHNxTGfj1Nrof_AIkyvu8qAo04CXlzpl3gWRbsUMYX434qz0QCUnDBB2xlxnxBDXx7A7XGF238_k4daWgNrb7JyLaN-lz8XLL8XkvNtGlJr9wbPayvnWzn5lKvNDyvu9uU404D4Q3HINsE1XagbBGfXSO3os-qU_kucD9Fh1X9kpR0hwcdUsYiIiKVnmOVjK3OgpPjq6ift4',
    title: { vi: 'Chăm sóc da mặt & Liệu pháp hương thơm', en: 'Facial Care & Aromatherapy' },
    gender: 'female',
    rating: 5.0,
    reviewCount: 156,
    isWorkingToday: true,
    availableAfter: null,
    nextWorkingDays: ['2026-04-04', '2026-04-06', '2026-04-07'],
    skills: { body: false, facial: true, foot: true, hotstone: false }
  },
  {
    id: 'NH004',
    name: 'Bảo Trâm',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLXtLmZJGE9Fx1luWWCYtf4Yqc-zC8c7xP2KBZMfM1iEHCGBRdajpQ9LKckhoUWvg3b6Yh6ct9oSIlPN8sFTf3LVG8MydwUHYrH__dNn20n7jQtFeLpcvq3yDPeIIyXxmhkAvw84x_LJQCJzffNJWD62BYrfjN70lHAGUmz-5x-QyndcCdFc4T1DompjmlnixZFoZoVjf59JwcCH7CvrlD-f_DuKq-s3ak4rTci9uH_s1uDtIhvq8QhR6xd661sAA7yXHMWrgyUDc',
    title: { vi: 'Chăm sóc toàn diện & Trị liệu Shiatsu', en: 'Full Body & Shiatsu Therapy' },
    gender: 'female',
    rating: 4.7,
    reviewCount: 82,
    isWorkingToday: true,
    availableAfter: '15:30',
    nextWorkingDays: ['2026-04-04', '2026-04-05', '2026-04-06'],
    skills: { body: true, facial: true, foot: true, hotstone: true }
  }
];

// ---- DANH MỤC DỊCH VỤ ----
export const mockCategories: MockCategory[] = [
  { id: 'body', icon: 'spa', vi: 'Chăm sóc Body', en: 'Body Therapy' },
  { id: 'facial', icon: 'face', vi: 'Chăm sóc da mặt', en: 'Facial Care' },
  { id: 'foot', icon: 'footprint', vi: 'Trị liệu chân', en: 'Foot Therapy' },
  { id: 'hotstone', icon: 'hot_tub', vi: 'Đá Nóng Trị Liệu', en: 'Hot Stone' },
];

// ---- DANH SÁCH KỸ NĂNG (SKILLS) ----
export const mockSkills: MockSkill[] = [
  { id: 'sk_deep_tissue', name: { vi: 'Deep Tissue', en: 'Deep Tissue' }, icon: 'spa', duration: 60, cat: 'body' },
  { id: 'sk_hot_stone', name: { vi: 'Hot Stone', en: 'Hot Stone' }, icon: 'hot_tub', duration: 90, cat: 'hotstone' },
  { id: 'sk_facial_ritual', name: { vi: 'Facial Ritual', en: 'Facial Ritual' }, icon: 'face', duration: 45, cat: 'facial' },
  { id: 'sk_aromatherapy', name: { vi: 'Aromatherapy', en: 'Aromatherapy' }, icon: 'psychology', duration: 60, cat: 'body' },
  { id: 'sk_foot_reflexology', name: { vi: 'Reflexology', en: 'Reflexology' }, icon: 'footprint', duration: 30, cat: 'foot' },
  { id: 'sk_shiatsu', name: { vi: 'Shiatsu', en: 'Shiatsu' }, icon: 'self_improvement', duration: 60, cat: 'body' },
  { id: 'sk_ray_body', name: { vi: 'Ray Body chuyên sâu', en: 'Deep Ray Body' }, icon: 'accessibility_new', duration: 70, cat: 'body' },
];

// ---- MOCK TIME SLOTS ----
export const mockTimeSlots = {
  morning: [
    { time: '08:00', available: true },
    { time: '09:30', available: true },
    { time: '11:00', available: true },
  ],
  afternoon: [
    { time: '14:00', available: true },
    { time: '15:30', available: false },
    { time: '17:00', available: true },
  ],
  evening: [
    { time: '19:00', available: true },
    { time: '20:30', available: false },
  ],
};

// ---- VIP PRICING ----
export const VIP_PRICE_PER_60_MIN = 200000; // 200k VNĐ / 60 phút
