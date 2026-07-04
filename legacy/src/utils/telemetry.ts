import { Config } from '@/config/env';
import { logger } from './logger';

export interface TelemetryEvent {
  name: string;
  properties?: Record<string, any>;
}

/**
 * Telemetry Service that handles environment-aware error logging,
 * event tracking, and page view monitoring (Sentry, PostHog, Plausible integration points).
 */
export class TelemetryService {
  private static instance: TelemetryService | null = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Initializes the monitoring clients.
   */
  private initialize(): void {
    if (Config.isProd) {
      logger.info('TelemetryService: Initializing production telemetry modules (Sentry, PostHog, Plausible stubs).');
      // PostHog.init('YOUR_POSTHOG_API_KEY', { host: 'https://app.posthog.com' });
      // Sentry.init({ dsn: 'YOUR_SENTRY_DSN', environment: 'production' });
    } else {
      logger.debug('TelemetryService: Telemetry initialized in development/sandbox mode.');
    }
  }

  /**
   * Captures error events and forwards them to production exception trackers (e.g. Sentry).
   */
  public captureException(error: Error, extraContext?: Record<string, any>): void {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      ...extraContext,
    };

    if (Config.isProd) {
      // Production exception tracking
      logger.error(`[Telemetry][Sentry] Capturing exception: ${error.message}`, errorDetails);
      // Sentry.captureException(error, { extra: extraContext });
    } else {
      // Local dev exception output
      logger.warn(`[Telemetry][Local] Captured exception (suppressed in dev): ${error.message}`, errorDetails);
    }
  }

  /**
   * Tracks custom usage events (e.g. PostHog).
   */
  public trackEvent(eventName: string, properties?: Record<string, any>): void {
    const payload = {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    if (Config.isProd) {
      // Production event analytics
      logger.info(`[Telemetry][PostHog] Tracking event: ${eventName}`, payload);
      // PostHog.capture(eventName, properties);
    } else {
      // Local dev logging
      logger.debug(`[Telemetry][Local] Track event: ${eventName}`, payload);
    }
  }

  /**
   * Tracks screen transitions and page views (Plausible / PostHog).
   */
  public trackPageView(screenName: string): void {
    if (Config.isProd) {
      logger.info(`[Telemetry][Plausible] Page view recorded: ${screenName}`);
      // Plausible.trackPageView(screenName);
    } else {
      logger.debug(`[Telemetry][Local] Screen transition: ${screenName}`);
    }
  }
}

export const telemetry = TelemetryService.getInstance();
