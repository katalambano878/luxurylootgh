import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Pacifico, Playfair_Display, Outfit } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import StoreLayoutShell from "@/components/StoreLayoutShell";
import "./globals.css";

const pacifico = Pacifico({ weight: '400', subsets: ['latin'], variable: '--font-pacifico' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c0a09',
};

const siteUrl = 'https://luxurylootgh.com';
const siteName = 'Luxury Loots GH';
const siteDescription = 'Shop thrifted tops, African print wears, watches, and sunglasses at Luxury Loots GH — premium curated fashion in Obuasi, Ghana.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Thrifted Tops · African Print · Accessories`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Luxury Loots GH',
    'thrift shop ghana',
    'thrift store obuasi',
    'African print wears Ghana',
    'thrifted tops ghana',
    'second hand clothes ghana',
    'watches Ghana',
    'sunglasses Ghana',
    'Obuasi fashion',
    'affordable fashion ghana',
    'ankara print tops',
    'kente blouse',
    'ashanti region fashion',
    'online clothes shopping ghana',
    'pre-loved fashion ghana',
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  applicationName: siteName,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteName,
  },
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: siteUrl,
    title: `${siteName} | Thrifted Tops · African Print · Accessories`,
    description: siteDescription,
    siteName,
    // opengraph-image.tsx auto-generates the OG image at /opengraph-image
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Thrifted Tops · African Print · Accessories`,
    description: 'Premium thrift fashion in Obuasi, Ghana — curated tops, African prints, watches & sunglasses.',
    // twitter-image.tsx auto-generates the card image at /twitter-image
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'shopping',
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GH">
      <head>
        {/* PWA / platform meta */}
        <meta name="theme-color" content="#0c0a09" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0c0a09" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Geo targeting */}
        <meta name="geo.region" content="GH-AH" />
        <meta name="geo.placename" content="Obuasi, Ashanti Region, Ghana" />
        <meta name="geo.position" content="6.2000;-1.6667" />
        <meta name="ICBM" content="6.2000, -1.6667" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Fonts & icons */}
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://dwcnpnambunujyhjzpvr.supabase.co" />

        {/* Structured Data — WebSite with Sitelinks Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              url: siteUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        {/* Structured Data — ClothingStore (LocalBusiness) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['ClothingStore', 'OnlineStore'],
              name: siteName,
              url: siteUrl,
              logo: `${siteUrl}/logo.png`,
              image: `${siteUrl}/opengraph-image`,
              description: siteDescription,
              priceRange: '₵₵',
              currenciesAccepted: 'GHS',
              paymentAccepted: 'Mobile Money, Credit Card',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Obuasi',
                addressLocality: 'Obuasi',
                addressRegion: 'Ashanti Region',
                addressCountry: 'GH',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 6.2000,
                longitude: -1.6667,
              },
              telephone: '+233535227192',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                telephone: '+233535227192',
                areaServed: 'GH',
                availableLanguage: 'English',
              },
              sameAs: [],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Luxury Loots GH Collections',
                itemListElement: [
                  { '@type': 'OfferCatalog', name: 'Thrifted Tops' },
                  { '@type': 'OfferCatalog', name: 'African Print Wears' },
                  { '@type': 'OfferCatalog', name: 'Watches' },
                  { '@type': 'OfferCatalog', name: 'Sunglasses' },
                ],
              },
            }),
          }}
        />

        {/* Structured Data — BreadcrumbList for homepage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
                { '@type': 'ListItem', position: 2, name: 'Shop', item: `${siteUrl}/shop` },
              ],
            }),
          }}
        />
      </head>

      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* Google reCAPTCHA v3 */}
      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}

      <body
        className={`antialiased overflow-x-hidden pwa-body ${pacifico.variable} ${playfair.variable} ${outfit.variable} font-sans`}
        style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-stone-600 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>
          <WishlistProvider>
            <StoreLayoutShell>{children}</StoreLayoutShell>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
