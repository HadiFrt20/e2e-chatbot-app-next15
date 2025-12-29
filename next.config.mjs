/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    '@chat-template/ai-sdk-providers',
    '@chat-template/auth',
    '@chat-template/core',
    '@chat-template/db',
    '@chat-template/utils',
  ],
};

export default nextConfig;
