'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { TherapyGalleryParsedItem } from '@/lib/menuPhotos.helper';

const THERAPY_BADGE_LABELS: Record<string, Record<string, string>> = {
  coconutOil: {
    vi: 'Tinh dầu dừa',
    en: 'Coconut Oil',
    cn: '椰子精油',
    jp: 'ココナッツオイル',
    kr: '코코넛 오일',
  },
  thaiTherapy: {
    vi: 'Thái',
    en: 'Thai Therapy',
    cn: '泰式理疗',
    jp: 'タイ古式',
    kr: '타이 테라피',
  },
  shiatsu: {
    vi: 'Bấm huyệt',
    en: 'Shiatsu Acupressure',
    cn: '指压理疗',
    jp: '指圧',
    kr: '시아추 지압',
  },
  hotStone: {
    vi: 'Đá nóng',
    en: 'Hot Stone',
    cn: '热石理疗',
    jp: 'ホットストーン',
    kr: '핫스톤',
  },
  mix: {
    vi: 'Mix 2–4 Liệu Trình',
    en: 'Mix 2–4 Therapies',
    cn: '2–4重综合疗程',
    jp: '2–4種融合',
    kr: '2–4가지 복합 테라피',
  },
};

export interface StaffImageCarouselProps {
  items?: Array<TherapyGalleryParsedItem | string>;
  images?: string[];
  staffId: string;
  staffName: string;
  lang?: string;
  onActiveItemChange?: (item: TherapyGalleryParsedItem | null) => void;
}

export default function StaffImageCarousel({
  items,
  images,
  staffId,
  staffName,
  lang = 'vi',
  onActiveItemChange,
}: StaffImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const normalizedItems = useMemo<TherapyGalleryParsedItem[]>(() => {
    const rawList = items ?? images ?? [];
    return rawList.map((it) =>
      typeof it === 'string' ? { url: it, kind: 'legacy' as const } : it
    );
  }, [items, images]);

  const total = normalizedItems.length;
  const validIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;

  // Touch and drag swipe detection
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef<number>(0);

  const selectIndex = useCallback(
    (nextIndex: number) => {
      setCurrentIndex(nextIndex);
      onActiveItemChange?.(normalizedItems[nextIndex] ?? null);
    },
    [normalizedItems, onActiveItemChange]
  );

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    const prev = validIndex === 0 ? total - 1 : validIndex - 1;
    selectIndex(prev);
  }, [total, validIndex, selectIndex]);

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    const next = validIndex === total - 1 ? 0 : validIndex + 1;
    selectIndex(next);
  }, [total, validIndex, selectIndex]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (total <= 1) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = () => {
    // tracking can be expanded if progressive drag animation is desired
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null || total <= 1) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - startXRef.current;

    if (Math.abs(diffX) > 40) {
      suppressClickUntilRef.current = Date.now() + 500;
      e.stopPropagation();
      if (diffX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }

    startXRef.current = null;
    startYRef.current = null;
  };

  // Mouse Drag Handlers (for desktop trackpads/mice)
  const isMouseDownRef = useRef<boolean>(false);
  const mouseStartXRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (total <= 1) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseMove = () => {
    if (!isMouseDownRef.current) return;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    const diffX = e.clientX - mouseStartXRef.current;

    if (Math.abs(diffX) > 40) {
      suppressClickUntilRef.current = Date.now() + 500;
      e.stopPropagation();
      if (diffX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (Date.now() < suppressClickUntilRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // If no images
  if (total === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#252528] to-[#121214]">
        <span className="text-3xl text-[#e6c487]/40 font-bold tracking-widest">{staffId}</span>
      </div>
    );
  }

  const activeItem = normalizedItems[validIndex];
  let badgeLabel: string | null = null;
  if (activeItem?.kind === 'therapy') {
    badgeLabel =
      THERAPY_BADGE_LABELS[activeItem.therapyId]?.[lang] ||
      THERAPY_BADGE_LABELS[activeItem.therapyId]?.en ||
      null;
  } else if (activeItem?.kind === 'mix') {
    badgeLabel =
      THERAPY_BADGE_LABELS.mix?.[lang] ||
      THERAPY_BADGE_LABELS.mix?.en ||
      null;
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        isMouseDownRef.current = false;
      }}
      onClickCapture={handleClickCapture}
    >
      {/* Sliding Track */}
      <div
        className="flex w-full h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${validIndex * 100}%)` }}
      >
        {normalizedItems.map((item, idx) => (
          <div key={idx} className="w-full h-full shrink-0 relative bg-[#1b1b1d]">
            <img
              src={item.url}
              alt={`${staffName} - ${idx + 1}`}
              className="w-full h-full object-cover object-top pointer-events-none transition-transform duration-700 group-hover:scale-105"
              loading={idx === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Therapy Metadata Badge Indicator (Non-clickable, informative) */}
      {badgeLabel && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#e6c487]/40 shadow-lg text-xs font-semibold text-[#e6c487]">
          <Sparkles size={12} className="text-[#e6c487] shrink-0" />
          <span>{badgeLabel}</span>
        </div>
      )}

      {/* Multiple Photos Controls (only rendered when > 1 photo) */}
      {total > 1 && (
        <>
          {/* Top Pagination Story Indicators */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-25 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {normalizedItems.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === validIndex
                    ? 'w-5 bg-[#e6c487] shadow-[0_0_8px_rgba(230,196,135,0.6)]'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ảnh ${idx + 1} của ${staffName}`}
              />
            ))}
          </div>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3.5 top-[40%] -translate-y-1/2 z-25 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white/90 hover:text-[#e6c487] border border-white/20 hover:border-[#e6c487]/60 flex items-center justify-center backdrop-blur-md shadow-xl transition-all cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3.5 top-[40%] -translate-y-1/2 z-25 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white/90 hover:text-[#e6c487] border border-white/20 hover:border-[#e6c487]/60 flex items-center justify-center backdrop-blur-md shadow-xl transition-all cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Ảnh kế tiếp"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
