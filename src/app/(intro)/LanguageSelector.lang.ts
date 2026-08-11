/*
 * File: LanguageSelector.lang.ts
 * Chức năng: Định nghĩa dữ liệu ngôn ngữ và text tĩnh
 * Chứa danh sách các ngôn ngữ hỗ trợ với thông tin cờ và greeting
 * Cung cấp text footer chung cho tất cả ngôn ngữ
 */

/**
 * Interface định nghĩa cấu trúc của một ngôn ngữ
 */
export interface Language {
  id: string;
  name: string;
  greeting: string;
  flag: string;   // URL hình ảnh cờ (fallback)
  emoji: string;  // Emoji cờ (primary display)
}

/**
 * Mảng chứa tất cả ngôn ngữ được hỗ trợ
 * Mỗi ngôn ngữ có thông tin cờ và greeting riêng
 */
/**
 * Twemoji CDN base URL for consistent flag rendering across platforms
 * Format: https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/{codepoint}.svg
 */
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

export const languages: Language[] = [
  {
    id: "en",
    name: "English",
    greeting: "Welcome to OriaSpa",
    flag: "/assets/flags/gb.webp",
    emoji: "🇬🇧"
  },
  {
    id: "vi",
    name: "Tiếng Việt",
    greeting: "OriaSpa Xin Chào",
    flag: "/assets/flags/vn.webp",
    emoji: "🇻🇳"
  },
  {
    id: "jp",
    name: "日本語",
    greeting: "OriaSpa ようこそ",
    flag: "/assets/flags/jp.webp",
    emoji: "🇯🇵"
  },
  {
    id: "kr",
    name: "한국어",
    greeting: "OriaSpa 의 인사",
    flag: "/assets/flags/kr.webp",
    emoji: "🇰🇷"
  },
  {
    id: "cn",
    name: "中文",
    greeting: "OriaSpa 向您问候",
    flag: "/assets/flags/cn.webp",
    emoji: "🇨🇳"
  }
];
