'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Check, Info, ShieldCheck, ChevronLeft, ChevronRight, Activity, Plus, ArrowRight } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { type VipPricingTable, type VipDuration, lookupPrice } from '@/lib/vipPricingEngine';
import { DEEP_BODY_TECHNIQUES, DeepBodyTechnique, DeepBodyLang } from '@/lib/deepBody.constants';
import { getDeepBodyT } from '../DeepBody.i18n';
import TechniqueGalleryModal from '../TechniqueGalleryModal';
import BodyFocusAvoidMap, { BodyAreaKey } from '../BodyFocusAvoidMap';

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
      bodyParts?: {
        focus: string[];
        avoid: string[];
      };
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
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [avoidAreas, setAvoidAreas] = useState<string[]>([]);
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
    setSelectedTechniqueIds([id]);
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

    // Map body area keys to localized names according to user language
    const AREA_I18N_MAP: Record<string, string> = {
      HEAD: t.area_head,
      NECK: t.area_neck,
      SHOULDER: t.area_shoulders,
      ARM: t.area_arms,
      BACK: t.area_back,
      THIGH: t.area_thigh,
      KNEE: t.area_knee,
      CALF: t.area_calf,
      FOOT: t.area_feet,
    };
    const getAreaName = (k: string) => AREA_I18N_MAP[k] || k;

    // Combine notes with bodyParts info in the selected language
    const bodyNoteParts: string[] = [];
    if (focusAreas.length > 0) {
      bodyNoteParts.push(`${t.body_map_col_focus}: ${focusAreas.map(getAreaName).join(', ')}`);
    }
    if (avoidAreas.length > 0) {
      bodyNoteParts.push(`${t.body_map_col_avoid}: ${avoidAreas.map(getAreaName).join(', ')}`);
    }
    const combinedNotes = [
      customerNotes.trim(),
      bodyNoteParts.length > 0 ? `[${bodyNoteParts.join(' | ')}]` : '',
    ]
      .filter(Boolean)
      .join(' ');

    onConfirm(
      {
        techniqueIds: selectedTechniqueIds,
        techniqueNames,
        totalDuration: selectedDuration,
        totalPrice: currentPrice,
        customerNotes: combinedNotes,
        bodyParts: {
          focus: focusAreas,
          avoid: avoidAreas,
        },
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
      className="flex flex-col px-2 sm:px-6 pt-2 pb-16 max-w-5xl mx-auto"
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
              {primaryStaff?.id || t.staff_label}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base uppercase font-bold text-[#e6c487] tracking-wider">
                {primaryStaff?.id} • {primaryStaff?.fullName}
              </span>
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs uppercase tracking-widest text-gray-400 block font-semibold">
            {t.menu_badge}
          </span>
          <span className="text-sm sm:text-base font-bold text-[#e6c487] tracking-wider uppercase">
            {t.tab_deep_body}
          </span>
        </div>
      </motion.div>

      {/* ── SECTION 1: BODY MAP (FOCUS & AVOID) ── */}
      <BodyFocusAvoidMap
        lang={lang}
        focusAreas={focusAreas}
        avoidAreas={avoidAreas}
        onChange={(newFocus, newAvoid) => {
          setFocusAreas(newFocus);
          setAvoidAreas(newAvoid);
        }}
      />

      {/* ── SECTION 2: DEEP BODY TECHNIQUES ── */}
      <section className="mb-8">
        <div className="mb-2">
          <h3 className="text-xl sm:text-2xl font-bold text-[#e6c487] tracking-wide">
            {t.select_technique_title}
          </h3>
          <p className="text-sm sm:text-base text-gray-300">
            {t.select_technique_subtitle}
          </p>
        </div>

        {/* Techniques List (1 card per row, large prominent typography matching Standard style) */}
        <div className="flex flex-col gap-3 sm:gap-3.5 mt-4">
          {DEEP_BODY_TECHNIQUES.map((tech) => {
            const isSelected = selectedTechniqueIds.includes(tech.id);

            return (
              <div
                key={tech.id}
                onClick={() => {
                  handleToggleTechnique(tech.id);
                  setActiveTechniqueForModal(tech);
                }}
                className={`group relative p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1f1d19] via-[#1a1916] to-[#161513] border-[#e6c487] shadow-[0_4px_25px_rgba(230,196,135,0.18)] ring-1 ring-[#e6c487]/30'
                    : 'bg-[#151517] border-white/8 hover:border-white/20 hover:bg-[#18181b]'
                }`}
              >
                {/* Left content: Title & Info Icon */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <h4 className="text-2xl sm:text-3xl md:text-[32px] font-black leading-tight tracking-wide text-white group-hover:text-[#e6c487] transition-colors truncate">
                    {tech.name[safeLang] || tech.name.en}
                  </h4>
                  <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#e6c487]/20 flex items-center justify-center text-gray-400 group-hover:text-[#e6c487] transition-colors shrink-0">
                    <Info size={16} />
                  </div>
                </div>

                {/* Right: Radio Selection Button */}
                <div className="flex items-center justify-end shrink-0 pl-2 sm:pl-4">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#e6c487] text-[#1c1c1e] shadow-[0_0_12px_rgba(230,196,135,0.4)] scale-105'
                        : 'border-2 border-white/25 group-hover:border-white/40'
                    }`}
                  >
                    {isSelected && <Check size={20} strokeWidth={3.5} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 2: DURATION PICKER (Horizontal Slider) ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Clock size={22} className="text-[#e6c487]" />
          <h3 className="text-xl sm:text-2xl font-bold text-[#e6c487] tracking-wide">
            {t.select_duration_title}
          </h3>
        </div>
        <p className="text-sm sm:text-base text-gray-300 font-medium mb-4">
          {t.duration_hint}
        </p>

        {/* Scroll Container */}
        <div className="relative">
          {/* Scroll indicators */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#131315] to-transparent z-10 flex items-center justify-start pointer-events-none">
              <ChevronLeft size={22} className="text-[#e6c487]" />
            </div>
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#131315] to-transparent z-10 flex items-center justify-end pointer-events-none">
              <ChevronRight size={22} className="text-[#e6c487]" />
            </div>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3.5 overflow-x-auto pb-3 custom-scrollbar scrollbar-hide snap-x"
          >
            {AVAILABLE_DURATIONS.map((dur) => {
              const price = lookupPrice(pricingTable, staffCount, dur);
              const isSelected = selectedDuration === dur;

              return (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`flex flex-col items-center justify-between w-[125px] sm:w-[145px] h-[160px] p-4 sm:p-5 rounded-2xl shrink-0 transition-all border snap-center ${
                    isSelected
                      ? 'bg-[#1f1d19] border-[#e6c487] text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.2)] scale-102'
                      : 'bg-[#161618] border-white/5 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                    {t.duration_label}
                  </span>

                  <div className="flex flex-col items-center my-1">
                    <span className="text-4xl sm:text-5xl font-black leading-none">{dur}</span>
                    <span className="text-sm sm:text-base font-bold mt-0.5">{t.mins}</span>
                  </div>

                  <div className="w-10 h-px bg-white/10 my-1" />

                  <span className="text-sm sm:text-base font-extrabold tracking-wide whitespace-nowrap">
                    {price.toLocaleString('vi-VN')} VND
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CUSTOMER NOTES ── */}
      <section className="mb-8">
        <h3 className="text-base sm:text-lg font-bold text-[#e6c487] uppercase tracking-wider mb-2.5">
          {t.customer_notes_title}
        </h3>
        <textarea
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          rows={3}
          placeholder={t.customer_notes_placeholder}
          className="w-full bg-[#171719] border border-white/10 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#e6c487]/50 transition-colors leading-relaxed"
        />
      </section>

      {/* ── SECTION 4: CONFIRMATION SUMMARY & CTA BUTTON ── */}
      <div className="sticky bottom-6 z-30 p-4 sm:p-6 rounded-2xl bg-[#141416]/95 backdrop-blur-xl border border-[#e6c487]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs sm:text-sm uppercase tracking-widest text-gray-300 block font-bold">
            {t.total_estimated}
          </span>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-[#e6c487]">
              {currentPrice.toLocaleString('vi-VN')} VND
            </span>
            <span className="text-sm sm:text-base font-medium text-gray-300">
              • {selectedDuration} {t.mins}
            </span>
          </div>
        </div>

        {/* Actions: Left = Select More (sub object), Right = Checkout (main object) */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Sub Object: Select More */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('SELECT_MORE')}
            className="flex-1 sm:flex-initial px-5 sm:px-7 py-4 sm:py-4.5 rounded-xl border border-[#e6c487]/40 bg-[#1c1c20] hover:bg-[#28282e] text-[#e6c487] font-bold uppercase tracking-wider text-sm sm:text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>{t.btn_select_more}</span>
          </button>

          {/* Main Object: Checkout */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('CHECKOUT')}
            className="flex-1 sm:flex-initial px-7 sm:px-9 py-4 sm:py-4.5 rounded-xl bg-[#e6c487] hover:bg-[#d6b272] text-[#382600] font-black uppercase tracking-wider text-sm sm:text-base shadow-[0_4px_20px_rgba(230,196,135,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <span>{t.btn_checkout}</span>
            <ArrowRight size={18} />
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
