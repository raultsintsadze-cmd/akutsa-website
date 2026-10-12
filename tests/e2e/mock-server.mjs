// Mock of the external services used by the booking system, for the Playwright tests:
// Notion API, Booking.com / Airbnb iCal feeds, Telegram Bot API and OpenAI chat completions.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const day = (offset) => new Date(Date.now() + 4 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);
const compact = (d) => d.replace(/-/g, '');

let pages = [];
let telegramCalls = [];
let tourRequests = [];

// "Akutsa Tours" catalog as it is in Notion today (no photos, start times or seasons yet).
const TOURS_DB = 'db1ef0a6fde840059c84b9da81a5c078';
const REQUESTS_DB = '04c3db80048f4467a581aacfc07732b9';
const rt = (s) => ({ type: 'rich_text', rich_text: s ? [{ type: 'text', plain_text: s, text: { content: s } }] : [] });
const tourPage = (slug, ka, en, ru, dayType, price, priceType, duration, max, sort) => ({
  object: 'page',
  id: randomUUID(),
  created_time: '2026-10-01T00:00:00.000Z',
  last_edited_time: '2026-10-01T00:00:00.000Z',
  cover: null,
  parent: { type: 'data_source_id', data_source_id: 'ds-tours', database_id: TOURS_DB },
  properties: {
    'Name KA': { type: 'title', title: [{ type: 'text', plain_text: ka, text: { content: ka } }] },
    'Name EN': rt(en),
    'Name RU': rt(ru),
    Slug: rt(slug),
    'Short description KA': rt(ka),
    'Short description EN': rt(`${en} near Akutsa.`),
    'Short description RU': rt(ru),
    Active: { type: 'checkbox', checkbox: true },
    'Price GEL': { type: 'number', number: price },
    'Price type': { type: 'select', select: { name: priceType } },
    'Overnight guest price GEL': { type: 'number', number: null },
    'Duration hours': { type: 'number', number: duration },
    'Start times': rt(''),
    'Min people': { type: 'number', number: null },
    'Max people': { type: 'number', number: max },
    'Season months': { type: 'multi_select', multi_select: [] },
    'Day type': { type: 'select', select: { name: dayType } },
    Operator: { type: 'select', select: null },
    'Distance from Akutsa km': { type: 'number', number: null },
    Includes: rt(''),
    Photo: { type: 'files', files: [] },
    'Sort order': { type: 'number', number: sort }
  }
});
const TOUR_PAGES = [
  tourPage('fishing', 'თევზაობა', 'Fishing', 'Рыбалка', 'Full day', 250, 'per person', null, null, 1),
  tourPage('mushroom-picking', 'სოკოს კრეფა', 'Mushroom picking', 'Сбор грибов', 'Full day', 250, 'per person', null, null, 2),
  tourPage('wine-cellar', 'მარანი და ღვინის დეგუსტაცია', 'Wine cellar & tasting', 'Винный погреб и дегустация', 'Full day', 250, 'per person', null, null, 3),
  tourPage('honey-bees', 'თაფლი და ფუტკარი', 'Honey & bees', 'Мёд и пчёлы', 'Full day', 250, 'per person', null, null, 4),
  tourPage('off-road-4x4', 'ოფროუდი 4x4', 'Off-road 4x4', 'Офф-роуд 4x4', 'Short activity', 300, 'per group', 1, 7, 5),
  tourPage('quad-bike', 'კვადროციკლი', 'Quad bike', 'Квадроциклы', 'Short activity', 150, 'per group', 1, 2, 6),
  tourPage('zipline', 'ზიპლაინი', 'Zipline', 'Зиплайн', 'Short activity', 80, 'per person', null, null, 7),
  tourPage('rafting', 'რაფტინგი', 'Rafting', 'Рафтинг', 'Short activity', 90, 'per person', 1, null, 8),
  tourPage('horse-riding', 'ცხენებით სეირნობა', 'Horse riding', 'Конные прогулки', 'Short activity', 100, 'per person', 0.5, null, 9)
];

