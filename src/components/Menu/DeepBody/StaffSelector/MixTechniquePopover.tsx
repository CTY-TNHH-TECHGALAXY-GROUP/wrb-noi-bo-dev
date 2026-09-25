'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !staff || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, staff]);

  const [selectedIds, setSelectedIds] = useState<DeepBodyBaseTechniqueId[]>(() => {
    if (initialSelected && initialSelected.length > 0) {
      return initialSelected.filter((id) =>
        staffHasDeepBodyTechnique(staff?.skills, id)
      );
    }
    return [];
  });

  useEffect(() => {
    if (initialSelected && initialSelected.length > 0) {
      setSelectedIds(
        initialSelected.filter((id) =>
          staffHasDeepBodyTechnique(staff?.skills, id)
        )
      );
    } else {
      setSelectedIds([]);
    }
  }, [initialSelected, staff]);

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

  const isApplyDisabled = selectedIds.length < 1 || selectedIds.length > 4;

  const handleApply = () => {
    if (isApplyDisabled) return;
    onApply(selectedIds);
  };

  return (
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => { event.preventDefault(); onCancel(); }}
        onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}
        className="fixed inset-0 m-auto w-[calc(100%_-_1.5rem)] max-w-md max-h-[calc(100dvh_-_2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[#e6c487]/30 bg-[#141416] p-0 text-white shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
      >
        <div
          className="flex min-h-0 flex-col p-4 sm:p-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 pb-3 border-b border-white/10">
            <div className="min-w-0">
              <div className="mb-1">
                <h3 id={titleId} className="text-base sm:text-lg font-semibold leading-snug break-words text-white">
                  {t.mix_popover_title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#e6c487]"
              aria-label={t.close}
            >
              <X size={18} />
            </button>
          </div>

          {/* Techniques list */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 space-y-2">
            {DEEP_BODY_BASE_TECHNIQUE_IDS.map((techId) => {
              const techInfo = DEEP_BODY_TECHNIQUES.find((t) => t.id === techId);
              const isSelected = selectedIds.includes(techId);
              const hasSkill = staffHasDeepBodyTechnique(staff.skills, techId);

              const name = techInfo?.name[safeLang] || techInfo?.name.en || techId;

              return (
                <button
                  key={techId}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={!hasSkill}
                  onClick={() => handleToggle(techId)}
                  className={`w-full min-h-12 p-3 rounded-xl border transition-colors flex items-center gap-3 text-left cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#e6c487] ${
                    !hasSkill
                      ? 'opacity-40 border-white/5 bg-white/5 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#e6c487]/10 border-[#e6c487] shadow-[0_0_15px_rgba(230,196,135,0.15)]'
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-black/60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-[#e6c487] border-[#e6c487] text-black font-bold'
                        : 'border-white/30 bg-black/40 text-transparent'
                    }`}
                  >
                    <Check size={14} className={isSelected ? 'text-black stroke-[3]' : 'opacity-0'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className={`text-sm sm:text-base font-medium break-words ${isSelected ? 'text-[#e6c487]' : 'text-white'}`}>
                        {name}
                      </span>
                      {!hasSkill && (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          {t.staff_not_supported_label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Validation Notice */}
          {selectedIds.length === 0 && (
            <div role="status" className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
              <AlertCircle size={14} className="shrink-0" />
              <span>{t.mix_min_warning}</span>
            </div>
          )}
          {selectedIds.length === 1 && (
            <div role="status" className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs mb-3">
              <AlertCircle size={14} className="shrink-0" />
              <span>{t.mix_single_hint}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="shrink-0 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-gray-400 font-medium">
              {t.selected_methods_count.replace('{count}', String(selectedIds.length))}
            </span>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-11 flex-1 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {t.mix_cancel}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplyDisabled}
                className={`min-h-11 flex-1 whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  isApplyDisabled
                    ? 'opacity-40 bg-zinc-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#e6c487] to-[#c9a96e] text-black hover:brightness-110 active:scale-95'
                }`}
              >
                {t.mix_apply}
              </button>
            </div>
          </div>
        </div>
      </dialog>
  );
}
