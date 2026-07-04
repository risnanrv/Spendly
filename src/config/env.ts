const getEnv = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
};

export const Config = {
  api: {
    baseUrl: getEnv('NEXT_PUBLIC_API_BASE_URL', '/api'),
    timeout: 15_000,
  },
  app: {
    name: 'Spendly',
    version: '1.0.0',
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production',
  },
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
} as const;

export type AppConfig = typeof Config;