function page({ unit, checkIn, checkOut, status, channel = 'Website', guest = 'Seed Guest', phone = '+995500000000', createdHoursAgo = 0, language = 'en', price = 0, guests = 2 }) {
  const created = new Date(Date.now() - createdHoursAgo * 3_600_000).toISOString();
  return {
    object: 'page',
    id: randomUUID(),
    created_time: created,
    last_edited_time: created,
    parent: { type: 'data_source_id', data_source_id: 'ds-bookings', database_id: 'db-bookings' },
    properties: {
      Guest: { id: 'title', type: 'title', title: [{ type: 'text', plain_text: guest, text: { content: guest } }] },
      Unit: { type: 'select', select: { name: unit } },
      'Check-in': { type: 'date', date: { start: checkIn } },
      'Check-out': { type: 'date', date: { start: checkOut } },
      Guests: { type: 'number', number: guests },
      Phone: { type: 'phone_number', phone_number: phone },
      Email: { type: 'email', email: null },
      Channel: { type: 'select', select: { name: channel } },
      Status: { type: 'select', select: { name: status } },
      Language: { type: 'select', select: { name: language } },
      'Estimated price GEL': { type: 'number', number: price },
      Notes: { type: 'rich_text', rich_text: [] }
    }
  };
}

function seed() {
  pages = [
    // Confirmed: blocks the nights of +5 and +6; +7 (check-out day) stays free.
    page({ unit: 'Lemon', checkIn: day(5), checkOut: day(7), status: 'Confirmed', guest: 'Private Name' }),
    // Pending for 30 hours: expired, must not block.
    page({ unit: 'Lemon', checkIn: day(8), checkOut: day(9), status: 'Pending', createdHoursAgo: 30 }),
    // Fresh pending: blocks.
    page({ unit: 'Fig', checkIn: day(3), checkOut: day(4), status: 'Pending', createdHoursAgo: 1 }),
    // Row imported from an OTA: blocks on the site but is not exported back.
    page({ unit: 'Camper', checkIn: day(6), checkOut: day(8), status: 'Confirmed', channel: 'Booking.com' })
  ];
  telegramCalls = [];
  tourRequests = [];
}
seed();

// Notion request properties -> response-shaped properties.
function toResponseProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if ('title' in value) out[key] = { type: 'title', title: value.title.map((t) => ({ type: 'text', plain_text: t.text.content, text: t.text })) };
    else if ('rich_text' in value) out[key] = { type: 'rich_text', rich_text: value.rich_text.map((t) => ({ type: 'text', plain_text: t.text.content, text: t.text })) };
    else if ('multi_select' in value) out[key] = { type: 'multi_select', multi_select: value.multi_select };
    else if ('checkbox' in value) out[key] = { type: 'checkbox', checkbox: value.checkbox };
    else if ('select' in value) out[key] = { type: 'select', select: value.select };
    else if ('date' in value) out[key] = { type: 'date', date: value.date };
    else if ('number' in value) out[key] = { type: 'number', number: value.number };
    else if ('phone_number' in value) out[key] = { type: 'phone_number', phone_number: value.phone_number };
    else if ('email' in value) out[key] = { type: 'email', email: value.email };
  }
  return out;
}

const ical = (events) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mock OTA//EN',
    ...events.flatMap(([start, end], i) => ['BEGIN:VEVENT', `UID:mock-${i}@ota`, `DTSTART;VALUE=DATE:${compact(start)}`, `DTEND;VALUE=DATE:${compact(end)}`, 'SUMMARY:CLOSED - Not available', 'END:VEVENT']),
    'END:VCALENDAR'].join('\r\n');

