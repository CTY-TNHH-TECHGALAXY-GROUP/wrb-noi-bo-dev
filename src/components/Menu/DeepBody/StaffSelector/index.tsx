'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldCheck, Check, Search, X } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import {
  type DeepBodyBaseTechniqueId,
  staffHasDeepBodyTechnique,
} from '@/lib/deepBody.constants';
import { type TherapyGalleryParsedItem } from '@/lib/menuPhotos.helper';
import { getDeepBodyT } from '../DeepBody.i18n';
import CertificateModal from '../CertificateModal';
import StaffImageCarousel from './StaffImageCarousel';
import MixTechniquePopover from './MixTechniquePopover';
import {
  evaluateMixApply,
  canConfirmBooking,
  resolveSelectedStaff,
  resolveInitialActiveGalleryItem,
} from './staffSelector.logic';

const MAX_SELECTABLE_STAFF = 2;

interface DeepStaffSelectorProps {
  lang: string;
  cartHasItems?: boolean;
  onConfirmSelection: (
    selectedStaffIds: string[],
    staffInfoList: VipStaffInfo[],
    groupingMode: 'FOUR_HAND' | 'SEPARATE' | null | undefined,
    techniqueIds: DeepBodyBaseTechniqueId[]
  ) => void;
}

const STATUS_STYLES: Record<string, { style: string; textStyle: string; label: Record<string, string> }> = {
  AVAILABLE: {
    style: 'bg-black/75 backdrop-blur-md border border-emerald-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-emerald-400 font-bold uppercase',
    label: { vi: 'Sẵn sàng', en: 'Available', cn: '可预约', jp: '空きあり', kr: '예약가능' },
  },
  BUSY: {
    style: 'bg-black/75 backdrop-blur-md border border-amber-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-amber-400 font-bold uppercase',
    label: { vi: 'Đang bận', en: 'Busy', cn: '忙碌中', jp: '施術中', kr: '시술중' },
  },
  NOT_YET: {
    style: 'bg-black/75 backdrop-blur-md border border-blue-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-blue-400 font-bold uppercase',
    label: { vi: 'Chưa vào ca', en: 'Upcoming', cn: '待上岗', jp: '待機中', kr: '대기중' },
  },
  OFF_DUTY: {
    style: 'bg-black/75 backdrop-blur-md border border-zinc-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-zinc-400 font-bold uppercase',
    label: { vi: 'Tan ca', en: 'Off Duty', cn: '已下班', jp: '退勤', kr: '퇴근' },
  },
  ON_LEAVE: {
    style: 'bg-black/75 backdrop-blur-md border border-red-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-red-400 font-bold uppercase',
    label: { vi: 'Nghỉ phép', en: 'On Leave', cn: '休假中', jp: '休暇中', kr: '휴가' },
  },
  ON_CALL: {
    style: 'bg-black/75 backdrop-blur-md border border-purple-500/40 shadow-lg',
    textStyle: 'text-[10px] tracking-[0.1em] text-purple-400 font-bold uppercase',
    label: { vi: 'Gọi ca', en: 'On Call', cn: '待命', jp: 'オンコール', kr: '대기' },
  },
};

