/* eslint-disable no-console */
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../lib/db';
import path from 'path';

export class MigrationRunner {
  private static isMigrating = false;

  public static async run(): Promise<void> {
    if (this.isMigrating) return;
    this.isMigrating = true;

    try {
      console.log('Executing SQLite database migrations...');
      await migrate(db, {
        migrationsFolder: path.join(process.cwd(), 'src/database/migrations'),
      });
      console.log('Database migrations executed successfully.');
    } catch (error) {
      console.error('Critical database migration execution failed:', error);
      throw error;
    } finally {
      this.isMigrating = false;
    }
  }
}
