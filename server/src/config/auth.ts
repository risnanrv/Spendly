/* eslint-disable no-console */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { jwt } from 'better-auth/plugins';
import { prisma } from './database.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true', // Optional in development
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`\n--- [EMAIL VERIFICATION LINK] ---\nTo: ${user.email}\nLink: ${url}\n---------------------------------\n`);
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/api/v1/auth',
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days refresh session lifespan
  },
  plugins: [
    jwt({
      jwt: {
        expirationTime: '15m', // Short-lived access token
      },
    }),
  ],
});
export type Auth = typeof auth;
