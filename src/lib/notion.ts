import { Client } from '@notionhq/client';
import { unstable_cache } from 'next/cache';
import type {
  PageObjectResponse,
  RichTextItemResponse
} from '@notionhq/client/build/src/api-endpoints';
import { locales, type Locale } from '@/i18n/config';
import { slugify } from '@/lib/slugify';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = NOTION_TOKEN ? new Client({ auth: NOTION_TOKEN }) : null;

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  locale: Locale | null;
  // Posts that are translations of each other share this value (Notion "Translation group").
  group: string | null;
  date: string | null;
  lastEdited: string;
  // Stable proxy paths (see /api/news-image); Notion's own file URLs expire after ~1 hour.
  // `image` is the "Cover", falling back to another post's Cover in the same translation group.
  image: string | null;
  gallery: string[];
  video: string | null;
  category: string | null;
  content: RichTextItemResponse[];
}

const normalizeId = (id: string) => id.replace(/-/g, '').toLowerCase();

function findProp(page: PageObjectResponse, type: string, names?: string[]) {
  return Object.entries(page.properties).find(
    ([key, value]) => value.type === type && (!names || names.includes(key.toLowerCase()))
  )?.[1];
}

function plain(items: RichTextItemResponse[] | undefined): string {
  return (items ?? []).map((t) => t.plain_text).join('').trim();
}

function getTitle(page: PageObjectResponse): string {
  const prop = findProp(page, 'title');
  return prop?.type === 'title' ? plain(prop.title) : '';
}

function getDate(page: PageObjectResponse): string | null {
  const prop = findProp(page, 'date');
  return prop?.type === 'date' ? (prop.date?.start ?? null) : null;
}

// Raw (expiring) image URL; only the image proxy route should use this.
export function getRawImageUrl(page: PageObjectResponse): string | null {
  const files = findProp(page, 'files');
  if (files?.type === 'files' && files.files.length > 0) {
    const file = files.files[0];
    if (file.type === 'file') return file.file.url;
    if (file.type === 'external') return file.external.url;
  }
  if (page.cover?.type === 'file') return page.cover.file.url;
  if (page.cover?.type === 'external') return page.cover.external.url;
  return null;
}

function fileUrls(page: PageObjectResponse, name: string): string[] {
  const prop = findProp(page, 'files', [name]);
  if (prop?.type !== 'files') return [];
  return prop.files.map((f) => (f.type === 'file' ? f.file.url : f.external.url));
}

// News images by index: 0 = first "Cover" file (else the page cover), 1.. = "Gallery" files.
// Raw, expiring URLs; only the /api/news-image route should use this.
export function getNewsImageUrl(page: PageObjectResponse, index: number): string | null {
  if (index === 0) {
    const cover = fileUrls(page, 'cover')[0];
    if (cover) return cover;
    if (page.cover?.type === 'file') return page.cover.file.url;
    if (page.cover?.type === 'external') return page.cover.external.url;
    return null;
  }
  return fileUrls(page, 'gallery')[index - 1] ?? null;
}

const newsImagePath = (page: PageObjectResponse, index: number) =>
  `/api/news-image/${normalizeId(page.id)}/${index}`;

function getUrl(page: PageObjectResponse, names: string[]): string | null {
  const prop = findProp(page, 'url', names);
  return prop?.type === 'url' ? (prop.url ?? null) : null;
}

function getCategory(page: PageObjectResponse): string | null {
  const prop = findProp(page, 'select', ['category']);
  return prop?.type === 'select' ? (prop.select?.name ?? null) : null;
}

function getText(page: PageObjectResponse, names: string[]): string {
  const prop = findProp(page, 'rich_text', names);
  return prop?.type === 'rich_text' ? plain(prop.rich_text) : '';
}

// The database's language column is "Language"; the older "Locale" is still accepted.
function getLocale(page: PageObjectResponse): Locale | null {
  const prop = findProp(page, 'select', ['language', 'locale']);
  const name = prop?.type === 'select' ? prop.select?.name : undefined;
  return name && (locales as readonly string[]).includes(name) ? (name as Locale) : null;
}

function toPost(page: PageObjectResponse): NewsPost {
  const title = getTitle(page);
  const textProp = findProp(page, 'rich_text', ['text']);
  return {
    id: page.id,
    title,
    slug: slugify(getText(page, ['slug'])) || slugify(title) || normalizeId(page.id),
    locale: getLocale(page),
    group: getText(page, ['translation group']) || null,
    date: getDate(page),
    lastEdited: page.last_edited_time,
    image: getNewsImageUrl(page, 0) ? newsImagePath(page, 0) : null,
    gallery: fileUrls(page, 'gallery').map((_, i) => newsImagePath(page, i + 1)),
    video: getUrl(page, ['video url']),
    category: getCategory(page),
    // May be truncated by Notion for long, heavily formatted text; see getFullPostContent.
    content: textProp?.type === 'rich_text' ? textProp.rich_text : []
  };
}

