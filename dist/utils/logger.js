/**
 * Structured logging utility with PII redaction
 */
import { redactObject } from './redact.js';
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
class Logger {
    level;
    enableRedaction;
    service;
    constructor(options = {}) {
        this.level = options.level || process.env.LOG_LEVEL || 'info';
        this.enableRedaction = options.enableRedaction ?? true;
        this.service = options.service || 'email-polisher';
    }
    shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    }
    formatMessage(level, message, context) {
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
    debug(message, context) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, context));
        }
    }
    error(message, context) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, context));
        }
    }
    child(context) {
        return new ChildLogger(this, context);
    }
}
class ChildLogger extends Logger {
    parent;
    childContext;
    constructor(parent, childContext) {
        super();
        this.parent = parent;
        this.childContext = childContext;
    }
    formatMessage(level, message, context) {
        const mergedContext = { ...this.childContext, ...context };
        return this.parent.formatMessage(level, message, mergedContext);
    }
}
// Default logger instance
export const logger = new Logger();
// Factory function for creating custom loggers
export function createLogger(options) {
    return new Logger(options);
}
//# sourceMappingURL=logger.js.map