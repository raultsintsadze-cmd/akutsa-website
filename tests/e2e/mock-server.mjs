// Mock of the external services used by the booking system, for the Playwright tests:
// Notion API, Booking.com / Airbnb iCal feeds, Telegram Bot API and OpenAI chat completions.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT ?? 4010);

const day = (offset) => new Date(Date.now() + 4 * 3_600_000 + offset * 86_400_000).toISOString().slice(0, 10);
const compact = (d) => d.replace(/-/g, '');

let pages = [];
let telegramCalls = [];

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
}
seed();

// Notion request properties -> response-shaped properties.
function toResponseProps(props) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    if ('title' in value) out[key] = { type: 'title', title: value.title.map((t) => ({ type: 'text', plain_text: t.text.content, text: t.text })) };
    else if ('rich_text' in value) out[key] = { type: 'rich_text', rich_text: value.rich_text.map((t) => ({ type: 'text', plain_text: t.text.content, text: t.text })) };
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
  if (path === '/__state') return json(res, 200, { pages, telegramCalls });
  if (path === '/__seed') { const p = page(body); pages.push(p); return json(res, 200, p); }

  // iCal feeds
  const feed = path.match(/^\/ical\/(.+)$/)?.[1];
  if (feed && FEEDS[feed]) {
    res.writeHead(200, { 'Content-Type': 'text/calendar' });
    return res.end(FEEDS[feed]());
  }

  // Notion
  if (req.method === 'GET' && /^\/v1\/databases\//.test(path)) {
    return json(res, 200, { object: 'database', id: 'db-bookings', data_sources: [{ id: 'ds-bookings', name: 'Akutsa Bookings' }] });
  }
  if (req.method === 'POST' && /^\/v1\/data_sources\/[^/]+\/query$/.test(path)) {
    const results = pages.filter((p) => ['Pending', 'Confirmed'].includes(p.properties.Status.select.name));
    return json(res, 200, { object: 'list', results, has_more: false, next_cursor: null });
  }
  if (req.method === 'POST' && path === '/v1/pages') {
    const now = new Date().toISOString();
    const created = { object: 'page', id: randomUUID(), created_time: now, last_edited_time: now, parent: body.parent, properties: toResponseProps(body.properties) };
    pages.push(created);
    return json(res, 200, created);
  }
  const pageId = path.match(/^\/v1\/pages\/([0-9a-f-]+)$/)?.[1];
  if (pageId) {
    const found = pages.find((p) => p.id.replace(/-/g, '') === pageId.replace(/-/g, ''));
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