export function isNewsDatabasePage(page: PageObjectResponse): boolean {
  const parent = page.parent as { database_id?: string };
  return Boolean(
    NOTION_DATABASE_ID &&
      parent.database_id &&
      normalizeId(parent.database_id) === normalizeId(NOTION_DATABASE_ID)
  );
}

export function isPublished(page: PageObjectResponse): boolean {
  const prop = findProp(page, 'checkbox', ['published']);
  return prop?.type === 'checkbox' && prop.checkbox;
}

// All published pages, newest first, following Notion's pagination.
async function queryPublishedPages(): Promise<PageObjectResponse[]> {
  if (!notion || !NOTION_DATABASE_ID) return [];

  const database = await notion.databases.retrieve({ database_id: NOTION_DATABASE_ID });
  const dataSourceId = 'data_sources' in database ? database.data_sources[0]?.id : undefined;
  if (!dataSourceId) return [];

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Date', direction: 'descending' }],
      start_cursor: cursor
    });
    pages.push(
      ...response.results.filter(
        (p): p is PageObjectResponse => p.object === 'page' && 'properties' in p
      )
    );
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

// One Notion query shared by the list, post pages, redirects and sitemap; refreshed every 30 minutes.
export const getAllPosts = unstable_cache(
  async (): Promise<NewsPost[]> => {
    try {
      const posts = (await queryPublishedPages()).map(toPost);
      // A translation without its own Cover borrows one from its translation group.
      for (const post of posts) {
        if (post.image || !post.group) continue;
        post.image = posts.find((p) => p.group === post.group && p.image)?.image ?? null;
      }
      return posts;
    } catch (err) {
      console.error('Failed to fetch Notion posts:', err);
      return [];
    }
  },
  ['notion-news-posts'],
  { revalidate: 1800 }
);

export async function getPublishedPosts(locale: Locale): Promise<NewsPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.locale === null || post.locale === locale);
}

export async function getPostBySlug(locale: Locale, slug: string): Promise<NewsPost | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug && (post.locale ?? locale) === locale) ?? null;
}

// Every post with this slug, in any language (translations share a slug).
export async function getPostsBySlug(slug: string): Promise<NewsPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.slug === slug);
}

export async function getPostById(id: string): Promise<NewsPost | null> {
  const posts = await getAllPosts();
  const wanted = normalizeId(id);
  return posts.find((post) => normalizeId(post.id) === wanted) ?? null;
}

// The post itself plus its translations, in ka/en/ru order.
export async function getTranslationSet(post: NewsPost): Promise<NewsPost[]> {
  if (!post.group || !post.locale) return [post];
  const posts = await getAllPosts();
  const byLocale = new Map<Locale, NewsPost>();
  for (const p of posts) if (p.group === post.group && p.locale) byLocale.set(p.locale, p);
  byLocale.set(post.locale, post);
  return locales.flatMap((l) => {
    const p = byLocale.get(l);
    return p ? [p] : [];
  });
}

// Full "Text" property (the page object caps rich_text at 25 items).
export const getFullPostContent = unstable_cache(
  async (pageId: string): Promise<RichTextItemResponse[]> => {
    if (!notion) return [];
    const page = (await notion.pages.retrieve({ page_id: pageId })) as PageObjectResponse;
    const prop = findProp(page, 'rich_text', ['text']);
    if (!prop) return [];
    const items: RichTextItemResponse[] = [];
    let cursor: string | undefined;
    do {
      const res = await notion.pages.properties.retrieve({
        page_id: pageId,
        property_id: prop.id,
        start_cursor: cursor
      });
      if (res.object !== 'list') break;
      for (const r of res.results) {
        if (r.type === 'rich_text') items.push(r.rich_text as unknown as RichTextItemResponse);
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
    return items;
  },
  ['notion-post-content'],
  { revalidate: 1800 }
);

export async function retrievePage(pageId: string): Promise<PageObjectResponse | null> {
  if (!notion) return null;
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    return 'properties' in page ? (page as PageObjectResponse) : null;
  } catch {
    return null;
  }
}

export function isNotionConfigured(): boolean {
  return Boolean(NOTION_TOKEN && NOTION_DATABASE_ID);
}
