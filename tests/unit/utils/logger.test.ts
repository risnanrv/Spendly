/* eslint-disable no-console */
/**
 * Unit tests: Logger (environment-aware logging)
 *
 * Verifies that debug/info logs are suppressed in production,
 * and that all levels emit correctly in development mode.
 */

describe('logger utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('in development mode', () => {
    it('emits debug logs via console.log', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.debug('test debug message');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    });

    it('emits info logs via console.log', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.info('test info message');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('emits warn logs via console.warn', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.warn('test warn message');
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    });

    it('emits error logs via console.error', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.error('test error message');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'));
    });

    it('includes timestamp in every log entry', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.info('timestamped message');
      const call = (console.log as jest.Mock).mock.calls[0]?.[0] as string;
      // ISO 8601 timestamp format check
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('serializes extra data as JSON in log output', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'development';
      const { logger } = require('@/utils/logger');

      logger.info('message with data', { userId: 'u1', amount: 500 });
      const call = (console.log as jest.Mock).mock.calls[0]?.[0] as string;
      expect(call).toContain('"userId":"u1"');
    });
  });

  describe('in staging mode (non-dev)', () => {
    it('suppresses debug logs', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'staging';
      const { logger } = require('@/utils/logger');

      logger.debug('should be suppressed');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('still emits warn and error logs', () => {
      process.env['EXPO_PUBLIC_APP_ENV'] = 'staging';
      const { logger } = require('@/utils/logger');

      logger.warn('staging warning');
      logger.error('staging error');
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
