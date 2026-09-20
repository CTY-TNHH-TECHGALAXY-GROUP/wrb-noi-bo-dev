'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, Info, ShieldCheck, Plus, ArrowRight, ChevronDown } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import type { VipPricingTable } from '@/lib/vipPricingEngine';
import {
  DEEP_BODY_TECHNIQUES,
  DeepBodyTechnique,
  DeepBodyLang,
  DEEP_BODY_DURATION_SERVICES,
  DEEP_BODY_BASE_TECHNIQUE_IDS,
  type DeepBodyBaseTechniqueId,
  getDeepBodyMinDuration,
} from '@/lib/deepBody.constants';
import { useMenuData } from '@/components/Menu/MenuContext';
import { getDeepBodyT } from '../DeepBody.i18n';
import TechniqueGalleryModal from '../TechniqueGalleryModal';
import BodyFocusAvoidMap from '../BodyFocusAvoidMap';
import MixTechniquePopover from '../StaffSelector/MixTechniquePopover';

const DEEP_BODY_DURATION_LIST = [70, 90, 120, 150, 180] as const;

const DEEP_BODY_SERVICE_ID_MAP: Record<number, string> = {
  70: 'NHT0002',
  90: 'NHT0003',
  120: 'NHT0004',
  150: 'NHT0005',
  180: 'NHT0006',
};

interface DeepBookingConfigProps {
  lang: string;
  isBookingFlow?: boolean;
  selectedStaffIds: string[];
  selectedStaffInfoList: VipStaffInfo[];
  staffGroupingMode?: 'FOUR_HAND' | 'SEPARATE' | null;
  vipPricingTable?: VipPricingTable;
  dynamicMethods?: DeepBodyTechnique[];
  initialTechniqueIds?: DeepBodyBaseTechniqueId[];
  onConfirm: (
    data: {
      serviceId: string;
      techniqueIds: string[];
      techniqueNames: string[];
      totalDuration: number;
      totalPrice: number;
      totalPriceUSD?: number;
      customerNotes?: string;
      focus?: string[];
      avoid?: string[];
      note?: string;
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
  selectedStaffIds,
  selectedStaffInfoList,
  staffGroupingMode,
  dynamicMethods,
  initialTechniqueIds,
  onConfirm,
}: DeepBookingConfigProps) {
  const safeLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'en') as DeepBodyLang;
  const t = getDeepBodyT(lang);

  const methodsList = dynamicMethods && dynamicMethods.length > 0 ? dynamicMethods : DEEP_BODY_TECHNIQUES;

  const baseMethods = useMemo(() => {
    return methodsList.filter((tech) =>
      DEEP_BODY_BASE_TECHNIQUE_IDS.includes(tech.id as DeepBodyBaseTechniqueId)
    );
  }, [methodsList]);

  const mixMethod = useMemo(() => {
    return methodsList.find((tech) => tech.id === 'mixofourtherapies');
  }, [methodsList]);

  // States
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [avoidAreas, setAvoidAreas] = useState<string[]>([]);
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<DeepBodyBaseTechniqueId[]>(() => {
    if (initialTechniqueIds && initialTechniqueIds.length > 0) {
      const valid = initialTechniqueIds.filter((id) =>
        DEEP_BODY_BASE_TECHNIQUE_IDS.includes(id as DeepBodyBaseTechniqueId)
      );
      if (valid.length > 0) return valid;
    }
    return [DEEP_BODY_BASE_TECHNIQUE_IDS[0]];
  });

  useEffect(() => {
    if (!initialTechniqueIds || initialTechniqueIds.length === 0) {
      if (selectedTechniqueIds.length === 0) {
        setSelectedTechniqueIds([DEEP_BODY_BASE_TECHNIQUE_IDS[0]]);
      }
      return;
    }

    const valid = initialTechniqueIds.filter((id) =>
      DEEP_BODY_BASE_TECHNIQUE_IDS.includes(id as DeepBodyBaseTechniqueId)
    );

    if (valid.length > 0) {
      setSelectedTechniqueIds(valid);
    }
  }, [initialTechniqueIds]);
  const [isMixPopoverOpen, setIsMixPopoverOpen] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [activeTechniqueForModal, setActiveTechniqueForModal] = useState<DeepBodyTechnique | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(true);

