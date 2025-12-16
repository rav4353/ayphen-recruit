import { cn } from '../../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'neutral';
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    customColor?: {
        bg: string;
        text: string;
    };
}

const variantStyles = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    outline: 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-transparent',
    success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    error: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
};

export function Badge({ children, variant = 'primary', className, size = 'md', customColor }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-medium transition-colors duration-150',
                !customColor && variantStyles[variant],
                sizeStyles[size],
                className
            )}
            style={customColor ? { backgroundColor: customColor.bg, color: customColor.text } : undefined}
        >
            {children}
        </span>
    );
}
