/* eslint-disable no-console */
import { TelemetryService } from '@/utils/telemetry';
import { Config } from '@/config/env';

// Mock Config so we can dynamically control isDev and isProd in tests
jest.mock('@/config/env', () => ({
  Config: {
    isDev: true,
    isProd: false,
    api: { baseUrl: 'http://localhost:3000/api/v1', timeout: 15000 },
    app: { name: 'Spendly', version: '1.0.0', env: 'development' },
  },
}));

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;

  beforeEach(() => {
    // Reset singleton instance before each test to force initialization check
    (TelemetryService as any).instance = null;
    
    // Default to dev mode configuration
    (Config as any).isDev = true;
    (Config as any).isProd = false;

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('in development environment', () => {
    beforeEach(() => {
      telemetryService = TelemetryService.getInstance();
    });

    it('emits screen transition updates in debug logs', () => {
      telemetryService.trackPageView('Dashboard');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Screen transition: Dashboard'));
    });

    it('emits events in debug logs', () => {
      telemetryService.trackEvent('add_expense', { amount: 150 });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Track event: add_expense'));
    });

    it('logs exceptions in console warnings', () => {
      const err = new Error('Database connection failed');
      telemetryService.captureException(err, { source: 'SQLite' });
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Captured exception (suppressed in dev): Database connection failed'));
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      (Config as any).isDev = false;
      (Config as any).isProd = true;
      telemetryService = TelemetryService.getInstance();
    });

    it('suppresses screen transition logs to local console', () => {
      telemetryService.trackPageView('Reports');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('suppresses general track event logs to local console', () => {
      telemetryService.trackEvent('sync_completed');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('does not log exception message to local console warn or error', () => {
      const err = new Error('Sync error');
      telemetryService.captureException(err);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