  // Helper smooth scroll xuống tiếp theo
  const handleScrollDown = () => {
    const scrollParents = document.querySelectorAll('.overflow-y-auto');
    let scrolled = false;
    scrollParents.forEach((el) => {
      if (el.scrollHeight > el.clientHeight) {
        el.scrollBy({ top: 420, behavior: 'smooth' });
        scrolled = true;
      }
    });
    if (!scrolled && typeof window !== 'undefined') {
      window.scrollBy({ top: 420, behavior: 'smooth' });
    }
  };

  // Mũi tên floating hiển thị liên tục và CHỈ ẨN KHI GẦN ĐẾN CUỐI TRANG
  useEffect(() => {
    const checkScrollPosition = () => {
      const scrollParents = document.querySelectorAll('.overflow-y-auto');
      let isNearBottom = false;

      scrollParents.forEach((el) => {
        if (el.scrollHeight > el.clientHeight) {
          const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
          if (remaining < 220) {
            isNearBottom = true;
          }
        }
      });

      if (typeof window !== 'undefined') {
        const docRemaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
        if (docRemaining < 220) {
          isNearBottom = true;
        }
      }

      setShowScrollDown(!isNearBottom);
    };

    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    const scrollParents = document.querySelectorAll('.overflow-y-auto');
    scrollParents.forEach((el) => el.addEventListener('scroll', checkScrollPosition, { passive: true }));

    checkScrollPosition();

    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      scrollParents.forEach((el) => el.removeEventListener('scroll', checkScrollPosition));
    };
  }, []);

  // Luôn cuộn lên đỉnh đầu trang khi vào (bắt đầu từ số 1: Vị trí trọng tâm & Tránh chạm)
  useEffect(() => {
    const scrollToTop = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
      const scrollParents = document.querySelectorAll('.overflow-y-auto');
      scrollParents.forEach((el) => {
        el.scrollTop = 0;
      });
    };

    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const { services } = useMenuData();
  // Only apply Four-Hands multiplier when explicitly FOUR_HAND mode
  const isFourHands = staffGroupingMode === 'FOUR_HAND' && selectedStaffIds.length > 1;

  const deepBodyServices = useMemo(() => {
    return DEEP_BODY_DURATION_LIST.map((dur) => {
      const config = DEEP_BODY_DURATION_SERVICES[dur];
      const targetId = DEEP_BODY_SERVICE_ID_MAP[dur] || config?.serviceId;
      const found = services.find(
        (s) => s.id === targetId || (s.timeValue === dur && s.id.startsWith('NHT'))
      );
      return {
        id: found?.id || targetId,
        timeValue: dur,
        priceVND:
          found?.priceVND ??
          config?.defaultPriceVND ??
          (dur === 70 ? 840000 : dur === 90 ? 1080000 : dur === 120 ? 1440000 : dur === 150 ? 1800000 : 2160000),
        priceUSD:
          found?.priceUSD ??
          config?.defaultPriceUSD ??
          (dur === 70 ? 35 : dur === 90 ? 43 : dur === 120 ? 58 : dur === 150 ? 72 : 86),
      };
    });
  }, [services]);

  const minDuration = getDeepBodyMinDuration(selectedTechniqueIds.length);

  const availableServices = useMemo(() => {
    return deepBodyServices.filter((s) => s.timeValue >= minDuration);
  }, [deepBodyServices, minDuration]);

  const [selectedDuration, setSelectedDuration] = useState<number>(() => {
    const initialMin = getDeepBodyMinDuration(initialTechniqueIds?.length || 1);
    return Math.max(90, initialMin);
  });

  const effectiveDuration =
    selectedDuration >= minDuration
      ? selectedDuration
      : (availableServices[0]?.timeValue ?? minDuration);

  const currentService = useMemo(() => {
    return (
      availableServices.find((s) => s.timeValue === effectiveDuration) ||
      availableServices[0] ||
      deepBodyServices[0]
    );
  }, [availableServices, effectiveDuration, deepBodyServices]);

  const currentPrice = isFourHands ? Math.round(currentService.priceVND * 1.5) : currentService.priceVND;
  const currentUsdPrice = isFourHands ? Math.round(currentService.priceUSD * 1.5) : currentService.priceUSD;

  const handleToggleTechnique = (techId: DeepBodyBaseTechniqueId) => {
    setSelectedTechniqueIds((prev) => {
      // If currently single technique
      if (prev.length === 1) {
        if (prev[0] === techId) return prev;
        return [techId]; // Switch to the clicked single technique
      }
      // If currently in mix mode
      if (prev.includes(techId)) {
        return prev.filter((id) => id !== techId);
      } else {
        if (prev.length < 4) {
          return [...prev, techId];
        }
        return prev;
      }
    });
  };

  const handleOpenMixPopover = () => {
    setIsMixPopoverOpen(true);
  };

  const handleApplyMix = (newIds: DeepBodyBaseTechniqueId[]) => {
    setSelectedTechniqueIds(newIds);
    setIsMixPopoverOpen(false);
  };

  const handleConfirmOrder = (action: 'SELECT_MORE' | 'CHECKOUT') => {
    if (selectedTechniqueIds.length === 0) {
      alert(t.select_both_warning);
      return;
    }

    const selectedTechniques = baseMethods.filter((tech) =>
      selectedTechniqueIds.includes(tech.id as DeepBodyBaseTechniqueId)
    );
    const techniqueNames = selectedTechniques.map(
      (tech) => tech.name[safeLang] || tech.name.en
    );

    // Map body area keys to standard Vietnamese for Admin Dispatch & KTV
    const AREA_VN_MAP: Record<string, string> = {
      HEAD: 'Đầu',
      NECK: 'Cổ',
      SHOULDER: 'Vai',
      ARM: 'Tay',
      BACK: 'Lưng',
      THIGH: 'Đùi',
      KNEE: 'Gối',
      CALF: 'Bắp chân',
      FOOT: 'Bàn chân',
    };
    const getAreaNameVN = (k: string) => AREA_VN_MAP[k] || k;

    // Combine notes with bodyParts info standardized in Vietnamese for Admin/KTV
    const bodyNoteParts: string[] = [];
    if (focusAreas.length > 0) {
      bodyNoteParts.push(`Tập trung: ${focusAreas.map(getAreaNameVN).join(', ')}`);
    }
    if (avoidAreas.length > 0) {
      bodyNoteParts.push(`Tránh: ${avoidAreas.map(getAreaNameVN).join(', ')}`);
    }
    const cleanCustomerNote = customerNotes.trim();
    const combinedNotes = [
      bodyNoteParts.length > 0 ? `[${bodyNoteParts.join(' | ')}]` : '',
      cleanCustomerNote,
    ]
      .filter(Boolean)
      .join(' ');

    onConfirm(
      {
        serviceId: currentService.id,
        techniqueIds: selectedTechniqueIds,
        techniqueNames,
        totalDuration: currentService.timeValue,
        totalPrice: currentPrice,
        totalPriceUSD: currentUsdPrice,
        customerNotes: combinedNotes,
        focus: focusAreas,
        avoid: avoidAreas,
        note: cleanCustomerNote,
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
          {(primaryStaff?.avatarUrl || primaryStaff?.galleryUrls?.[0]) ? (
            <img
              src={primaryStaff?.avatarUrl || primaryStaff?.galleryUrls?.[0]}
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
      <section id="deep-section-technique" className="mb-8 scroll-mt-24">
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
          {baseMethods.map((tech) => {
            const isSelected = selectedTechniqueIds.includes(tech.id as DeepBodyBaseTechniqueId);

            return (
              <div
                key={tech.id}
                onClick={() => {
                  handleToggleTechnique(tech.id as DeepBodyBaseTechniqueId);
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTechniqueForModal(tech);
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#e6c487]/20 flex items-center justify-center text-gray-400 hover:text-[#e6c487] transition-colors shrink-0"
                    aria-label="Chi tiết kỹ thuật"
                  >
                    <Info size={16} />
                  </button>
                </div>

                {/* Right: Radio/Check Selection Button */}
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

          {/* Mix Card */}
          {mixMethod && (
            <div
              key={mixMethod.id}
              onClick={handleOpenMixPopover}
              className={`group relative p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                selectedTechniqueIds.length >= 2
                  ? 'bg-gradient-to-r from-[#1f1d19] via-[#1a1916] to-[#161513] border-[#e6c487] shadow-[0_4px_25px_rgba(230,196,135,0.18)] ring-1 ring-[#e6c487]/30'
                  : 'bg-[#151517] border-white/8 hover:border-white/20 hover:bg-[#18181b]'
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-3.5">
                  <h4 className="text-2xl sm:text-3xl md:text-[32px] font-black leading-tight tracking-wide text-white group-hover:text-[#e6c487] transition-colors truncate">
                    {mixMethod.name[safeLang] || mixMethod.name.en}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTechniqueForModal(mixMethod);
                    }}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-[#e6c487]/20 flex items-center justify-center text-gray-400 hover:text-[#e6c487] transition-colors shrink-0"
                    aria-label="Chi tiết gói kết hợp"
                  >
                    <Info size={16} />
                  </button>
                </div>
                {selectedTechniqueIds.length >= 2 && (
                  <p className="text-xs sm:text-sm text-[#e6c487]/90 mt-1 font-semibold truncate">
                    {t.selected_methods_count.replace('{count}', String(selectedTechniqueIds.length))}: {
                      baseMethods
                        .filter((m) => selectedTechniqueIds.includes(m.id as DeepBodyBaseTechniqueId))
                        .map((m) => m.name[safeLang] || m.name.en)
                        .join(' + ')
                    }
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end shrink-0 pl-2 sm:pl-4">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    selectedTechniqueIds.length >= 2
                      ? 'bg-[#e6c487] text-[#1c1c1e] shadow-[0_0_12px_rgba(230,196,135,0.4)] scale-105'
                      : 'border-2 border-white/25 group-hover:border-white/40'
                  }`}
                >
                  {selectedTechniqueIds.length >= 2 && <Check size={20} strokeWidth={3.5} />}
                </div>
              </div>
            </div>
          )}
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

        {/* Dynamic Duration Cards Grid matching ma trận thời lượng */}
        <div className={`grid gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 w-full ${
          availableServices.length === 3
            ? 'grid-cols-3'
            : availableServices.length === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}>
          {availableServices.map((svc, idx) => {
            const isSelected = effectiveDuration === svc.timeValue;
            const priceVND = isFourHands ? Math.round(svc.priceVND * 1.5) : svc.priceVND;
            const priceUSD = isFourHands ? Math.round(svc.priceUSD * 1.5) : svc.priceUSD;
            const isLastOfFive = availableServices.length === 5 && idx === 4;

            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => setSelectedDuration(svc.timeValue)}
                className={`flex flex-col items-center justify-between min-h-[190px] xs:min-h-[205px] sm:min-h-[225px] md:min-h-[240px] p-2.5 xs:p-3 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl transition-all duration-200 border cursor-pointer ${
                  isLastOfFive ? 'col-span-2 sm:col-span-1' : ''
                } ${
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
                    {svc.timeValue}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-bold mt-1 text-gray-300">
                    {t.mins}
                  </span>
                </div>

                <div className="w-12 sm:w-16 h-px bg-white/10 my-1 sm:my-1.5" />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center font-black">
                  <span className="text-xs xs:text-sm sm:text-base md:text-lg tracking-tight whitespace-nowrap">
                    {priceVND.toLocaleString('vi-VN')} VND
                  </span>
                  <span className={`text-[11px] xs:text-xs sm:text-sm md:text-base font-bold whitespace-nowrap ${
                    isSelected ? 'text-[#e6c487]/90' : 'text-gray-400'
                  }`}>
                    / ${priceUSD}
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
      <div className="relative sm:sticky sm:bottom-6 z-30 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#141416]/95 backdrop-blur-xl border border-[#e6c487]/40 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-3">
        {/* Mũi tên nổi có background blur hướng dẫn khách cuộn xuống dưới */}
        <AnimatePresence>
          {showScrollDown && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={handleScrollDown}
              className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/80 backdrop-blur-md border border-[#e6c487]/60 text-[#e6c487] shadow-[0_4px_20px_rgba(0,0,0,0.85)] flex items-center justify-center hover:bg-black/95 hover:border-[#e6c487] hover:scale-110 active:scale-95 transition-all cursor-pointer group"
              aria-label="Cuộn xuống xem tiếp"
              title="Cuộn xuống xem tiếp"
            >
              <ChevronDown size={24} className="animate-bounce text-[#e6c487] group-hover:text-white transition-colors" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Top: Summary & Prominent Duration */}
        <div className="flex flex-wrap items-center justify-between gap-3 min-w-0 w-full pb-3 border-b border-white/10">
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
              {effectiveDuration} {t.mins}
            </span>
          </div>
        </div>

        {/* Bottom (Xếp 2 nút xuống): 2 CTA Buttons */}
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4 w-full">
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

      {/* Mix Technique Popover */}
      {mixMethod && primaryStaff && isMixPopoverOpen && (
        <MixTechniquePopover
          key={`${primaryStaff.id}-${selectedTechniqueIds.join(',')}`}
          isOpen={isMixPopoverOpen}
          staff={primaryStaff}
          lang={lang}
          initialSelected={selectedTechniqueIds}
          onApply={handleApplyMix}
          onCancel={() => setIsMixPopoverOpen(false)}
        />
      )}
    </motion.div>
  );
}
