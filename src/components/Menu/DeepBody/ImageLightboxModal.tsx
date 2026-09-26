'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ImageLightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
  badgeLabel?: string | null;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export default function ImageLightboxModal({
  isOpen,
  images,
  initialIndex = 0,
  title,
  subtitle,
  badgeLabel,
  onClose,
  onIndexChange,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const validInitial = Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1));
      setCurrentIndex(validInitial);
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const total = images.length;
  const validIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0;
  const currentImage = images[validIndex];

  const selectIndex = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
    },
    [onIndexChange]
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrev, goToNext, onClose]);

  // Touch swipe support
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (total <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || total <= 1) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartXRef.current;
    const diffY = endY - (touchStartYRef.current ?? endY);

    // Only swipe if horizontal move is dominant
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && total > 0 && currentImage && (
        <motion.div
          key="image-lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Xem ảnh đầy đủ'}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Backdrop (Clicking outside closes modal) */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-zoom-out z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />

          {/* Top Header Bar */}
          <div
            className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Title & Badge */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
              {badgeLabel && (
                <span className="px-3 py-1 rounded-full bg-[#e6c487]/20 border border-[#e6c487]/50 text-[#e6c487] text-xs font-bold uppercase tracking-wider shrink-0 shadow-sm">
                  {badgeLabel}
                </span>
              )}
              {title && (
                <div className="min-w-0">
                  <h3 className="text-white text-sm sm:text-base font-bold truncate">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-gray-400 text-xs truncate">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-2xl shrink-0 z-50 pointer-events-auto"
              aria-label="Đóng xem ảnh"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Image Container */}
          <div
            className="relative z-20 w-full h-full flex items-center justify-center p-2 sm:p-6 md:p-8 pointer-events-auto"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }
            }}
          >
            <motion.div
              key={validIndex}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative max-w-[95vw] max-h-[85vh] sm:max-h-[88vh] flex items-center justify-center pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage}
                alt={title || `Ảnh ${validIndex + 1}`}
                className="max-w-[95vw] max-h-[85vh] sm:max-h-[88vh] w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Navigation Arrows (if > 1 image) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPrev();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-[#e6c487] border border-[#e6c487]/50 hover:border-[#e6c487] flex items-center justify-center transition-all shadow-[0_6px_25px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer pointer-events-auto"
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNext();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/70 hover:bg-black/90 active:scale-90 text-[#e6c487] border border-[#e6c487]/50 hover:border-[#e6c487] flex items-center justify-center transition-all shadow-[0_6px_25px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-pointer pointer-events-auto"
                aria-label="Ảnh kế tiếp"
              >
                <ChevronRight size={28} />
              </button>

              {/* Bottom Dots & Counter */}
              <div
                className="absolute bottom-5 inset-x-0 z-30 flex items-center justify-center gap-3 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
                  <span className="text-xs sm:text-sm font-bold text-[#e6c487]">
                    {validIndex + 1} / {total}
                  </span>

                  <div className="flex items-center gap-1.5 ml-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectIndex(idx);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === validIndex
                            ? 'w-6 bg-[#e6c487] shadow-[0_0_10px_rgba(230,196,135,0.7)]'
                            : 'w-2 bg-white/35 hover:bg-white/65'
                        }`}
                        aria-label={`Chuyển đến ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
