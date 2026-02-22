/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    middlewareClientMaxBodySize: "50mb"
  },
  images: {
    remotePatterns: []
  }
};

module.exports = nextConfig;
