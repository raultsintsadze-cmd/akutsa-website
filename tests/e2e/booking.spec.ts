import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const MOCK = 'http://127.0.0.1:4010';
const OWNER_CHAT_ID = 6499517306;

// Same "today" as the app and the mock server (Asia/Tbilisi).
const day = (offset: number) =>
  new Date(Date.now() + 4 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);
const display = (date: string) => date.split('-').reverse().join('.');

interface MockPage {
  id: string;
  properties: Record<string, any>;
}
interface MockState {
  pages: MockPage[];
  telegramCalls: { method: string; payload: any }[];
}

async function mockState(request: APIRequestContext): Promise<MockState> {
  return (await request.get(`${MOCK}/__state`)).json();
}

const prop = (page: MockPage, name: string) => {
  const p = page.properties[name];
  return p.select?.name ?? p.date?.start ?? p.number ?? p.phone_number ?? p.title?.[0]?.plain_text;
};

// Clicks a calendar day, moving forward a month at a time until it is on screen.
async function clickDate(page: Page, date: string) {
  const dayButton = page.locator(`button[data-date="${date}"]`);
  for (let i = 0; i < 12 && (await dayButton.count()) === 0; i++) {
    await page.getByRole('button', { name: 'Next month' }).click();
  }
  await dayButton.click();
}

async function showDate(page: Page, date: string) {
  const dayButton = page.locator(`button[data-date="${date}"]`);
  for (let i = 0; i < 12 && (await dayButton.count()) === 0; i++) {
    await page.getByRole('button', { name: 'Next month' }).click();
  }
  return dayButton;
}

const telegramUpdate = (bookingId: string, action: 'c' | 'd', chatId = OWNER_CHAT_ID) => ({
  update_id: 1,
  callback_query: {
    id: 'cb-1',
    from: { id: chatId },
    data: `bk:${action}:${bookingId.replace(/-/g, '')}`,
    message: { message_id: 77, chat: { id: chatId }, text: 'Original request text' }
  }
});

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await request.post(`${MOCK}/__reset`);
});

test('availability merges Notion bookings and both iCal feeds', async ({ request }) => {
  const blocked = async (unit: string) =>
    (await (await request.get(`/api/availability?unit=${unit}&from=${day(0)}&to=${day(40)}`)).json()).blocked as string[];

  // Confirmed booking: check-out day is free; expired pending (30 h old) does not block.
  expect(await blocked('lemon')).toEqual([day(5), day(6)]);
  // Fresh pending request blocks.
  expect(await blocked('fig')).toEqual([day(3)]);
  // Booking.com feed (+10, +11) and Airbnb feed (+20); DTEND is exclusive.
  expect(await blocked('cottage')).toEqual([day(10), day(11), day(20)]);
  // Unit with no bookings and no feeds configured.
  expect(await blocked('strawberry')).toEqual([]);

  const res = await request.get(`/api/availability?unit=cottage&from=${day(0)}&to=${day(40)}`);
  expect(res.headers()['x-robots-tag']).toContain('noindex');
  expect((await request.get('/api/availability?unit=penthouse')).status()).toBe(400);
});

