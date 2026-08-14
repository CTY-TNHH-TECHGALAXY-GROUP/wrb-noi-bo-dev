import React from 'react';
import { motion } from 'framer-motion';
import { mockCategories } from '../mockData';

// =============================================
// 📂 Category Selector – CELESTIAL Design  
// Sub-screen for Service-led flow
// =============================================

interface CategorySelectorProps {
  lang: string;
  onSelectCategory: (categoryId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  body: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  facial: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  foot: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
  hotstone: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
};

const CategorySelector = ({ lang, onSelectCategory }: CategorySelectorProps) => {
  const isVi = lang === 'vi';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-6 pt-4 pb-8"
    >
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-serif italic text-[#e6c487] leading-tight mb-2">
          {isVi ? 'CHỌN THEO NHU CẦU' : 'SELECT TREATMENT'}
        </h2>
        <p className="text-[11px] tracking-[0.15em] uppercase text-[#d0c5b5]/80">
          {isVi ? 'Hệ thống sẽ tìm chuyên gia phù hợp nhất' : 'We will match the best specialist for you'}
        </p>
      </motion.section>

      {/* Category Cards */}
      <div className="grid grid-cols-2 gap-4">
        {mockCategories.map((cat, idx) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.08, duration: 0.35 }}
            onClick={() => onSelectCategory(cat.id)}
            className="bg-[#1b1b1d] hover:bg-[#2a2a2c] border border-[#4d463a]/20 rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center transition-all duration-300 h-[140px] group active:scale-95"
          >
            <div className="text-[#e6c487] mb-3 group-hover:scale-110 transition-transform">
              {CATEGORY_ICONS[cat.id] || CATEGORY_ICONS.body}
            </div>
            <span className="text-sm font-medium text-[#d0c5b5] group-hover:text-[#e6c487] transition-colors">
              {isVi ? cat.vi : cat.en}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default CategorySelector;
