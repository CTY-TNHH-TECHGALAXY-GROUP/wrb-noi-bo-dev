import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type VipStaffInfo,
  getIntersectionSkills,
  groupSkillsByType,
  getSkillName,
} from '@/lib/vipStaffUtils';
import { type VipLang } from '@/lib/vipSkills.constants';
import {
  calculateMinDuration,
  getAvailableDurations,
  lookupPrice,
  type VipPricingTable,
  type VipDuration,
} from '@/lib/vipPricingEngine';
import { getT, tpl, DAY_KEYS } from '../Premium.i18n';

// =============================================
// 📅 Booking Config – REAL DATA (Pha 3)
// Skills thực từ Staff DB, pricing từ SystemConfigs
// Time slots ĐỘNG theo ca KTV (shiftStart/shiftEnd)
// UI compact: horizontal scroll + grid layout
// =============================================

// 🔧 UI CONFIGURATION
const FALLBACK_PRICING_TABLE: VipPricingTable = {
  '1': { '60': 690000, '70': 805000, '90': 1035000, '120': 1380000, '150': 1725000, '180': 2070000, '240': 2760000 },
  '2': { '60': 1080000, '70': 1260000, '90': 1530000, '120': 2040000, '150': 2550000, '180': 3060000, '240': 4080000 },
};
const TIME_SLOT_INTERVAL_MINUTES = 30;
const BUFFER_MINUTES = 30; // Đặt trước ít nhất 30 phút so với hiện tại
const DEFAULT_SHIFT_START = '09:00';
const DEFAULT_SHIFT_END = '22:00';
const SKILLS_VISIBLE_COUNT = 8; // Hiện tối đa 8 skills, có nút "Xem thêm"

