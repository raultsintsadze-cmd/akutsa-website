import 'server-only';
import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { unstable_cache } from 'next/cache';
import { MONTHS, type DayType, type Month, type PriceType, type Tour } from '@/lib/tours/types';

// Notion databases "Akutsa Tours" (catalog) and "Akutsa Tour Requests".
export const TOURS_DATABASE_ID = process.env.NOTION_TOURS_DATABASE_ID ?? 'db1ef0a6fde840059c84b9da81a5c078';
export const TOUR_REQUESTS_DATABASE_ID =
  process.env.NOTION_TOUR_REQUESTS_DATABASE_ID ?? '04c3db80048f4467a581aacfc07732b9';

// 'live' (API routes: tour requests) never caches. 'catalog' revalidates every 30 minutes, which also lets
// tour pages be prerendered (a no-store fetch would make Next abort static rendering).
export function notionClient(mode: 'live' | 'catalog' = 'live'): Client | null {
  const auth = process.env.NOTION_TOKEN;
  if (!auth) return null;
  const live = mode === 'live' || process.env.BOOKING_CACHE === 'off';
  return new Client({
    auth,
    // NOTION_API_BASE_URL is only set by the end-to-end tests (mock Notion server).
    baseUrl: process.env.NOTION_API_BASE_URL || undefined,
    fetch: (url, init) =>
      fetch(url, live ? { ...init, cache: 'no-store' } : { ...init, next: { revalidate: 1800, tags: ['tours'] } })
  });
}

const dataSourceIds = new Map<string, string>();
export async function dataSourceId(notion: Client, databaseId: string): Promise<string> {
  const known = dataSourceIds.get(databaseId);
  if (known) return known;
  const database = await notion.databases.retrieve({ database_id: databaseId });
  const id = 'data_sources' in database ? database.data_sources[0]?.id : undefined;
  if (!id) throw new Error(`Database ${databaseId} has no data source`);
  dataSourceIds.set(databaseId, id);
  return id;
}

const normalizeId = (id: string) => id.replace(/-/g, '').toLowerCase();

function text(page: PageObjectResponse, name: string): string {
  const p = page.properties[name];
  if (p?.type === 'title') return p.title.map((t) => t.plain_text).join('').trim();
  if (p?.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('').trim();
  return '';
}
const num = (page: PageObjectResponse, name: string) => {
  const p = page.properties[name];
  return p?.type === 'number' ? p.number : null;
};
const select = (page: PageObjectResponse, name: string) => {
  const p = page.properties[name];
  return p?.type === 'select' ? (p.select?.name ?? null) : null;
};

function fileUrls(page: PageObjectResponse, name: string): string[] {
  const p = page.properties[name];
  return p?.type === 'files' ? p.files.map((f) => (f.type === 'file' ? f.file.url : f.external.url)) : [];
}

// "Video" files (raw, expiring URLs); only the /api/tour-video route should use this.
export function getTourVideoUrl(page: PageObjectResponse, index: number): string | null {
  return fileUrls(page, 'Video')[index] ?? null;
}

const photoUrls = (page: PageObjectResponse) => fileUrls(page, 'Photo');

// "Photo" files: index 0 is the cover (else the page cover), the rest are the gallery.
// Raw, expiring URLs; only the /api/tour-image route should use this.
export function getTourImageUrl(page: PageObjectResponse, index: number): string | null {
  const photos = photoUrls(page);
  if (index === 0 && !photos.length) {
    if (page.cover?.type === 'file') return page.cover.file.url;
    if (page.cover?.type === 'external') return page.cover.external.url;
  }
  return photos[index] ?? null;
}

const tourImagePath = (page: PageObjectResponse, index: number) =>
  `/api/tour-image/${normalizeId(page.id)}/${index}`;

// Only active catalog pages may be served by the image proxy.
export function isActiveTourPage(page: PageObjectResponse): boolean {
  const parent = page.parent as { database_id?: string };
  const active = page.properties['Active'];
  return (
    Boolean(parent.database_id) &&
    normalizeId(parent.database_id!) === normalizeId(TOURS_DATABASE_ID) &&
    active?.type === 'checkbox' &&
    active.checkbox
  );
}

function toTour(page: PageObjectResponse): Tour | null {
  const slug = text(page, 'Slug').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const nameKa = text(page, 'Name KA');
  const nameEn = text(page, 'Name EN');
  const nameRu = text(page, 'Name RU');
  if (!slug || !(nameEn || nameKa)) return null;

  const priceType = (select(page, 'Price type') ?? 'on request') as PriceType;
  const season = page.properties['Season months'];
  const months: Month[] =
    season?.type === 'multi_select'
      ? season.multi_select.map((o) => o.name as Month).filter((m) => MONTHS.includes(m))
      : [];
  const dayType = (select(page, 'Day type') === 'Full day' ? 'Full day' : 'Short activity') as DayType;
  const operator = select(page, 'Operator');

  return {
    id: page.id,
    slug,
    name: { ka: nameKa || nameEn, en: nameEn || nameKa, ru: nameRu || nameEn || nameKa },
    description: {
      ka: text(page, 'Short description KA'),
      en: text(page, 'Short description EN'),
      ru: text(page, 'Short description RU')
    },
    nameEn: nameEn || nameKa,
    price: num(page, 'Price GEL'),
    priceType: ['per person', 'per group', 'on request'].includes(priceType) ? priceType : 'on request',
    overnightPrice: num(page, 'Overnight guest price GEL'),
    durationHours: num(page, 'Duration hours'),
    startTimes: text(page, 'Start times')
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{1,2}:\d{2}$/.test(s))
      .map((s) => s.padStart(5, '0')),
    minPeople: num(page, 'Min people'),
    maxPeople: num(page, 'Max people'),
    seasonMonths: months,
    dayType,
    operator: operator === 'Akutsa' || operator === 'Partner' ? operator : null,
    distanceKm: num(page, 'Distance from Akutsa km'),
    includes: text(page, 'Includes'),
    image: getTourImageUrl(page, 0) ? tourImagePath(page, 0) : null,
    gallery: photoUrls(page).slice(1).map((_, i) => tourImagePath(page, i + 1)),
    video: getTourVideoUrl(page, 0) ? `/api/tour-video/${normalizeId(page.id)}/0` : null,
    sortOrder: num(page, 'Sort order') ?? 999
  };
}

async function queryTours(): Promise<Tour[]> {
  const notion = notionClient('catalog');
  if (!notion) return [];
  try {
    const res = await notion.dataSources.query({
      data_source_id: await dataSourceId(notion, TOURS_DATABASE_ID),
      filter: { property: 'Active', checkbox: { equals: true } }
    });
    const seen = new Set<string>();
    return res.results
      .filter((p): p is PageObjectResponse => p.object === 'page' && 'properties' in p)
      .map(toTour)
      .filter((t): t is Tour => t !== null && !seen.has(t.slug) && Boolean(seen.add(t.slug)))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    console.error('Failed to fetch tours:', err);
    return [];
  }
}

const cachedTours = unstable_cache(queryTours, ['tour-catalog'], { revalidate: 1800, tags: ['tours'] });

// Active tours, sorted. Cached for 30 minutes (BOOKING_CACHE=off in end-to-end tests).
export function getTours(): Promise<Tour[]> {
  return process.env.BOOKING_CACHE === 'off' ? queryTours() : cachedTours();
}

export async function getTourCatalog(): Promise<Map<string, Tour>> {
  return new Map((await getTours()).map((t) => [t.slug, t]));
}
