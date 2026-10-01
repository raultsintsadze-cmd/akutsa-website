import { NextResponse } from 'next/server';
import { getBlockedDates } from '@/lib/availability';
import { isUnitId, BOOKING_POLICY } from '@/lib/booking/units';
import { addDays, isDateStr, nightsBetween, todayInTbilisi } from '@/lib/booking/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/availability?unit=cottage&from=2026-10-01&to=2026-12-01
// -> { blocked: ["2026-10-15", ...] }  (nights that cannot be booked; `to` is exclusive)
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const unit = params.get('unit');
  const from = params.get('from') ?? todayInTbilisi();
  const to = params.get('to') ?? addDays(from, BOOKING_POLICY.horizonDays);

  if (!isUnitId(unit) || !isDateStr(from) || !isDateStr(to) || to <= from || nightsBetween(from, to) > 400) {
    return NextResponse.json({ error: 'Invalid unit or date range.' }, { status: 400 });
  }

  try {
    const blocked = await getBlockedDates(unit, from, to);
    return NextResponse.json({ unit, from, to, blocked }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Availability lookup failed:', err);
    return NextResponse.json({ error: 'Availability is temporarily unavailable.' }, { status: 502 });
  }
}
