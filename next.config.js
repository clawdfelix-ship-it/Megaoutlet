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
  async redirects() {
    return [
      {
        source: '/cart',
        destination: '/shop/cart',
        permanent: true,
      },
      {
        source: '/cart/checkout',
        destination: '/shop/cart/checkout',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
