import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAvailable, suggestAlternatives } from '@/lib/availability';
import { createPendingBooking } from '@/lib/booking/store';
import { BOOKING_POLICY, UNIT_IDS, UNITS } from '@/lib/booking/units';
import { isDateStr, nightsBetween, todayInTbilisi } from '@/lib/booking/dates';
import { estimateTotal, guestRequestMessage, ownerRequestMessage } from '@/lib/booking/messages';
import { OWNER_CHAT_ID, bookingKeyboard, telegram } from '@/lib/booking/telegram';
import { WHATSAPP_URL } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const dateStr = z.string().refine(isDateStr);

const schema = z.object({
  unit: z.enum(UNIT_IDS),
  checkIn: dateStr,
  checkOut: dateStr,
  guests: z.number().int().min(1).max(20),
  name: z.string().trim().min(2).max(80),
  // International format with country code, e.g. +995577225289.
  phone: z
    .string()
    .transform((v) => v.replace(/[\s().-]/g, ''))
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/)),
  email: z.union([z.literal(''), z.email().max(120)]).optional(),
  notes: z.string().trim().max(1000).optional(),
  locale: z.enum(['ka', 'en', 'ru']),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(200).optional()
});

// Best-effort limiter (per server instance): 5 requests per 10 minutes per IP.
const WINDOW_MS = 10 * 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid', fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Bots fill the hidden field: answer "ok" without creating anything.
  if (input.website) return NextResponse.json({ ok: true });

  const unit = UNITS[input.unit];
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (
    input.checkIn < todayInTbilisi() ||
    nights < 1 ||
    nights > BOOKING_POLICY.maxNights ||
    input.guests > unit.maxGuests
  ) {
    return NextResponse.json({ error: 'invalid', fields: ['dates'] }, { status: 400 });
  }

  try {
    // Re-check against Notion and freshly fetched Booking.com / Airbnb calendars.
    if (!(await isAvailable(input.unit, input.checkIn, input.checkOut, { fresh: true }))) {
      const alternatives = await suggestAlternatives(input.unit, input.checkIn, nights);
      return NextResponse.json({ error: 'unavailable', alternatives }, { status: 409 });
    }

    const total = estimateTotal(input.unit, input.checkIn, input.checkOut);
    const summary = { ...input, total, email: input.email || undefined, notes: input.notes || undefined };

    const bookingId = await createPendingBooking({
      unit: input.unit,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      name: input.name,
      phone: input.phone,
      email: summary.email,
      notes: summary.notes,
      language: input.locale,
      estimatedPrice: total
    });

    // The request is saved in Notion even if Telegram is down, so don't fail the guest.
    await telegram('sendMessage', {
      chat_id: OWNER_CHAT_ID,
      text: ownerRequestMessage({ ...summary, language: input.locale }),
      reply_markup: bookingKeyboard(bookingId)
    });

    return NextResponse.json({
      ok: true,
      nights,
      total,
      whatsappUrl: `${WHATSAPP_URL}?text=${encodeURIComponent(guestRequestMessage(summary, input.locale))}`
    });
  } catch (err) {
    console.error('Booking request failed:', err);
    return NextResponse.json({ error: 'server' }, { status: 502 });
  }
}
