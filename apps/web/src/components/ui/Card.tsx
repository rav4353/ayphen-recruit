import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none',
          padding && 'p-6 sm:p-8',
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
          'mb-6',
          align === 'center' ? 'text-center' : 'flex items-center justify-between',
          className
        )}
        {...props}
      >
        <div className={cn(align === 'center' ? 'w-full' : 'flex-1')}>
          {icon && (
            <div className={cn(
              "w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center",
              align === 'center' ? "mx-auto mb-4" : "mr-4 inline-flex"
            )}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
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
