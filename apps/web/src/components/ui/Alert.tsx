import { HTMLAttributes, forwardRef } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
}

const variantStyles = {
  error: 'bg-danger-50 dark:bg-danger-950/30 border-danger-200 dark:border-danger-800/60 text-danger-700 dark:text-danger-400',
  success: 'bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800/60 text-success-700 dark:text-success-400',
  warning: 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800/60 text-warning-700 dark:text-warning-400',
  info: 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800/60 text-primary-700 dark:text-primary-400',
};

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'error', title, children, ...props }, ref) => {
    const Icon = icons[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'p-4 rounded-lg border flex gap-3 shadow-soft transition-all duration-150',
          variantStyles[variant],
          className
        )}
        role="alert"
        {...props}
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <p className="font-semibold mb-1.5 tracking-tight">{title}</p>}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
