const withPWA = require('next-pwa')({
  dest: 'public',
  disable: true, // Disable next-pwa temporarily to resolve compiler page collection issues
  register: true,
  skipWaiting: true,
  fallbacks: false, 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withPWA(nextConfig);

