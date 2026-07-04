import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../database/schema';

const getDatabaseConfig = () => {
  const url = process.env.DATABASE_URL || 'file:spendly.db';
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const isRemote = url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://');

  if (isRemote) {
    if (!authToken && process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.error('CRITICAL DATABASE ERROR: DATABASE_URL is a remote Turso address but DATABASE_AUTH_TOKEN is missing!');
      throw new Error('Missing DATABASE_AUTH_TOKEN environment variable for remote LibSQL database.');
    }
    
    // eslint-disable-next-line no-console
    console.log('Database mode: Turso (Remote LibSQL)');
    return { url, authToken };
  } else {
    // eslint-disable-next-line no-console
    console.log(`Database mode: Local SQLite (Path: ${url})`);
    return { url };
  }
};

const config = getDatabaseConfig();
const client = createClient(config);

export const db = drizzle(client, { schema });
export type Database = typeof db;
