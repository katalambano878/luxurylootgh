import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://luxurylootgh.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                     lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/shop`,           lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${baseUrl}/categories`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/about`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`,        lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blog`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${baseUrl}/faqs`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/help`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/shipping`,       lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/returns`,        lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/order-tracking`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`,        lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${baseUrl}/terms`,          lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];

  let productPages:  MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('slug, updated_at').eq('status', 'active'),
      supabase.from('categories').select('slug, updated_at').eq('status', 'active'),
    ]);

    if (products) {
      productPages = products.map((p) => ({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }

    if (categories) {
      categoryPages = categories.map((c) => ({
        url: `${baseUrl}/shop?category=${c.slug}`,
        lastModified: new Date(c.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('[sitemap] Error fetching dynamic pages:', err);
  }

  return [...staticPages, ...productPages, ...categoryPages];
}
