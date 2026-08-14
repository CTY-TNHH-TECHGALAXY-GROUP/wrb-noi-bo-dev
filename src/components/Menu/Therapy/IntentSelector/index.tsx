import React from 'react';
import { motion } from 'framer-motion';

// =============================================
// 🎨 Intent Selector – CELESTIAL Design
// Màn hình "Lời Chào Tiên Quyết"
// =============================================

interface IntentSelectorProps {
  lang: string;
  onSelectIntent: (intent: 'service_led' | 'staff_led') => void;
}

// Background images from the mockup
const SERVICE_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb8UBdrKfqj8bwY8Ol1VYYTqTv8p2T0yyEJVvcjF3qyw7yX04ejqe4a3Y0kwkxKdbhCaydf5_7Tq4g_nd1fY7QDPFsZtsJvIqP5_TRzNdwIVGQc9AOc0k9F2hcvptyAMmgQGFyW5qZUQJ7jpSI9O7j-KU-sDr_QO4ZnldJ-HZkos8uLs_8w4mj_pWWsFpTSVt-RI-FppnFxuwC3dt7TysAsA9a3uKN4dXLIHCyk9EqCFhNMiJxqm0UFNw88xvXYZe33yLT6N49M9k';
const STAFF_BG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8wOKzA1nDfrOiA7RteIo3gMGtFzDWlRMfkrGKiQkRh5IhVBJiJO8FNSuuuD2gF-tdwUt1eBDw4ZdC_hN9t1zgcUJbvpOMJ_46XWFBUVhPBzj7Py9YPPMXmP1eXmLHPmkHSdGfRYo-ncQmZjFC1tjzbWVGifSxee3MFm8-wVnjWAJsxB-yN0Fr7BbcLWDMsuUkiNVPY9FeKinPUjvM86ZEGysJ3XQd1WNhX6cOf6xXzPXPD9CGuxjFawcJkaHoY-Y9_Wl3iUmrjH8';

const IntentSelector = ({ lang, onSelectIntent }: IntentSelectorProps) => {
  const isVi = lang === 'vi';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-6 pt-4 pb-8"
    >
      {/* Hero Header */}
      <section className="mb-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-serif italic text-[#e6c487] leading-tight mb-3"
        >
          {isVi ? 'LỜI CHÀO TIÊN QUYẾT' : 'YOUR SANCTUARY'}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#d0c5b5] text-sm tracking-wide"
        >
          {isVi ? 'Hôm nay quý khách muốn tập trung vào điều gì?' : 'What brings you joy today?'}
        </motion.p>

        {/* Divider ornament */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center justify-center"
        >
          <div className="h-px w-12 bg-[#e6c487]/30" />
          <span className="mx-4 text-[10px] tracking-[0.3em] text-[#e6c487] uppercase font-medium">
            Select Your Path
          </span>
          <div className="h-px w-12 bg-[#e6c487]/30" />
        </motion.div>
      </section>

      {/* Card Grid */}
      <div className="space-y-6">
        {/* Card 1: Select by Service */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          onClick={() => onSelectIntent('service_led')}
          className="relative group h-[260px] w-full rounded-[2rem] overflow-hidden bg-[#1b1b1d] shadow-2xl cursor-pointer active:scale-[0.98] transition-transform duration-200"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={SERVICE_BG}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full p-7 flex flex-col justify-end">
            <div className="mb-3 bg-[#e6c487]/10 backdrop-blur-md p-3 rounded-full border border-[#e6c487]/20 w-fit">
              <svg className="w-7 h-7 text-[#e6c487]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <h3 className="text-xl font-serif italic text-[#e4e2e4] mb-1.5">
              {isVi ? 'CHỌN THEO DỊCH VỤ' : 'FOCUS ON TREATMENT'}
            </h3>
            <p className="text-[#d0c5b5] text-[10px] tracking-[0.15em] uppercase mb-5">
              {isVi ? 'Trải nghiệm thuần khiết' : 'Pure healing experience'}
            </p>
            <div className="bg-[#e6c487] text-[#412d00] px-7 py-2.5 rounded-full text-[10px] tracking-[0.15em] uppercase font-bold shadow-lg shadow-[#e6c487]/20 w-fit">
              {isVi ? 'Khám phá ngay' : 'Explore'}
            </div>
          </div>
        </motion.div>

        {/* Card 2: Select by Staff */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          onClick={() => onSelectIntent('staff_led')}
          className="relative group h-[260px] w-full rounded-[2rem] overflow-hidden bg-[#1b1b1d] shadow-2xl cursor-pointer active:scale-[0.98] transition-transform duration-200"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={STAFF_BG}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#131315] via-[#131315]/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full p-7 flex flex-col justify-end">
            <div className="mb-3 bg-[#ffb597]/10 backdrop-blur-md p-3 rounded-full border border-[#ffb597]/20 w-fit">
              <svg className="w-7 h-7 text-[#ffb597]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-serif italic text-[#e4e2e4] mb-1.5">
              {isVi ? 'CHỌN NHÂN VIÊN TRỰC TIẾP' : 'PREFERRED THERAPIST'}
            </h3>
            <p className="text-[#d0c5b5] text-[10px] tracking-[0.15em] uppercase mb-5">
              {isVi ? 'Kết nối cá nhân hóa' : 'Personalized connection'}
            </p>
            <div className="bg-[#e6c487] text-[#412d00] px-7 py-2.5 rounded-full text-[10px] tracking-[0.15em] uppercase font-bold shadow-lg shadow-[#e6c487]/20 w-fit">
              {isVi ? 'Khám phá ngay' : 'Explore'}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IntentSelector;
