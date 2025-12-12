import { forwardRef, InputHTMLAttributes, useState, useId } from 'react';
import { Eye, EyeOff, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const isPassword = type === 'password';
    const isDate = type === 'date';

    // Auto-add calendar icon for date inputs if no right icon is provided
    const effectiveRightIcon = rightIcon || (isDate ? <Calendar size={18} /> : null);

    const handleContainerClick = () => {
      if (isDate) {
        const input = document.getElementById(inputId) as HTMLInputElement;
        input?.showPicker?.();
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {label}
          </label>
        )}
        <div
          className="relative group"
          onClick={handleContainerClick}
        >
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            formNoValidate
            className={cn(
              'w-full px-4 py-2.5 rounded-lg font-sans',
              'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700',
              'text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500',
              'focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-500',
              'focus:ring-1 focus:ring-neutral-500 transition-all duration-150',
              leftIcon && 'pl-10',
              (effectiveRightIcon || isPassword) && 'pr-10',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
              isDate && 'cursor-pointer min-h-[42px]',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {effectiveRightIcon && !isPassword && (
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 ${isDate ? 'pointer-events-none' : ''}`}>
              {effectiveRightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
