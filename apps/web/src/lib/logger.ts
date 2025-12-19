/**
 * Centralized logging utility
 * Replace all console.log/error with these methods
 * In production, this can be connected to Sentry, LogRocket, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: string;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  // Queue for batching logs in production
  private logQueue: LogEntry[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private createEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  private sendToService(entry: LogEntry): void {
    // In production, send to external service
    // This is where you'd integrate Sentry, LogRocket, Datadog, etc.
    
    if (this.isProduction && entry.level === 'error') {
      // Example Sentry integration (uncomment when Sentry is set up):
      // if (typeof window !== 'undefined' && (window as any).Sentry) {
      //   (window as any).Sentry.captureException(entry.error || new Error(entry.message), {
      //     extra: entry.context,
      //   });
      // }
      
      // For now, store in queue for potential batch sending
      this.logQueue.push(entry);
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) return;
    
    this.flushTimeout = setTimeout(() => {
      this.flush();
      this.flushTimeout = null;
    }, 5000); // Flush every 5 seconds
  }

  private flush(): void {
    if (this.logQueue.length === 0) return;
    
    // In production, send batched logs to your logging service
    // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(this.logQueue) });
    
    this.logQueue = [];
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDev) return; // Only in development
    
    const entry = this.createEntry('debug', message, context);
    console.debug(this.formatMessage('debug', message, context));
    this.sendToService(entry);
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createEntry('info', message, context);
    
    if (this.isDev) {
      console.info(this.formatMessage('info', message, context));
    }
    
    this.sendToService(entry);
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createEntry('warn', message, context);
    
    if (this.isDev) {
      console.warn(this.formatMessage('warn', message, context));
    }
    
    this.sendToService(entry);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createEntry('error', message, context, errorObj);
    
    if (this.isDev) {
      console.error(this.formatMessage('error', message, context), errorObj);
    }
    
    this.sendToService(entry);
  }

  // Utility to capture API errors with context
  apiError(endpoint: string, error: unknown, context?: LogContext): void {
    const message = `API Error: ${endpoint}`;
    this.error(message, error, { ...context, endpoint });
  }

  // Utility for component-specific logging
  component(componentName: string) {
    return {
      debug: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.debug(message, { ...context, component: componentName }),
      info: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.info(message, { ...context, component: componentName }),
      warn: (message: string, context?: Omit<LogContext, 'component'>) =>
        this.warn(message, { ...context, component: componentName }),
      error: (message: string, error?: Error | unknown, context?: Omit<LogContext, 'component'>) =>
        this.error(message, error, { ...context, component: componentName }),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for consumers
export type { LogContext, LogLevel };
