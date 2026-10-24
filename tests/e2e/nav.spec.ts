import { expect, test } from '@playwright/test';

const SHOTS = process.env.NAV_SHOTS_DIR;

for (const locale of ['ka', 'en', 'ru'] as const) {
  for (const width of [1280, 1024]) {
    test(`desktop header fits on one line: ${locale} @ ${width}px`, async ({ browser }) => {
      const page = await browser.newPage({ viewport: { width, height: 800 }, isMobile: false, hasTouch: false });
      await page.goto(`/${locale}`);
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav).toBeVisible();

      const m = await page.evaluate(() => {
        const header = document.querySelector('header')!;
        const row = header.querySelector(':scope > .container-px') as HTMLElement;
        const logo = row.firstElementChild!.getBoundingClientRect();
        const navEl = row.querySelector('nav')!;
        const first = [...navEl.children].find((el) => (el as HTMLElement).offsetParent !== null)!.getBoundingClientRect();
        // Count rendered text lines per visible item (not box height: the Book pill is taller).
        const lines = (el: Element) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          // Distinct line boxes: tops more than 8px apart (smaller differences are flex alignment).
          const tops = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.top).sort((a, b) => a - b);
          return tops.filter((t, i) => i === 0 || t - tops[i - 1] > 8).length;
        };
        const items = [...navEl.children, ...row.lastElementChild!.previousElementSibling!.children]
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { text: (el as HTMLElement).innerText.trim(), lines: lines(el), top: r.top + r.height / 2 };
          });
        return {
          rowOverflow: row.scrollWidth > row.clientWidth + 1,
          pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
          rowHeight: row.getBoundingClientRect().height,
          logoGap: first.left - logo.right,
          maxLines: Math.max(...items.map((i) => i.lines)),
          tops: [...new Set(items.map((i) => Math.round(i.top)))],
          items: items.map((i) => i.text)
        };
      });
      expect(m.rowOverflow, JSON.stringify(m)).toBe(false);
      expect(m.pageOverflow).toBe(false);
      expect(m.rowHeight).toBe(80);
      expect(m.logoGap).toBeGreaterThanOrEqual(24);
      // One text line each, all vertically centred on the same row.
      expect(m.maxLines, JSON.stringify(m.items)).toBe(1);
      expect(Math.max(...m.tops) - Math.min(...m.tops)).toBeLessThanOrEqual(4);

      // Stay dropdown: hover opens; shows 3 units with prices + booking entry.
      const stayButton = nav.getByRole('button').first();
      await stayButton.hover();
      await expect(stayButton).toHaveAttribute('aria-expanded', 'true');
      const menu = page.locator(`#${await stayButton.getAttribute('aria-controls')}`.replace(/:/g, '\\:'));
      await expect(menu.getByRole('link')).toHaveCount(4);
      await expect(menu.locator(`a[href="/${locale}/guesthouse"]`)).toContainText('90');
      await expect(menu.locator(`a[href="/${locale}/cottage"]`)).toContainText('150');
      await expect(menu.locator(`a[href="/${locale}/camper"]`)).toContainText('100');
      await expect(menu.locator(`a[href="/${locale}/book"]`)).toBeVisible();
      const menuBox = await menu.locator('ul').boundingBox();
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(width);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/nav-${locale}-${width}.png`, clip: { x: 0, y: 0, width, height: 420 } });

      // Keyboard: Esc closes and returns focus to the button.
      await stayButton.focus();
      await page.keyboard.press('Escape');
      await page.mouse.move(width / 2, 700);
      await expect(stayButton).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Enter');
      await expect(stayButton).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(stayButton).toHaveAttribute('aria-expanded', 'false');
      await expect(stayButton).toBeFocused();
      await page.close();
    });
  }

  test(`mobile menu accordion: ${locale} @ 375px`, async ({ page }) => {
    await page.goto(`/${locale}`);
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator('#mobile-menu');
    const stay = menu.getByRole('button').first();
    await expect(stay).toHaveAttribute('aria-expanded', 'false');
    await stay.click();
    await expect(stay).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.locator(`a[href="/${locale}/cottage"]`)).toContainText('150');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/nav-${locale}-375.png` });
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    // Footer still lists the individual pages.
    expect(await page.locator(`footer a[href="/${locale}/guesthouse"]`).count()).toBeGreaterThan(0);
  });
}