export default function DeepStaffSelector({
  lang,
  cartHasItems,
  onConfirmSelection,
}: DeepStaffSelectorProps) {
  const t = getDeepBodyT(lang);

  const [staffList, setStaffList] = useState<VipStaffInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupingPopup, setShowGroupingPopup] = useState(false);

  // Active gallery item tracked per therapist from carousel
  const [activeGalleryByStaff, setActiveGalleryByStaff] = useState<
    Record<string, TherapyGalleryParsedItem | null>
  >({});

  // Selected technique IDs established by photos/mix
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<
    DeepBodyBaseTechniqueId[]
  >([]);

  // Mix popover state
  const [mixStaff, setMixStaff] = useState<VipStaffInfo | null>(null);

  // Warning toast message (e.g. 2nd therapist does not support selected therapy)
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Certificate Modal
  const [selectedStaffForCert, setSelectedStaffForCert] = useState<VipStaffInfo | null>(null);

  // Auto-dismiss warning message
  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => setWarningMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  useEffect(() => {
    fetch('/api/staff/therapy-available')
      .then((res) => res.json())
      .then((data) => {
        if (data.staff && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      })
      .catch((err) => console.error('[DeepStaffSelector] Fetch error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toUpperCase();

    if (!query) return staffList;

    return staffList.filter(
      (s) =>
        s.id.toUpperCase().includes(query) ||
        s.fullName.toUpperCase().includes(query)
    );
  }, [staffList, searchQuery]);

  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      const ORDER: Record<string, number> = { AVAILABLE: 0, ON_CALL: 1, BUSY: 2, NOT_YET: 3, OFF_DUTY: 4, ON_LEAVE: 5 };
      const diff = (ORDER[a.availability] ?? 9) - (ORDER[b.availability] ?? 9);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });
  }, [filteredStaff]);

  const isUnavailable = (staff: VipStaffInfo) =>
    staff.availability === 'OFF_DUTY' || staff.availability === 'ON_LEAVE';

  const handleToggle = (staff: VipStaffInfo) => {
    if (isUnavailable(staff)) return;

    if (selectedIds.includes(staff.id)) {
      const activeItem = resolveInitialActiveGalleryItem(staff, activeGalleryByStaff);

      if (
        selectedIds.length === 1 &&
        selectedIds[0] === staff.id &&
        activeItem &&
        ((activeItem.kind === 'therapy' && !selectedTechniqueIds.includes(activeItem.therapyId)) ||
          activeItem.kind === 'mix')
      ) {
        if (activeItem.kind === 'therapy') {
          setSelectedTechniqueIds([activeItem.therapyId]);
        } else if (activeItem.kind === 'mix') {
          setSelectedTechniqueIds([]);
          setMixStaff(staff);
        }
        return;
      }

      const nextIds = selectedIds.filter((item) => item !== staff.id);
      setSelectedIds(nextIds);
      if (nextIds.length === 0) {
        setSelectedTechniqueIds([]);
      }
      return;
    }

    const activeItem = resolveInitialActiveGalleryItem(staff, activeGalleryByStaff);

    if (selectedIds.length === 0) {
      if (activeItem?.kind === 'therapy') {
        setSelectedTechniqueIds([activeItem.therapyId]);
        setSelectedIds([staff.id]);
      } else if (activeItem?.kind === 'mix') {
        // Mở popover chọn 2-4 phương pháp cho Mix
        setSelectedTechniqueIds([]);
        setMixStaff(staff);
      } else {
        // Legacy image mà chưa có metadata: chọn KTV, để BookingConfig yêu cầu chọn
        setSelectedTechniqueIds([]);
        setSelectedIds([staff.id]);
      }
    } else {
      // KTV thứ hai: không ghi đè therapy đã chọn bởi KTV đầu tiên
      // Kiểm tra KTV thứ hai có hỗ trợ các kỹ thuật đã chọn không
      if (selectedTechniqueIds.length > 0) {
        const unsupported = selectedTechniqueIds.filter(
          (therapyId) => !staffHasDeepBodyTechnique(staff.skills, therapyId)
        );

        if (unsupported.length > 0) {
          setWarningMessage(t.staff_second_unsupported_warning);
          return;
        }
      }

      if (selectedIds.length >= MAX_SELECTABLE_STAFF) {
        return;
      }

      const next = [...selectedIds, staff.id];
      setSelectedIds(next);
      if (next.length === 2 && cartHasItems) {
        setShowGroupingPopup(true);
      }
    }
  };

  const handleBookNow = (staff: VipStaffInfo) => {
    if (isUnavailable(staff)) return;

    const activeItem = resolveInitialActiveGalleryItem(staff, activeGalleryByStaff);

    if (activeItem?.kind === 'mix') {
      setSelectedIds([staff.id]);
      setSelectedTechniqueIds([]);
      setMixStaff(staff);
      return;
    }

    const techIds: DeepBodyBaseTechniqueId[] =
      activeItem?.kind === 'therapy' ? [activeItem.therapyId] : [];

    setSelectedIds([staff.id]);
    setSelectedTechniqueIds(techIds);
    onConfirmSelection([staff.id], [staff], undefined, techIds);
  };

  const handleMixApply = (chosenTechniqueIds: DeepBodyBaseTechniqueId[]) => {
    if (!mixStaff) return;

    const result = evaluateMixApply({
      mixStaff,
      chosenTechniqueIds,
      selectedIds,
      staffList,
      unsupportedWarningText: t.staff_second_unsupported_warning,
    });

    setSelectedIds(result.nextSelectedIds);
    setSelectedTechniqueIds(result.nextTechniqueIds);
    if (result.warningMessage) {
      setWarningMessage(result.warningMessage);
    }

    setMixStaff(null);

    const selectedStaff = resolveSelectedStaff(result.nextSelectedIds, staffList);
    if (!selectedStaff) {
      setWarningMessage(t.staff_selection_stale_warning);
      return;
    }

    if (result.nextSelectedIds.length === 2 && !showGroupingPopup) {
      setShowGroupingPopup(true);
      return;
    }

    onConfirmSelection(result.nextSelectedIds, selectedStaff, undefined, result.nextTechniqueIds);
  };

  const handleMixCancel = () => {
    setMixStaff(null);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;

    const primaryStaff = staffList.find((s) => s.id === selectedIds[0]);
    const activeItem = primaryStaff
      ? (activeGalleryByStaff[primaryStaff.id] ?? null)
      : null;

    let currentTechniqueIds = selectedTechniqueIds;
    if (currentTechniqueIds.length === 0 && activeItem) {
      if (activeItem.kind === 'therapy') {
        currentTechniqueIds = [activeItem.therapyId];
        setSelectedTechniqueIds(currentTechniqueIds);
      } else if (activeItem.kind === 'mix') {
        if (primaryStaff) setMixStaff(primaryStaff);
        return;
      }
    }

    const check = canConfirmBooking({
      selectedIds,
      activeItem,
      selectedTechniqueIds: currentTechniqueIds,
    });

    if (!check.canConfirm) {
      if (check.requiresMixModal && primaryStaff) {
        setMixStaff(primaryStaff);
      }
      return;
    }

    const selectedStaff = resolveSelectedStaff(selectedIds, staffList);
    if (!selectedStaff) {
      setWarningMessage(t.staff_selection_stale_warning);
      return;
    }

    if (selectedIds.length === 2 && !showGroupingPopup) {
      setShowGroupingPopup(true);
      return;
    }
    onConfirmSelection(selectedIds, selectedStaff, undefined, currentTechniqueIds);
  };

  const handleGroupingConfirm = (mode: 'FOUR_HAND' | 'SEPARATE') => {
    const primaryStaff = staffList.find((s) => s.id === selectedIds[0]);
    const activeItem = primaryStaff
      ? (activeGalleryByStaff[primaryStaff.id] ?? null)
      : null;

    let currentTechniqueIds = selectedTechniqueIds;
    if (currentTechniqueIds.length === 0 && activeItem) {
      if (activeItem.kind === 'therapy') {
        currentTechniqueIds = [activeItem.therapyId];
        setSelectedTechniqueIds(currentTechniqueIds);
      } else if (activeItem.kind === 'mix') {
        setShowGroupingPopup(false);
        if (primaryStaff) setMixStaff(primaryStaff);
        return;
      }
    }

    const check = canConfirmBooking({
      selectedIds,
      activeItem,
      selectedTechniqueIds: currentTechniqueIds,
    });

    if (!check.canConfirm) {
      setShowGroupingPopup(false);
      if (check.requiresMixModal && primaryStaff) {
        setMixStaff(primaryStaff);
      }
      return;
    }

    const selectedStaff = resolveSelectedStaff(selectedIds, staffList);
    if (!selectedStaff) {
      setShowGroupingPopup(false);
      setWarningMessage(t.staff_selection_stale_warning);
      return;
    }

    setShowGroupingPopup(false);
    onConfirmSelection(selectedIds, selectedStaff, mode, currentTechniqueIds);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-4 sm:px-6 pt-2 pb-12 max-w-md mx-auto w-full"
    >
      {/* Title Header */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="premium-therapist-display-font text-2xl sm:text-3xl md:text-4xl text-[#e6c487] leading-tight mb-2">
          {t.ss_title}
        </h2>
        <p className="premium-therapist-display-font text-[11px] sm:text-xs tracking-[0.15em] uppercase text-[#d0c5b5]/80">
          {t.ss_subtitle}
        </p>
      </motion.section>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-[#1b1b1d] rounded-full px-5 py-3 flex items-center gap-3 border border-[#4d463a]/30 focus-within:border-[#e6c487]/40 transition-colors">
          <Search size={16} className="text-[#e6c487]/60 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.ss_searchPlaceholder}
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs sm:text-sm w-full placeholder:text-[#998f81]/50 text-[#e4e2e4]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 w-full">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[2rem] bg-[#1b1b1d] h-[420px] sm:h-[460px] md:h-[480px] animate-pulse border border-white/5" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedStaff.length === 0 && (
        <div className="text-center py-16 text-[#998f81] text-sm">
          {t.ss_noResult}
        </div>
      )}

      {/* Staff Grid (1 card 1 hàng) */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:gap-8 w-full">
          {sortedStaff.map((staff, idx) => {
            const isSelected = selectedIds.includes(staff.id);
            const unavailable = isUnavailable(staff);
            const statusStyle = STATUS_STYLES[staff.availability] || STATUS_STYLES.AVAILABLE;
            const cleanStaffName = staff.fullName
              ? staff.fullName.replace(new RegExp(`^${staff.id}\\s*[-•:]?\\s*`, 'i'), '').trim()
              : '';

            const carouselItems =
              staff.therapyGallery && staff.therapyGallery.length > 0
                ? staff.therapyGallery
                : staff.avatarUrl
                ? [staff.avatarUrl]
                : [];

            return (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
                onClick={() => handleToggle(staff)}
                className={`group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 border ${
                  isSelected
                    ? 'ring-2 ring-[#e6c487] ring-offset-2 ring-offset-[#131315] border-[#e6c487]'
                    : 'border-white/5 hover:border-[#e6c487]/30'
                } ${unavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
              >
                {/* Image Container */}
                <div className="relative h-[420px] sm:h-[460px] md:h-[480px] w-full overflow-hidden bg-[#1b1b1d]">
                  {/* Image Carousel (Lướt ảnh qua lại) */}
                  <StaffImageCarousel
                    imageFit="cover"
                    items={carouselItems}
                    staffId={staff.id}
                    staffName={`${t.master_deep_body} ${staff.id}`}
                    lang={lang}
                    autoSelectPreferred={true}
                    onActiveItemChange={(item) => {
                      const therapyItem =
                        item && (item.kind === 'therapy' || item.kind === 'mix' || item.kind === 'legacy')
                          ? (item as TherapyGalleryParsedItem)
                          : null;
                      setActiveGalleryByStaff((current) => {
                        const previous = current[staff.id] ?? null;
                        const previousTherapyId =
                          previous?.kind === 'therapy' ? previous.therapyId : undefined;
                        const nextTherapyId =
                          therapyItem?.kind === 'therapy' ? therapyItem.therapyId : undefined;

                        if (
                          previous?.url === therapyItem?.url &&
                          previous?.kind === therapyItem?.kind &&
                          previousTherapyId === nextTherapyId
                        ) {
                          return current;
                        }

                        const next = { ...current, [staff.id]: therapyItem };

                        if (therapyItem?.kind === 'therapy' && selectedIds.includes(staff.id)) {
                          setSelectedTechniqueIds([therapyItem.therapyId]);
                        }

                        return next;
                      });
                    }}
                  />

                  {/* Status Badge (Top Left) */}
                  <div className={`absolute top-5 left-5 px-3 py-1.5 rounded-full ${statusStyle.style} z-20`}>
                    <span className={statusStyle.textStyle}>
                      {statusStyle.label[lang] || statusStyle.label.en}
                    </span>
                  </div>

                  {/* Selected Indicator (Top Right) */}
                  {isSelected && (
                    <div className="absolute top-5 right-5 bg-[#e6c487] w-8 h-8 rounded-full flex items-center justify-center z-20 shadow-lg animate-in zoom-in-75">
                      <Check size={18} className="text-[#412d00]" strokeWidth={3} />
                    </div>
                  )}

                  {/* ẢNH CHỨNG CHỈ Ở GÓC PHẢI DƯỚI */}
                  <div className="absolute bottom-28 sm:bottom-32 right-4 sm:right-6 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStaffForCert(staff);
                      }}
                      className="w-26 sm:w-28 rounded-xl overflow-hidden bg-black/85 hover:bg-black/95 backdrop-blur-md border border-[#e6c487]/50 hover:border-[#e6c487] text-[#e6c487] shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95 transition-all group/cert flex flex-col text-left cursor-pointer"
                      title={t.certificate_view}
                    >
                      {/* Mini Certificate Image / Preview */}
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
                              {t.certificate_badge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="w-full bg-black/90 py-1.5 px-2 flex items-center justify-center gap-1 border-t border-white/10">
                        <span className="text-[10px] sm:text-[11px] font-bold text-white group-hover/cert:text-[#e6c487] transition-colors leading-tight flex items-center gap-1 whitespace-nowrap">
                          {t.certificate_view}
                          <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Content Gradient Overlay (Bottom) */}
                  <div className="absolute bottom-0 left-0 w-full p-5 sm:p-6 pt-10 bg-gradient-to-t from-[#121214] via-[#121214]/85 to-transparent">
                    {/* Staff Title, ID & Name (Mẫu: ARTISAN KTV05 Luna - không đóng khung, bỏ cảm giác button) */}
                    <div className="mb-3.5 min-w-0">
                      <p className="text-base sm:text-lg font-black tracking-wide text-[#e6c487] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] truncate">
                        <span className="uppercase">{t.master_deep_body}</span> {staff.id}
                      </p>
                    </div>

                    {/* Book Now Button */}
                    <button
                      type="button"
                      disabled={unavailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(staff);
                      }}
                      className={`w-full py-3.5 rounded-full text-center text-xs sm:text-sm font-bold tracking-[0.1em] uppercase transition-all shadow-lg cursor-pointer ${
                        !unavailable
                          ? 'bg-[#e6c487] text-[#412d00] hover:bg-[#cba86a] active:scale-95'
                          : 'bg-black/60 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!unavailable ? t.book_now : t.unavailable}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating CTA Bar for Multi-select */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 inset-x-4 sm:inset-x-0 mx-auto max-w-md z-40"
          >
            <button
              onClick={handleConfirm}
              className="w-full py-4 rounded-full bg-[#e6c487] text-[#412d00] font-bold tracking-[0.12em] text-xs sm:text-sm shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 active:scale-95 uppercase cursor-pointer"
            >
              <span>{t.book_now} ({selectedIds.length})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouping Popup (Four-hand vs Separate) */}
      <AnimatePresence>
        {showGroupingPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowGroupingPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="responsive-panel relative w-full max-w-sm bg-[#131315] border border-[#e6c487]/30 rounded-[2rem] p-4 sm:p-6 shadow-2xl text-center z-10"
            >
              <h3 className="text-lg font-bold text-[#e6c487] mb-4">
                {t.arrangement_title}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleGroupingConfirm('FOUR_HAND')}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#e6c487]/15 border border-[#e6c487]/40 text-[#e6c487] font-bold text-xs uppercase cursor-pointer"
                >
                  {t.arrangement_four_hands}
                </button>
                <button
                  onClick={() => handleGroupingConfirm('SEPARATE')}
                  className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  {t.arrangement_separate}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mix Technique Selection Popover */}
      {mixStaff && (
        <MixTechniquePopover
          key={`${mixStaff.id}-${selectedTechniqueIds.join(',')}`}
          isOpen={!!mixStaff}
          staff={mixStaff}
          lang={lang}
          initialSelected={selectedTechniqueIds}
          onApply={handleMixApply}
          onCancel={handleMixCancel}
        />
      )}

      {/* Warning Toast */}
      <AnimatePresence>
        {warningMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 inset-x-4 sm:inset-x-0 mx-auto max-w-md z-50 p-4 rounded-2xl bg-red-950/90 border border-red-500/40 text-red-200 text-xs sm:text-sm shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md"
          >
            <span>{warningMessage}</span>
            <button
              onClick={() => setWarningMessage(null)}
              className="text-red-300 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
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
}
