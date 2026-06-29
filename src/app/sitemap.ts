import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { SITE_URL } from '@/lib/constants';

const paths = [
  '',
  '/guesthouse',
  '/cottage',
  '/camper',
  '/services',
  '/gallery',
  '/attractions',
  '/tour-planner',
  '/news',
  '/contact'
];

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date()
    }))
  );
}
