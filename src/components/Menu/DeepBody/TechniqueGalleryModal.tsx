'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { DeepBodyTechnique, DeepBodyLang } from '@/lib/deepBody.constants';
import { getDeepBodyT } from './DeepBody.i18n';

interface TechniqueGalleryModalProps {
  isOpen: boolean;
  technique: DeepBodyTechnique | null;
  lang: string;
  onClose: () => void;
}

export default function TechniqueGalleryModal({
  isOpen,
  technique,
  lang,
  onClose,
}: TechniqueGalleryModalProps) {
  const safeLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'en') as DeepBodyLang;
  const t = getDeepBodyT(lang);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !technique) return null;

  const images = [technique.thumbnail, ...technique.techniqueGallery];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Top Gold Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#e6c487] to-transparent opacity-80" />

          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {technique.name[safeLang] || technique.name.en}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 ml-3"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto py-4 space-y-4 custom-scrollbar pr-1">
            {/* Image Slider */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg group">
              <img
                src={images[activeImageIndex]}
                alt={technique.name[safeLang]}
                className="w-full h-full object-cover transition-all duration-300"
                onError={(e) => {
                  // Fallback to elegant gradient if photo not yet present
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Fallback Display if image not loaded */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1c1c1f] to-[#0f0f11] -z-10">
                <Sparkles size={36} className="text-[#e6c487] mb-2 opacity-80" />
                <h4 className="text-base font-bold text-[#e6c487]">
                  {technique.name[safeLang]}
                </h4>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  {technique.shortDesc[safeLang]}
                </p>
              </div>

              {/* Navigation Arrows (if > 1 image) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === activeImageIndex
                            ? 'bg-[#e6c487] w-4'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Detailed Description */}
            <div className="bg-[#1b1b1e] p-4 rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-[#e6c487] uppercase tracking-wider">
                {t.clinical_overview_title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                {technique.fullDesc[safeLang] || technique.fullDesc.en}
              </p>
            </div>

            {/* Recommended For */}
            <div className="bg-[#e6c487]/10 p-4 rounded-2xl border border-[#e6c487]/20 flex items-start gap-3">
              <span className="text-[#e6c487] text-lg">💡</span>
              <div>
                <span className="text-[11px] font-bold text-[#e6c487] uppercase tracking-wider block mb-0.5">
                  {t.recommended_label}
                </span>
                <p className="text-xs sm:text-sm text-gray-200">
                  {technique.recommendedFor[safeLang] || technique.recommendedFor.en}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[#e6c487] hover:bg-[#d4b070] text-black text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
