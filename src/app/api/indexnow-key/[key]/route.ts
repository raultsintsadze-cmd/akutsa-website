// Serves the IndexNow key file. Reached via the rewrite /{key}.txt -> /api/indexnow-key/{key}
// (see next.config.mjs); the body must be exactly the key.
export const dynamic = 'force-dynamic';

export function GET(_req: Request, { params }: { params: { key: string } }) {
  const key = process.env.INDEXNOW_KEY;
  if (!key || params.key !== key) return new Response('Not found', { status: 404 });
  return new Response(key, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}
