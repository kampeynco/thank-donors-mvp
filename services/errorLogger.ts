// Centralized error logging service
// Replace console.log/error/warn with proper error tracking

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private isDevelopment = import.meta.env.DEV;

  log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      ...(error && {
        error: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: this.isDevelopment ? error.stack : undefined,
            }
          : { message: String(error) },
      }),
    };

    // In development, use console for visibility
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, logEntry);
    }

    // In production, this would send to a logging service (e.g., Sentry, LogRocket)
    // For now, we store in sessionStorage for debugging
    if (!this.isDevelopment) {
      this.storeLog(logEntry);
    }
  }

  private storeLog(entry: any): void {
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      // Keep only last 100 logs
      if (logs.length > 100) logs.shift();
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch {
      // Silent fail - don't break app if storage is full
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error | unknown): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error | unknown): void {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  getLogs(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  clearLogs(): void {
    sessionStorage.removeItem('app_logs');
  }
}

export const logger = new ErrorLogger();