const FEEDS = {
  // Booking.com: cottage taken on the nights of +10 and +11.
  'cottage-booking.ics': () => ical([[day(10), day(12)]]),
  // Airbnb: cottage taken on the night of +20.
  'cottage-airbnb.ics': () => ical([[day(20), day(21)]])
};

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};

  // Test control
  if (path === '/__health') return json(res, 200, { ok: true });
  if (path === '/__reset') { seed(); return json(res, 200, { ok: true }); }
  if (path === '/__state') return json(res, 200, { pages, telegramCalls, tourRequests });
  if (path === '/__seed') { const p = page(body); pages.push(p); return json(res, 200, p); }

  // iCal feeds
  const feed = path.match(/^\/ical\/(.+)$/)?.[1];
  if (feed && FEEDS[feed]) {
    res.writeHead(200, { 'Content-Type': 'text/calendar' });
    return res.end(FEEDS[feed]());
  }

  // Notion
  if (req.method === 'GET' && /^\/v1\/databases\//.test(path)) {
    const id = path.split('/').pop().replace(/-/g, '');
    if (id === TOURS_DB) return json(res, 200, { object: 'database', id: TOURS_DB, data_sources: [{ id: 'ds-tours', name: 'Akutsa Tours' }] });
    if (id === REQUESTS_DB) return json(res, 200, { object: 'database', id: REQUESTS_DB, data_sources: [{ id: 'ds-requests', name: 'Akutsa Tour Requests' }] });
    return json(res, 200, { object: 'database', id: 'db-bookings', data_sources: [{ id: 'ds-bookings', name: 'Akutsa Bookings' }] });
  }
  if (req.method === 'POST' && path === '/v1/data_sources/ds-tours/query') {
    return json(res, 200, { object: 'list', results: TOUR_PAGES, has_more: false, next_cursor: null });
  }
  if (req.method === 'POST' && /^\/v1\/data_sources\/[^/]+\/query$/.test(path)) {
    const results = pages.filter((p) => ['Pending', 'Confirmed'].includes(p.properties.Status.select.name));
    return json(res, 200, { object: 'list', results, has_more: false, next_cursor: null });
  }
  if (req.method === 'POST' && path === '/v1/pages') {
    const now = new Date().toISOString();
    const isRequest = body.parent?.data_source_id === 'ds-requests';
    const parent = { ...body.parent, database_id: isRequest ? REQUESTS_DB : 'db-bookings' };
    const created = { object: 'page', id: randomUUID(), created_time: now, last_edited_time: now, parent, properties: toResponseProps(body.properties) };
    (isRequest ? tourRequests : pages).push(created);
    return json(res, 200, created);
  }
  const pageId = path.match(/^\/v1\/pages\/([0-9a-f-]+)$/)?.[1];
  if (pageId) {
    const found = [...pages, ...tourRequests, ...TOUR_PAGES].find((p) => p.id.replace(/-/g, '') === pageId.replace(/-/g, ''));
    if (!found) return json(res, 404, { object: 'error', status: 404, code: 'object_not_found', message: 'Not found' });
    if (req.method === 'PATCH') Object.assign(found.properties, toResponseProps(body.properties ?? {}));
    return json(res, 200, found);
  }

  // Telegram
  const tg = path.match(/^\/bot[^/]+\/(\w+)$/)?.[1];
  if (tg) {
    telegramCalls.push({ method: tg, payload: body });
    return json(res, 200, { ok: true, result: { message_id: telegramCalls.length } });
  }

  // OpenAI: first round asks for the availability tool, second round echoes its result.
  if (path === '/openai/chat/completions') {
    const toolMessage = [...body.messages].reverse().find((m) => m.role === 'tool');
    const userText = body.messages.find((m) => m.role === 'user')?.content ?? '';
    if (!toolMessage && userText.includes('TOURS_TEST')) {
      // Deliberately breaks the full-day rule: fishing and rafting on the same day.
      const items = [{ slug: 'fishing', date: day(12) }, { slug: 'rafting', date: day(12) }, { slug: 'quad-bike', date: day(13), time: 'morning' }];
      return json(res, 200, {
        choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_t', type: 'function', function: { name: 'plan_tours_link', arguments: JSON.stringify({ items, people: 4 }) } }] } }]
      });
    }
    if (!toolMessage) {
      return json(res, 200, {
        choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'check_availability', arguments: JSON.stringify({ unit: 'cottage', check_in: day(10), check_out: day(12) }) } }] } }]
      });
    }
    const system = body.messages.find((m) => m.role === 'system')?.content ?? '';
    const user = body.messages.find((m) => m.role === 'user')?.content ?? '';
    return json(res, 200, {
      choices: [{ message: { role: 'assistant', content: `TOOL_RESULT:${toolMessage.content}\nSYSTEM_HAS_RULES:${system.includes('You cannot make, hold or confirm a booking')}\nUSER_HAS_LIVE_BLOCK:${user.includes('LIVE AVAILABILITY')}` } }]
    });
  }

  json(res, 404, { error: `mock: no route for ${req.method} ${path}` });
});

server.listen(PORT, '127.0.0.1', () => console.log(`mock services on http://127.0.0.1:${PORT}`));
