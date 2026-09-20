'use client';

import React from 'react';
import { useServiceCountdown } from './useServiceCountdown.logic';
import { t } from './ServiceCountdownGauge.i18n';

// 🔧 UI CONFIGURATION
const GAUGE_SIZE = 220;
const STROKE_WIDTH = 12;
const ACCENT_COLOR = '#10B981'; // Emerald 500
const TRACK_COLOR = '#F3F4F6'; // Gray 100
const TEXT_TIMER_COLOR = '#111827'; // Gray 900
const WARNING_MINUTES = 15; // Mốc 15 phút đầu được cảnh báo/đổi người

interface Props {
    startTimeISO: string | null;
    durationMinutes: number;
    lang?: 'vi' | 'en';
}

export const ServiceCountdownGauge = ({ startTimeISO, durationMinutes, lang = 'vi' }: Props) => {
    const { formattedTime, progressPercentage, isFinished, elapsedMinutes } = useServiceCountdown(startTimeISO, durationMinutes);
    const localeText = t[lang];

    // SVG Gauge Math (Vòng cung 270 độ, hở phần dưới)
    const radius = (GAUGE_SIZE - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius * 0.75; // 75% of circle
    const dashoffset = circumference - (progressPercentage / 100) * circumference;

    const isWarningPeriod = elapsedMinutes < WARNING_MINUTES && !isFinished;

    return (
        <div className="flex flex-col items-center gap-6 p-6 animate-fade-in-up">
            {/* Vòng cung Gauge */}
            <div className="relative flex justify-center items-center aspect-square max-w-full" style={{ width: GAUGE_SIZE }}>
                <svg
                    width={GAUGE_SIZE}
                    height={GAUGE_SIZE}
                    viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
                    className="absolute w-full h-full transform rotate-[135deg]"
                >
                    {/* Background Track */}
                    <circle
                        cx={GAUGE_SIZE / 2}
                        cy={GAUGE_SIZE / 2}
                        r={radius}
                        fill="none"
                        stroke={TRACK_COLOR}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                    {/* Progress Bar */}
                    <circle
                        cx={GAUGE_SIZE / 2}
                        cy={GAUGE_SIZE / 2}
                        r={radius}
                        fill="none"
                        stroke={ACCENT_COLOR}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset || 0}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>

                {/* Chữ hiển thị giữa vòng tròn */}
                <div className="absolute flex flex-col items-center justify-center gap-1 mt-6">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        {localeText.timeRemaining}
                    </span>
                    <span
                        className="text-4xl font-bold font-mono tracking-tight"
                        style={{ color: TEXT_TIMER_COLOR }}
                    >
                        {formattedTime}
                    </span>
                </div>
            </div>

            {/* Cảnh báo trạng thái đổi nhân viên */}
            {isWarningPeriod ? (
                <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col gap-1 items-start shadow-sm animate-pop delay-200">
                    <div className="flex items-center gap-2 text-yellow-800 font-semibold">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <span>{localeText.switchStaffWarnTitle}</span>
                    </div>
                    <p className="text-sm text-yellow-700 leading-snug font-medium pr-2">
                        {localeText.switchStaffWarnDesc}
                    </p>
                </div>
            ) : isFinished ? (
                <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-center rounded-xl p-4 animate-pop">
                    {localeText.serviceCompleted} 🎉
                </div>
            ) : null}
        </div>
    );
};
