// Pure date logic for bookings. Dates are plain 'YYYY-MM-DD' strings (property-local days),
// so string comparison is date comparison and no time zone maths is involved.

export type DateStr = string;

// A stay occupies the nights [start, end): `end` is the check-out day and stays free,
// so one guest can leave and another arrive on the same day.
export interface Range {
  start: DateStr;
  end: DateStr;
}

export const PENDING_HOLD_HOURS = 24;

export function isDateStr(value: unknown): value is DateStr {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(date: DateStr, days: number): DateStr {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: DateStr, checkOut: DateStr): number {
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000
  );
}

export function rangesOverlap(a: Range, b: Range): boolean {
  return a.start < b.end && b.start < a.end;
}

export function isRangeFree(busy: Range[], checkIn: DateStr, checkOut: DateStr): boolean {
  const wanted = { start: checkIn, end: checkOut };
  return !busy.some((range) => rangesOverlap(range, wanted));
}

// Every blocked night within [from, to), sorted and de-duplicated.
export function blockedNights(busy: Range[], from: DateStr, to: DateStr): DateStr[] {
  const nights = new Set<DateStr>();
  for (const range of busy) {
    let day = range.start < from ? from : range.start;
    const end = range.end > to ? to : range.end;
    while (day < end) {
      nights.add(day);
      day = addDays(day, 1);
    }
  }
  return [...nights].sort();
}

// A pending website request holds its dates for 24 hours, then stops blocking them.
export function isPendingActive(createdIso: string, now: Date = new Date()): boolean {
  const created = Date.parse(createdIso);
  if (Number.isNaN(created)) return false;
  return now.getTime() - created < PENDING_HOLD_HOURS * 3_600_000;
}

type DayParts = { year: number; month: number; day: number };

const partsToStr = (p: DayParts): DateStr =>
  `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;

// iCal VEVENT -> blocked range. DTEND is exclusive (the check-out day is free); an event
// with no DTEND, or a DTEND on/before DTSTART, blocks the single start night.
export function icalEventRange(start: DayParts, end?: DayParts | null): Range {
  const s = partsToStr(start);
  const e = end ? partsToStr(end) : null;
  return { start: s, end: e && e > s ? e : addDays(s, 1) };
}

// Today's date at the property (Asia/Tbilisi, UTC+4, no daylight saving).
export function todayInTbilisi(now: Date = new Date()): DateStr {
  return new Date(now.getTime() + 4 * 3_600_000).toISOString().slice(0, 10);
}

// Nearest free ranges of `nights` nights around `checkIn`, closest first, never in the past.
export function nearestFreeRanges(
  busy: Range[],
  checkIn: DateStr,
  nights: number,
  today: DateStr,
  { limit = 3, searchDays = 45 }: { limit?: number; searchDays?: number } = {}
): Range[] {
  const found: Range[] = [];
  for (let offset = 1; offset <= searchDays && found.length < limit; offset++) {
    for (const delta of [-offset, offset]) {
      const start = addDays(checkIn, delta);
      if (start < today) continue;
      const end = addDays(start, nights);
      if (isRangeFree(busy, start, end)) found.push({ start, end });
      if (found.length >= limit) break;
    }
  }
  return found;
}
