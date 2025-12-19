import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  fullPage = false 
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-2 border-primary-500 border-t-transparent rounded-full animate-spin`} />
      {message && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">{message}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-full">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
          style={{ width: `${Math.max(60, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  count?: number;
}

export function LoadingCards({ count = 3 }: LoadingCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
}

export function LoadingTable({ rows = 5, columns = 5 }: LoadingTableProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse flex-1"
                  style={{ animationDelay: `${(rowIndex + colIndex) * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = 'Loading' }: InlineLoadingProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
      <RefreshCw size={14} className="animate-spin" />
      {text}
    </span>
  );
}
