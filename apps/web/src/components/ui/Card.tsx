import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient';
  hover?: boolean;
}

const cardVariants = {
  default: [
    'bg-white dark:bg-neutral-900',
    'border border-neutral-200/60 dark:border-neutral-800/60',
    'shadow-card',
  ],
  glass: [
    'bg-white/70 dark:bg-neutral-900/70',
    'backdrop-blur-xl',
    'border border-white/20 dark:border-neutral-700/30',
    'shadow-soft-lg',
  ],
  elevated: [
    'bg-white dark:bg-neutral-900',
    'border-0',
    'shadow-premium',
  ],
  outlined: [
    'bg-transparent',
    'border-2 border-neutral-200 dark:border-neutral-700',
    'shadow-none',
  ],
  gradient: [
    'bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800',
    'border border-neutral-200/40 dark:border-neutral-700/40',
    'shadow-soft-lg',
  ],
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = true, variant = 'default', hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          ...cardVariants[variant],
          hover && 'hover:shadow-card-hover hover:-translate-y-0.5',
          padding && 'p-5 sm:p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'center' | 'left';
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, icon, action, align = 'center', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800/60',
          align === 'center' ? 'text-center' : 'flex items-center justify-between',
          className
        )}
        {...props}
      >
        <div className={cn(align === 'center' ? 'w-full' : 'flex-1')}>
          {icon && (
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/30",
              "flex items-center justify-center text-primary-600 dark:text-primary-400",
              "shadow-sm",
              align === 'center' ? "mx-auto mb-4" : "mr-4 inline-flex"
            )}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="ml-4">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Premium card footer
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-6 pt-4 flex items-center justify-end gap-3',
          bordered && 'border-t border-neutral-100 dark:border-neutral-800/60',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
