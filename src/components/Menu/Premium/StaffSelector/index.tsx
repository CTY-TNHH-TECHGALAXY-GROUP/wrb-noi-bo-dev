'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { type VipStaffInfo, getStaffVipSkills, groupSkillsByType } from '@/lib/vipStaffUtils';
import { getT, tpl } from '../Premium.i18n';
import StaffImageCarousel from '../../DeepBody/StaffSelector/StaffImageCarousel';
import { resolveVipGalleryForStaff, type TherapyGalleryParsedItem } from '@/lib/menuPhotos.helper';
import CertificateModal from '../../DeepBody/CertificateModal';
import { type DeepBodyBaseTechniqueId } from '@/lib/deepBody.constants';
import { type VipLang } from '@/lib/vipSkills.constants';

// =============================================
// 🧑 Staff Selector – REAL DATA (Pha 3)
// Fetch từ GET /api/staff/vip-available
// Hiển thị trạng thái thực AVAILABLE/BUSY/OFF/ON_LEAVE
// =============================================

// 🔧 UI CONFIGURATION
const MAX_SELECTABLE_STAFF = 2;
const SKILL_PREVIEW_COUNT = 3;

const BRIDGE_I18N = {
  badge: {
    vi: 'KHÁM PHÁ THÊM',
    en: 'DISCOVER MORE',
    cn: '探索更多',
    jp: 'さらに探索',
    kr: '더 알아보기',
  },
  title: {
    vi: 'Nghệ nhân body chuyên sâu',
    en: 'Artisan Deep Body',
    cn: '深层身体匠人',
    jp: 'ディープボディ職人',
    kr: '딥 바디 장인',
  },
  subtitle: {
    vi: 'Phục hồi chuyên sâu toàn thân với kỹ thuật Ấn huyệt Shiatsu, Massage Thái, Tinh dầu dừa & Đá nóng.',
    en: 'Intensive whole-body recovery therapy featuring Shiatsu acupressure, Thai massage, Coconut oil & Hot stone.',
    cn: '融合指压穴位、泰式拉伸、椰子精油与热石理疗的全身深层调理。',
    jp: '指圧、タイ古式、ココナッツオイル、ホットストーンを組み合わせた全身深層リカバリートリートメント。',
    kr: '시아추 지압, 타이 마사지, 코코넛 오일, 핫스톤을 결합한 전문 전신 딥 리커버리 테라피.',
  },
  bookNow: {
    vi: 'Đặt Ngay',
    en: 'Book Now',
    cn: '立即预约',
    jp: '今すぐ予約',
    kr: '지금 예약',
  },
  artisanLabel: {
    vi: 'Nghệ Nhân',
    en: 'Artisan',
    cn: '匠人',
    jp: '職人',
    kr: '장인',
  },
  viewCert: {
    vi: 'Chứng chỉ',
    en: 'Certificate',
    cn: '专业证书',
    jp: '資格認定',
    kr: '전문 자격증',
  },
};

interface StaffSelectorProps {
  lang: string;
  preferredCategoryId?: string;
  cartHasItems?: boolean;
  onConfirmSelection: (selectedStaffIds: string[], staffInfoList: VipStaffInfo[], groupingMode?: 'FOUR_HAND' | 'SEPARATE' | null) => void;
  onSelectDeepBodyStaff?: (staff: VipStaffInfo, initialTherapyId?: DeepBodyBaseTechniqueId) => void;
}

// --- Status badge style config (text from i18n) ---
const STATUS_STYLES: Record<string, { style: string; textStyle: string; i18nKey: string }> = {
  AVAILABLE: {
    style: 'bg-black/70 backdrop-blur-md border border-emerald-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-emerald-400 font-bold uppercase',
    i18nKey: 'status_available',
  },
  BUSY: {
    style: 'bg-black/70 backdrop-blur-md border border-amber-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-amber-400 font-bold uppercase',
    i18nKey: 'status_busy',
  },
  NOT_YET: {
    style: 'bg-black/70 backdrop-blur-md border border-blue-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-blue-400 font-bold uppercase',
    i18nKey: 'status_notYet',
  },
  OFF_DUTY: {
    style: 'bg-black/70 backdrop-blur-md border border-zinc-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-zinc-300 font-bold uppercase',
    i18nKey: 'status_offDuty',
  },
  ON_LEAVE: {
    style: 'bg-black/70 backdrop-blur-md border border-red-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-red-500 font-bold uppercase',
    i18nKey: 'status_onLeave',
  },
  ON_CALL: {
    style: 'bg-black/70 backdrop-blur-md border border-purple-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-purple-400 font-bold uppercase',
    i18nKey: 'status_onCall',
  },
};

