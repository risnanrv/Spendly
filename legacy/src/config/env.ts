// Environment configuration — typed and validated at startup
// Expo uses EXPO_PUBLIC_ prefix for public env vars accessible in the client

import { Platform } from 'react-native';

const getEnv = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};

const defaultApiUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api/v1'
  : 'http://localhost:3000/api/v1';

export const Config = {
  api: {
    baseUrl: getEnv('EXPO_PUBLIC_API_BASE_URL', defaultApiUrl),
    timeout: 15_000,
  },
  app: {
    name: 'Spendly',
    version: '1.0.0',
    env: getEnv('EXPO_PUBLIC_APP_ENV', 'development') as 'development' | 'staging' | 'production',
  },
  isDev: getEnv('EXPO_PUBLIC_APP_ENV', 'development') === 'development',
  isProd: getEnv('EXPO_PUBLIC_APP_ENV', 'development') === 'production',
} as const;

export type AppConfig = typeof Config;
