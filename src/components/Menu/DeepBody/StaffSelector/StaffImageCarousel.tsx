'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  type TherapyGalleryParsedItem,
  sortTherapyGalleryItems,
} from '@/lib/menuPhotos.helper';

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
  imageFit?: 'contain' | 'cover';
  onActiveItemChange?: (item: TherapyGalleryParsedItem | null) => void;
}

export default function StaffImageCarousel({
  items,
  images,
  staffId,
  staffName,
  lang = 'vi',
  imageFit = 'contain',
  onActiveItemChange,
}: StaffImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const normalizedItems = useMemo<TherapyGalleryParsedItem[]>(() => {
    const rawList = items ?? images ?? [];
    const mapped = rawList.map((it) =>
      typeof it === 'string' ? { url: it, kind: 'legacy' as const } : it
    );
    return sortTherapyGalleryItems(mapped);
  }, [items, images]);

  const preferredIndex = useMemo(() => {
    const taggedIndex = normalizedItems.findIndex(
      (item) => item.kind === 'therapy' || item.kind === 'mix'
    );
    return taggedIndex >= 0 ? taggedIndex : 0;
  }, [normalizedItems]);

  const total = normalizedItems.length;
  const validIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;
  const initializedKeyRef = useRef<string | null>(null);

  const staffKey = `${staffId}-${normalizedItems.map((it) => it.url).join(',')}`;

  useEffect(() => {
    if (!normalizedItems.length) return;

    if (initializedKeyRef.current !== staffKey) {
      initializedKeyRef.current = staffKey;
      setCurrentIndex(preferredIndex);
      onActiveItemChange?.(normalizedItems[preferredIndex] ?? null);
    }
  }, [staffKey, normalizedItems, preferredIndex, onActiveItemChange]);

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
          <div
            key={idx}
            className={`w-full h-full shrink-0 relative flex items-center justify-center overflow-hidden ${
              imageFit === 'cover' ? 'bg-[#1b1b1d]' : 'bg-[#131315]'
            }`}
          >
            {imageFit === 'cover' ? (
              <img
                src={item.url}
                alt={`${staffName} - ${idx + 1}`}
                className="w-full h-full object-cover object-top pointer-events-none transition-transform duration-700 group-hover:scale-105"
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            ) : (
              <>
                {/* Ambient blurred backdrop so letterbox/pillarbox blends softly */}
                <img
                  src={item.url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-25 pointer-events-none"
                />
                {/* Full uncropped image */}
                <img
                  src={item.url}
                  alt={`${staffName} - ${idx + 1}`}
                  className="w-full h-full object-contain relative z-10 pointer-events-none"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  draggable={false}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Therapy Label (Soft blur background, no button frame/border) */}
      {badgeLabel && (
        <div className="absolute top-16 left-5 sm:left-6 z-20 pointer-events-none select-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md inline-flex items-center">
            <span className="text-xs sm:text-sm font-black tracking-[0.15em] uppercase text-[#e6c487] drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
              {badgeLabel}
            </span>
          </div>
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
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3 sm:left-4 top-[45%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 text-[#e6c487] border border-[#e6c487]/50 hover:border-[#e6c487] flex items-center justify-center backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 sm:right-4 top-[45%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black/95 text-[#e6c487] border border-[#e6c487]/50 hover:border-[#e6c487] flex items-center justify-center backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-90"
            aria-label="Ảnh kế tiếp"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}
