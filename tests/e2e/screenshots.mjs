// Ad-hoc visual check: node tests/e2e/screenshots.mjs <baseUrl> <outDir>
import { chromium } from '@playwright/test';

const [base, out] = process.argv.slice(2);
const day = (o) => new Date(Date.now() + 4 * 3_600_000 + o * 86_400_000).toISOString().slice(0, 10);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, deviceScaleFactor: 2 });
await page.goto(`${base}/en/book?unit=cottage`);
await page.waitForSelector('button[data-date]');
const click = async (d) => {
  const b = page.locator(`button[data-date="${d}"]`);
  for (let i = 0; i < 12 && (await b.count()) === 0; i++) await page.getByRole('button', { name: 'Next month' }).click();
  await b.click();
};
await click(day(14));
await click(day(16));
await page.screenshot({ path: `${out}/book-1.png`, fullPage: true });
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByLabel('Full name').fill('Anna Tester');
await page.getByLabel('Phone').fill('+995 577 12 34 56');
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/book-2.png`, fullPage: true });
await browser.close();
