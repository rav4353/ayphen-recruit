import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded' | 'text';
  animation?: 'pulse' | 'shimmer' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = 'default',
  animation = 'shimmer',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'bg-neutral-200/80 dark:bg-neutral-700/60';
  
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: [
      'relative overflow-hidden',
      'before:absolute before:inset-0 before:-translate-x-full',
      'before:animate-[shimmer_1.5s_infinite]',
      'before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent',
    ].join(' '),
    wave: [
      'relative overflow-hidden',
      'after:absolute after:inset-0',
      'after:bg-gradient-to-r after:from-transparent after:via-neutral-300/50 dark:after:via-neutral-600/50 after:to-transparent',
      'after:animate-[shimmer_2s_ease-in-out_infinite]',
    ].join(' '),
    none: '',
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={Object.keys(style).length > 0 ? style : undefined}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showAction?: boolean;
}

export function SkeletonCard({ lines = 3, showAvatar = false, showAction = false }: SkeletonCardProps) {
  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card">
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          {Array.from({ length: lines - 1 }).map((_, i) => (
            <Skeleton key={i} className="h-4" width={`${85 - i * 10}%`} />
          ))}
          <Skeleton className="h-4 w-1/3" />
        </div>
        {showAction && (
          <Skeleton variant="rounded" className="w-24 h-9 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex gap-6 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 flex-1 ${colIndex === 0 ? 'w-1/4' : ''}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="relative overflow-hidden p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card"
        >
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-100 to-transparent dark:from-neutral-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <Skeleton variant="rounded" className="w-10 h-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Premium skeleton for lists
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60"
        >
          <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton variant="rounded" className="w-16 h-6 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// Skeleton for page headers
export function SkeletonPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" className="w-32 h-10" />
        <Skeleton variant="rounded" className="w-10 h-10" />
      </div>
    </div>
  );
}
