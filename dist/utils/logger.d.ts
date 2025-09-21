/**
 * Structured logging utility with PII redaction
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogContext {
    [key: string]: any;
}
export interface LoggerOptions {
    level?: LogLevel;
    enableRedaction?: boolean;
    service?: string;
}
declare class Logger {
    private level;
    private enableRedaction;
    private service;
    constructor(options?: LoggerOptions);
    private shouldLog;
    protected formatMessage(level: LogLevel, message: string, context?: LogContext): string;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    child(context: LogContext): Logger;
}
export declare const logger: Logger;
export declare function createLogger(options: LoggerOptions): Logger;
export {};
//# sourceMappingURL=logger.d.ts.map