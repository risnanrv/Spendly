import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../database/schema';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:spendly.db',
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
