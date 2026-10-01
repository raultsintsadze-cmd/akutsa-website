import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // IndexNow key file: /{32-hex-key}.txt is answered by a route handler that reads INDEXNOW_KEY.
  async rewrites() {
    return [{ source: '/:key([0-9a-f]{32}).txt', destination: '/api/indexnow-key/:key' }];
  },
  async headers() {
    return [
      {
        source: '/api/((?!notion-image).*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos'
      }
    ]
  }
};

export default withNextIntl(nextConfig);
