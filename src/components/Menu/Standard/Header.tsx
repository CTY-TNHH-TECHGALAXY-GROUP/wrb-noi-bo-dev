/*
 * File: Standard/Header.tsx
 * Chức năng: Thanh điều hướng (Navigation Bar) trên cùng.
 * Logic chi tiết:
 * - Nhận danh sách categories và activeCategory từ parent.
 * - Hiển thị các tab danh mục (Body, Foot, Facial...).
 * - Xử lý sự kiện click: Scroll mượt (smooth scroll) đến section tương ứng.
 * - Highlight tab đang active.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Category } from '@/components/Menu/types';

interface HeaderProps {
    categories: Category[];
    activeCategory: string;
    lang: string;
    onSelectCategory: (id: string) => void;
}

export default function Header({ categories, activeCategory, lang, onSelectCategory }: HeaderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    
    const repeatedCategories = categories;

    useEffect(() => {
        setIsReady(true);
    }, [categories.length]);

    // ---- Hỗ trợ kéo thả trên màn hình máy tính (Mouse Drag to Scroll) ----
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        if (scrollRef.current) {
            startX.current = e.pageX - scrollRef.current.offsetLeft;
            scrollLeft.current = scrollRef.current.scrollLeft;
            scrollRef.current.style.cursor = 'grabbing';
            scrollRef.current.style.scrollBehavior = 'auto'; // Tắt snap khi kéo
        }
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.scrollBehavior = 'smooth';
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (scrollRef.current) {
            scrollRef.current.style.cursor = 'grab';
            scrollRef.current.style.scrollBehavior = 'smooth';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5; // Tốc độ trượt
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    return (
        <div className="glass-header w-full z-30 pt-safe-top pb-2 px-2 flex flex-col shadow-lg shrink-0 relative bg-black/80 backdrop-blur-md border-b border-gray-800/50 sticky top-0">
            <div 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className={`flex flex-row overflow-x-auto md:justify-center snap-x hide-scrollbar gap-x-4 md:gap-x-6 pt-4 px-4 pb-2 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} cursor-grab`}
                style={{ scrollBehavior: 'smooth' }}
            >
                {repeatedCategories.map((cat, index) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={`${cat.id}-${index}`}
                            onClick={() => onSelectCategory(cat.id)}
                            className={`flex flex-col items-center gap-2 group focus:outline-none shrink-0 snap-center w-[4.5rem] md:w-[5.5rem] transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}
                        >
                            <div className={`w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-full border flex items-center justify-center transition-all shadow-md overflow-hidden relative ${isActive ? 'bg-[#1a1a1a] border-[#C9A96E]' : 'bg-[#1c1c1e] border-transparent group-hover:bg-[#252528] pointer-events-none'}`}>
                                <img
                                    src={cat.image || 'https://placehold.co/100x100'}
                                    className="w-[70%] h-[70%] object-contain transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                                    alt={cat.names['en']}
                                />
                            </div>
                            <span className={`pointer-events-none text-[10px] font-medium uppercase tracking-tight text-center w-full truncate px-0.5 leading-tight ${isActive ? 'text-[#C9A96E]' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                {cat.names[lang as keyof typeof cat.names] || cat.names['en']}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="text-[9px] text-center text-gray-500 uppercase tracking-widest mt-2 border-t border-gray-800 pt-1">
                — Random Staff & Room —
            </div>
        </div>
    );
}