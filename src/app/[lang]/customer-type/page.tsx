/* File: src/app/[lang]/customer-type/page.tsx */
"use client";

import React, { useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowRight, X, Loader2, ArrowLeft, History, Search, Phone, Calendar } from "lucide-react";
import { languages } from "../../(intro)/LanguageSelector.lang";
import { useCustomerTypeLogic } from "./CustomerType.logic";
import { GoogleLoginBtn } from '@/components/Auth/GoogleLoginBtn';

// ============================================================================
// 👇 KHU VỰC CHỈNH SỬA GIAO DIỆN (SỬA SỐ Ở ĐÂY) 👇
// ============================================================================
const LAYOUT_CONFIG = {
  // 1. CẤU HÌNH LOGO
  logo: {
    width: "260px",          
    height: "200px",    
    marginBottom: "8px", 
  },
};
// ============================================================================

export default function CustomerTypePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const lang = (params?.lang as string) || "en";
  const [inputValue, setInputValue] = useState("");

  const handleLanguageChange = (newLang: string) => {
    // Replace the current language in the pathname
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.replace(newPath); // Dùng replace thay vì push để tránh sinh lịch sử rác
  };

  const {
    t,                    // <-- Lấy hàm dịch
    showPopup,
    popupStep,
    isLoading,
    failedEmail,
    onRegisterNewCustomer,
    onSelectOldUser,
    onSelectWalkIn,
    onSelectAdvance,
    onSelectContactedFirst,
    handleCheckUserEmail,
    handleRetry,
    closePopup,
    handleBack,           // <-- Lấy hàm quay lại
    handleLogoutClick,    // <-- Lấy hàm đăng xuất
    user,                 // <-- Lấy thông tin user đăng nhập
    getCommonAnimationClass,
    getPopupOverlayClass, // <-- Lấy animation popup
    getPopupContentClass  // <-- Lấy animation content
  } = useCustomerTypeLogic(lang);

  return (
    <div className="w-full min-h-[100dvh] flex flex-col justify-center items-center relative overflow-hidden bg-[#050505] text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-sans">
      
      {/* Định nghĩa Keyframes cho hiệu ứng quét sáng */}
      <style>{`
        @keyframes spaSweep {
          0%, 62% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>

      {/* --- NỀN --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          src="/Video/From Klickpin.com- Copy this guide to clever herb garden ideas everyone will ask you about using simple ideas you can actually pull off and turn s.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center opacity-100 pointer-events-none"
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
      </div>

      {/* Đã xóa mũi tên quay lại vì đây là trang chủ mới */}

      {/* --- KHUNG NỘI DUNG CHÍNH --- */}
      <div className={`relative z-10 w-full max-w-[460px] md:max-w-[540px] px-5 py-6 ${getCommonAnimationClass()}`}>

        {/* --- LOGO --- */}
        <div
          className="mx-auto relative flex items-center justify-center text-[#f5df8b] drop-shadow-[0_0_12px_rgba(222,180,79,0.22)]"
          style={{
            width: LAYOUT_CONFIG.logo.width,
            height: LAYOUT_CONFIG.logo.height,
            marginBottom: LAYOUT_CONFIG.logo.marginBottom
          }}
        >
          {/* Logo SVG từ HTML hoặc ảnh hiện tại đều được. Dùng ảnh hiện tại để đồng bộ */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-[#d8b34e]/20 rounded-full blur-xl animate-pulse"></div>
          <div 
            className="w-full h-full relative z-10" 
            style={{
                backgroundColor: "#f7ebc7",
                WebkitMaskImage: "url('/Image/ria%20Spa-2.png')",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: "url('/Image/ria%20Spa-2.png')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
            }}
          />
        </div>

        {/* --- ĐÃ XÓA TIÊU ĐỀ WELCOME --- */}

        {/* --- ACTIONS GRID (4 BUTTONS) --- */}
        <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
          
          {/* HISTORY (HIGHLIGHTED) */}
          <button 
            onClick={onSelectOldUser}
            className="relative overflow-hidden flex flex-col justify-between min-h-[135px] md:min-h-[155px] border border-[#ecc964]/80 rounded-[22px] p-[18px] md:p-6 text-white text-left outline-none transition-all duration-250 hover:border-[#f1d376] hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#f5df8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] shadow-[0_4px_20px_rgba(236,201,100,0.15)] group"
            style={{
              background: 'linear-gradient(135deg, rgba(72, 55, 24, 0.9), rgba(27, 23, 15, 0.9))'
            }}
          >
            {/* Hiệu ứng quét sáng */}
            <div 
              className="absolute inset-0 pointer-events-none animate-[spaSweep_4.2s_ease-in-out_infinite]"
              style={{ background: 'linear-gradient(110deg, transparent 28%, rgba(255,234,160,.12), transparent 66%)' }}
            />
            
            <div className="flex justify-between items-start w-full relative z-10">
              <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-[#2b1c04] bg-gradient-to-r from-[#f5df8b] to-[#c99932] text-[20px] md:text-[24px] shadow-lg">
                <History size={22} className="md:w-6 md:h-6" />
              </span>
              
            </div>
            <span className="block mt-3 md:mt-4 relative z-10">
              <span className="block text-[#fae9a2] text-[16px] md:text-[19px] font-bold leading-tight">{t('btn_history_title')}</span>
              <span className="block mt-1.5 md:mt-2 text-white/70 text-[11.5px] md:text-[13px] leading-relaxed">{t('btn_history_desc')}</span>
            </span>
          </button>

          {/* WALK-IN */}
          <button 
            onClick={onSelectWalkIn}
            className="flex flex-col justify-between min-h-[135px] md:min-h-[155px] border border-[#c4972f]/50 rounded-[22px] p-[18px] md:p-6 text-white bg-[#12100c]/80 text-left outline-none transition-all duration-250 hover:border-[#f1d376]/90 hover:bg-[#261f12]/90 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#f5df8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-[#f5df8b] bg-[#b2861d]/20 text-[20px] md:text-[24px]">
              <ArrowRight size={22} className="md:w-6 md:h-6" />
            </span>
            <span className="block mt-3 md:mt-4">
              <span className="block text-[#f5dd83] text-[16px] md:text-[19px] font-bold leading-tight">{t('btn_walkin_title')}</span>
              <span className="block mt-1.5 md:mt-2 text-white/50 text-[11.5px] md:text-[13px] leading-relaxed">{t('btn_walkin_desc')}</span>
            </span>
          </button>

          {/* ADVANCE BOOKING */}
          <button 
            onClick={onSelectAdvance}
            className="flex flex-col justify-between min-h-[135px] md:min-h-[155px] border border-[#c4972f]/50 rounded-[22px] p-[18px] md:p-6 text-white bg-[#12100c]/80 text-left outline-none transition-all duration-250 hover:border-[#f1d376]/90 hover:bg-[#261f12]/90 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#f5df8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-[#f5df8b] bg-[#b2861d]/20 text-[20px] md:text-[24px]">
              <Calendar size={22} className="md:w-6 md:h-6" />
            </span>
            <span className="block mt-3 md:mt-4">
              <span className="block text-[#f5dd83] text-[16px] md:text-[19px] font-bold leading-tight">{t('btn_advance_title')}</span>
              <span className="block mt-1.5 md:mt-2 text-white/50 text-[11.5px] md:text-[13px] leading-relaxed">{t('btn_advance_desc')}</span>
            </span>
          </button>

          {/* CONTACTED FIRST */}
          <button 
            onClick={onSelectContactedFirst}
            className="flex flex-col justify-between min-h-[135px] md:min-h-[155px] border border-[#c4972f]/50 rounded-[22px] p-[18px] md:p-6 text-white bg-[#12100c]/80 text-left outline-none transition-all duration-250 hover:border-[#f1d376]/90 hover:bg-[#261f12]/90 hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#f5df8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            <span className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-[#f5df8b] bg-[#b2861d]/20 text-[20px] md:text-[24px]">
              <Phone size={22} className="md:w-6 md:h-6" />
            </span>
            <span className="block mt-3 md:mt-4">
              <span className="block text-[#f5dd83] text-[16px] md:text-[19px] font-bold leading-tight">{t('btn_booking_title')}</span>
              <span className="block mt-1.5 md:mt-2 text-white/50 text-[11.5px] md:text-[13px] leading-relaxed">{t('btn_booking_desc')}</span>
            </span>
          </button>

        </div>


        {/* --- LANGUAGE SELECTOR (FLAGS) --- */}
        <div className="mt-8 flex justify-center items-center gap-4">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLanguageChange(l.id)}
              className={`w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all ${
                lang === l.id 
                  ? 'border-[#f5df8b] scale-110 shadow-[0_0_15px_rgba(245,223,139,0.5)]' 
                  : 'border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={l.flag} alt={l.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

      </div>

      {/* --- POPUP (GIỮ NGUYÊN) --- */}
      <div className={getPopupOverlayClass(showPopup)}>
        <div className={`${getPopupContentClass(showPopup)} !bg-[#0f1218] !border-[#2a2f3e] !rounded-[32px] !p-8 !max-w-[400px]`}>
          
          {popupStep === 'input' ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#8B6E40]/30 flex items-center justify-center">
                  <History size={48} className="text-[#D4AF37]" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 bg-[#D4AF37] blur-3xl opacity-20 rounded-full"></div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {t('find_history')}
              </h3>
              <p className="text-sm text-gray-400 mb-6 font-medium">
                {t('desc_enter_email')}
              </p>

              <div className="w-full mb-4 shadow-lg rounded-[8px]">
                <GoogleLoginBtn lang={lang} />
              </div>

              <div className="flex items-center gap-3 w-full mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('or_manual')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="w-full space-y-4">
                <input
                  type="text"
                  placeholder={t('input_placeholder')}
                  className="w-full bg-[#161b26] border border-[#2a3040] rounded-2xl p-4 text-white text-center font-bold text-lg focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308] outline-none transition-all placeholder-gray-600"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckUserEmail(inputValue)}
                  autoFocus
                />

                <button
                  onClick={() => handleCheckUserEmail(inputValue)}
                  disabled={isLoading}
                  className="w-full bg-[#EAB308] hover:bg-[#d9a507] text-black font-extrabold text-[15px] py-4 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {t('search')} <Search size={18} strokeWidth={3} />
                    </>
                  )}
                </button>

                <button
                  onClick={closePopup}
                  className="text-gray-500 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors mt-2"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-center animate-in zoom-in duration-300">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border-4 border-red-500/20 flex items-center justify-center text-red-500 mb-2">
                <X size={40} strokeWidth={3} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1">{t('error_not_found')}</h3>
                <p className="text-sm text-gray-400">{t('error_desc')}</p>
                {failedEmail && (
                  <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 font-medium text-sm text-center break-all">{failedEmail}</p>
                  </div>
                )}
                </div>

              <div className="flex flex-col gap-3 mt-4">
                <button onClick={handleRetry} className="w-full bg-[#2a2f3e] hover:bg-[#353b4d] text-white font-bold py-3.5 rounded-xl border border-white/5 transition-colors">
                  {t('btn_retry')}
                </button>
                <button onClick={onRegisterNewCustomer} className="w-full bg-[#EAB308] hover:bg-[#d9a507] text-black font-bold py-3.5 rounded-xl uppercase tracking-wide shadow-md transition-colors">
                    {t('btn_register_new')}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}