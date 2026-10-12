import { NextResponse } from 'next/server';
import { z } from 'zod';
import { WHATSAPP_URL } from '@/lib/constants';
import { isDateStr, todayInTbilisi } from '@/lib/booking/dates';
import { OWNER_CHAT_ID, telegram, tourKeyboard } from '@/lib/booking/telegram';
import { getTourCatalog } from '@/lib/tours/catalog';
import { createTourRequest } from '@/lib/tours/requests';
import { tripProblems, tripTotal } from '@/lib/tours/schedule';
import { guestTourRequestMessage, itineraryLines, ownerTourRequestMessage } from '@/lib/tours/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
        date: z.string().refine(isDateStr),
        slot: z.string().regex(/^(\d{2}:\d{2}|morning|afternoon)$/).optional()
      })
    )
    .min(1)
    .max(20),
  people: z.number().int().min(1).max(50),
  staying: z.boolean(),
  transfer: z.boolean(),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .transform((v) => v.replace(/[\s().-]/g, ''))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
  email: z.union([z.literal(''), z.email().max(120)]).optional(),
  notes: z.string().trim().max(1000).optional(),
  locale: z.enum(['ka', 'en', 'ru']),
  website: z.string().max(200).optional() // honeypot
});

// Best-effort limiter (per server instance): 5 requests per 10 minutes per IP.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  const limited = recent.length >= 5;
  if (!limited) recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return limited;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] },
      { status: 400 }
    );
  }
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });

  try {
    const catalog = await getTourCatalog();
    const today = todayInTbilisi();
    const problems = [
      ...tripProblems(input.items, catalog, input.people),
      ...input.items.filter((i) => i.date < today).map((i) => `past:${i.slug}`)
    ];
    if (problems.length) return NextResponse.json({ error: 'invalid_trip', problems }, { status: 400 });

    const total = tripTotal(input.items, catalog, input.people, input.staying);
    const dates = input.items.map((i) => i.date).sort();
    const summaryFor = (lang: 'ka' | 'en' | 'ru') => ({
      lines: itineraryLines(input.items, catalog, lang),
      people: input.people,
      total,
      staying: input.staying,
      transfer: input.transfer
    });
    const guestSummary = summaryFor(input.locale);

    const requestId = await createTourRequest({
      guest: input.name,
      itinerary: guestSummary.lines.join('\n'),
      tourNamesEn: input.items.map((i) => catalog.get(i.slug)!.nameEn),
      firstDate: dates[0],
      lastDate: dates.at(-1)!,
      people: input.people,
      phone: input.phone,
      email: input.email || undefined,
      language: input.locale,
      staying: input.staying,
      transfer: input.transfer,
      estimatedTotal: total,
      notes: input.notes || undefined
    });

    // The request is in Notion even if Telegram is down.
    await telegram('sendMessage', {
      chat_id: OWNER_CHAT_ID,
      text: ownerTourRequestMessage(
        { name: input.name, phone: input.phone, email: input.email || undefined, language: input.locale, notes: input.notes || undefined },
        summaryFor('ka')
      ),
      reply_markup: tourKeyboard(requestId)
    });

    return NextResponse.json({
      ok: true,
      total,
      whatsappUrl: `${WHATSAPP_URL}?text=${encodeURIComponent(guestTourRequestMessage(input.name, guestSummary, input.locale))}`
    });
  } catch (err) {
    console.error('Tour request failed:', err);
    return NextResponse.json({ error: 'server' }, { status: 502 });
  }
}
