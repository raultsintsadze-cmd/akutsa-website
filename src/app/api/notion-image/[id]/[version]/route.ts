import { getRawImageUrl, isNewsDatabasePage, isPublished, retrievePage } from '@/lib/notion';

export const runtime = 'nodejs';

// Serves a news post's cover from a stable URL. Notion's file URLs are signed and expire after
// ~1 hour, so each cache miss asks Notion for a fresh URL; the CDN then keeps the bytes.
// `version` is the post's last-edit timestamp: an edited post gets a new URL, so caching can
// be immutable. Only covers of published posts in the news database are served.
export async function GET(
  _req: Request,
  { params }: { params: { id: string; version: string } }
) {
  if (!/^[0-9a-f]{32}$/.test(params.id) || !/^\d{1,16}$/.test(params.version)) {
    return new Response('Not found', { status: 404 });
  }

  const page = await retrievePage(params.id);
  const src = page && isNewsDatabasePage(page) && isPublished(page) ? getRawImageUrl(page) : null;
  if (!src) return new Response('Not found', { status: 404 });

  const upstream = await fetch(src, { cache: 'no-store' });
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !type.startsWith('image/')) {
    return new Response('Image unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
