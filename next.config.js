/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-mms.hktvmall.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-media.hktvmall.com',
      },
      {
        protocol: 'https',
        hostname: 'media.hktvmall.com',
      },
    ],
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
