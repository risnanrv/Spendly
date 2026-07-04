import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { DatabaseLogger } from './logger';

const DATABASE_NAME = 'spendly.db';

// Singleton SQLite connection — only one instance across the app lifetime
let _sqliteDb: SQLite.SQLiteDatabase | null = null;

const getSQLiteDb = (): SQLite.SQLiteDatabase => {
  if (!_sqliteDb) {
    _sqliteDb = SQLite.openDatabaseSync(DATABASE_NAME);
    // Enable WAL mode for improved read/write concurrency
    _sqliteDb.execSync('PRAGMA journal_mode = WAL;');
  }
  return _sqliteDb;
};

// Drizzle ORM client — typed, uses our schema and injected privacy-safe logger
export const db = drizzle(getSQLiteDb(), {
  schema,
  logger: new DatabaseLogger(),
});

export type Database = typeof db;
