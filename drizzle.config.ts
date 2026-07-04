import type { Config } from 'drizzle-kit';

const url = process.env.DATABASE_URL || 'file:spendly.db';
const isRemote = url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://');

export default {
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: isRemote ? 'turso' : 'sqlite',
  dbCredentials: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;