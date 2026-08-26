/*
 * File: Standard/ServiceItem.tsx
 * Chức năng: Card hiển thị thông tin tóm tắt của một nhóm dịch vụ (Service Group).
 * Logic chi tiết:
 * - Hiển thị ảnh đại diện, tên dịch vụ (đa ngôn ngữ), và khoảng giá (Min - Max).
 * - Xử lý sự kiện click để mở MainSheet cho nhóm dịch vụ này.
 * - Hiển thị badge số lượng nếu đã có item trong giỏ hàng.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';
import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Service } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';

interface ServiceItemProps {
    service: Service;
    singleOption?: Service;
    quantity: number;
    lang: string;
    isBestSeller?: boolean; // Prop mới
    onClick: () => void;
    onQuickAdd?: () => void;
    onQuickRemove?: () => void;
}

const TEXT = {
    mins: { vi: 'phút', en: 'mins', cn: '分钟', jp: '分', kr: '분' },
    see_more: { vi: 'Xem thêm', en: 'See more', cn: '查看更多', jp: 'もっと見る', kr: '더 보기' },
};

const normalizeText = (value: string) => (
    value.trim().toLowerCase().replace(/\s+/g, ' ')
);

const getShortDescription = (value: string, wordLimit = 7) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, wordLimit).join(' ');
};

export default function ServiceItem({ service, singleOption, quantity, lang, isBestSeller, onClick, onQuickAdd, onQuickRemove }: ServiceItemProps) {
    const name = service.names[lang as keyof typeof service.names] || service.names['en'];
    const desc = service.descriptions[lang as keyof typeof service.descriptions] || service.descriptions['en'];
    const isSelected = quantity > 0;
    const minsText = TEXT.mins[lang as keyof typeof TEXT.mins] || TEXT.mins.en;
    const seeMoreText = TEXT.see_more[lang as keyof typeof TEXT.see_more] || TEXT.see_more.en;
    const descMatchesName = normalizeText(desc || '') === normalizeText(name || '');
    const hideLongSingleDescription = !!singleOption && (desc || '').length > 58;
    const showDescription = !!desc && !descMatchesName && !hideLongSingleDescription;
    const shortDescription = hideLongSingleDescription ? getShortDescription(desc, 7) : '';
    const stopControlEvent = (event: React.SyntheticEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    if (singleOption) {
        return (
            <div
                onClick={onClick}
                className={`
                    relative w-full min-h-[210px] sm:min-h-[230px] md:min-h-[250px] overflow-hidden rounded-[28px] border px-5 py-5 sm:px-7 sm:py-6 md:px-9
                    flex items-center gap-5 sm:gap-7 md:gap-8 cursor-pointer active:scale-[0.985] transition-all duration-300
                    bg-[radial-gradient(circle_at_18%_50%,rgba(218,163,64,0.20),transparent_32%),linear-gradient(115deg,rgba(18,11,5,0.82),rgba(0,0,0,0.54))]
                    shadow-[0_18px_44px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,238,170,0.08)]
                    ${isSelected ? 'border-white/20' : 'border-white/10 hover:border-white/18'}
                `}
            >
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_45%_100%,rgba(193,129,30,0.24),transparent_58%)]" />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe9a6]/70 to-transparent" />

                {isBestSeller && (
                    <div className="absolute left-5 top-5 z-20 rounded-full bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 text-[12px] sm:text-[14px] md:text-[16px] font-bold uppercase tracking-wider text-white shadow-md">
                        BEST SELLER
                    </div>
                )}

                <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center pr-0">
                    <h3 className="max-w-[620px] break-words text-[28px] font-black leading-[1.14] tracking-wide text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)] line-clamp-3 sm:text-[34px] md:text-[40px]">
                        {name}
                    </h3>
                    {showDescription ? (
                        <p className="mt-3 max-w-[560px] break-words text-[18px] font-light leading-[1.35] text-gray-300 line-clamp-2 sm:text-[21px] md:text-[24px]">
                            {desc}
                        </p>
                    ) : hideLongSingleDescription && shortDescription ? (
                        <p className="mt-3 max-w-[560px] break-words text-[18px] font-light leading-[1.35] text-gray-300 sm:text-[21px] md:text-[24px]">
                            <span>{shortDescription}...</span>
                            <span className="ml-2 font-bold text-[#f1cf73]">{seeMoreText}</span>
                        </p>
                    ) : null}
                </div>

                <div className="relative z-20 flex w-[126px] shrink-0 flex-col items-end justify-center gap-4 sm:w-[172px] md:w-[220px]">
                    {singleOption.timeValue > 0 && (
                        <div className="rounded-full border border-white/12 bg-black/25 px-4 py-1.5 text-center sm:px-6 sm:py-2">
                            <span className="text-[18px] font-black tracking-[0.08em] text-[#ffe7a3] sm:text-[24px] md:text-[28px]">
                                {singleOption.timeValue}
                            </span>
                            <span className="ml-1 text-[12px] font-black uppercase tracking-[0.18em] text-[#ffe7a3] sm:text-[16px]">
                                {minsText}
                            </span>
                        </div>
                    )}

                    <div className="text-right">
                        <div className="text-[21px] font-black leading-tight text-[#d8b76a] tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:text-[27px] md:text-[31px]">
                            {formatCurrency(singleOption.priceVND)}
                            <span className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#aeb4c0] sm:text-[13px] md:text-[15px]">VND</span>
                        </div>
                        <div className="mt-1.5 text-[20px] font-black leading-tight text-emerald-500 tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] sm:text-[26px] md:text-[30px]">
                            {singleOption.priceUSD}
                            <span className="ml-1 text-[10px] font-black uppercase tracking-[0.12em] sm:text-[13px] md:text-[15px]">USD</span>
                        </div>
                    </div>

                    {isSelected ? (
                        <div
                            className="relative z-40 flex items-center rounded-full bg-black/55 p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.28)] ring-1 ring-white/10"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={(event) => {
                                    stopControlEvent(event);
                                    onQuickRemove?.();
                                }}
                                className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/90 transition-colors hover:bg-white/14 sm:h-12 sm:w-12"
                                aria-label="Decrease quantity"
                            >
                                <Minus className="h-5 w-5" />
                            </button>
                            <span className="min-w-9 text-center text-xl font-black text-white sm:min-w-11 sm:text-2xl">{quantity}</span>
                            <button
                                type="button"
                                onClick={(event) => {
                                    stopControlEvent(event);
                                    onQuickAdd?.();
                                }}
                                className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#f7df74] to-[#bd8622] text-white transition-transform active:scale-95 sm:h-12 sm:w-12"
                                aria-label="Increase quantity"
                            >
                                <Plus className="h-5 w-5" strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={(event) => {
                                stopControlEvent(event);
                                onQuickAdd?.();
                            }}
                            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/35 text-[#ffe7a3] transition-colors hover:bg-white/10 sm:h-14 sm:w-14 md:h-16 md:w-16"
                        >
                            <Plus className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2.6} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`
        relative w-full min-h-[132px] sm:min-h-[148px] md:min-h-[168px] rounded-2xl p-4 sm:p-5 md:p-6 flex flex-row gap-4 sm:gap-5 md:gap-6 items-center overflow-hidden
        transition-all duration-300 cursor-pointer active:scale-[0.98]
        ${isSelected ? 'bg-black/40 border border-white/15' : 'bg-black/10 border border-white/10'}
        backdrop-blur-sm shadow-lg hover:bg-black/20
      `}
        >
            {/* [LOGIC NEW] Badge Best Seller */}
            {isBestSeller && (
                <div className="absolute top-0 right-0 z-20 bg-red-600 text-white text-[12px] sm:text-[14px] md:text-[16px] font-bold px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-bl-xl shadow-md uppercase tracking-wider">
                    BEST SELLER
                </div>
            )}

            {/* 2. Nội dung text (Không hiện giá) */}
            <div className="flex flex-col justify-center flex-1 min-w-0 pr-20 sm:pr-24 md:pr-28 py-1">
                <h3 className="break-words font-bold text-white text-[30px] sm:text-[34px] md:text-[40px] leading-[1.18] mb-2 line-clamp-3 font-luxury tracking-wide">
                    {name}
                </h3>
                {showDescription ? (
                    <p className="break-words text-[18px] sm:text-[20px] md:text-[24px] text-gray-400 line-clamp-2 leading-[1.35] font-light">
                        {desc}
                    </p>
                ) : hideLongSingleDescription && shortDescription ? (
                    <p className="break-words text-[18px] sm:text-[20px] md:text-[24px] text-gray-400 leading-[1.35] font-light">
                        <span>{shortDescription}...</span>
                        <span className="ml-2 font-semibold text-[#C9A96E]">{seeMoreText}</span>
                    </p>
                ) : null}
                {singleOption && (
                    <div className="md:hidden mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 pr-2 text-left">
                        {singleOption.timeValue > 0 && (
                            <span className="text-[18px] font-black text-white">
                                {singleOption.timeValue} {minsText}
                            </span>
                        )}
                        <span className="text-[19px] font-black text-[#C9A96E]">
                            {formatCurrency(singleOption.priceVND)} VND
                        </span>
                        <span className="text-[18px] font-bold text-emerald-500">
                            {singleOption.priceUSD} USD
                        </span>
                    </div>
                )}
            </div>

            {singleOption && (
                <div className="hidden md:flex shrink-0 min-w-[220px] flex-col items-end justify-center gap-1 pr-20">
                    {singleOption.timeValue > 0 && (
                        <div className="text-[24px] font-black text-white leading-none">
                            {singleOption.timeValue} <span className="text-[16px] uppercase tracking-wider text-gray-400">{minsText}</span>
                        </div>
                    )}
                    <div className="text-[26px] font-black leading-tight text-[#C9A96E] tabular-nums">
                        {formatCurrency(singleOption.priceVND)} <span className="text-[15px] text-gray-500">VND</span>
                    </div>
                    <div className="text-[22px] font-bold leading-tight text-emerald-500 tabular-nums">
                        {singleOption.priceUSD} <span className="text-[14px]">USD</span>
                    </div>
                </div>
            )}

            {/* 3. Nút Cộng / Badge số lượng (Góc dưới phải tuyệt đối) */}
            <div className="absolute bottom-4 right-4 z-40">
                {isSelected ? (
                    <div
                        className="relative z-40 flex items-center rounded-full bg-black/55 p-1.5 shadow-lg ring-1 ring-white/10 animate-[pop_0.2s_ease-out]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={(event) => {
                                stopControlEvent(event);
                                onQuickRemove?.();
                            }}
                            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/90 transition-colors hover:bg-white/14 sm:h-11 sm:w-11"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-5 w-5" />
                        </button>
                        <span className="min-w-8 text-center text-lg font-black text-white sm:min-w-10 sm:text-xl">{quantity}</span>
                        <button
                            type="button"
                            onClick={(event) => {
                                stopControlEvent(event);
                                onQuickAdd?.();
                            }}
                            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-white transition-colors hover:bg-[#F2C96B] sm:h-11 sm:w-11"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.6} />
                        </button>
                    </div>
                ) : (
                    // Chưa chọn: Hiện nút Plus xám tròn
                    <button
                        type="button"
                        onClick={(event) => {
                            stopControlEvent(event);
                            onQuickAdd?.();
                        }}
                        className="relative z-50 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-gray-700/80 text-[#C9A96E] flex items-center justify-center backdrop-blur-sm hover:bg-gray-600 hover:text-white transition-colors"
                    >
                        <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>
    );
}
