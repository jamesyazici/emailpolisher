/**
 * Structured logging utility with PII redaction
 */

import { redactObject } from './redact.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LoggerOptions {
  level?: LogLevel;
  enableRedaction?: boolean;
  service?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private level: LogLevel;
  private enableRedaction: boolean;
  private service: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.enableRedaction = options.enableRedaction ?? true;
    this.service = options.service || 'email-polisher';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  protected formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.service,
      message,
      ...(context && { context: this.enableRedaction ? redactObject(context) : context })
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  child(context: LogContext): Logger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger extends Logger {
  constructor(
    private parent: Logger,
    private childContext: LogContext
  ) {
    super();
  }

  protected formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const mergedContext = { ...this.childContext, ...context };
    return (this.parent as any).formatMessage(level, message, mergedContext);
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function for creating custom loggers
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}