import type { Logger } from 'drizzle-orm/logger';
import { logger } from '@/utils/logger';

/**
 * Privacy-safe DatabaseLogger for logging Drizzle SQL queries.
 * Completely masks parameter arrays to prevent logging passwords,
 * tokens, notes, or descriptions.
 */
export class DatabaseLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    // Log query text containing sql operators and placeholder '?' values
    logger.debug(`[DB QUERY] ${query}`);
    
    // Mask the arguments array completely to prevent leaking sensitive data
    if (params && params.length > 0) {
      logger.debug(`[DB PARAMS] [Masked: ${params.length} variables]`);
    }
  }
}
