import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { SITE_URL, buildAlternates } from '@/lib/seo';
import { getAllPosts, type NewsPost } from '@/lib/notion';

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
  '/book',
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

  // Each post is listed once, at its own language's slug URL, with its translations as alternates.
  const posts = (await getAllPosts()).filter((post) => post.locale !== null);
  const postUrl = (post: NewsPost) => `${SITE_URL}/${post.locale}/news/${post.slug}`;
  const postEntries = posts.map((post) => {
    const translations = post.group ? posts.filter((p) => p.group === post.group) : [post];
    const entry = { url: postUrl(post), lastModified: new Date(post.lastEdited) };
    if (translations.length < 2) return entry;
    const languages: Record<string, string> = {};
    for (const p of translations) languages[p.locale!] = postUrl(p);
    languages['x-default'] = postUrl(translations.find((p) => p.locale === 'en') ?? post);
    return { ...entry, alternates: { languages } };
  });

  return [...staticEntries, ...postEntries];
}
