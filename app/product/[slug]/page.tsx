import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProductDetailClient from './ProductDetailClient';

const siteUrl = 'https://luxurylootgh.com';

async function getProduct(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('products')
    .select('name, description, price, product_images(url)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product is no longer available at Luxury Loots GH.',
    };
  }

  const image = (product.product_images as any)?.[0]?.url;
  const price = `GH₵ ${Number(product.price).toFixed(2)}`;
  const description = product.description
    ? `${product.description.slice(0, 155)}…`
    : `Buy ${product.name} at Luxury Loots GH for ${price}. Premium thrift fashion in Obuasi, Ghana.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} — ${price} | Luxury Loots GH`,
      description,
      url: `${siteUrl}/product/${slug}`,
      type: 'website',
      images: image ? [{ url: image, width: 800, height: 1000, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ${price}`,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `${siteUrl}/product/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
