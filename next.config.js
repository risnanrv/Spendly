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
  webpack: (config, { isServer }) => {
    const path = require('path');
    if (isServer) {
      config.resolve.alias['react$'] = path.resolve(__dirname, 'react-polyfill.js');
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);

