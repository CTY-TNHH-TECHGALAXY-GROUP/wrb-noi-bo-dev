'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldCheck, Check, Search, X } from 'lucide-react';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { getDeepBodyT } from '../DeepBody.i18n';
import CertificateModal from '../CertificateModal';

const MAX_SELECTABLE_STAFF = 2;

interface DeepStaffSelectorProps {
  lang: string;
  cartHasItems?: boolean;
  onConfirmSelection: (
    selectedStaffIds: string[],
    staffInfoList: VipStaffInfo[],
    groupingMode?: 'FOUR_HAND' | 'SEPARATE' | null
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

  // Modals
  const [selectedStaffForCert, setSelectedStaffForCert] = useState<VipStaffInfo | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/staff/vip-available')
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
      (s) => s.id.toUpperCase().includes(query) || s.fullName.toUpperCase().includes(query)
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

  const handleToggle = (id: string) => {
    const staff = staffList.find((s) => s.id === id);
    if (!staff || isUnavailable(staff)) return;

    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= MAX_SELECTABLE_STAFF) {
        setSelectedIds([id]);
      } else {
        const next = [...selectedIds, id];
        setSelectedIds(next);
        if (next.length === 2 && cartHasItems) {
          setShowGroupingPopup(true);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length === 2) {
      setShowGroupingPopup(true);
      return;
    }
    const selectedStaff = staffList.filter((s) => selectedIds.includes(s.id));
    onConfirmSelection(selectedIds, selectedStaff);
  };

  const handleGroupingConfirm = (mode: 'FOUR_HAND' | 'SEPARATE') => {
    setShowGroupingPopup(false);
    const selectedStaff = staffList.filter((s) => selectedIds.includes(s.id));
    onConfirmSelection(selectedIds, selectedStaff, mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-4 sm:px-6 pt-2 pb-12"
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
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[2rem] bg-[#1b1b1d] h-[460px] animate-pulse border border-white/5" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedStaff.length === 0 && (
        <div className="text-center py-16 text-[#998f81] text-sm">
          {t.ss_noResult}
        </div>
      )}

      {/* Staff Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {sortedStaff.map((staff, idx) => {
            const isSelected = selectedIds.includes(staff.id);
            const unavailable = isUnavailable(staff);
            const statusStyle = STATUS_STYLES[staff.availability] || STATUS_STYLES.AVAILABLE;

            return (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35 }}
                onClick={() => handleToggle(staff.id)}
                className={`group relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-300 border ${
                  isSelected
                    ? 'ring-2 ring-[#e6c487] ring-offset-2 ring-offset-[#131315] border-[#e6c487]'
                    : 'border-white/5 hover:border-[#e6c487]/30'
                } ${unavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
              >
                {/* Image Container */}
                <div className="relative h-[470px] md:h-[510px] w-full overflow-hidden bg-[#1b1b1d]">
                  {staff.avatarUrl ? (
                    <img
                      src={staff.avatarUrl}
                      alt={staff.fullName}
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#252528] to-[#121214]">
                      <span className="text-3xl text-[#e6c487]/40 font-bold tracking-widest">{staff.id}</span>
                    </div>
                  )}

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

                  {/* ⭐ ẢNH CHỨNG CHỈ Ở GÓC PHẢI VỚI FOOTER "VIEW CERTIFICATE" (User Requirement) */}
                  <div className="absolute bottom-28 right-5 sm:right-6 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStaffForCert(staff);
                      }}
                      className="w-28 sm:w-32 rounded-xl overflow-hidden bg-black/85 hover:bg-black/95 backdrop-blur-md border border-[#e6c487]/50 hover:border-[#e6c487] text-[#e6c487] shadow-[0_8px_25px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95 transition-all group/cert flex flex-col text-left cursor-pointer"
                      title={t.certificate_view}
                    >
                      {/* Mini Certificate Image / Preview */}
                      <div className="w-full h-16 sm:h-20 relative overflow-hidden bg-[#18181b] flex items-center justify-center">
                        {staff.certificateUrl ? (
                          <img
                            src={staff.certificateUrl}
                            alt="Certificate"
                            className="w-full h-full object-cover p-1 group-hover/cert:scale-105 transition-transform"
                          />
                        ) : (
                          /* Stylized Mini Certificate Preview Mockup */
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

                      {/* Footer là "View Certificate" giống hiện tại */}
                      <div className="w-full bg-black/90 py-1.5 px-2 flex items-center justify-center gap-1 border-t border-white/10">
                        <span className="text-[10px] sm:text-[11px] font-bold text-white group-hover/cert:text-[#e6c487] transition-colors leading-tight flex items-center gap-1 whitespace-nowrap">
                          {t.certificate_view}
                          <ShieldCheck size={11} className="text-emerald-400 shrink-0" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Content Gradient Overlay (Bottom) */}
                  <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-[#121214] via-[#121214]/85 to-transparent">
                    {/* Staff ID & Tagline */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-block bg-[#e6c487]/15 border border-[#e6c487]/40 px-4 py-1.5 rounded-full shadow-sm">
                        <span className="text-sm tracking-[0.15em] text-[#e6c487] font-bold">
                          {staff.id} • {staff.fullName}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium tracking-wider uppercase">
                        {t.master_deep_body}
                      </span>
                    </div>

                    {/* Book Now Button */}
                    <button
                      type="button"
                      disabled={unavailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!unavailable) {
                          onConfirmSelection([staff.id], [staff]);
                        }
                      }}
                      className={`w-full py-3.5 rounded-full text-center text-xs sm:text-sm font-bold tracking-[0.1em] uppercase transition-all shadow-lg ${
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
              className="w-full py-4 rounded-full bg-[#e6c487] text-[#412d00] font-bold tracking-[0.12em] text-xs sm:text-sm shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 active:scale-95 uppercase"
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
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#131315] border border-[#e6c487]/30 rounded-[2rem] p-6 shadow-2xl text-center z-10"
            >
              <h3 className="text-lg font-bold text-[#e6c487] mb-4">
                {t.arrangement_title}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleGroupingConfirm('FOUR_HAND')}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#e6c487]/15 border border-[#e6c487]/40 text-[#e6c487] font-bold text-xs uppercase"
                >
                  {t.arrangement_four_hands}
                </button>
                <button
                  onClick={() => handleGroupingConfirm('SEPARATE')}
                  className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase"
                >
                  {t.arrangement_separate}
                </button>
              </div>
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
}
