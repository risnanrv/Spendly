import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from '../database/schema';

// Production environment validation diagnostics
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  if (!process.env.BETTER_AUTH_SECRET) {
    // eslint-disable-next-line no-console
    console.error('CRITICAL ENVIRONMENT ERROR: BETTER_AUTH_SECRET is not configured! Authentication signing will fail in production.');
  }
  if (!process.env.BETTER_AUTH_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    // eslint-disable-next-line no-console
    console.warn('Production warning: BETTER_AUTH_URL is not set. Better Auth will try to infer context URLs.');
  }
}

const getBaseURL = () => {
  let url = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  baseURL: getBaseURL(),
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
  },
});
