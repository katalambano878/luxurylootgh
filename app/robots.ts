import { MetadataRoute } from 'next';

const baseUrl = 'https://luxurylootgh.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/cart',
          '/wishlist',
          '/account/',
          '/order-success',
          '/pay/',
          '/maintenance',
          '/returns/confirmation',
          '/support/ticket',
          '/support/tickets',
          '/*?*sort=',
          '/*?*page=',
        ],
      },
      // Block AI training crawlers
      { userAgent: 'GPTBot',         disallow: ['/'] },
      { userAgent: 'ChatGPT-User',   disallow: ['/'] },
      { userAgent: 'CCBot',          disallow: ['/'] },
      { userAgent: 'anthropic-ai',   disallow: ['/'] },
      { userAgent: 'Claude-Web',     disallow: ['/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
