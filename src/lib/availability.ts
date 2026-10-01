import 'server-only';
import { parseIcal } from '@/lib/booking/ical';
import { UNIT_IDS, type UnitId } from '@/lib/booking/units';
import { getActiveBookings, type Booking } from '@/lib/booking/store';
import {
  addDays,
  blockedNights,
  isPendingActive,
  isRangeFree,
  nearestFreeRanges,
  nightsBetween,
  todayInTbilisi,
  type DateStr,
  type Range
} from '@/lib/booking/dates';

// Availability per unit = Notion bookings (Confirmed, or Pending for under 24 h)
// + the unit's Booking.com iCal feed + its Airbnb iCal feed.

export interface AvailabilityOptions {
  // Bypass caches (Notion 60 s, iCal 10 min). Used right before creating/confirming a booking.
  fresh?: boolean;
  // Ignore this booking (when re-checking the booking that is being confirmed).
  excludeBookingId?: string;
  // Count other guests' pending requests as blocking (default true).
  includePending?: boolean;
}

const ICAL_SOURCES = ['BOOKING', 'AIRBNB'] as const;

function icalUrls(unit: UnitId): string[] {
  return ICAL_SOURCES.map((source) => process.env[`ICAL_${unit.toUpperCase()}_${source}`]).filter(
    (url): url is string => Boolean(url)
  );
}

async function fetchIcal(url: string, fresh: boolean): Promise<Range[]> {
  try {
    const res = await fetch(url, {
      ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 600 } }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseIcal(await res.text());
  } catch (err) {
    // A feed that is down must not take the booking page down with it.
    console.error(`iCal feed failed (${new URL(url).host}):`, err instanceof Error ? err.message : err);
    return [];
  }
}

function bookingBlocks(booking: Booking, { excludeBookingId, includePending = true }: AvailabilityOptions): boolean {
  if (booking.id === excludeBookingId) return false;
  if (booking.status === 'Confirmed') return true;
  return booking.status === 'Pending' && includePending && isPendingActive(booking.createdAt);
}

async function getBusyRanges(unit: UnitId, options: AvailabilityOptions = {}): Promise<Range[]> {
  const fresh = options.fresh ?? false;
  const [bookings, ...feeds] = await Promise.all([
    getActiveBookings({ fresh }),
    ...icalUrls(unit).map((url) => fetchIcal(url, fresh))
  ]);
  const own = bookings
    .filter((b) => b.unit === unit && bookingBlocks(b, options))
    .map((b) => ({ start: b.checkIn, end: b.checkOut }));
  return [...own, ...feeds.flat()];
}

// Blocked nights within [from, to). A night's date is the evening the guest sleeps there,
// so a check-out date itself is never in the list.
export async function getBlockedDates(
  unit: UnitId,
  from: DateStr,
  to: DateStr,
  options?: AvailabilityOptions
): Promise<DateStr[]> {
  return blockedNights(await getBusyRanges(unit, options), from, to);
}

export async function isAvailable(
  unit: UnitId,
  checkIn: DateStr,
  checkOut: DateStr,
  options?: AvailabilityOptions
): Promise<boolean> {
  if (checkOut <= checkIn) return false;
  return isRangeFree(await getBusyRanges(unit, options), checkIn, checkOut);
}

export interface Alternatives {
  // Nearest free ranges of the same length in the same unit.
  sameUnit: Range[];
  // Other units that are free for the requested dates.
  otherUnits: UnitId[];
}

export async function suggestAlternatives(
  unit: UnitId,
  checkIn: DateStr,
  nights: number,
  options?: AvailabilityOptions
): Promise<Alternatives> {
  const checkOut = addDays(checkIn, nights);
  const others = UNIT_IDS.filter((id) => id !== unit);
  const [busy, ...otherBusy] = await Promise.all([
    getBusyRanges(unit, options),
    ...others.map((id) => getBusyRanges(id, options))
  ]);
  return {
    sameUnit: nearestFreeRanges(busy, checkIn, nights, todayInTbilisi()),
    otherUnits: others.filter((_, i) => isRangeFree(otherBusy[i], checkIn, checkOut))
  };
}

export { nightsBetween };
