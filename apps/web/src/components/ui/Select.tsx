import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            'w-full px-3.5 py-2.5 rounded-lg font-sans appearance-none',
                            'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700',
                            'text-neutral-900 dark:text-white',
                            'focus:outline-none focus:border-primary-500 dark:focus:border-primary-500',
                            'focus:ring-2 focus:ring-primary-500/10 transition-all duration-150',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'shadow-soft',
                            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/10',
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-neutral-500 dark:text-neutral-400">
                        <ChevronDown size={16} />
                    </div>
                </div>
                {error && <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
