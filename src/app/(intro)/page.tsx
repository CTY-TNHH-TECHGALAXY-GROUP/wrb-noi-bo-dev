/*
 * File: (intro)/page.tsx
 * Chức năng: Trang chủ (/) - Chọn ngôn ngữ
 * Hiển thị giao diện chọn ngôn ngữ với hiệu ứng sao và cờ quốc kỳ
 * Sau khi chọn ngôn ngữ, chuyển đến trang chọn dịch vụ
 */

"use client";

import React from "react";
import { useLanguageSelectorLogic } from "./LanguageSelector.logic";
import { languages } from "./LanguageSelector.lang";
import { animClasses } from "./animation";
import { useDeviceType } from "@/lib/useDeviceType";

// ============================================================================
// 👇 KHU VỰC CHỈNH SỬA GIAO DIỆN CHỌN NGÔN NGỮ (SỬA SỐ Ở ĐÂY) 👇
// ============================================================================
// Responsive config: trả về giá trị khác nhau cho Mobile / Tablet / Desktop
const getLayoutConfig = (isTabletOrAbove: boolean) => ({
  // 1. LOGO TRÊN CÙNG
  topLogo: {
    marginTop: "20px",
    width: isTabletOrAbove ? "280px" : "200px",
  },

  // 2. VÒNG TRÒN CỜ (ORBIT)
  orbit: {
    marginTop: isTabletOrAbove ? "160px" : "120px",
    centerLogoSize: isTabletOrAbove ? "130px" : "100px",
    radius: isTabletOrAbove ? 170 : 120,  // Hook sẽ tự scale thêm
  },

  // 3. CẤU HÌNH LÁ CỜ
  flag: {
    circleSize: isTabletOrAbove ? 88 : 64,
    flagSize: isTabletOrAbove ? "75px" : "55px",
    textSize: isTabletOrAbove ? "15px" : "12px",
  },

  // 4. CHỮ CHẠY (MARQUEE)
  marquee: {
    marginBottom: "20px",
    height: isTabletOrAbove ? "120px" : "100px",
    fontSize: isTabletOrAbove ? "22px" : "17px",
  }
});
// ============================================================================

/**
 * Component chính cho trang chọn ngôn ngữ
 * Sử dụng hook useLanguageSelectorLogic để quản lý logic
 */
export default function LanguageSelectorPage() {
  const { isTabletOrAbove } = useDeviceType();
  const LAYOUT_CONFIG = getLayoutConfig(isTabletOrAbove);

  const {
    greeting,
    showGreeting,
    handleSelectLanguage,
    getFlagPosition
  } = useLanguageSelectorLogic(LAYOUT_CONFIG.orbit.radius); // Truyền bán kính responsive từ config

  // Tạo mảng nội dung lặp lại để chạy chữ (4 lần để đảm bảo lấp đầy màn hình rộng)
  const marqueeContent = Array(4).fill("11 Ngo Duc Ke, Sai Gon Ward, HCMC, VietNam");

  return (
    <div className="w-full h-[100dvh] flex flex-col justify-center items-center px-6 relative overflow-hidden bg-black">

      {/* --- NỀN --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/0 z-0" />
        <img
          src="/assets/backgrounds/galaxy.webp"
          alt="Spa Background"
          className="w-full h-full object-cover opacity-100"
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img src="/assets/backgrounds/galaxy.webp" alt="Background" className="bg-image" />
        <div className="shooting-star star-1"></div>
        <div className="shooting-star star-2"></div>
        <div className="shooting-star star-3"></div>

      </div>

      {/* LOGO TRÊN CÙNG */}
      <div
        className={animClasses.logoTopContainer}
        style={{ top: `calc(${LAYOUT_CONFIG.topLogo.marginTop} + env(safe-area-inset-top))` }}
      >
        <img
          src="/assets/logos/logo-gold.webp"
          alt="Ngan Ha Spa"
          className={animClasses.logoTop}
          style={{ width: LAYOUT_CONFIG.topLogo.width }}
        />
      </div>

      {/* VÒNG TRÒN CỜ & LOGO GIỮA */}
      <div
        className={animClasses.orbitContainer}
        style={{ marginTop: LAYOUT_CONFIG.orbit.marginTop }}
      >


        {!showGreeting && languages.map((lang, index) => {
          const { x, y } = getFlagPosition(index);
          const cs = LAYOUT_CONFIG.flag.circleSize;
          return (
            <div
              key={lang.id}
              className="absolute top-1/2 left-1/2 z-30 cursor-pointer flex flex-col items-center"
              style={{
                width: `${cs}px`,
                marginLeft: `${-cs / 2}px`,
                marginTop: `${-cs / 2 - 10}px`,
                transform: `translate3d(${x}px, ${y}px, 0)`,
              }}
              onClick={() => handleSelectLanguage(lang.id)}
            >
              {/* Circle — cờ lấp đầy vòng tròn, giống mẫu Image 1 */}
              <div
                className="rounded-full overflow-hidden flex items-center justify-center hover:scale-110 hover:shadow-[0_0_25px_rgba(250,204,21,0.6)] transition-all duration-300 shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                style={{
                  width: `${cs}px`,
                  height: `${cs}px`,
                  border: '2px solid rgba(255,255,255,0.1)',
                }}
              >
                <img
                  src={lang.flag}
                  className="w-full h-full object-cover select-none"
                  alt={lang.name}
                  draggable={false}
                />
              </div>
              {/* Tên ngôn ngữ canh giữa dưới circle */}
              <span
                className="font-bold text-center leading-tight drop-shadow-sm mt-1.5 gold-text-soft"
                style={{ fontSize: LAYOUT_CONFIG.flag.textSize }}
              >
                {lang.name}
              </span>
            </div>
          );
        })}

        <div className={animClasses.greeting(showGreeting)}>
          {greeting}
        </div>
      </div>

      {/* --- PHẦN CHỮ CHẠY (MARQUEE) --- */}
      <div
        className={animClasses.marqueeWrapper}
        style={{
          bottom: `calc(${LAYOUT_CONFIG.marquee.marginBottom} + env(safe-area-inset-bottom))`,
          height: LAYOUT_CONFIG.marquee.height
        }}
      >
        <div className={`${animClasses.marqueeTrack} animate-scroll`}>
          {marqueeContent.map((text, i) => (
            <div
              key={i}
              className={animClasses.marqueeText}
              style={{ fontSize: LAYOUT_CONFIG.marquee.fontSize }}
            >
              11 Ngo Duc Ke, Sai Gon Ward, HCMC, VietNam
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}