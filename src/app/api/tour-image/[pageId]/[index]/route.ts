import { retrievePage } from '@/lib/notion';
import { getTourImageUrl, isActiveTourPage } from '@/lib/tours/catalog';

export const runtime = 'nodejs';

// Serves an active tour's "Photo" files from a stable URL (index 0 = cover, 1.. = gallery).
// Notion's file URLs are signed and expire after ~1 hour, so each cache miss asks Notion for a
// fresh URL; the CDN keeps the bytes for a day and may serve them stale while it refetches.
export async function GET(
  _req: Request,
  { params }: { params: { pageId: string; index: string } }
) {
  const pageId = params.pageId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(pageId) || !/^\d{1,3}$/.test(params.index)) {
    return new Response('Not found', { status: 404 });
  }

  const page = await retrievePage(pageId);
  const src = page && isActiveTourPage(page) ? getTourImageUrl(page, Number(params.index)) : null;
  if (!src) return new Response('Not found', { status: 404 });

  const upstream = await fetch(src, { cache: 'no-store' });
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !type.startsWith('image/')) {
    return new Response('Image unavailable', { status: 502 });
  }

  const cache = 'public, max-age=86400, stale-while-revalidate=604800';
  return new Response(upstream.body, {
    headers: { 'Content-Type': type, 'Cache-Control': cache, 'CDN-Cache-Control': cache }
  });
}
