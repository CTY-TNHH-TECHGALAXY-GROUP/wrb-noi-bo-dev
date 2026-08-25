import React from 'react';
import { t } from './ServiceOptionSelector.i18n';

export interface ServiceOptions {
    quantity: number;
    duration: number; // in minutes (e.g., 60, 90, 120)
    strength: 'light' | 'medium' | 'strong';
}

export const useServiceOptionLogic = (
    initialOptions?: Partial<ServiceOptions>,
    onChange?: (options: ServiceOptions) => void
) => {
    const [options, setOptions] = React.useState<ServiceOptions>({
        quantity: initialOptions?.quantity || 1,
        duration: initialOptions?.duration ?? 60,
        strength: initialOptions?.strength || 'medium',
    });

    const updateOption = <K extends keyof ServiceOptions>(key: K, value: ServiceOptions[K]) => {
        const newOptions = { ...options, [key]: value };
        setOptions(newOptions);
        if (onChange) {
            onChange(newOptions);
        }
    };

    const incrementQuantity = () => updateOption('quantity', Math.min(10, options.quantity + 1));
    const decrementQuantity = () => updateOption('quantity', Math.max(1, options.quantity - 1));

    return {
        options,
        updateOption,
        incrementQuantity,
        decrementQuantity,
    };
};