const StaffSelector = ({
  lang,
  preferredCategoryId,
  cartHasItems,
  onConfirmSelection,
  onSelectDeepBodyStaff,
}: StaffSelectorProps) => {
  const t = getT(lang);
  const safeLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'vi') as VipLang;

  // State
  const [staffList, setStaffList] = useState<VipStaffInfo[]>([]);
  const [deepBodyStaffList, setDeepBodyStaffList] = useState<VipStaffInfo[]>([]);
  const [activeTherapyByStaff, setActiveTherapyByStaff] = useState<Record<string, TherapyGalleryParsedItem | null>>({});
  const [selectedStaffForCert, setSelectedStaffForCert] = useState<VipStaffInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupingPopup, setShowGroupingPopup] = useState(false);

  // Fetch real staff from API
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/staff/vip-available').then((res) => res.json()).catch(() => ({ staff: [] })),
      fetch('/api/staff/therapy-available').then((res) => res.json()).catch(() => ({ staff: [] })),
    ])
      .then(([vipData, therapyData]) => {
        if (vipData.staff && Array.isArray(vipData.staff)) {
          setStaffList(vipData.staff);
        }
        if (therapyData.staff && Array.isArray(therapyData.staff)) {
          setDeepBodyStaffList(therapyData.staff);
        }
      })
      .catch((err) => console.error('[StaffSelector] Fetch error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter by search query (API already gates is_active_vip_menu === true)
  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();

    if (!query) return staffList;

    return staffList.filter(
      (s) =>
        s.id.toUpperCase().includes(query) ||
        s.fullName.toUpperCase().includes(query)
    );
  }, [staffList, searchQuery]);

  // Sort: AVAILABLE → ON_CALL → BUSY → NOT_YET → OFF_DUTY → ON_LEAVE
  // And within the same status, sort by turnsCompleted (số tua đã làm) then queuePosition (sổ tua)
  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      const ORDER: Record<string, number> = { AVAILABLE: 0, ON_CALL: 1, BUSY: 2, NOT_YET: 3, OFF_DUTY: 4, ON_LEAVE: 5 };
      const diff = (ORDER[a.availability] ?? 9) - (ORDER[b.availability] ?? 9);
      if (diff !== 0) return diff;

      // 1. Số tua đã làm (turnsCompleted) tăng dần
      const aTurns = a.turnsCompleted ?? 0;
      const bTurns = b.turnsCompleted ?? 0;
      if (aTurns !== bTurns) return aTurns - bTurns;

      // 2. Vị trí xếp hàng (queuePosition) tăng dần
      const aPos = a.queuePosition ?? 999;
      const bPos = b.queuePosition ?? 999;
      if (aPos !== bPos) return aPos - bPos;

      return a.id.localeCompare(b.id);
    });
  }, [filteredStaff]);

  // Sort Deep Body Staff for Smart Bridge
  const sortedDeepBodyStaff = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();
    const filtered = query
      ? deepBodyStaffList.filter(
          (s) =>
            s.id.toUpperCase().includes(query) ||
            s.fullName.toUpperCase().includes(query)
        )
      : deepBodyStaffList;

    return [...filtered].sort((a, b) => {
      const ORDER: Record<string, number> = { AVAILABLE: 0, ON_CALL: 1, BUSY: 2, NOT_YET: 3, OFF_DUTY: 4, ON_LEAVE: 5 };
      const diff = (ORDER[a.availability] ?? 9) - (ORDER[b.availability] ?? 9);
      if (diff !== 0) return diff;
      const aTurns = a.turnsCompleted ?? 0;
      const bTurns = b.turnsCompleted ?? 0;
      if (aTurns !== bTurns) return aTurns - bTurns;
      const aPos = a.queuePosition ?? 999;
      const bPos = b.queuePosition ?? 999;
      if (aPos !== bPos) return aPos - bPos;
      return a.id.localeCompare(b.id);
    });
  }, [deepBodyStaffList, searchQuery]);

  // OFF_DUTY + ON_LEAVE = không cho đặt. NOT_YET = vẫn cho đặt (đặt trước cho lúc vô ca)
  const isUnavailable = (staff: VipStaffInfo) =>
    staff.availability === 'OFF_DUTY' || staff.availability === 'ON_LEAVE';

  const handleToggle = (id: string) => {
    const staff = staffList.find((s) => s.id === id);
    if (!staff || isUnavailable(staff)) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_SELECTABLE_STAFF) return prev; // max 2
      return [...prev, id];
    });
  };

  const getStatusBadge = (staff: VipStaffInfo) => {
    const cfg = STATUS_STYLES[staff.availability];
    let label = t[cfg.i18nKey];
    let overrideStyle = cfg.style;
    let overrideTextStyle = cfg.textStyle;

    // BUSY: show estimated end time
    if (staff.availability === 'BUSY' && staff.estimatedEndTime) {
      label = tpl(t.status_freeAfter, { time: staff.estimatedEndTime });
    }

    // NOT_YET: show shift start time if known (VD: "VÀO CA LÚC 17:00")
    if (staff.availability === 'NOT_YET' && staff.shiftStart) {
      label = tpl(t.status_startsAt, { time: staff.shiftStart });
    }

    // ON_CALL: dynamically calculate current time + travel time
    if (staff.availability === 'ON_CALL') {
      let isFreeAfter = false;
      if (staff.travelTimeMins) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + staff.travelTimeMins);
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        label = tpl(t.status_freeAfter, { time: `${hh}:${mm}` });
        isFreeAfter = true;
      } else if (staff.availableFrom) {
        label = tpl(t.status_freeAfter, { time: staff.availableFrom });
        isFreeAfter = true;
      }
      
      if (isFreeAfter) {
        overrideStyle = STATUS_STYLES.BUSY.style;
        overrideTextStyle = STATUS_STYLES.BUSY.textStyle;
      }
    }

    return (
      <div className={`absolute top-5 left-5 ${overrideStyle} px-3.5 py-1.5 rounded-full z-20`}>
        <span className={overrideTextStyle}>{label}</span>
      </div>
    );
  };

  // Preview top skills for a staff member
  const getSkillPreview = (staff: VipStaffInfo): string => {
    const skills = getStaffVipSkills(staff.skills);
    let names = skills.map((sk) => (sk.name as Record<string, string>)[lang] || sk.name.en);
    names = [...new Set(names)]; // Lọc trùng lặp do gộp Pro và Basic
    
    const top = names.slice(0, SKILL_PREVIEW_COUNT);
    if (names.length > SKILL_PREVIEW_COUNT) top.push(`+${names.length - SKILL_PREVIEW_COUNT}`);
    return top.join(' · ');
  };

  // On confirm: pass selected staff info list
  const handleConfirm = () => {
    const selectedStaff = staffList.filter((s) => selectedIds.includes(s.id));
    // Nếu chọn 2 KTV, hoặc chọn 1 KTV nhưng đang Thêm nhân viên (cartHasItems)
    if (selectedIds.length === 2 || (selectedIds.length === 1 && cartHasItems)) {
        setShowGroupingPopup(true);
    } else {
        onConfirmSelection(selectedIds, selectedStaff);
    }
  };

  const handleGroupingConfirm = (mode: 'FOUR_HAND' | 'SEPARATE') => {
    const selectedStaff = staffList.filter((s) => selectedIds.includes(s.id));
    setShowGroupingPopup(false);
    onConfirmSelection(selectedIds, selectedStaff, mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-4 sm:px-6 pt-2 pb-8 max-w-md mx-auto w-full"
    >
      {/* Section Header */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="premium-therapist-display-font text-3xl text-[#e6c487] leading-tight mb-2">
          {t.ss_title}
        </h2>
        <p className="premium-therapist-display-font text-[11px] tracking-[0.15em] uppercase text-[#d0c5b5]/80">
          {t.ss_subtitle}
        </p>
      </motion.section>

      {/* 🔍 Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 mb-8"
      >
        <div className="flex-1 bg-[#1b1b1d] rounded-full px-5 py-3 flex items-center gap-3 border border-[#4d463a]/30 focus-within:border-[#e6c487]/40 transition-colors">
          <svg className="w-4 h-4 text-[#e6c487]/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.ss_searchPlaceholder}
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full placeholder:text-[#998f81]/50 text-[#e4e2e4]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#998f81] hover:text-[#e4e2e4] transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[2rem] overflow-hidden bg-[#1b1b1d] h-[420px] sm:h-[460px] md:h-[480px] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedStaff.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#998f81] text-sm">
            {t.ss_noResult}
          </p>
        </div>
      )}

      {/* Max selection hint */}
      {selectedIds.length >= MAX_SELECTABLE_STAFF && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 px-4 py-2.5 bg-[#e6c487]/10 border border-[#e6c487]/30 rounded-xl text-center"
        >
          <p className="text-xs text-[#e6c487]">
            {tpl(t.ss_maxHint, { max: MAX_SELECTABLE_STAFF })}
          </p>
        </motion.div>
      )}

      {/* Therapist Gallery (1 card 1 hàng) */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 w-full">
          {sortedStaff.map((staff, idx) => {
            const isSelected = selectedIds.includes(staff.id);
            const unavailable = isUnavailable(staff);
            const skillPreview = getSkillPreview(staff);

            return (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                onClick={() => handleToggle(staff.id)}
                className={`group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300
                  ${unavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                  ${isSelected ? 'ring-2 ring-[#e6c487] ring-offset-2 ring-offset-[#131315]' : ''}
                `}
              >
                {/* Image Container */}
                <div className="relative h-[420px] sm:h-[460px] md:h-[480px] w-full overflow-hidden bg-[#1b1b1d]">
                  {/* Image Carousel (Avatar trước, sau đó là Gallery với Tag Skill) */}
                  <StaffImageCarousel
                    imageFit="cover"
                    items={
                      staff.vipGallery && staff.vipGallery.length > 0
                        ? staff.vipGallery
                        : resolveVipGalleryForStaff({
                            avatarUrl: staff.avatarUrl,
                            galleryUrls: (staff as any).gallery_urls ?? staff.galleryUrls,
                            skills: staff.skills,
                          })
                    }
                    images={staff.galleryUrls?.length ? staff.galleryUrls : (staff.avatarUrl ? [staff.avatarUrl] : [])}
                    staffId={staff.id}
                    staffName={staff.fullName}
                    lang={lang}
                    initialIndex={0}
                    autoSelectPreferred={false}
                  />

                  {/* Status Badge */}
                  {getStatusBadge(staff)}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-5 right-5 bg-[#e6c487] w-7 h-7 rounded-full flex items-center justify-center z-20 shadow-lg">
                      <svg className="w-4 h-4 text-[#412d00]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-7 bg-gradient-to-t from-[#131315] via-[#131315]/60 to-transparent">
                    {/* Staff Code Badge — enlarged as primary identifier */}
                    <div className="inline-block bg-[#e6c487]/15 border border-[#e6c487]/30 px-5 py-2 rounded-full mb-3">
                      <span className="text-base tracking-[0.15em] text-[#e6c487] font-bold">{staff.id}</span>
                    </div>

                    {/* Skill preview chips */}
                    {skillPreview && (
                      <p className="text-xs text-[#d0c5b5]/90 mb-4 tracking-wide font-medium">{skillPreview}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện click lan ra viền thẻ
                          if (!unavailable) {
                            if (selectedIds.length === 0) {
                                // Nếu chỉ đặt 1 người (Direct click)
                                const staffItem = staffList.find(s => s.id === staff.id);
                                if (cartHasItems) {
                                    setSelectedIds([staff.id]);
                                    setShowGroupingPopup(true);
                                } else {
                                    onConfirmSelection([staff.id], staffItem ? [staffItem] : []);
                                }
                            } else if (selectedIds.includes(staff.id)) {
                                // Đã chọn rồi, ấn Book Now sẽ Confirm luôn với list hiện tại
                                handleConfirm();
                            } else {
                                handleToggle(staff.id);
                            }
                          }
                        }}
                        className={`w-full py-4 rounded-full text-center text-sm font-bold tracking-[0.1em] uppercase transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] ${
                          !unavailable
                            ? 'bg-[#e6c487] text-[#412d00] hover:bg-[#cba86a] active:scale-95'
                            : 'bg-black/60 backdrop-blur-sm border border-[#4d463a] text-[#e4e2e4] cursor-not-allowed'
                        }`}
                      >
                        {!unavailable ? t.ss_bookNow : t.ss_unavailable}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── 🌟 SMART BRIDGE SECTION: ARTISAN DEEP BODY THERAPISTS ── */}
      {!isLoading && sortedDeepBodyStaff.length > 0 && (
        <div className="mt-14 pt-10 border-t border-[#e6c487]/25 w-full">
          {/* Bridge Header / Luxury Banner */}
          <div className="text-center mb-8 flex flex-col items-center">
            <span className="text-xs sm:text-sm font-black tracking-[0.2em] text-[#e6c487] uppercase mb-2 select-none">
              {BRIDGE_I18N.badge[safeLang] || BRIDGE_I18N.badge.vi}
            </span>
            <h3 className="premium-therapist-display-font text-2xl sm:text-3xl text-white font-black tracking-wide mb-2 drop-shadow-md">
              {BRIDGE_I18N.title[safeLang] || BRIDGE_I18N.title.vi}
            </h3>
            <p className="text-xs sm:text-sm text-[#d0c5b5]/80 max-w-lg leading-relaxed font-medium">
              {BRIDGE_I18N.subtitle[safeLang] || BRIDGE_I18N.subtitle.vi}
            </p>
          </div>

          {/* Deep Body Staff Cards (1 card 1 hàng) */}
          <div className="grid grid-cols-1 gap-6 lg:gap-8 w-full">
            {sortedDeepBodyStaff.map((staff, idx) => {
              const unavailable = isUnavailable(staff);
              const statusBadge = getStatusBadge(staff);
              const carouselItems =
                staff.therapyGallery && staff.therapyGallery.length > 0
                  ? staff.therapyGallery
                  : staff.avatarUrl
                  ? [staff.avatarUrl]
                  : [];

              const handleBridgeCardClick = () => {
                if (unavailable) return;
                const activeItem = activeTherapyByStaff[staff.id];
                const activeTherapyId = activeItem?.kind === 'therapy' ? activeItem.therapyId : undefined;
                onSelectDeepBodyStaff?.(staff, activeTherapyId);
              };

              return (
                <motion.div
                  key={`bridge-${staff.id}`}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  onClick={handleBridgeCardClick}
                  className={`group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 border border-white/8 hover:border-[#e6c487]/50
                    ${unavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
                  `}
                >
                  {/* Image Container */}
                  <div className="relative h-[420px] sm:h-[460px] md:h-[480px] w-full overflow-hidden bg-[#1b1b1d]">
                    <StaffImageCarousel
                      imageFit="cover"
                      items={carouselItems}
                      staffId={staff.id}
                      staffName={`${BRIDGE_I18N.artisanLabel[safeLang] || BRIDGE_I18N.artisanLabel.vi} ${staff.id}`}
                      lang={lang}
                      autoSelectPreferred={true}
                      onActiveItemChange={(item) => {
                        const therapyItem =
                          item && (item.kind === 'therapy' || item.kind === 'mix' || item.kind === 'legacy')
                            ? (item as TherapyGalleryParsedItem)
                            : null;
                        setActiveTherapyByStaff((curr) => ({ ...curr, [staff.id]: therapyItem }));
                      }}
                    />

                    {/* Status Badge */}
                    {statusBadge}

                    {/* Certificate Badge (Right Bottom) */}
                    <div className="absolute bottom-28 sm:bottom-32 right-4 sm:right-6 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffForCert(staff);
                        }}
                        className="w-26 sm:w-28 rounded-xl overflow-hidden bg-black/85 hover:bg-black/95 backdrop-blur-md border border-[#e6c487]/50 hover:border-[#e6c487] text-[#e6c487] shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95 transition-all group/cert flex flex-col text-left cursor-pointer"
                        title={BRIDGE_I18N.viewCert[safeLang] || BRIDGE_I18N.viewCert.vi}
                      >
                        <div className="w-full h-15 sm:h-18 relative overflow-hidden bg-[#18181b] flex items-center justify-center">
                          {staff.certificateUrl ? (
                            <img
                              src={staff.certificateUrl}
                              alt="Certificate"
                              className="w-full h-full object-cover p-1 group-hover/cert:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full p-2 bg-gradient-to-b from-[#242428] via-[#1a1a1d] to-[#121214] flex flex-col items-center justify-center text-center relative">
                              <div className="absolute inset-1 border border-[#e6c487]/30 rounded-md pointer-events-none" />
                              <Award size={18} className="text-[#e6c487] mb-0.5 group-hover/cert:rotate-12 transition-transform" />
                              <span className="text-[7.5px] tracking-[0.15em] text-[#e6c487] uppercase font-black leading-none">
                                ORIA SPA
                              </span>
                              <span className="text-[6.5px] text-gray-400 uppercase tracking-widest leading-tight mt-0.5">
                                {BRIDGE_I18N.viewCert[safeLang] || BRIDGE_I18N.viewCert.vi}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-full bg-black/90 py-1.5 px-2 flex items-center justify-center gap-1 border-t border-white/10">
                          <span className="text-[10px] sm:text-[11px] font-bold text-white group-hover/cert:text-[#e6c487] transition-colors leading-tight flex items-center gap-1 whitespace-nowrap">
                            {BRIDGE_I18N.viewCert[safeLang] || BRIDGE_I18N.viewCert.vi}
                            <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 pt-10 bg-gradient-to-t from-[#121214] via-[#121214]/85 to-transparent">
                      <div className="mb-3.5 min-w-0">
                        <p className="text-base sm:text-lg font-black tracking-wide text-[#e6c487] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] truncate">
                          <span className="uppercase">{BRIDGE_I18N.artisanLabel[safeLang] || BRIDGE_I18N.artisanLabel.vi}</span> {staff.id}
                        </p>
                      </div>

                      {/* Action Button: Book Deep Body with Smart Switch */}
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBridgeCardClick();
                        }}
                        className={`w-full py-3.5 rounded-full text-center text-xs sm:text-sm font-black tracking-[0.1em] uppercase transition-all shadow-[0_4px_20px_rgba(230,196,135,0.25)] flex items-center justify-center gap-2 cursor-pointer ${
                          !unavailable
                            ? 'bg-gradient-to-r from-[#e6c487] via-[#f5deb3] to-[#e6c487] text-[#412d00] hover:brightness-105 active:scale-95'
                            : 'bg-black/60 border border-[#4d463a] text-[#e4e2e4] cursor-not-allowed'
                        }`}
                      >
                        <span>🌿</span>
                        <span>{BRIDGE_I18N.bookNow[safeLang] || BRIDGE_I18N.bookNow.vi}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating CTA Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 inset-x-6 lg:inset-x-0 mx-auto lg:w-[500px] z-40"
          >
            <button
              onClick={handleConfirm}
              className="w-full py-5 rounded-full bg-[#e6c487] text-[#412d00] font-bold tracking-[0.12em] text-sm shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center justify-center gap-3 active:scale-95 duration-200 uppercase"
            >
              <span>{tpl(t.ss_continueWith, { count: selectedIds.length })}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editorial Quote */}
      {!isLoading && sortedStaff.length > 0 && (
        <div className="mt-16 text-center px-4 opacity-40">
          <p className="font-sans not-italic text-base text-[#c9a96e] leading-relaxed">
            {t.ss_quote}
          </p>
        </div>
      )}

      {/* Grouping Popup (Four-hand vs Separate) */}
      <AnimatePresence>
        {showGroupingPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowGroupingPopup(false)}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="responsive-panel relative w-full max-w-sm bg-[#131315] border border-[#e6c487]/30 rounded-[2rem] p-4 sm:p-6 shadow-2xl"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e6c487] to-transparent opacity-50" />
                    
                    <h3 className="text-xl font-sans not-italic text-[#e6c487] text-center mb-6 mt-2">
                        {t.ss_grouping_title || 'Xác nhận dịch vụ'}
                    </h3>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleGroupingConfirm('FOUR_HAND')}
                            className="w-full py-4 px-6 rounded-2xl bg-[#e6c487]/10 hover:bg-[#e6c487]/20 border border-[#e6c487]/40 text-[#e6c487] text-sm font-bold tracking-wider transition-all active:scale-95 text-center flex flex-col items-center justify-center gap-1"
                        >
                            <span>{t.ss_fourhand || 'Làm chung 1 khách (Tứ thủ)'}</span>
                        </button>

                        <button
                            onClick={() => handleGroupingConfirm('SEPARATE')}
                            className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold tracking-wider transition-all active:scale-95 text-center flex flex-col items-center justify-center gap-1"
                        >
                            <span>{t.ss_separate || 'Mỗi khách 1 KTV (Riêng biệt)'}</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setShowGroupingPopup(false)}
                        className="w-full mt-4 py-3 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
                    >
                        {t.ss_cancel || 'Hủy'}
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Certificate Lightbox Modal */}
      <CertificateModal
        isOpen={!!selectedStaffForCert}
        staff={selectedStaffForCert}
        lang={lang}
        onClose={() => setSelectedStaffForCert(null)}
      />
    </motion.div>
  );
};

export default StaffSelector;
