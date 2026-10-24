import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const MOCK = 'http://127.0.0.1:4010';
const OWNER_CHAT_ID = 6499517306;
const day = (offset: number) => new Date(Date.now() + 4 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);
const display = (d: string) => d.split('-').reverse().join('.');

interface MockPage {
  id: string;
  properties: Record<string, any>;
}
const state = async (request: APIRequestContext) =>
  (await (await request.get(`${MOCK}/__state`)).json()) as { tourRequests: MockPage[]; telegramCalls: { method: string; payload: any }[] };

const prop = (p: MockPage, name: string) => {
  const v = p.properties[name];
  return v.multi_select?.map((o: any) => o.name) ?? v.select?.name ?? v.date?.start ?? v.number ?? v.checkbox ?? v.phone_number ?? v.rich_text?.[0]?.plain_text ?? v.title?.[0]?.plain_text;
};

async function details(page: Page, name: string) {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Phone').fill('+995 577 11 22 33');
  await page.getByRole('button', { name: 'Send trip request' }).click();
  await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await request.post(`${MOCK}/__reset`);
});

test('tours page lists the live catalog with one H1, FAQ and JSON-LD', async ({ page }) => {
  await page.goto('/en/tours');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Activities in Keda — fishing, rafting, horse riding, wine');
  await expect(page.locator('article[data-tour]')).toHaveCount(9);
  await expect(page.locator('article[data-tour="fishing"]')).toContainText('Full day');
  await expect(page.locator('article[data-tour="quad-bike"]')).toContainText('150 GEL per group of up to 2');
  await expect(page.locator('article[data-tour="zipline"]')).toContainText('about 2 h (approx.)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // FAQ answers are in the HTML.
  await expect(page.locator('details').first()).toContainText('Full-day tours');

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').last().textContent())!);
  const list = ld['@graph'].find((g: any) => g['@type'] === 'ItemList');
  expect(list.itemListElement).toHaveLength(9);
  const quad = list.itemListElement.find((i: any) => i.item.url.endsWith('/tours/quad-bike')).item;
  expect(quad['@type']).toBe('TouristTrip');
  expect(quad.offers).toMatchObject({ price: 150, priceCurrency: 'GEL' });
  expect(ld['@graph'].some((g: any) => g['@type'] === 'FAQPage')).toBe(true);

  // "Add to my trip" → sticky drawer → planner with the tour prefilled.
  await page.locator('button[data-add="rafting"]').click();
  await expect(page.getByRole('button', { name: /My trip \(1\)/ })).toBeVisible();
  await page.getByRole('link', { name: 'Open trip planner' }).click();
  await expect(page).toHaveURL(/\/en\/tours\/plan\?trip=rafting%40|\/en\/tours\/plan\?trip=rafting@/);
  await expect(page.locator('li[data-item="rafting"]')).toBeVisible();
  await page.evaluate(() => localStorage.clear());
});

test('(a) zipline + rafting + horse riding on one day → request', async ({ page, request }) => {
  await page.goto('/en/tours/plan');
  await page.getByRole('button', { name: 'All on one day' }).click();
  await page.getByLabel('Date', { exact: true }).fill(day(10));
  for (const slug of ['zipline', 'rafting', 'horse-riding']) await page.locator(`button[data-plan-add="${slug}"]`).click();

  const timeline = page.getByTestId('timeline');
  await expect(timeline).toContainText(`Day 1 · ${display(day(10))}`);
  await expect(timeline).toContainText('09:00–11:00 (approx.) · Zipline');
  await expect(timeline).toContainText('11:30–12:30 · Rafting');
  await expect(timeline).toContainText('13:00–13:30 · Horse riding');
  await expect(page.getByTestId('trip-total')).toHaveText('540 GEL'); // (80 + 90 + 100) × 2

  await details(page, 'One Day Guest');
  const whatsapp = await page.getByRole('link', { name: 'Send it to us on WhatsApp' }).getAttribute('href');
  expect(decodeURIComponent(whatsapp!)).toContain(`${day(10)} 11:30 — Rafting`);

  const { tourRequests, telegramCalls } = await state(request);
  expect(tourRequests).toHaveLength(1);
  const r = tourRequests[0];
  expect(prop(r, 'Guest')).toBe('One Day Guest');
  expect(prop(r, 'Tours')).toEqual(['Zipline', 'Rafting', 'Horse riding']);
  expect(prop(r, 'Status')).toBe('Pending');
  expect(prop(r, 'Estimated total GEL')).toBe(540);
  expect(prop(r, 'First date')).toBe(day(10));
  expect(prop(r, 'Last date')).toBe(day(10));
  expect(prop(r, 'Itinerary')).toBe(
    [`${day(10)} 09:00 — Zipline (approx.)`, `${day(10)} 11:30 — Rafting`, `${day(10)} 13:00 — Horse riding`].join('\n')
  );
  const msg = telegramCalls.find((c) => c.method === 'sendMessage')!;
  expect(msg.payload.chat_id).toBe(String(OWNER_CHAT_ID));
  expect(msg.payload.text).toContain('ზიპლაინი');
  expect(msg.payload.reply_markup.inline_keyboard[0][0].callback_data).toBe(`tr:c:${r.id.replace(/-/g, '')}`);

  // ✅ in Telegram: Notion → Confirmed, message edited, WhatsApp link for the guest.
  const res = await request.post('/api/telegram/booking', {
    headers: { 'x-telegram-bot-api-secret-token': 'test-webhook-secret' },
    data: {
      callback_query: {
        id: 'cb',
        data: `tr:c:${r.id.replace(/-/g, '')}`,
        message: { message_id: 5, chat: { id: OWNER_CHAT_ID }, text: msg.payload.text }
      }
    }
  });
  expect(res.status()).toBe(200);
  const after = await state(request);
  expect(prop(after.tourRequests[0], 'Status')).toBe('Confirmed');
  expect(after.telegramCalls.some((c) => c.method === 'editMessageText' && c.payload.text.includes('✅'))).toBe(true);
  const reply = after.telegramCalls.filter((c) => c.method === 'sendMessage').at(-1)!;
  expect(reply.payload.text).toContain('https://wa.me/995577112233?text=');
  expect(decodeURIComponent(reply.payload.text.split('?text=')[1])).toContain('Your tours are confirmed');
});

test('(b) fishing on day 1, quad + off-road on day 2 for 4 people → request', async ({ page, request }) => {
  await page.goto('/en/tours/plan');
  await page.getByRole('button', { name: 'Across several days' }).click();
  await page.getByLabel('Number of people').fill('4');
  await page.getByTestId('new-date').fill(day(20));
  await page.locator('button[data-plan-add="fishing"]').click();
  await page.getByTestId('new-date').fill(day(21));
  await page.locator('button[data-plan-add="quad-bike"]').click();
  await page.locator('button[data-plan-add="off-road-4x4"]').click();

  await expect(page.locator('li[data-item="quad-bike"]')).toContainText('300 GEL (2 × 150 GEL)');
  await expect(page.locator('li[data-item="off-road-4x4"]')).toContainText('300 GEL (1 × 300 GEL)');
  const timeline = page.getByTestId('timeline');
  await expect(timeline).toContainText(`Day 1 · ${display(day(20))}`);
  await expect(timeline).toContainText('whole day · Fishing');
  await expect(timeline).toContainText(`Day 2 · ${display(day(21))}`);
  await expect(timeline).toContainText('09:00–10:00 · Quad bike');
  await expect(timeline).toContainText('10:30–11:30 · Off-road 4x4');
  await expect(page.getByTestId('trip-total')).toHaveText('1600 GEL'); // 4 × 250 + 2 quads + 1 car

  await details(page, 'Two Day Guest');
  const r = (await state(request)).tourRequests.at(-1)!;
  expect(prop(r, 'Tours')).toEqual(['Fishing', 'Quad bike', 'Off-road 4x4']);
  expect(prop(r, 'People')).toBe(4);
  expect(prop(r, 'First date')).toBe(day(20));
  expect(prop(r, 'Last date')).toBe(day(21));
  expect(prop(r, 'Estimated total GEL')).toBe(1600);

  // 9 people off-road = 2 cars.
  await page.getByRole('button', { name: 'Plan another trip' }).click();
  await page.getByLabel('Number of people').fill('9');
  await page.locator('button[data-plan-add="off-road-4x4"]').click();
  await expect(page.locator('li[data-item="off-road-4x4"]')).toContainText('600 GEL (2 × 300 GEL)');
  await page.evaluate(() => localStorage.clear());
});

test('(c) adding rafting to a fishing day is blocked with a message', async ({ page, request }) => {
  await page.goto('/en/tours/plan');
  await page.getByRole('button', { name: 'Across several days' }).click();
  await page.getByTestId('new-date').fill(day(30));
  await page.locator('button[data-plan-add="fishing"]').click();
  await page.locator('button[data-plan-add="rafting"]').click();

  const notice = page.getByTestId('notice');
  await expect(notice).toContainText(`Fishing takes the whole day on ${display(day(30))}`);
  await expect(notice).toContainText(`Next free day: ${display(day(31))}`);
  await expect(page.locator('li[data-item]')).toHaveCount(1);

  // One tap moves it to the suggested day.
  await notice.getByRole('button', { name: `Add on ${display(day(31))}` }).click();
  await expect(page.locator('li[data-item="rafting"] input[type="date"]')).toHaveValue(day(31));

  // A full-day tour can't go on a day that already has activities either.
  await page.getByTestId('new-date').fill(day(31));
  await page.locator('button[data-plan-add="wine-cellar"]').click();
  await expect(page.getByTestId('notice')).toContainText('takes the whole day');
  await expect(page.locator('li[data-item]')).toHaveCount(2);

  // The server enforces the rule even if the page is bypassed.
  const res = await request.post('/api/tour-requests', {
    headers: { 'x-forwarded-for': '10.1.1.1' },
    data: {
      items: [{ slug: 'fishing', date: day(30) }, { slug: 'rafting', date: day(30) }],
      people: 2, staying: false, transfer: false, name: 'Bypass', phone: '+995577000000', locale: 'en'
    }
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).problems).toContain(`fullDay:${day(30)}`);
  await page.evaluate(() => localStorage.clear());
});

test('tour detail page: metadata, hreflang, JSON-LD and sitemap', async ({ page, request }) => {
  await page.goto('/ka/tours/off-road-4x4');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ოფროუდი 4x4');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://www.akutsaresosort.ge/ka/tours/off-road-4x4');
  expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(4);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').last().textContent())!);
  expect(ld['@type']).toBe('TouristTrip');
  expect(ld.offers.price).toBe(300);

  await page.getByRole('link', { name: 'მხოლოდ ამ ტურის დაჯავშნა' }).click();
  await expect(page).toHaveURL(/\/ka\/tours\/plan\?trip=off-road-4x4/);
  await expect(page.locator('li[data-item="off-road-4x4"]')).toBeVisible();

  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/en/tours', '/ru/tours/plan', '/ka/tours/fishing', '/en/tours/horse-riding']) {
    expect(sitemap).toContain(`<loc>https://www.akutsaresosort.ge${p}</loc>`);
  }
  // Main navigation and footer link to tours.
  await page.goto('/ru');
  expect(await page.locator('footer a[href="/ru/tours"]').count()).toBeGreaterThan(0);
});

test('AI planner validates tours and links to the prefilled planner', async ({ request }) => {
  const before = (await state(request)).tourRequests.length;
  const res = await request.post('/api/generate-tour', {
    data: { days: 2, people: 4, interests: ['nature'], budget: 'medium', locale: 'en', question: 'TOURS_TEST' }
  });
  expect(res.status()).toBe(200);
  const { itinerary } = await res.json();
  const tool = JSON.parse(itinerary.split('TOOL_RESULT:')[1].split('\nSYSTEM_HAS_RULES')[0]);
  expect(tool.valid).toBe(false);
  expect(tool.problems).toContain(`fullDay:${day(12)}`);
  expect(tool.url).toBe(
    `https://www.akutsaresosort.ge/en/tours/plan?trip=${encodeURIComponent(`fishing@${day(12)},rafting@${day(12)},quad-bike@${day(13)}@morning`)}&people=4`
  );
  expect(tool.note).toContain('Not a booking');
  // The catalog is in the system prompt.
  expect(itinerary).toContain('SYSTEM_HAS_RULES:true');
  // The assistant never creates requests.
  expect((await state(request)).tourRequests.length).toBe(before);
});
