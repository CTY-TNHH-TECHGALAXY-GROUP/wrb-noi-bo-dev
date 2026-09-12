'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Check, Info, ShieldCheck, Activity, Plus, ArrowRight } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { type VipPricingTable, type VipDuration, lookupPrice, lookupUsdPrice } from '@/lib/vipPricingEngine';
import { DEEP_BODY_TECHNIQUES, DeepBodyTechnique, DeepBodyLang, DEEP_BODY_DURATION_SERVICES } from '@/lib/deepBody.constants';
import { useMenuData } from '@/components/Menu/MenuContext';
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
      serviceId: string;
      techniqueIds: string[];
      techniqueNames: string[];
      totalDuration: number;
      totalPrice: number;
      totalPriceUSD?: number;
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

  const { services } = useMenuData();
  const staffCount = Math.max(1, selectedStaffIds.length);

  // Helper lấy service ID chuẩn trong DB (NHT0002, NHT0003, NHT0004) và bắt giá trực tiếp từ DB
  const getServiceInfo = (dur: number) => {
    const config = DEEP_BODY_DURATION_SERVICES[dur];
    const targetServiceId = config?.serviceId || `NHT000${dur === 70 ? 2 : dur === 90 ? 3 : 4}`;
    const dbService = services.find((s) => s.id === targetServiceId);

    const baseVnd = dbService?.priceVND ?? config?.defaultPriceVND ?? (dur === 70 ? 840000 : dur === 90 ? 1080000 : 1440000);
    const baseUsd = dbService?.priceUSD ?? config?.defaultPriceUSD ?? (dur === 70 ? 35 : dur === 90 ? 43 : 58);

    const priceVND = staffCount > 1 ? Math.round(baseVnd * 1.5) : baseVnd;
    const priceUSD = staffCount > 1 ? Math.round(baseUsd * 1.5) : baseUsd;

    return {
      serviceId: targetServiceId,
      priceVND,
      priceUSD,
    };
  };

  const currentService = getServiceInfo(selectedDuration);
  const currentPrice = currentService.priceVND;
  const currentUsdPrice = currentService.priceUSD;

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
        serviceId: currentService.serviceId,
        techniqueIds: selectedTechniqueIds,
        techniqueNames,
        totalDuration: selectedDuration,
        totalPrice: currentPrice,
        totalPriceUSD: currentUsdPrice,
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
      {/* Therapist Summary Bar - Square Bo Góc Responsive All Devices */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-[#1a1a1d] border border-[#e6c487]/35 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {primaryStaff?.avatarUrl ? (
            <img
              src={primaryStaff.avatarUrl}
              alt={primaryStaff.fullName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-[#e6c487]/50 shadow-md shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#e6c487]/20 flex items-center justify-center font-bold text-[#e6c487] text-lg sm:text-xl shrink-0">
              {primaryStaff?.id || t.staff_label}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg md:text-xl uppercase font-black text-[#e6c487] tracking-wider truncate">
                {primaryStaff?.id} • {primaryStaff?.fullName}
              </span>
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          <span className="text-xs sm:text-sm uppercase tracking-widest text-gray-400 block font-bold">
            {t.menu_badge}
          </span>
          <span className="text-sm sm:text-base md:text-lg font-extrabold text-[#e6c487] tracking-wider uppercase">
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

        {/* 3 Duration Cards Grid - Exactly 3 cards fit 1 row */}
        <div className="grid grid-cols-3 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 w-full">
          {AVAILABLE_DURATIONS.map((dur) => {
            const svc = getServiceInfo(dur);
            const isSelected = selectedDuration === dur;

            return (
              <button
                key={dur}
                type="button"
                onClick={() => setSelectedDuration(dur)}
                className={`flex flex-col items-center justify-between min-h-[190px] xs:min-h-[205px] sm:min-h-[225px] md:min-h-[240px] p-2.5 xs:p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#24211b] via-[#1d1b17] to-[#161513] border-[#e6c487] text-[#e6c487] shadow-[0_6px_30px_rgba(230,196,135,0.25)] ring-1 ring-[#e6c487]/40 scale-[1.02]'
                    : 'bg-[#161618] border-white/8 text-gray-300 hover:border-white/20 hover:bg-[#18181b] active:scale-[0.98]'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-75">
                  {t.duration_label}
                </span>

                <div className="flex flex-col items-center my-1 sm:my-2">
                  <span className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight">
                    {dur}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-bold mt-1 text-gray-300">
                    {t.mins}
                  </span>
                </div>

                <div className="w-12 sm:w-16 h-px bg-white/10 my-1 sm:my-1.5" />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center font-black">
                  <span className="text-xs xs:text-sm sm:text-base md:text-lg tracking-tight whitespace-nowrap">
                    {svc.priceVND.toLocaleString('vi-VN')} VND
                  </span>
                  <span className={`text-[11px] xs:text-xs sm:text-sm md:text-base font-bold whitespace-nowrap ${
                    isSelected ? 'text-[#e6c487]/90' : 'text-gray-400'
                  }`}>
                    / ${svc.priceUSD}
                  </span>
                </div>
              </button>
            );
          })}
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

      {/* ── SECTION 4: CONFIRMATION SUMMARY & CTA BUTTON (Xếp 2 nút xuống, tăng size duration) ── */}
      <div className="sticky bottom-6 z-30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#141416]/95 backdrop-blur-xl border border-[#e6c487]/40 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-4">
        {/* Top: Summary & Prominent Duration */}
        <div className="flex items-center justify-between w-full pb-3 border-b border-white/10">
          <div>
            <span className="text-xs sm:text-sm uppercase tracking-widest text-gray-400 block font-bold mb-1">
              {t.total_estimated}
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#e6c487] tracking-tight">
                {currentPrice.toLocaleString('vi-VN')} VND
              </span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400">
                / ${currentUsdPrice}
              </span>
            </div>
          </div>

          {/* Large prominent duration badge */}
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#e6c487]/15 border border-[#e6c487]/35 text-[#e6c487] shadow-inner">
            <Clock size={22} className="shrink-0 text-[#e6c487]" />
            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wide whitespace-nowrap">
              {selectedDuration} {t.mins}
            </span>
          </div>
        </div>

        {/* Bottom (Xếp 2 nút xuống): 2 CTA Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {/* Sub Object: Select More */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('SELECT_MORE')}
            className="w-full py-4 sm:py-4.5 rounded-xl border border-[#e6c487]/40 bg-[#1c1c20] hover:bg-[#28282e] text-[#e6c487] font-bold uppercase tracking-wider text-sm sm:text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            <span>{t.btn_select_more}</span>
          </button>

          {/* Main Object: Checkout */}
          <button
            type="button"
            onClick={() => handleConfirmOrder('CHECKOUT')}
            className="w-full py-4 sm:py-4.5 rounded-xl bg-[#e6c487] hover:bg-[#d6b272] text-[#382600] font-black uppercase tracking-wider text-sm sm:text-base shadow-[0_4px_20px_rgba(230,196,135,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
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
