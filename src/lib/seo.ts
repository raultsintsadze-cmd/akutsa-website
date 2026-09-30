import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SITE_URL } from '@/lib/constants';
import { locales, type Locale } from '@/i18n/config';

export { SITE_URL };
export const OG_DEFAULT_IMAGE = '/og/og-default.jpg';

export const OG_LOCALES: Record<Locale, string> = { ka: 'ka_GE', en: 'en_US', ru: 'ru_RU' };

// Canonical + hreflang for a page. `path` has no locale prefix ('' for home, '/faq', ...).
export function buildAlternates(locale: Locale, path: string): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path}`;
  languages['x-default'] = `${SITE_URL}/en${path}`;
  return { canonical: `${SITE_URL}/${locale}${path}`, languages };
}

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
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: tMeta('siteName'),
      locale: OG_LOCALES[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
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
