'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, AlertCircle } from 'lucide-react';
import {
  DEEP_BODY_BASE_TECHNIQUE_IDS,
  type DeepBodyBaseTechniqueId,
  DEEP_BODY_TECHNIQUES,
  staffHasDeepBodyTechnique,
  type DeepBodyLang,
} from '@/lib/deepBody.constants';
import { type VipStaffInfo } from '@/lib/vipStaffUtils';
import { getDeepBodyT } from '../DeepBody.i18n';

interface MixTechniquePopoverProps {
  isOpen: boolean;
  staff: VipStaffInfo | null;
  lang: string;
  initialSelected?: DeepBodyBaseTechniqueId[];
  onApply: (selectedTechniqueIds: DeepBodyBaseTechniqueId[]) => void;
  onCancel: () => void;
}

export default function MixTechniquePopover({
  isOpen,
  staff,
  lang,
  initialSelected = [],
  onApply,
  onCancel,
}: MixTechniquePopoverProps) {
  const t = getDeepBodyT(lang);
  const safeLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(lang) ? lang : 'en') as DeepBodyLang;

  const [selectedIds, setSelectedIds] = useState<DeepBodyBaseTechniqueId[]>(() => {
    if (initialSelected.length >= 2) return initialSelected;
    // Default select first 2 techniques that staff supports
    const available = DEEP_BODY_BASE_TECHNIQUE_IDS.filter((id) =>
      staffHasDeepBodyTechnique(staff?.skills, id)
    );
    return available.slice(0, 2);
  });

  if (!isOpen || !staff) return null;

  const handleToggle = (id: DeepBodyBaseTechniqueId) => {
    const hasSkill = staffHasDeepBodyTechnique(staff.skills, id);
    if (!hasSkill) return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 4) return prev; // max 4
        return [...prev, id];
      }
    });
  };

  const isApplyDisabled = selectedIds.length < 2 || selectedIds.length > 4;

  const handleApply = () => {
    if (isApplyDisabled) return;
    onApply(selectedIds);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to cancel */}
        <div className="absolute inset-0" onClick={onCancel} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#141416] border border-[#e6c487]/30 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-[#e6c487]" />
                <h3 className="text-lg sm:text-xl font-bold text-white font-luxury">
                  {t.mix_popover_title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                {t.mix_popover_desc}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              aria-label={t.close}
            >
              <X size={18} />
            </button>
          </div>

          {/* Techniques list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {DEEP_BODY_BASE_TECHNIQUE_IDS.map((techId) => {
              const techInfo = DEEP_BODY_TECHNIQUES.find((t) => t.id === techId);
              const isSelected = selectedIds.includes(techId);
              const hasSkill = staffHasDeepBodyTechnique(staff.skills, techId);

              const name = techInfo?.name[safeLang] || techInfo?.name.en || techId;
              const shortDesc =
                techInfo?.shortDesc[safeLang] || techInfo?.shortDesc.en || '';

              return (
                <div
                  key={techId}
                  onClick={() => handleToggle(techId)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                    !hasSkill
                      ? 'opacity-40 border-white/5 bg-white/5 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#e6c487]/10 border-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.15)]'
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                      isSelected
                        ? 'bg-[#e6c487] border-[#e6c487] text-black font-bold'
                        : 'border-white/30 bg-black/40 text-transparent'
                    }`}
                  >
                    <Check size={14} className={isSelected ? 'text-black stroke-[3]' : 'opacity-0'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm sm:text-base font-bold ${isSelected ? 'text-[#e6c487]' : 'text-white'}`}>
                        {name}
                      </h4>
                      {!hasSkill && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          {t.staff_not_supported_label}
                        </span>
                      )}
                    </div>
                    {shortDesc && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {shortDesc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Warning if < 2 */}
          {selectedIds.length < 2 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
              <AlertCircle size={14} className="shrink-0" />
              <span>{t.mix_min_warning}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-medium">
              {t.selected_methods_count.replace('{count}', String(selectedIds.length))}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                {t.mix_cancel}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplyDisabled}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg cursor-pointer ${
                  isApplyDisabled
                    ? 'opacity-40 bg-zinc-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#e6c487] to-[#c9a96e] text-black hover:brightness-110 active:scale-95'
                }`}
              >
                {t.mix_apply}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
