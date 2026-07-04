import { db } from './client';
import { meta } from './schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';

/**
 * DatabaseHealthService verifies database connection, schema migration success,
 * and seeding completion states before the application is marked ready for interaction.
 */
export class DatabaseHealthService {
  public static async verifyHealth(): Promise<boolean> {
    try {
      logger.info('Executing database health diagnostics...');

      // 1. Test basic read connectivity and verify seeding state
      const seedCheck = await db
        .select()
        .from(meta)
        .where(eq(meta.key, 'has_seeded'))
        .limit(1);

      if (seedCheck.length === 0 || seedCheck[0].value !== 'true') {
        logger.warn('Database Health Warn: Category seeding has not run or is incomplete.');
        return false;
      }

      logger.info('Database health diagnostics passed successfully.');
      return true;
    } catch (error) {
      logger.error('Critical database health diagnostics failed:', error);
      return false;
    }
  }
}
