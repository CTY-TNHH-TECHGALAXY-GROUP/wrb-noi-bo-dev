'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Check, Info, ShieldCheck, ChevronLeft, ChevronRight, Activity, Plus, ArrowRight } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { type VipPricingTable, type VipDuration, lookupPrice } from '@/lib/vipPricingEngine';
import { DEEP_BODY_TECHNIQUES, DeepBodyTechnique, DeepBodyLang } from '@/lib/deepBody.constants';
import { getDeepBodyT } from '../DeepBody.i18n';
import TechniqueGalleryModal from '../TechniqueGalleryModal';

const FALLBACK_PRICING: VipPricingTable = {
  '1': { '60': 720000, '70': 840000, '90': 1080000, '120': 1440000, '150': 1800000, '180': 2160000, '240': 2880000 },
  '2': { '60': 1080000, '70': 1260000, '90': 1620000, '120': 2160000, '150': 2700000, '180': 3240000, '240': 4320000 },
};

const AVAILABLE_DURATIONS: VipDuration[] = [70, 90, 120];

interface DeepBookingConfigProps {
  lang: string;
  isBookingFlow?: boolean;
  selectedStaffIds: string[];
  selectedStaffInfoList: VipStaffInfo[];
  vipPricingTable?: VipPricingTable;
  onConfirm: (
    data: {
      techniqueIds: string[];
      techniqueNames: string[];
      totalDuration: number;
      totalPrice: number;
      customerNotes?: string;
    },
    action?: 'SELECT_MORE' | 'CHECKOUT'
  ) => void;
}

