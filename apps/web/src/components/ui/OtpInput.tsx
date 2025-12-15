import { useRef, KeyboardEvent, ClipboardEvent, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (value: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  inputClassName?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
  inputClassName,
}: OtpInputProps) {
  // ... (existing refs and logic) ...
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasCalledComplete = useRef(false);

  // Reset the complete flag when value changes to incomplete
  const isComplete = value.every((digit) => digit) && value.join('').length === length;
  if (!isComplete) {
    hasCalledComplete.current = false;
  }

  const triggerComplete = useCallback((code: string) => {
    if (!hasCalledComplete.current && onComplete) {
      hasCalledComplete.current = true;
      onComplete(code);
    }
  }, [onComplete]);

  const handleChange = (index: number, inputValue: string) => {
    if (!/^\d*$/.test(inputValue)) return;

    const newValue = [...value];
    newValue[index] = inputValue.slice(-1);
    onChange(newValue);

    // Auto-focus next input
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newValue.every((digit) => digit) && newValue.join('').length === length) {
      triggerComplete(newValue.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newValue = [...value];
    pastedData.split('').forEach((digit, index) => {
      if (index < length) newValue[index] = digit;
    });
    onChange(newValue);

    if (pastedData.length === length) {
      triggerComplete(pastedData);
    }
  };

  return (
    <div className={cn('flex justify-center gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold',
            'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg',
            'text-neutral-900 dark:text-white',
            'focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 outline-none',
            'transition-all duration-150 disabled:opacity-50',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
            inputClassName
          )}
        />
      ))}
    </div>
  );
}
