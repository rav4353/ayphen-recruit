import { cn } from '../../lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
    className?: string;
    customColor?: {
        bg: string;
        text: string;
    };
}

const variantStyles = {
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    outline: 'border border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export function Badge({ children, variant = 'primary', className, customColor }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                !customColor && variantStyles[variant],
                className
            )}
            style={customColor ? { backgroundColor: customColor.bg, color: customColor.text } : undefined}
        >
            {children}
        </span>
    );
}