export default function DeepBookingConfig({
  lang,
  isBookingFlow,
  selectedStaffIds,
  selectedStaffInfoList,
  vipPricingTable,
  onConfirm,
}: DeepBookingConfigProps) {
  const safeLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'en') as DeepBodyLang;
  const t = getDeepBodyT(lang);

  // States
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<string[]>([DEEP_BODY_TECHNIQUES[0].id]);
  const [selectedDuration, setSelectedDuration] = useState<VipDuration>(90);
  const [customerNotes, setCustomerNotes] = useState('');
  const [activeTechniqueForModal, setActiveTechniqueForModal] = useState<DeepBodyTechnique | null>(null);

  // Duration scroll indicators
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const pricingTable = vipPricingTable || FALLBACK_PRICING;
  const staffCount = Math.max(1, selectedStaffIds.length);
  const currentPrice = lookupPrice(pricingTable, staffCount, selectedDuration);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleToggleTechnique = (id: string) => {
    setSelectedTechniqueIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleConfirmOrder = (action: 'SELECT_MORE' | 'CHECKOUT') => {
    if (selectedTechniqueIds.length === 0) {
      alert(t.select_both_warning);
      return;
    }

    const selectedTechniques = DEEP_BODY_TECHNIQUES.filter((tech) =>
      selectedTechniqueIds.includes(tech.id)
    );
    const techniqueNames = selectedTechniques.map(
      (tech) => tech.name[safeLang] || tech.name.en
    );

    onConfirm(
      {
        techniqueIds: selectedTechniqueIds,
        techniqueNames,
        totalDuration: selectedDuration,
        totalPrice: currentPrice,
        customerNotes: customerNotes.trim(),
      },
      action
    );
  };

  const primaryStaff = selectedStaffInfoList[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-4 sm:px-6 pt-2 pb-16 max-w-5xl mx-auto"
    >
      {/* Therapist Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-2xl bg-[#1a1a1d] border border-[#e6c487]/30 flex items-center justify-between shadow-md"
      >
        <div className="flex items-center gap-3">
          {primaryStaff?.avatarUrl ? (
            <img
              src={primaryStaff.avatarUrl}
              alt={primaryStaff.fullName}
              className="w-12 h-12 rounded-xl object-cover border border-[#e6c487]/40 shadow"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#e6c487]/20 flex items-center justify-center font-bold text-[#e6c487]">
              {primaryStaff?.id || 'KTV'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-bold text-[#e6c487] tracking-wider">
                {primaryStaff?.id} • {primaryStaff?.fullName}
              </span>
              <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-gray-400">
              {staffCount === 2 ? 'Gói Tứ Thủ 2 Chuyên Viên (4-Hands)' : 'Chuyên Viên Trị Liệu Trọng Tâm'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 block font-medium">
            Menu
          </span>
          <span className="text-xs font-bold text-[#e6c487] tracking-wider">
            DEEP BODY
          </span>
        </div>
      </motion.div>

      {/* ── SECTION 1: DEEP BODY TECHNIQUES ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#e6c487] tracking-wide">
              {t.select_technique_title}
            </h3>
            <p className="text-xs text-gray-400">
              {t.select_technique_subtitle}
            </p>
          </div>
          <span className="text-xs font-bold text-[#e6c487] bg-[#e6c487]/15 px-3 py-1 rounded-full border border-[#e6c487]/30">
            {selectedTechniqueIds.length} đã chọn
          </span>
        </div>

        {/* Techniques Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {DEEP_BODY_TECHNIQUES.map((tech) => {
            const isSelected = selectedTechniqueIds.includes(tech.id);

            return (
              <div
                key={tech.id}
                onClick={() => handleToggleTechnique(tech.id)}
                className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1e1c19] border-[#e6c487] shadow-[0_0_20px_rgba(230,196,135,0.15)]'
                    : 'bg-[#151517] border-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  {/* Top row: Badge & Intensity */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isSelected
                          ? 'bg-[#e6c487] text-black'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {tech.badge[safeLang] || tech.badge.en}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] text-[#e6c487] font-semibold">
                      <Activity size={13} />
                      <span>{t.intensity_label}: {tech.intensity}/5</span>
                    </div>
                  </div>

                  {/* Title & Checkmark */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-[#e6c487] transition-colors">
                      {tech.name[safeLang] || tech.name.en}
                    </h4>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#e6c487] text-black' : 'border border-white/20'
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                    {tech.shortDesc[safeLang] || tech.shortDesc.en}
                  </p>
                </div>

                {/* Bottom link: View Technique Gallery Modal */}
                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTechniqueForModal(tech);
                    }}
                    className="text-[11px] text-[#e6c487] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Info size={12} />
                    <span>{t.view_details}</span>
                  </button>

                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                    #{tech.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 2: DURATION PICKER (Horizontal Slider) ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-[#e6c487]" />
          <h3 className="text-lg sm:text-xl font-bold text-[#e6c487] tracking-wide">
            {t.select_duration_title}
          </h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {t.duration_hint}
        </p>

        {/* Scroll Container */}
        <div className="relative">
          {/* Scroll indicators */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#131315] to-transparent z-10 flex items-center justify-start pointer-events-none">
              <ChevronLeft size={20} className="text-[#e6c487]" />
            </div>
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#131315] to-transparent z-10 flex items-center justify-end pointer-events-none">
              <ChevronRight size={20} className="text-[#e6c487]" />
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar scrollbar-hide snap-x"
          >
            {AVAILABLE_DURATIONS.map((dur) => {
              const price = lookupPrice(pricingTable, staffCount, dur);
              const isSelected = selectedDuration === dur;

              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`flex flex-col items-center justify-between w-[110px] sm:w-[125px] h-[140px] p-4 rounded-2xl shrink-0 transition-all border snap-center ${
                    isSelected
                      ? 'bg-[#1f1d19] border-[#e6c487] text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.2)] scale-102'
                      : 'bg-[#161618] border-white/5 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Duration
                  </span>

                  <div className="flex flex-col items-center my-1">
                    <span className="text-3xl sm:text-4xl font-black leading-none">{dur}</span>
                    <span className="text-xs font-semibold">{t.mins}</span>
                  </div>

                  <div className="w-8 h-px bg-white/10 my-1" />

                  <span className="text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap">
                    {price.toLocaleString('vi-VN')} đ
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CUSTOMER NOTES ── */}
      <section className="mb-8">
        <h3 className="text-sm font-bold text-[#e6c487] uppercase tracking-wider mb-2">
          {t.customer_notes_title}
        </h3>
        <textarea
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          rows={3}
          placeholder={t.customer_notes_placeholder}
          className="w-full bg-[#171719] border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#e6c487]/50 transition-colors"
        />
      </section>

      {/* ── SECTION 4: CONFIRMATION SUMMARY & CTA BUTTON ── */}
      <div className="sticky bottom-6 z-30 p-4 sm:p-5 rounded-2xl bg-[#141416]/95 backdrop-blur-xl border border-[#e6c487]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 block font-medium">
            Tổng cộng / Estimated Total
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#e6c487]">
              {currentPrice.toLocaleString('vi-VN')} VND
            </span>
            <span className="text-xs text-gray-400">
              • {selectedDuration} {t.mins}
            </span>
          </div>
        </div>

        {/* Actions: Left = Select More (sub object), Right = Checkout (main object) */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Sub Object: Select More */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('SELECT_MORE')}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl border border-[#e6c487]/40 bg-[#1c1c20] hover:bg-[#28282e] text-[#e6c487] font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={15} />
            <span>{t.btn_select_more}</span>
          </button>

          {/* Main Object: Checkout */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('CHECKOUT')}
            className="flex-1 sm:flex-initial px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[#e6c487] hover:bg-[#d6b272] text-[#382600] font-black uppercase tracking-wider text-xs sm:text-sm shadow-[0_4px_20px_rgba(230,196,135,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>{t.btn_checkout}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Technique Modal Preview */}
      <TechniqueGalleryModal
        isOpen={!!activeTechniqueForModal}
        technique={activeTechniqueForModal}
        lang={lang}
        onClose={() => setActiveTechniqueForModal(null)}
      />
    </motion.div>
  );
}
