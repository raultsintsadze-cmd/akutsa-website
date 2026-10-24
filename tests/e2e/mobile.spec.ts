import { expect, test } from '@playwright/test';

const PAGES = ['', '/guesthouse', '/cottage', '/camper', '/book', '/tours', '/tours/plan', '/menu', '/rtveli', '/services', '/attractions', '/gallery', '/news', '/faq', '/contact', '/tour-planner'];
const SHOTS = process.env.MOBILE_SHOTS_DIR;

for (const width of [360, 390, 430]) {
  for (const locale of ['ka', 'en', 'ru'] as const) {
    test(`phone ${width}px ${locale}: no horizontal scroll, compact header, action bar`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
      const problems: string[] = [];
      for (const path of PAGES) {
        await page.goto(`/${locale}${path}`);
        const m = await page.evaluate(() => {
          const wide = [...document.querySelectorAll('body *')]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.right <= window.innerWidth + 1) return false;
              // Ignore content inside horizontal scrollers (swipe rows) and off-screen helpers.
              for (let p = el.parentElement; p; p = p.parentElement) {
                const o = getComputedStyle(p).overflowX;
                if (o === 'auto' || o === 'scroll' || o === 'hidden') return false;
              }
              return r.left < window.innerWidth && getComputedStyle(el).position !== 'fixed';
            })
            .map((el) => `${el.tagName}.${String((el as HTMLElement).className).slice(0, 40)}`);
          const bar = document.querySelector('[data-testid="mobile-action-bar"]') as HTMLElement | null;
          const header = document.querySelector('header')!.getBoundingClientRect().height;
          const bubbles = [...document.querySelectorAll('.fixed')].filter((el) => {
            const s = getComputedStyle(el);
            return s.display !== 'none' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().width < 80;
          }).length;
          return {
            scroll: document.documentElement.scrollWidth > window.innerWidth,
            wide: wide.slice(0, 3),
            header,
            bar: !!bar && bar.getBoundingClientRect().height >= 56,
            padding: parseFloat(getComputedStyle(document.body).paddingBottom),
            bubbles
          };
        });
        if (m.scroll) problems.push(`${path || '/'} horizontal scroll: ${m.wide.join(', ')}`);
        if (m.header < 56 || m.header > 61) problems.push(`${path || '/'} header ${m.header}px`);
        if (!m.bar && path !== '/menu') problems.push(`${path || '/'} no action bar`);
        if (m.padding < 56) problems.push(`${path || '/'} body padding ${m.padding}`);
        if (m.bubbles > 0) problems.push(`${path || '/'} ${m.bubbles} floating bubble(s)`);
      }
      // Home hero: H1 at most 3 lines; hero ~75svh.
      await page.goto(`/${locale}`);
      const hero = await page.evaluate(() => {
        const h1 = document.querySelector('h1')!;
        const lh = parseFloat(getComputedStyle(h1).lineHeight);
        return { lines: Math.round(h1.getBoundingClientRect().height / lh), hero: h1.closest('section')!.getBoundingClientRect().height };
      });
      if (hero.lines > 3) problems.push(`home H1 ${hero.lines} lines`);
      if (hero.hero > 800 * 0.8) problems.push(`hero ${hero.hero}px`);
      if (SHOTS && width === 360) await page.screenshot({ path: `${SHOTS}/home-${locale}-360.png`, fullPage: true });
      expect(problems, problems.join('\n')).toEqual([]);
      await page.close();
    });
  }
}

test('full-screen menu locks scroll and shows language switch at the bottom', async ({ page }) => {
  await page.goto('/ka');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  const menu = page.locator('#mobile-menu');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box!.height).toBeGreaterThan(600);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  await expect(menu.getByRole('button', { name: 'ქართული' }).or(menu.getByText('KA', { exact: true }))).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});