// --- Helper: parse "HH:mm" → minutes from midnight ---
const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// --- Helper: minutes from midnight → "HH:mm" ---
const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// --- Generate time slots based on shift + day + duration ---
const generateTimeSlots = (
  shiftStart: string | null,
  shiftEnd: string | null,
  isToday: boolean,
  serviceDuration: number,
): string[] => {
  const start = shiftStart || DEFAULT_SHIFT_START;
  const end = shiftEnd || DEFAULT_SHIFT_END;

  let startMins = timeToMinutes(start);
  // Ca 3 (00:00) = midnight = 0 → convert to 1440 (24:00)
  let endMins = timeToMinutes(end);
  if (endMins <= startMins) endMins += 24 * 60; // cross-midnight

  // Trừ buffer cuối ca: slot cuối = shiftEnd - serviceDuration
  const lastSlotMins = endMins - serviceDuration;

  // Nếu hôm nay: start từ now + BUFFER, round lên bội 30
  if (isToday) {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes() + BUFFER_MINUTES;
    const roundedNow = Math.ceil(nowMins / TIME_SLOT_INTERVAL_MINUTES) * TIME_SLOT_INTERVAL_MINUTES;
    startMins = Math.max(startMins, roundedNow);
  }

  const slots: string[] = [];
  for (let m = startMins; m <= lastSlotMins; m += TIME_SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
};

interface BookingConfigProps {
  lang: string;
  selectedStaffIds: string[];
  selectedStaffInfoList: VipStaffInfo[];
  vipPricingTable?: VipPricingTable;
  vipPricing?: { duration: number; price: number; label: string }[];
  onConfirm: (data: { skillsMap: Record<string, string[]>; totalDuration: number; timeSlot: string | null; totalPrice: number }) => void;
}

const BookingConfig = ({ lang, selectedStaffIds, selectedStaffInfoList, vipPricingTable, onConfirm }: BookingConfigProps) => {
  const t = getT(lang);
  const primaryStaff = selectedStaffInfoList[0];
  const pricingTable = vipPricingTable ?? FALLBACK_PRICING_TABLE;

  // State
  const [selectedSkillsMap, setSelectedSkillsMap] = useState<Record<string, string[]>>(
    Object.fromEntries(selectedStaffIds.map(id => [id, []]))
  );
  const [activeStaffTab, setActiveStaffTab] = useState<string>(selectedStaffIds[0]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<VipDuration | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingMethod, setBookingMethod] = useState<'advance' | 'branch' | null>(null);
  const [showAllSkills, setShowAllSkills] = useState(false);

  // --- Real skills: intersection of all selected KTVs ---
  const allStaffSkills = selectedStaffInfoList.map(s => s.skills);
  const availableSkills = useMemo(() => getIntersectionSkills(allStaffSkills), [allStaffSkills]);
  const { le: leSkills, chinh: chinhSkills } = useMemo(() => groupSkillsByType(availableSkills), [availableSkills]);

  // All currently selected skill IDs
  const allSelectedSkillIds = useMemo(() =>
    Object.values(selectedSkillsMap).flat(), [selectedSkillsMap]
  );

  // --- Dynamic minDuration from PricingEngine ---
  const { minDuration, leCount, chinhCount } = useMemo(() =>
    calculateMinDuration(allSelectedSkillIds), [allSelectedSkillIds]
  );

  // Available durations (>= minDuration)
  const availableDurations = useMemo(() =>
    getAvailableDurations(minDuration), [minDuration]
  );

  // Auto-adjust selectedDuration if below minDuration
  const effectiveDuration = selectedDuration && selectedDuration >= minDuration
    ? selectedDuration : null;

  // Price from real pricing table
  const totalPrice = effectiveDuration
    ? lookupPrice(pricingTable, selectedStaffIds.length, effectiveDuration)
    : 0;

  // Day chips (next 5 days)
  const dayChips = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({ label: t[DAY_KEYS[d.getDay()]], date: d.getDate(), isoDate: d.toISOString().slice(0, 10) });
    }
    return days;
  }, [t]);

  // --- Dynamic time slots from KTV shift ---
  const timeSlots = useMemo(() => {
    // Use earliest shift among all selected staff (most restrictive)
    const shiftStart = primaryStaff?.shiftStart ?? null;
    const shiftEnd = primaryStaff?.shiftEnd ?? null;
    const isToday = selectedDay === 0;
    const duration = effectiveDuration ?? 60;
    return generateTimeSlots(shiftStart, shiftEnd, isToday, duration);
  }, [primaryStaff, selectedDay, effectiveDuration]);

  const toggleSkill = (staffId: string, skillId: string) => {
    setSelectedSkillsMap(prev => {
      const current = prev[staffId] || [];
      const updated = current.includes(skillId)
        ? current.filter(s => s !== skillId)
        : [...current, skillId];
      return { ...prev, [staffId]: updated };
    });
    setSelectedDuration(null);
  };

  const isReady = effectiveDuration !== null &&
    bookingMethod !== null &&
    (bookingMethod === 'branch' || (bookingMethod === 'advance' && selectedSlot !== null && selectedSlot !== 'BRANCH_DECIDE'));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-5 pt-2 pb-36"
    >
      {/* KTV Header — compact */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        {selectedStaffInfoList.length > 1 ? (
          <div>
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#d0c5b5] flex items-center mb-3">
              <span className="w-6 h-px bg-[#4d463a] mr-2" />
              {t.bc_servicesByKtv}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {selectedStaffInfoList.map(s => (
                <button key={s.id} onClick={() => setActiveStaffTab(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl min-w-max border transition-all ${
                    activeStaffTab === s.id
                      ? 'bg-[#c9a96e]/10 border-[#e6c487] text-[#e6c487]'
                      : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5]'
                  }`}
                >
                  {s.avatarUrl
                    ? <img src={s.avatarUrl} alt={s.fullName} className="w-7 h-7 rounded-full border border-white/10 shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-[#2a2a2c] flex items-center justify-center text-[#e6c487] text-xs font-bold">{s.fullName.charAt(0)}</div>
                  }
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-bold">{s.fullName}</span>
                    <span className="block text-[9px] opacity-60">
                      {(selectedSkillsMap[s.id] || []).length} {t.bc_skills}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Single KTV — compact inline */
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg relative shrink-0">
              {primaryStaff?.avatarUrl
                ? <img src={primaryStaff.avatarUrl} alt={primaryStaff.fullName} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-[#2a2a2c] to-[#1b1b1d] flex items-center justify-center text-xl text-[#e6c487]/30 font-serif">{primaryStaff?.fullName.charAt(0)}</div>
              }
            </div>
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#c9a96e]">{t.bc_expertTherapist}</p>
              <h2 className="text-xl font-serif italic text-[#e4e2e4]">{primaryStaff?.fullName}</h2>
              <p className="text-[11px] text-[#998f81]">{primaryStaff?.id}</p>
            </div>
          </div>
        )}
      </motion.section>

      {/* Skills — compact with "show more" */}
      <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
        <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#d0c5b5] flex items-center mb-3">
          <span className="w-6 h-px bg-[#4d463a] mr-2" />
          {t.bc_specialties}
        </h3>
        <p className="text-[10px] text-[#998f81] mb-3">
          {tpl(t.bc_minDurationHint, { le: leCount, chinh: chinhCount, min: minDuration })}
        </p>

        {/* Chính */}
        {chinhSkills.length > 0 && (
          <div className="mb-2">
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#998f81] mb-1.5">— {t.bc_mainServices}</p>
            <div className="flex flex-wrap gap-1.5">
              {chinhSkills.map(skill => {
                const isSelected = (selectedSkillsMap[activeStaffTab] || []).includes(skill.id);
                return (
                  <button key={skill.id} onClick={() => toggleSkill(activeStaffTab, skill.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                      isSelected
                        ? 'bg-[#e6c487]/15 border-[#e6c487] text-[#e6c487]'
                        : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5] hover:border-[#998f81]/50'
                    }`}
                  >{getSkillName(skill, lang as VipLang)}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lẻ — with show more logic */}
        {leSkills.length > 0 && (
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#998f81] mb-1.5">— {t.bc_addons}</p>
            <div className="flex flex-wrap gap-1.5">
              {(showAllSkills ? leSkills : leSkills.slice(0, SKILLS_VISIBLE_COUNT)).map(skill => {
                const isSelected = (selectedSkillsMap[activeStaffTab] || []).includes(skill.id);
                return (
                  <button key={skill.id} onClick={() => toggleSkill(activeStaffTab, skill.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                      isSelected
                        ? 'bg-[#e6c487]/15 border-[#e6c487] text-[#e6c487]'
                        : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5] hover:border-[#998f81]/50'
                    }`}
                  >{getSkillName(skill, lang as VipLang)}</button>
                );
              })}
              {!showAllSkills && leSkills.length > SKILLS_VISIBLE_COUNT && (
                <button onClick={() => setShowAllSkills(true)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-dashed border-[#998f81]/40 text-[#998f81] hover:border-[#e6c487]/50 hover:text-[#e6c487] transition-all"
                >+{leSkills.length - SKILLS_VISIBLE_COUNT}</button>
              )}
            </div>
          </div>
        )}

        {availableSkills.length === 0 && (
          <p className="text-[#998f81] text-sm">{t.bc_noSkills}</p>
        )}
      </motion.section>

      {/* Duration — HORIZONTAL SCROLL (Bug C fix) */}
      <AnimatePresence>
        {availableDurations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-[#c9a96e]/5 border border-[#e6c487]/20">
              <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#e6c487] font-bold mb-1">
                {t.bc_selectDuration}
              </h3>
              <p className="text-[10px] text-[#998f81] mb-3">
                {t.bc_vatIncluded}
              </p>
              {/* Horizontal scroll row */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {availableDurations.map(dur => {
                  const price = lookupPrice(pricingTable, selectedStaffIds.length, dur);
                  const isSelected = effectiveDuration === dur;
                  return (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`flex flex-col items-center justify-center min-w-[90px] py-3 px-3 rounded-xl transition-all shrink-0 border-2 ${
                        isSelected
                          ? 'bg-[#e6c487]/15 border-[#e6c487] text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.15)]'
                          : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5] hover:border-[#998f81]/50'
                      }`}
                    >
                      <span className="text-base font-bold">{dur}</span>
                      <span className="text-[10px] opacity-70">{t.bc_mins}</span>
                      <span className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-[#e6c487]' : 'text-[#c9a96e]'}`}>
                        {(price / 1000).toFixed(0)}k
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hình Thức Sử Dụng (after duration selected) */}
      <AnimatePresence>
        {selectedDuration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <section>
              <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#d0c5b5] flex items-center mb-3">
                <span className="w-6 h-px bg-[#4d463a] mr-2" />
                {t.bc_servicePreference}
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setBookingMethod('branch');
                    setSelectedSlot('BRANCH_DECIDE');
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    bookingMethod === 'branch'
                      ? 'bg-[#e6c487]/10 border-[#e6c487] text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.1)]'
                      : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5] hover:border-[#998f81]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-xs font-medium">{t.bc_walkIn}</span>
                </button>

                <button
                  onClick={() => {
                    setBookingMethod('advance');
                    if (selectedSlot === 'BRANCH_DECIDE') setSelectedSlot(null);
                  }}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    bookingMethod === 'advance'
                      ? 'bg-[#e6c487]/10 border-[#e6c487] text-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.1)]'
                      : 'bg-[#1b1b1d] border-[#4d463a]/30 text-[#d0c5b5] hover:border-[#998f81]/50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-xs font-medium">{t.bc_bookAdvance}</span>
                </button>
              </div>
            </section>

            <AnimatePresence>
              {bookingMethod === 'advance' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Day chips */}
                  <section>
                    <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#d0c5b5] flex items-center mb-3">
                      <span className="w-6 h-px bg-[#4d463a] mr-2" />
                      {t.bc_selectDate}
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {dayChips.map((day: { label: string; date: number }, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => { setSelectedDay(idx); setSelectedSlot(null); }}
                          className={`flex flex-col items-center justify-center min-w-[52px] h-16 rounded-2xl transition-all duration-200 ${
                            selectedDay === idx
                              ? 'bg-[#c9a96e]/20 border border-[#e6c487]/30 text-[#e6c487]'
                              : 'bg-[#1b1b1d] text-[#d0c5b5] border border-transparent'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-tighter opacity-70">{day.label}</span>
                          <span className="text-lg font-bold mt-0.5">{day.date}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Time slots — DYNAMIC GRID 3 COLUMNS (Bug B+C fix) */}
                  <section>
                    <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#d0c5b5] flex items-center mb-3">
                      <span className="w-6 h-px bg-[#4d463a] mr-2" />
                      {t.bc_availableTimes}
                    </h3>
                    {timeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(time => (
                          <button key={time} onClick={() => setSelectedSlot(time)}
                            className={`py-2.5 text-center rounded-xl text-sm font-medium transition-all border ${
                              selectedSlot === time
                                ? 'bg-[#e6c487]/10 border-[#e6c487] text-[#e6c487] font-bold'
                                : 'bg-[#1b1b1d] border-[#4d463a]/20 text-[#e4e2e4]/60 hover:border-[#998f81]/40'
                            }`}
                          >{time}</button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#998f81] text-sm text-center py-4">
                        {lang === 'vi' ? 'Không còn khung giờ trống' : 'No available time slots'}
                      </p>
                    )}
                    <p className="text-[9px] text-[#998f81] text-center mt-2">
                      {t.bc_timeNote}
                    </p>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating CTA Bar */}
      <AnimatePresence>
        {isReady && effectiveDuration && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-5 right-5 z-40"
          >
            <div className="flex justify-between items-end mb-2 px-1">
              <div>
                <div className="text-[10px] text-[#998f81] uppercase tracking-wider">{t.bc_selected}</div>
                <div className="text-lg font-bold text-[#e4e2e4]">{effectiveDuration} {t.bc_mins}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#e6c487] tracking-wider uppercase font-bold">Bespoke</div>
                <div className="text-lg font-bold text-[#e6c487]">{totalPrice.toLocaleString('vi-VN')}đ</div>
              </div>
            </div>
            <button
              onClick={() => onConfirm({ skillsMap: selectedSkillsMap, totalDuration: effectiveDuration, timeSlot: selectedSlot, totalPrice })}
              className="w-full py-4 rounded-full bg-[#e6c487] text-[#412d00] font-bold tracking-[0.12em] text-sm shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center justify-center gap-3 active:scale-95 duration-200 uppercase"
            >
              <span>{t.bc_confirmSelection}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingConfig;
