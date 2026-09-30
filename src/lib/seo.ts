import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_URL } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export const OG_DEFAULT_IMAGE = '/og/og-default.jpg';

// Page metadata with canonical URL, Open Graph and Twitter card.
// Needed per page because a page's `openGraph` replaces the layout's instead of merging with it.
export async function pageMetadata({
  locale,
  path,
  title,
  description,
  image = OG_DEFAULT_IMAGE,
  keywords,
  absoluteTitle = false
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  image?: string;
  keywords?: string;
  // true when `title` already contains the brand, so the layout template must not append it.
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const tMeta = await getTranslations({ locale, namespace: 'meta' });
  const images = [{ url: image, width: 1200, height: 630, alt: title }];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/${locale}${path}` },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: tMeta('siteName'),
      locale,
      url: `${SITE_URL}/${locale}${path}`,
      images
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}
