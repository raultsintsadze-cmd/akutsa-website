// Runs as `postbuild`. On production Vercel builds it submits every URL from the freshly built
// sitemap to IndexNow. It never fails the build: any problem is logged and the script exits 0.
import fs from 'node:fs';

const SITE_URL = 'https://www.akutsaresosort.ge';
const MAX_URLS = 10000;

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('[indexnow] skipped (not a production build)');
    return;
  }
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.log('[indexnow] skipped (INDEXNOW_KEY is not set)');
    return;
  }

  // The sitemap Next.js just prerendered, so the list always matches the sitemap logic.
  const xml = fs.readFileSync('.next/server/app/sitemap.xml.body', 'utf8');
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'))
    .slice(0, MAX_URLS);
  if (urlList.length === 0) {
    console.log('[indexnow] skipped (no URLs found in the built sitemap)');
    return;
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList
    }),
    signal: AbortSignal.timeout(15000)
  });
  console.log(`[indexnow] submitted ${urlList.length} URLs -> HTTP ${res.status}`);
}

main().catch((err) => console.log(`[indexnow] failed, ignoring: ${err?.message ?? err}`));
