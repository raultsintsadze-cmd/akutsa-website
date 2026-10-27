import { retrievePage } from '@/lib/notion';
import { getTourVideoUrl, isActiveTourPage } from '@/lib/tours/catalog';

export const runtime = 'nodejs';

// Redirects to an active tour's "Video" file. The video is never streamed through the function:
// the browser gets Notion's fresh signed URL (valid ~1 hour), and the CDN caches the redirect
// for 30 minutes so a cached redirect never points at an expired URL.
export async function GET(
  _req: Request,
  { params }: { params: { pageId: string; index: string } }
) {
  const pageId = params.pageId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(pageId) || !/^\d{1,3}$/.test(params.index)) {
    return new Response('Not found', { status: 404 });
  }

  const page = await retrievePage(pageId);
  const src = page && isActiveTourPage(page) ? getTourVideoUrl(page, Number(params.index)) : null;
  if (!src) return new Response('Not found', { status: 404 });

  const cache = 'public, s-maxage=1800, stale-while-revalidate=600';
  return new Response(null, {
    status: 302,
    headers: { Location: src, 'Cache-Control': cache, 'CDN-Cache-Control': cache }
  });
}
