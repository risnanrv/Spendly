import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../database/schema';

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Vercel serverless has a writable /tmp folder. Use it as a fallback local DB to prevent read-only filesystem crashes.
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return 'file:/tmp/spendly.db';
  }
  return 'file:spendly.db';
};

const client = createClient({
  url: getDatabaseUrl(),
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
