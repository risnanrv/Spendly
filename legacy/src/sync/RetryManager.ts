import { SyncLogger } from './SyncLogger';

/**
 * RetryManager calculates exponential backoff wait times and determines if outbox
 * operations are eligible for retry attempts.
 */
export class RetryManager {
  private static readonly MAX_RETRY_LIMIT = 5;

  /**
   * Calculates backoff wait duration in milliseconds.
   * Returns backoff progression: 1 min, 2 min, 4 min, 8 min, 16 min.
   */
  public static getBackoffDelayMs(retryCount: number): number {
    if (retryCount <= 0) return 0;
    // Delay is calculated as 2^(retryCount - 1) minutes.
    const minutes = Math.pow(2, retryCount - 1);
    return minutes * 60 * 1000;
  }

  /**
   * Checks if an operation can be retried yet based on current backoff schedule.
   */
  public static shouldRetry(retryCount: number, lastAttempt: Date | null): boolean {
    if (retryCount >= this.MAX_RETRY_LIMIT) {
      SyncLogger.warn('Sync outbox item has reached the maximum retry limit and is quarantined', {
        retryCount,
        maxLimit: this.MAX_RETRY_LIMIT,
      });
      return false;
    }

    if (!lastAttempt) return true;

    const requiredDelay = this.getBackoffDelayMs(retryCount);
    const elapsed = Date.now() - lastAttempt.getTime();

    const ready = elapsed >= requiredDelay;
    if (!ready) {
      SyncLogger.debug('Sync item backoff has not expired yet', {
        retryCount,
        requiredDelayMs: requiredDelay,
        elapsedMs: elapsed,
        remainingMs: requiredDelay - elapsed,
      });
    }

    return ready;
  }

  public static getMaxLimit(): number {
    return this.MAX_RETRY_LIMIT;
  }
}
