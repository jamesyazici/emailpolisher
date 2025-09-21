import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger } from '../src/utils/logger.js';

describe('Logger Utility', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore());
  });

  describe('basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.service).toBe('email-polisher');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      const logCall = consoleSpy.warn.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.message).toBe('Warning message');
    });

    it('should log error messages', () => {
      logger.error('Error message');
      
      expect(consoleSpy.error).toHaveBeenCalledOnce();
      const logCall = consoleSpy.error.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Error message');
    });

    it('should log debug messages', () => {
      const debugLogger = createLogger({ level: 'debug' });
      debugLogger.debug('Debug message');
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('DEBUG');
      expect(logEntry.message).toBe('Debug message');
    });
  });

  describe('context logging', () => {
    it('should include context in log entries', () => {
      const context = { userId: '123', action: 'login' };
      logger.info('User action', context);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual(context);
    });

    it('should redact PII in context by default', () => {
      const context = { 
        email: 'user@example.com',
        phone: '(555) 123-4567',
        name: 'John Doe'
      };
      logger.info('User data', context);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.email).toBe('[REDACTED]');
      expect(logEntry.context.phone).toBe('[REDACTED]');
      expect(logEntry.context.name).toBe('John Doe'); // Name should not be redacted
    });

    it('should not redact when redaction is disabled', () => {
      const noRedactLogger = createLogger({ enableRedaction: false });
      const context = { email: 'user@example.com' };
      
      noRedactLogger.info('User data', context);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.email).toBe('user@example.com');
    });
  });

  describe('log levels', () => {
    it('should respect log level filtering - info level', () => {
      const infoLogger = createLogger({ level: 'info' });
      
      infoLogger.debug('Debug message');
      infoLogger.info('Info message');
      infoLogger.warn('Warn message');
      infoLogger.error('Error message');
      
      // Debug should be filtered out
      expect(consoleSpy.log).toHaveBeenCalledTimes(1); // Only info
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should respect log level filtering - warn level', () => {
      const warnLogger = createLogger({ level: 'warn' });
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warn message');
      warnLogger.error('Error message');
      
      // Debug and info should be filtered out
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should respect log level filtering - error level', () => {
      const errorLogger = createLogger({ level: 'error' });
      
      errorLogger.debug('Debug message');
      errorLogger.info('Info message');
      errorLogger.warn('Warn message');
      errorLogger.error('Error message');
      
      // Only error should be logged
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom logger configuration', () => {
    it('should use custom service name', () => {
      const customLogger = createLogger({ service: 'test-service' });
      customLogger.info('Test message');
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.service).toBe('test-service');
    });

    it('should handle all configuration options', () => {
      const customLogger = createLogger({
        level: 'debug',
        enableRedaction: false,
        service: 'custom-service'
      });
      
      const context = { email: 'test@example.com' };
      customLogger.debug('Debug message', context);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.level).toBe('DEBUG');
      expect(logEntry.service).toBe('custom-service');
      expect(logEntry.context.email).toBe('test@example.com'); // No redaction
    });
  });

  describe('child logger', () => {
    it('should create child logger with inherited context', () => {
      const parentContext = { requestId: '123', userId: 'user456' };
      const childLogger = logger.child(parentContext);
      
      childLogger.info('Child message');
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual(parentContext);
    });

    it('should merge child and additional context', () => {
      const parentContext = { requestId: '123' };
      const additionalContext = { action: 'login' };
      const childLogger = logger.child(parentContext);
      
      childLogger.info('Child message', additionalContext);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual({
        requestId: '123',
        action: 'login'
      });
    });

    it('should override parent context with additional context', () => {
      const parentContext = { requestId: '123', action: 'old' };
      const additionalContext = { action: 'new' };
      const childLogger = logger.child(parentContext);
      
      childLogger.info('Child message', additionalContext);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual({
        requestId: '123',
        action: 'new'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined context', () => {
      logger.info('Message', undefined);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toBeUndefined();
    });

    it('should handle empty context', () => {
      logger.info('Message', {});
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context).toEqual({});
    });

    it('should handle complex nested context', () => {
      const complexContext = {
        user: {
          profile: {
            email: 'user@example.com',
            preferences: {
              notifications: true
            }
          }
        },
        request: {
          method: 'POST',
          url: 'https://api.example.com/users'
        }
      };
      
      logger.info('Complex context', complexContext);
      
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const logCall = consoleSpy.log.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.context.user.profile.email).toBe('[REDACTED]');
      expect(logEntry.context.user.profile.preferences.notifications).toBe(true);
      expect(logEntry.context.request.url).toBe('[REDACTED]');
      expect(logEntry.context.request.method).toBe('POST');
    });
  });
});