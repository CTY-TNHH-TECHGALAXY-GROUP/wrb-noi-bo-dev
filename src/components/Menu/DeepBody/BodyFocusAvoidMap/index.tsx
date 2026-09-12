'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { getDeepBodyT } from '../DeepBody.i18n';

export type BodyAreaKey =
  | 'HEAD'
  | 'NECK'
  | 'SHOULDER'
  | 'ARM'
  | 'BACK'
  | 'THIGH'
  | 'KNEE'
  | 'CALF'
  | 'FOOT';

export type MarkerMode = 'focus' | 'avoid' | null;

interface BodyPoint {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  primary?: boolean;
}

// Coordinates calibrated to 655 x 1024 native image
const AREA_CLUSTERS: Record<BodyAreaKey, BodyPoint[]> = {
  HEAD: [
    { x: 50.0, y: 3.8, primary: true },
    { x: 50.0, y: 6.8, primary: true },
    { x: 50.0, y: 10.2 },
  ],
  NECK: [
    { x: 50.0, y: 14.2, primary: true },
    { x: 50.0, y: 16.6 },
    { x: 47.2, y: 15.5 },
    { x: 52.8, y: 15.5 },
  ],
  SHOULDER: [
    { x: 33.2, y: 19.8, primary: true },
    { x: 66.8, y: 19.8, primary: true },
    { x: 38.6, y: 18.2 },
    { x: 61.4, y: 18.2 },
    { x: 43.8, y: 18.0 },
    { x: 56.2, y: 18.0 },
  ],
  ARM: [
    { x: 26.5, y: 27.2 },
    { x: 73.5, y: 27.2 },
    { x: 24.0, y: 35.5, primary: true },
    { x: 76.0, y: 35.5, primary: true },
    { x: 20.0, y: 47.0, primary: true },
    { x: 80.0, y: 47.0, primary: true },
    { x: 19.0, y: 52.0 },
    { x: 81.0, y: 52.0 },
  ],
  BACK: [
    { x: 50.0, y: 21.6 },
    { x: 50.0, y: 28.5, primary: true },
    { x: 44.5, y: 34.0 },
    { x: 55.5, y: 34.0 },
    { x: 50.0, y: 37.8, primary: true },
    { x: 45.2, y: 41.8 },
    { x: 54.8, y: 41.8 },
    { x: 50.0, y: 45.0, primary: true },
  ],
  THIGH: [
    { x: 40.0, y: 48.8, primary: true },
    { x: 60.0, y: 48.8, primary: true },
    { x: 37.5, y: 56.5, primary: true },
    { x: 62.5, y: 56.5, primary: true },
    { x: 38.5, y: 62.0 },
    { x: 61.5, y: 62.0 },
  ],
  KNEE: [
    { x: 40.0, y: 67.5, primary: true },
    { x: 60.0, y: 67.5, primary: true },
    { x: 39.0, y: 70.0 },
    { x: 61.0, y: 70.0 },
  ],
  CALF: [
    { x: 37.5, y: 75.5, primary: true },
    { x: 62.5, y: 75.5, primary: true },
    { x: 37.0, y: 81.5 },
    { x: 63.0, y: 81.5 },
  ],
  FOOT: [
    { x: 42.0, y: 88.0, primary: true },
    { x: 58.0, y: 88.0, primary: true },
    { x: 41.0, y: 92.5 },
    { x: 59.0, y: 92.5 },
    { x: 40.0, y: 96.0 },
    { x: 60.0, y: 96.0 },
  ],
};

const AREA_LIST: { key: BodyAreaKey; i18nKey: string }[] = [
  { key: 'HEAD', i18nKey: 'area_head' },
  { key: 'NECK', i18nKey: 'area_neck' },
  { key: 'SHOULDER', i18nKey: 'area_shoulders' },
  { key: 'ARM', i18nKey: 'area_arms' },
  { key: 'BACK', i18nKey: 'area_back' },
  { key: 'THIGH', i18nKey: 'area_thigh' },
  { key: 'KNEE', i18nKey: 'area_knee' },
  { key: 'CALF', i18nKey: 'area_calf' },
  { key: 'FOOT', i18nKey: 'area_feet' },
];

interface BodyFocusAvoidMapProps {
  lang: string;
  focusAreas: string[];
  avoidAreas: string[];
  onChange: (focus: string[], avoid: string[]) => void;
}

