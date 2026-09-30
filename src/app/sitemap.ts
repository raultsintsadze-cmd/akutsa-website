import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { SITE_URL, buildAlternates } from '@/lib/seo';
import { getAllPublishedPostRefs } from '@/lib/notion';

// Regenerate hourly so new Notion posts show up without a redeploy.
export const revalidate = 3600;

// Bump when static page content changes meaningfully (new Date() would claim daily changes).
const STATIC_LAST_MODIFIED = new Date('2026-09-30');

const paths = [
  '',
  '/guesthouse',
  '/cottage',
  '/camper',
  '/services',
  '/menu',
  '/gallery',
  '/attractions',
  '/tour-planner',
  '/news',
  '/contact',
  '/faq',
  '/rtveli'
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: STATIC_LAST_MODIFIED,
      alternates: { languages: buildAlternates(locale, path).languages as Record<string, string> }
    }))
  );

  // Each post is listed once, under its own language only. The post route still uses the Notion page ID.
  const posts = await getAllPublishedPostRefs();
  const postEntries = posts
    .filter((post) => post.locale !== null)
    .map((post) => ({
      url: `${SITE_URL}/${post.locale}/news/${post.id}`,
      lastModified: new Date(post.lastEdited)
    }));

  return [...staticEntries, ...postEntries];
}
