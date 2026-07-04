import { logger } from '@/utils/logger';

/**
 * SyncLogger wraps system logging functionality, enforcing financial data masking
 * rules to protect PII and transaction amounts during network/sync diagnostics.
 */
export class SyncLogger {
  public static info(message: string, meta?: Record<string, any>): void {
    logger.info(`[SYNC] ${message} ${meta ? JSON.stringify(this.mask(meta)) : ''}`);
  }

  public static debug(message: string, meta?: Record<string, any>): void {
    logger.debug(`[SYNC] ${message} ${meta ? JSON.stringify(this.mask(meta)) : ''}`);
  }

  public static warn(message: string, meta?: Record<string, any>): void {
    logger.warn(`[SYNC] ${message} ${meta ? JSON.stringify(this.mask(meta)) : ''}`);
  }

  public static error(message: string, error?: any, meta?: Record<string, any>): void {
    logger.error(`[SYNC] ${message} ${meta ? JSON.stringify(this.mask(meta)) : ''}`, error);
  }

  /**
   * Recursively traverses objects to replace sensitive keys with masked placeholders.
   */
  private static mask(obj: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (
          key === 'amount' ||
          key === 'title' ||
          key === 'note' ||
          key === 'payload' ||
          key === 'name' ||
          key === 'value'
        ) {
          masked[key] = '[MASKED]';
        } else if (typeof val === 'object' && val !== null) {
          masked[key] = Array.isArray(val)
            ? val.map((item) => (typeof item === 'object' && item !== null ? this.mask(item) : item))
            : this.mask(val);
        } else {
          masked[key] = val;
        }
      }
    }
    return masked;
  }
}
