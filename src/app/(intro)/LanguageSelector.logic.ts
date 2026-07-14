/*
 * File: LanguageSelector.logic.ts
 * Chức năng: Hook logic cho trang chọn ngôn ngữ
 * Quản lý trạng thái greeting, vị trí cờ, và điều hướng
 * Xử lý việc chọn ngôn ngữ và lưu vào localStorage
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { languages } from "./LanguageSelector.lang";
import { useOrbitRotation } from "./animation";

/**
 * Hook chính chứa logic cho trang chọn ngôn ngữ
 * @returns Object chứa các state và hàm xử lý
 */
export const useLanguageSelectorLogic = (overrideRadius?: number) => {
  const router = useRouter();
  const [greeting, setGreeting] = useState(""); // Lưu trữ text greeting
  const [showGreeting, setShowGreeting] = useState(false); // Hiển thị greeting hay không
  const [radius, setRadius] = useState(overrideRadius || 0); // Bán kính quỹ đạo cờ

  const rotation = useOrbitRotation(); // Hook tạo hiệu ứng xoay quỹ đạo

  /**
   * useEffect để cập nhật bán kính dựa trên kích thước màn hình
   * Responsive: mobile 110px, desktop 120px
   */
  useEffect(() => {
    const updateRadius = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        // Desktop: larger orbit
        setRadius(overrideRadius ? Math.round(overrideRadius * 1.5) : 180);
      } else if (w >= 768) {
        // Tablet: medium orbit (scaled up for iPad)
        setRadius(overrideRadius ? Math.round(overrideRadius * 1.4) : 170);
      } else {
        // Mobile: compact orbit
        setRadius(overrideRadius || 110);
      }
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, [overrideRadius]);

  /**
   * Hàm xử lý khi người dùng chọn ngôn ngữ
   * @param langId - ID của ngôn ngữ được chọn (vi, en, jp, etc.)
   * Lưu ngôn ngữ vào localStorage và chuyển đến trang chọn dịch vụ sau 1.5s
   */
  const handleSelectLanguage = (langId: string) => {
    const lang = languages.find((l) => l.id === langId);
    if (!lang) return;

    setGreeting(lang.greeting);
    setShowGreeting(true);
    localStorage.setItem("app_lang", langId);

    setTimeout(() => {
      router.push(`/${langId}/customer-type`);
    }, 1500);
  };

  const step = (2 * Math.PI) / languages.length; // Góc giữa các cờ

  /**
   * Tính toán vị trí của cờ dựa trên index
   * @param index - Vị trí của ngôn ngữ trong mảng
   * @returns Object {x, y} - Tọa độ vị trí cờ
   */
  const getFlagPosition = (index: number) => {
    if (radius === 0) return { x: 0, y: 0 };

    const angle = step * index + rotation;
    const x = parseFloat((Math.cos(angle) * radius).toFixed(4));
    const y = parseFloat((Math.sin(angle) * radius).toFixed(4));

    return { x, y };
  };

  // Trả về object chứa tất cả state và hàm cần thiết cho component
  return {
    greeting,
    showGreeting,
    handleSelectLanguage,
    getFlagPosition,
    radius
  };
};