// Edge function logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  function?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export function log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry: any = {
    timestamp,
    level,
    message,
    ...context,
  };

  if (error) {
    logEntry.error = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { message: String(error) };
  }

  // In edge functions, we use console for Deno logs which are captured by Supabase
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[consoleMethod](JSON.stringify(logEntry));
}

export const edgeLogger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext, error?: Error | unknown) => log('warn', message, context, error),
  error: (message: string, context?: LogContext, error?: Error | unknown) => log('error', message, context, error),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
};