export default function BodyFocusAvoidMap({
  lang,
  focusAreas,
  avoidAreas,
  onChange,
}: BodyFocusAvoidMapProps) {
  const t = getDeepBodyT(lang);

  const handleToggle = (key: BodyAreaKey, type: 'focus' | 'avoid') => {
    let newFocus = [...focusAreas];
    let newAvoid = [...avoidAreas];

    if (type === 'focus') {
      if (newFocus.includes(key)) {
        newFocus = newFocus.filter((k) => k !== key);
      } else {
        newFocus.push(key);
        newAvoid = newAvoid.filter((k) => k !== key);
      }
    } else {
      if (newAvoid.includes(key)) {
        newAvoid = newAvoid.filter((k) => k !== key);
      } else {
        newAvoid.push(key);
        newFocus = newFocus.filter((k) => k !== key);
      }
    }

    onChange(newFocus, newAvoid);
  };

  const getAreaStatus = (key: BodyAreaKey): MarkerMode => {
    if (focusAreas.includes(key)) return 'focus';
    if (avoidAreas.includes(key)) return 'avoid';
    return null;
  };

  return (
    <section className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#e6c487] tracking-wide">
            {t.body_map_section_title}
          </h3>
        </div>
        {(focusAreas.length > 0 || avoidAreas.length > 0) && (
          <div className="flex items-center gap-2">
            {focusAreas.length > 0 && (
              <span className="text-xs sm:text-sm font-bold text-[#39d67b] bg-[#39d67b]/15 px-3 py-1 rounded-full border border-[#39d67b]/30">
                {focusAreas.length} {t.body_map_col_focus}
              </span>
            )}
            {avoidAreas.length > 0 && (
              <span className="text-xs sm:text-sm font-bold text-[#ff5b66] bg-[#ff5b66]/15 px-3 py-1 rounded-full border border-[#ff5b66]/30">
                {avoidAreas.length} {t.body_map_col_avoid}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Container: Left Viewer + Right Controls side-by-side on ALL screens (mobile, tablet, desktop) */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#e6c487]/25 bg-gradient-to-b from-[#141416] to-[#0c0c0e] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-row items-stretch">
        
        {/* ── LEFT PANEL: FIXED ASPECT RATIO (655:1024) BODY ANATOMY VIEWER ── */}
        <div className="relative w-[40%] xs:w-[42%] sm:w-[43%] md:w-[45%] shrink-0 bg-[#070708] flex items-center justify-center p-1.5 sm:p-2.5 border-r border-white/5 overflow-hidden select-none">
          {/* Ambient Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(230,196,135,0.08),transparent_55%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(57,214,123,0.04),transparent_50%)] pointer-events-none" />

          {/* Unified Container with fixed aspect ratio matching the 655x1024 body image - fitted naturally within frame */}
          <div
            className="relative w-full max-h-full scale-[0.96] sm:scale-[0.98] transition-transform origin-center"
            style={{
              aspectRatio: '655 / 1024',
              maxHeight: '100%',
            }}
          >
            {/* 1. Base Image - pinned to 100% of container */}
            <img
              src="/images/body-map.webp"
              alt="Anatomical Body Meridian Map"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none filter contrast-115 brightness-110 saturate-105"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
            />

            {/* Glowing Acupuncture Dots Overlay - pinned to exact anatomical coordinates */}
            <div className="absolute inset-0 pointer-events-none">
              {AREA_LIST.map(({ key }) => {
                const status = getAreaStatus(key);
                const points = AREA_CLUSTERS[key] || [];

                return points.map((pt, i) => {
                  const isVisible = status !== null;
                  const isFocus = status === 'focus';
                  const isAvoid = status === 'avoid';

                  return (
                    <span
                      key={`${key}-${i}`}
                      style={{
                        left: `${pt.x}%`,
                        top: `${pt.y}%`,
                      }}
                      className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none ${
                        pt.primary ? 'w-2.5 h-2.5 sm:w-3.5 sm:h-3.5' : 'w-1.5 h-1.5 sm:w-2.5 sm:h-2.5'
                      } ${
                        isVisible
                          ? 'opacity-100 scale-100'
                          : 'opacity-0 scale-50'
                      } ${
                        isFocus
                          ? 'bg-[#39d67b] shadow-[0_0_8px_#39d67b,0_0_16px_rgba(57,214,123,0.7)]'
                          : ''
                      } ${
                        isAvoid
                          ? 'bg-[#ff5b66] shadow-[0_0_8px_#ff5b66,0_0_16px_rgba(255,91,102,0.7)]'
                          : ''
                      }`}
                    >
                      {/* Inner Ping Core for Primary Dots */}
                      {isVisible && pt.primary && (
                        <span
                          className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                            isFocus ? 'bg-[#39d67b]' : 'bg-[#ff5b66]'
                          }`}
                        />
                      )}
                    </span>
                  );
                });
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: AREA CONTROLS (ALIGNED HORIZONTALLY WITH BODY MAP ACROSS ALL SCREENS) ── */}
        <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 md:p-5 bg-gradient-to-b from-[#121214] to-[#0d0d0f] h-full overflow-hidden">
          <div className="flex flex-col h-full justify-between">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_36px_36px] xs:grid-cols-[1fr_42px_42px] sm:grid-cols-[1fr_64px_64px] md:grid-cols-[1fr_76px_76px] gap-1 sm:gap-2 items-center pb-2 mb-0.5 border-b border-white/10 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider flex-none">
              <div className="text-[#e6c487] pl-0.5 font-bold truncate">
                {t.body_map_col_area}
              </div>
              <div className="text-[#39d67b] text-center font-bold truncate">
                {t.body_map_col_focus}
              </div>
              <div className="text-[#ff5b66] text-center font-bold truncate">
                {t.body_map_col_avoid}
              </div>
            </div>

            {/* Rows distributed evenly across height so each row aligns with the anatomical position on the left */}
            <div className="flex-1 flex flex-col justify-between divide-y divide-white/5 py-0.5 sm:py-1">
              {AREA_LIST.map(({ key, i18nKey }) => {
                const status = getAreaStatus(key);
                const isFocus = status === 'focus';
                const isAvoid = status === 'avoid';
                const label = (t as any)[i18nKey] || key;

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_36px_36px] xs:grid-cols-[1fr_42px_42px] sm:grid-cols-[1fr_64px_64px] md:grid-cols-[1fr_76px_76px] gap-1 sm:gap-2 items-center py-0.5 sm:py-1 hover:bg-white/[0.03] rounded-lg transition-colors px-0.5 sm:px-1"
                  >
                    {/* Area Name */}
                    <div
                      className={`text-xs xs:text-sm sm:text-base md:text-lg font-bold transition-colors flex items-center gap-1.5 sm:gap-2 truncate ${
                        isFocus
                          ? 'text-[#39d67b]'
                          : isAvoid
                          ? 'text-[#ff5b66]'
                          : 'text-gray-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 transition-all ${
                          isFocus
                            ? 'bg-[#39d67b] shadow-[0_0_6px_#39d67b]'
                            : isAvoid
                            ? 'bg-[#ff5b66] shadow-[0_0_6px_#ff5b66]'
                            : 'bg-white/25'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {/* Focus Checkbox Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(key, 'focus')}
                      aria-label={`Focus ${label}`}
                      className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 mx-auto rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                        isFocus
                          ? 'bg-[#39d67b]/20 border-[#39d67b] text-[#39d67b] shadow-[0_0_12px_rgba(57,214,123,0.35)] scale-105'
                          : 'bg-[#18181b] border-white/10 text-transparent hover:border-white/25 active:scale-95'
                      }`}
                    >
                      <Check
                        size={16}
                        strokeWidth={3}
                        className={isFocus ? 'opacity-100' : 'opacity-0'}
                      />
                    </button>

                    {/* Avoid Checkbox Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(key, 'avoid')}
                      aria-label={`Avoid ${label}`}
                      className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 mx-auto rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                        isAvoid
                          ? 'bg-[#ff5b66]/20 border-[#ff5b66] text-[#ff5b66] shadow-[0_0_12px_rgba(255,91,102,0.35)] scale-105'
                          : 'bg-[#18181b] border-white/10 text-transparent hover:border-white/25 active:scale-95'
                      }`}
                    >
                      <Check
                        size={16}
                        strokeWidth={3}
                        className={isAvoid ? 'opacity-100' : 'opacity-0'}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