test('guest books the cottage on a 375 px screen', async ({ page, request }) => {
  await page.goto('/en');
  // The header "Book Now" button (in the mobile menu) leads to the booking page.
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await page.getByRole('banner').getByRole('link', { name: 'Book Now' }).click();
  await expect(page).toHaveURL(/\/en\/book$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Book Your Stay');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // Step 1: unit, dates, guests.
  await page.locator('button[data-unit="cottage"]').click();
  await expect(page.locator('button[data-unit="cottage"]')).toHaveAttribute('aria-pressed', 'true');

  // Dates taken on Booking.com are greyed out; the check-out day of that stay is selectable.
  await expect(await showDate(page, day(10))).toBeDisabled();
  await expect(page.locator(`button[data-date="${day(11)}"]`)).toBeDisabled();
  await expect(page.locator(`button[data-date="${day(10)}"]`)).toHaveAttribute('aria-label', /booked/);

  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await clickDate(page, day(14));
  await clickDate(page, day(16));
  await expect(page.getByTestId('check-in')).toHaveText(display(day(14)));
  await expect(page.getByTestId('check-out')).toHaveText(display(day(16)));
  await expect(page.getByTestId('total')).toHaveText('300 GEL'); // 2 nights × 150
  await expect(page.getByText('☕ Free breakfast — booking directly on our website')).toBeVisible();
  await expect(page.getByText('Free cancellation up to 48 hours before arrival.')).toBeVisible();

  await page.getByLabel('Guests').selectOption('2');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Step 2: details. A phone without country code is rejected before anything is sent.
  await page.getByLabel('Full name').fill('Anna Tester');
  await page.getByLabel('Phone').fill('577123456');
  await page.getByRole('button', { name: 'Send booking request' }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('country code');
  expect((await mockState(request)).pages).toHaveLength(4);

  await page.getByLabel('Phone').fill('+995 577 12 34 56');
  await page.getByLabel('Notes (optional)').fill('Arriving late');
  await page.getByRole('button', { name: 'Send booking request' }).click();

  await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible();
  await expect(page.getByText('We confirm within a few hours via WhatsApp.', { exact: true })).toBeVisible();
  const whatsapp = page.getByRole('link', { name: 'Message us on WhatsApp' });
  const href = await whatsapp.getAttribute('href');
  expect(href).toContain('https://wa.me/995577225289?text=');
  expect(decodeURIComponent(href!)).toContain(`${display(day(14))} – ${display(day(16))}`);

  // Notion got a Pending / Website row with the estimate.
  const state = await mockState(request);
  expect(state.pages).toHaveLength(5);
  const created = state.pages[4];
  expect(prop(created, 'Guest')).toBe('Anna Tester');
  expect(prop(created, 'Unit')).toBe('Cottage');
  expect(prop(created, 'Status')).toBe('Pending');
  expect(prop(created, 'Channel')).toBe('Website');
  expect(prop(created, 'Check-in')).toBe(day(14));
  expect(prop(created, 'Check-out')).toBe(day(16));
  expect(prop(created, 'Phone')).toBe('+995577123456');
  expect(prop(created, 'Language')).toBe('en');
  expect(prop(created, 'Estimated price GEL')).toBe(300);

  // The owner got a Telegram message with Confirm / Decline buttons.
  const sent = state.telegramCalls.find((c) => c.method === 'sendMessage');
  expect(sent?.payload.chat_id).toBe(String(OWNER_CHAT_ID));
  expect(sent?.payload.text).toContain('Anna Tester');
  expect(sent?.payload.text).toContain('300');
  const buttons = sent?.payload.reply_markup.inline_keyboard[0];
  expect(buttons.map((b: any) => b.callback_data)).toEqual([
    `bk:c:${created.id.replace(/-/g, '')}`,
    `bk:d:${created.id.replace(/-/g, '')}`
  ]);

  // The pending request now holds those nights.
  const blocked = (await (await request.get(`/api/availability?unit=cottage&from=${day(0)}&to=${day(40)}`)).json()).blocked;
  expect(blocked).toContain(day(14));
  expect(blocked).toContain(day(15));
  expect(blocked).not.toContain(day(16));
});

test('dates taken while the guest fills the form: alternatives are offered', async ({ page, request }) => {
  await page.goto(`/en/book?unit=camper&in=${day(30)}&out=${day(32)}`);
  await expect(page.locator('button[data-unit="camper"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('check-in')).toHaveText(display(day(30)));
  await expect(page.getByTestId('total')).toHaveText('200 GEL');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Full name').fill('Boris Late');
  await page.getByLabel('Phone').fill('+79161234567');

  // Someone else gets confirmed for the same nights before this guest submits.
  await request.post(`${MOCK}/__seed`, {
    data: { unit: 'Camper', checkIn: day(30), checkOut: day(32), status: 'Confirmed', channel: 'Phone/WhatsApp' }
  });
  await page.getByRole('button', { name: 'Send booking request' }).click();

  const alert = page.locator('main').getByRole('alert');
  await expect(alert).toContainText('These dates were just taken');
  await expect(alert).toContainText('Other dates for the same place');
  await expect(alert).toContainText('Free for your dates');
  const before = (await mockState(request)).pages.length;

  // Take the first suggested range for the same unit and finish the booking.
  await alert.getByRole('button', { name: /\d{2}\.\d{2}\.\d{4} – \d{2}\.\d{2}\.\d{4}/ }).first().click();
  await expect(page.getByTestId('check-in')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Send booking request' }).click();
  await expect(page.getByRole('heading', { name: 'Request received' })).toBeVisible();

  const state = await mockState(request);
  expect(state.pages).toHaveLength(before + 1);
  const created = state.pages.at(-1)!;
  expect(prop(created, 'Unit')).toBe('Camper');
  expect(prop(created, 'Check-in')).not.toBe(day(30));
});

test('server rejects bad input, bots and floods', async ({ request }) => {
  const valid = { unit: 'strawberry', checkIn: day(40), checkOut: day(42), guests: 2, name: 'Api Guest', phone: '+995577000111', locale: 'ka' };
  const post = (data: object, ip: string) => request.post('/api/bookings', { data, headers: { 'x-forwarded-for': ip } });
  const count = async () => (await mockState(request)).pages.length;
  const start = await count();

  expect((await post({ ...valid, phone: '577000111' }, '10.0.0.1')).status()).toBe(400);
  expect((await post({ ...valid, checkIn: day(-2), checkOut: day(1) }, '10.0.0.1')).status()).toBe(400);
  expect((await post({ ...valid, guests: 9 }, '10.0.0.1')).status()).toBe(400);
  expect((await post({ ...valid, unit: 'penthouse' }, '10.0.0.1')).status()).toBe(400);

  // Honeypot filled: looks successful, creates nothing.
  const bot = await post({ ...valid, website: 'http://spam.example' }, '10.0.0.2');
  expect(bot.status()).toBe(200);
  expect(await count()).toBe(start);

  // Already-booked dates: 409 with alternatives.
  const taken = await post({ ...valid, unit: 'lemon', checkIn: day(5), checkOut: day(7) }, '10.0.0.3');
  expect(taken.status()).toBe(409);
  const { alternatives } = await taken.json();
  expect(alternatives.sameUnit.length).toBeGreaterThan(0);
  expect(alternatives.otherUnits).toContain('strawberry');
  expect(alternatives.otherUnits).not.toContain('lemon');

  // Back-to-back stay on the check-out day is fine.
  expect((await post({ ...valid, unit: 'lemon', checkIn: day(7), checkOut: day(8) }, '10.0.0.3')).status()).toBe(200);

  // Rate limit: the 6th request from one IP within 10 minutes is refused.
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await post({ ...valid, unit: 'penthouse' }, '10.0.0.9')).status());
  expect(statuses).toEqual([400, 400, 400, 400, 400, 429]);
});

test('Telegram confirm / decline updates Notion and replies with a WhatsApp link', async ({ request }) => {
  const webhook = (data: object, secret?: string) =>
    request.post('/api/telegram/booking', {
      data,
      headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {}
    });
  const find = async (guest: string) => (await mockState(request)).pages.find((p) => prop(p, 'Guest') === guest)!;

  const anna = await find('Anna Tester');

  // No secret / wrong secret: rejected, nothing changes.
  expect((await webhook(telegramUpdate(anna.id, 'c'))).status()).toBe(401);
  expect((await webhook(telegramUpdate(anna.id, 'c'), 'wrong')).status()).toBe(401);
  // Right secret but not the owner's chat: ignored.
  expect((await webhook(telegramUpdate(anna.id, 'c', 12345), 'test-webhook-secret')).status()).toBe(200);
  expect(prop(await find('Anna Tester'), 'Status')).toBe('Pending');
  // Updates that are not booking buttons are acknowledged and ignored.
  expect((await webhook({ update_id: 2, message: { text: 'hello' } }, 'test-webhook-secret')).status()).toBe(200);

  // Confirm.
  expect((await webhook(telegramUpdate(anna.id, 'c'), 'test-webhook-secret')).status()).toBe(200);
  expect(prop(await find('Anna Tester'), 'Status')).toBe('Confirmed');
  let calls = (await mockState(request)).telegramCalls;
  const edit = calls.filter((c) => c.method === 'editMessageText').at(-1)!;
  expect(edit.payload.text).toContain('Original request text');
  expect(edit.payload.text).toContain('✅');
  expect(edit.payload.reply_markup).toBeUndefined();
  const reply = calls.filter((c) => c.method === 'sendMessage').at(-1)!;
  expect(reply.payload.text).toContain('https://wa.me/995577123456?text=');
  const confirmText = decodeURIComponent(reply.payload.text.split('?text=')[1]);
  expect(confirmText).toContain('Anna Tester');
  expect(confirmText).toContain('confirmed');
  expect(confirmText).toContain('300 GEL');
  expect(calls.some((c) => c.method === 'answerCallbackQuery')).toBe(true);

  // Pressing again does not flip the status.
  await webhook(telegramUpdate(anna.id, 'd'), 'test-webhook-secret');
  expect(prop(await find('Anna Tester'), 'Status')).toBe('Confirmed');

  // Decline (Russian-speaking guest): status Declined, dates free again, message in Russian.
  const boris = await find('Boris Late');
  const borisIn = prop(boris, 'Check-in');
  await request.patch(`${MOCK}/v1/pages/${boris.id}`, { data: { properties: { Language: { select: { name: 'ru' } } } } });
  expect((await webhook(telegramUpdate(boris.id, 'd'), 'test-webhook-secret')).status()).toBe(200);
  expect(prop(await find('Boris Late'), 'Status')).toBe('Declined');
  calls = (await mockState(request)).telegramCalls;
  const declineReply = calls.filter((c) => c.method === 'sendMessage').at(-1)!;
  expect(declineReply.payload.text).toContain('https://wa.me/79161234567?text=');
  expect(decodeURIComponent(declineReply.payload.text.split('?text=')[1])).toContain('К сожалению');
  const camperBlocked = (await (await request.get(`/api/availability?unit=camper&from=${day(0)}&to=${day(90)}`)).json()).blocked;
  expect(camperBlocked).not.toContain(borisIn);

  // Confirm is refused when the dates got taken elsewhere in the meantime.
  const api = await find('Api Guest'); // lemon, +7 → +8, still pending
  await request.post(`${MOCK}/__seed`, { data: { unit: 'Lemon', checkIn: day(7), checkOut: day(9), status: 'Confirmed', channel: 'Airbnb' } });
  await webhook(telegramUpdate(api.id, 'c'), 'test-webhook-secret');
  expect(prop(await find('Api Guest'), 'Status')).toBe('Pending');
  calls = (await mockState(request)).telegramCalls;
  const conflict = calls.filter((c) => c.method === 'editMessageText').at(-1)!;
  expect(conflict.payload.text).toContain('⚠️');
  expect(conflict.payload.reply_markup.inline_keyboard[0]).toHaveLength(2);
});

test('iCal export is token-protected and contains no guest data', async ({ request }) => {
  expect((await request.get('/api/ical/cottage.ics')).status()).toBe(404);
  expect((await request.get('/api/ical/cottage.ics?t=wrong')).status()).toBe(404);
  expect((await request.get('/api/ical/penthouse.ics?t=test-ical-token')).status()).toBe(404);

  const res = await request.get('/api/ical/cottage.ics?t=test-ical-token');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/calendar');
  const ics = await res.text();
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect(ics).toContain(`DTSTART;VALUE=DATE:${day(14).replace(/-/g, '')}`);
  expect(ics).toContain(`DTEND;VALUE=DATE:${day(16).replace(/-/g, '')}`);
  expect(ics).toContain('SUMMARY:Akutsa — booked');
  expect(ics).not.toContain('Anna');
  expect(ics).not.toContain('577123456');
  // Booking.com's own dates for the cottage are not echoed back.
  expect(ics).not.toContain(day(10).replace(/-/g, ''));
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);

  // A row whose channel is Booking.com is not exported; the confirmed lemon stay is.
  const camper = await (await request.get('/api/ical/camper.ics?t=test-ical-token')).text();
  expect(camper).not.toContain(day(6).replace(/-/g, ''));
  const lemon = await (await request.get('/api/ical/lemon.ics?t=test-ical-token')).text();
  expect(lemon).toContain(`DTSTART;VALUE=DATE:${day(5).replace(/-/g, '')}`);
  expect(lemon).not.toContain('Private Name');
  // Expired pending (30 h) is not exported.
  expect(lemon).not.toContain(`DTSTART;VALUE=DATE:${day(8).replace(/-/g, '')}`);
});

test('AI planner answers availability from real data and only links to /book', async ({ request }) => {
  const res = await request.post('/api/generate-tour', {
    data: { days: 2, people: 2, interests: ['nature'], budget: 'medium', locale: 'en', startDate: day(10), question: 'Is the cottage free?' }
  });
  expect(res.status()).toBe(200);
  const { itinerary, availability } = await res.json();

  // Pre-step: structured availability for the page, with prefilled booking links.
  expect(availability.checkIn).toBe(day(10));
  expect(availability.checkOut).toBe(day(12));
  const cottage = availability.units.find((u: any) => u.unit === 'cottage');
  expect(cottage.available).toBe(false);
  const strawberry = availability.units.find((u: any) => u.unit === 'strawberry');
  expect(strawberry.available).toBe(true);
  expect(strawberry.bookUrl).toBe(`https://www.akutsaresosort.ge/en/book?unit=strawberry&in=${day(10)}&out=${day(12)}`);

  // Tool call: the mock model asked about the cottage on Booking.com-blocked dates.
  const tool = JSON.parse(itinerary.split('TOOL_RESULT:')[1].split('\nSYSTEM_HAS_RULES')[0]);
  expect(tool.available).toBe(false);
  expect(tool.book_url).toContain('/en/book?unit=cottage');
  expect(tool.alternatives.other_units_same_dates.map((u: any) => u.unit)).toContain('strawberry');
  expect(tool.alternatives.same_unit_other_dates[0].book_url).toContain('/en/book?unit=cottage&in=');
  expect(tool.note).toContain('not a reservation');
  expect(itinerary).toContain('SYSTEM_HAS_RULES:true');
  expect(itinerary).toContain('USER_HAS_LIVE_BLOCK:true');

  // The planner never writes to the bookings database.
  const before = (await mockState(request)).pages.length;
  await request.post('/api/generate-tour', { data: { days: 1, people: 1, interests: [], budget: 'low', locale: 'en' } });
  expect((await mockState(request)).pages.length).toBe(before);
});

test('booking page is linked from unit pages, the sitemap and has hreflang', async ({ page, request }) => {
  await page.goto('/en/cottage');
  await page.getByRole('link', { name: 'Book online' }).first().click();
  await expect(page).toHaveURL(/\/en\/book\?unit=cottage$/);
  await expect(page.locator('button[data-unit="cottage"]')).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/en/guesthouse');
  expect(await page.locator('a[href="/en/book?unit=fig"]').count()).toBe(1);

  await page.goto('/ka/book');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('დაჯავშნეთ ადგილი');
  expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(4);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://www.akutsaresosort.ge/ka/book');

  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const l of ['ka', 'en', 'ru']) expect(sitemap).toContain(`<loc>https://www.akutsaresosort.ge/${l}/book</loc>`);
});
