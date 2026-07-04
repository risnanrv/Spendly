const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@libsql/client'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/database/migrations/**/*'],
  },
};

module.exports = withPWA(nextConfig);
