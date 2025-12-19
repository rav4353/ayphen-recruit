import { AlertTriangle, RefreshCw, WifiOff, ServerCrash, FileQuestion } from 'lucide-react';
import { Button } from '../ui';

type ErrorType = 'generic' | 'network' | 'server' | 'notFound' | 'permission';

interface ErrorStateProps {
  title?: string;
  message?: string;
  type?: ErrorType;
  onRetry?: () => void;
  retryLabel?: string;
  fullPage?: boolean;
  className?: string;
}

const errorConfig: Record<ErrorType, { icon: typeof AlertTriangle; defaultTitle: string; defaultMessage: string }> = {
  generic: {
    icon: AlertTriangle,
    defaultTitle: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Connection error',
    defaultMessage: 'Unable to connect. Please check your internet connection.',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Server error',
    defaultMessage: 'The server encountered an error. Please try again later.',
  },
  notFound: {
    icon: FileQuestion,
    defaultTitle: 'Not found',
    defaultMessage: 'The requested resource could not be found.',
  },
  permission: {
    icon: AlertTriangle,
    defaultTitle: 'Access denied',
    defaultMessage: 'You do not have permission to access this resource.',
  },
};

export function ErrorState({
  title,
  message,
  type = 'generic',
  onRetry,
  retryLabel = 'Try again',
  fullPage = false,
  className = '',
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const content = (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <Icon size={24} className="text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-4">
        {message || config.defaultMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          {retryLabel}
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-full p-8">
        {content}
      </div>
    );
  }

  return content;
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 ${className}`}>
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-red-700 dark:text-red-300 hover:underline font-medium"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

interface QueryErrorProps {
  error: Error | null;
  onRetry?: () => void;
  compact?: boolean;
}

export function QueryError({ error, onRetry, compact = false }: QueryErrorProps) {
  if (!error) return null;

  // Determine error type from error message/status
  let type: ErrorType = 'generic';
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    type = 'network';
  } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
    type = 'server';
  } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    type = 'notFound';
  } else if (errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.includes('permission')) {
    type = 'permission';
  }

  if (compact) {
    return <InlineError message={error.message} onRetry={onRetry} />;
  }

  return <ErrorState type={type} message={error.message} onRetry={onRetry} />;
}
