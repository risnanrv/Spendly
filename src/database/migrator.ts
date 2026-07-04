/* eslint-disable no-console */
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../lib/db';
import path from 'path';

export class MigrationRunner {
  private static migrationPromise: Promise<void> | null = null;

  public static async run(): Promise<void> {
    if (this.migrationPromise) {
      return this.migrationPromise;
    }

    this.migrationPromise = (async () => {
      try {
        const url = process.env.DATABASE_URL || 'file:spendly.db';
        const isRemote = url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://');
        const authToken = process.env.DATABASE_AUTH_TOKEN;

        // Safety check: Do not attempt remote migrations without credentials
        if (isRemote && !authToken) {
          console.warn('Skipping migrations: DATABASE_URL is remote but DATABASE_AUTH_TOKEN is missing.');
          return;
        }

        console.log('Executing database schema migrations...');
        await migrate(db, {
          migrationsFolder: path.join(process.cwd(), 'src/database/migrations'),
        });
        console.log('Database migrations executed successfully.');
      } catch (error: any) {
        const errMsg = error?.message || '';
        
        // If tables already exist, log a notice and continue safely
        if (errMsg.includes('already exists') || errMsg.includes('SQLITE_ERROR: table')) {
          console.log('Database schema migrations notice: Schema tables already exist. Skipping migrations initialization.');
          return;
        }

        if (errMsg.includes('401') || error?.code === 'SERVER_ERROR' || errMsg.includes('unauthorized')) {
          console.error('CRITICAL MIGRATION ERROR: Database authentication failed (HTTP 401). Please verify that DATABASE_AUTH_TOKEN is correctly set in your environment configuration.');
        } else if (errMsg.includes('ENOENT') || error?.code === 'ENOENT') {
          console.error('CRITICAL MIGRATION ERROR: Migrations folder could not be found. Please ensure Next.js file tracing copies src/database/migrations.');
        } else {
          console.error('Critical database migration execution failed:', error);
        }
        
        // Reset the promise on failure so that subsequent calls can attempt to retry
        MigrationRunner.migrationPromise = null;
        throw error;
      }
    })();

    return this.migrationPromise;
  }
}
