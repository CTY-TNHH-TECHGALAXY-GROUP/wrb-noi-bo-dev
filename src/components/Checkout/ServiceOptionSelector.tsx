'use client';

import React from 'react';
import { useServiceOptionLogic, ServiceOptions } from './ServiceOptionSelector.logic';
import { t } from './ServiceOptionSelector.i18n';

// 🔧 UI CONFIGURATION
const BTN_SIZE = '40px';
const BORDER_RADIUS = '12px';
const ACCENT_COLOR = '#10B981'; // Emerald 500
const RADIO_INNER_COLOR = '#047857';

interface Props {
    initialOptions?: Partial<ServiceOptions>;
    onChange?: (options: ServiceOptions) => void;
    lang?: 'vi' | 'en';
}

const DURATIONS = [60, 90, 120];

export const ServiceOptionSelector = ({ initialOptions, onChange, lang = 'vi' }: Props) => {
    const { options, updateOption, incrementQuantity, decrementQuantity } = useServiceOptionLogic(initialOptions, onChange);
    const localeText = t[lang];

    return (
        <div className="w-full flex flex-col gap-5 p-4 bg-white rounded-[16px] shadow-sm animate-fade-in-up delay-100">
            <h3 className="text-lg font-semibold text-gray-800">
                {localeText.optionsTitle}
            </h3>

            {/* 1. Số lượng */}
            <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-700">
                    {localeText.quantity}
                </label>
                <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-full border border-gray-100">
                    <button
                        onClick={decrementQuantity}
                        disabled={options.quantity <= 1}
                        className="flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                        style={{ width: BTN_SIZE, height: BTN_SIZE }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="text-lg font-semibold text-gray-800 w-4 text-center">
                        {options.quantity}
                    </span>
                    <button
                        onClick={incrementQuantity}
                        disabled={options.quantity >= 10}
                        className="flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                        style={{ width: BTN_SIZE, height: BTN_SIZE }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* 2. Thời lượng */}
            <div className="flex flex-col gap-3">
                <label className="text-base font-medium text-gray-700">
                    {localeText.duration}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {DURATIONS.map((dur) => (
                        <button
                            key={dur}
                            onClick={() => updateOption('duration', dur)}
                            className={`py-2 px-1 text-sm font-medium transition-all ${options.duration === dur
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                } border`}
                            style={{ borderRadius: BORDER_RADIUS }}
                        >
                            {dur} {localeText.minutes}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* 3. Sức ấn */}
            <div className="flex flex-col gap-3">
                <label className="text-base font-medium text-gray-700">
                    {localeText.strength}
                </label>
                <div className="flex flex-col gap-2">
                    {(['light', 'medium', 'strong'] as const).map((strengthType) => {
                        const isSelected = options.strength === strengthType;
                        let label = '';
                        if (strengthType === 'light') label = localeText.strengthLight;
                        else if (strengthType === 'medium') label = localeText.strengthMedium;
                        else label = localeText.strengthStrong;

                        return (
                            <label
                                key={strengthType}
                                className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                                style={{ borderRadius: BORDER_RADIUS }}
                            >
                                <div
                                    className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors"
                                    style={{ borderColor: isSelected ? ACCENT_COLOR : '#D1D5DB' }}
                                >
                                    {isSelected && (
                                        <div className="w-2.5 h-2.5 rounded-full animate-pop" style={{ backgroundColor: RADIO_INNER_COLOR }} />
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-emerald-800' : 'text-gray-600'}`}>
                                    {label}
                                </span>
                                {/* Ẩn radio input thực tế */}
                                <input
                                    type="radio"
                                    name="strength"
                                    value={strengthType}
                                    checked={isSelected}
                                    onChange={() => updateOption('strength', strengthType)}
                                    className="hidden"
                                />
                            </label>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
