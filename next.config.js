/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
  experimental: {
    middlewareClientMaxBodySize: "50mb"
  },
  images: {
    remotePatterns: []
  }
};

module.exports = nextConfig;
