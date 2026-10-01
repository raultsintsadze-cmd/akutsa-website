import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';
import { SITE_URL } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10000;

function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/indexnow with header `x-indexnow-secret: <INDEXNOW_SECRET>`.
// Submits every sitemap URL to IndexNow (Bing, Yandex and other participating engines).
export async function POST(req: Request) {
  const key = process.env.INDEXNOW_KEY;
  const secret = process.env.INDEXNOW_SECRET;
  if (!key || !secret) {
    return NextResponse.json({ error: 'IndexNow is not configured.' }, { status: 500 });
  }
  if (!secretMatches(req.headers.get('x-indexnow-secret'), secret)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const urlList = (await sitemap()).map((entry) => entry.url).slice(0, MAX_URLS);
  const host = new URL(SITE_URL).host;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList })
    });
    // 200 = accepted, 202 = accepted, key validation pending.
    return NextResponse.json(
      { submitted: urlList.length, indexNowStatus: res.status, ok: res.ok },
      { status: res.ok ? 200 : 502 }
    );
  } catch (err) {
    console.error('IndexNow request failed:', err);
    return NextResponse.json({ error: 'IndexNow request failed.' }, { status: 502 });
  }
}
