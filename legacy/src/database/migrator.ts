import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from './migrations/migrations.js';
import { logger } from '@/utils/logger';

/**
 * MigrationRunner applies Drizzle schema migrations to the local Expo SQLite database.
 */
export class MigrationRunner {
  private static isMigrating = false;

  public static async run(): Promise<void> {
    if (this.isMigrating) return;
    this.isMigrating = true;

    try {
      logger.info('Executing SQLite database migrations...');
      // Execute the standard Drizzle Expo SQLite migrator
      await migrate(db, migrations);
      logger.info('Database migrations executed successfully.');
    } catch (error) {
      logger.error('Critical database migration execution failed:', error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }
}
