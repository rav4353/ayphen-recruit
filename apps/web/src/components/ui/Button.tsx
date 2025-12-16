import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft hover:shadow-soft-lg focus:ring-primary-500/50',
  secondary: 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 shadow-soft hover:shadow-soft-lg focus:ring-neutral-400/50',
  ghost: 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/50 focus:ring-neutral-400/50',
  outline: 'bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 border border-primary-300 dark:border-primary-700 focus:ring-primary-500/50',
  link: 'bg-transparent text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline-offset-4 hover:underline p-0 focus:ring-primary-500/50',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-soft hover:shadow-soft-lg focus:ring-danger-500/50',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 shadow-soft hover:shadow-soft-lg focus:ring-success-500/50',
};

const sizeStyles = {
  xs: 'text-xs py-1.5 px-2.5 h-7',
  sm: 'text-sm py-2 px-3 h-9',
  md: 'text-sm py-2.5 px-4 h-10',
  lg: 'text-base py-3 px-6 h-12',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
          'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950',
          'active:scale-[0.98]',
          variantStyles[variant],
          variant !== 'link' && sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
