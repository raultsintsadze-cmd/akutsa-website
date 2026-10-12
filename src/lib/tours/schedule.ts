// Pure itinerary rules: full-day exclusivity, short-activity sequencing, seasons, people limits
// and pricing. Shared by the builder UI, the request API and the AI planner.
import { addDays, type DateStr } from '@/lib/booking/dates';
import { MONTHS, type Tour } from '@/lib/tours/types';

export const DAY_START = 9 * 60; // 09:00
export const DAY_END = 20 * 60; // 20:00
export const BUFFER_MIN = 30;
export const DEFAULT_DURATION_HOURS = 2;
export const MORNING = 9 * 60;
export const AFTERNOON = 14 * 60;

// Preferred start: an "HH:MM" from the tour's start times, or morning/afternoon when the
// tour has none (time agreed with the host), or empty = as early as possible.
export type Slot = string;

export interface TripItem {
  slug: string;
  date: DateStr;
  slot?: Slot;
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export function durationMinutes(tour: Tour): { minutes: number; approx: boolean } {
  return tour.durationHours && tour.durationHours > 0
    ? { minutes: Math.round(tour.durationHours * 60), approx: false }
    : { minutes: DEFAULT_DURATION_HOURS * 60, approx: true };
}

export function isInSeason(tour: Tour, date: DateStr): boolean {
  if (tour.seasonMonths.length === 0) return true;
  return tour.seasonMonths.includes(MONTHS[Number(date.slice(5, 7)) - 1]);
}

const isFullDay = (tour: Tour) => tour.dayType === 'Full day';

export type AddBlock =
  | { reason: 'fullDayTaken'; blocker: string; nextFreeDate: DateStr }
  | { reason: 'dayNotEmpty'; nextFreeDate: DateStr }
  | { reason: 'outOfSeason' }
  | { reason: 'duplicate' };

// Can `tour` be added on `date`? A full-day tour needs an empty date, and nothing can join
// a date that already has a full-day tour. Suggests the next date where it would fit.
export function checkAdd(
  items: TripItem[],
  tour: Tour,
  date: DateStr,
  catalog: ReadonlyMap<string, Tour>
): AddBlock | null {
  if (items.some((i) => i.slug === tour.slug && i.date === date)) return { reason: 'duplicate' };
  if (!isInSeason(tour, date)) return { reason: 'outOfSeason' };
  const onDate = (d: DateStr) => items.filter((i) => i.date === d);
  const fits = (d: DateStr) => {
    const day = onDate(d);
    if (isFullDay(tour)) return day.length === 0;
    return !day.some((i) => {
      const t = catalog.get(i.slug);
      return t ? isFullDay(t) : false;
    });
  };
  if (fits(date)) return null;
  let next = addDays(date, 1);
  for (let i = 0; i < 366 && (!fits(next) || !isInSeason(tour, next)); i++) next = addDays(next, 1);
  const fullDay = onDate(date).find((i) => {
    const t = catalog.get(i.slug);
    return t ? isFullDay(t) : false;
  });
  return fullDay
    ? { reason: 'fullDayTaken', blocker: fullDay.slug, nextFreeDate: next }
    : { reason: 'dayNotEmpty', nextFreeDate: next };
}

export interface ScheduledItem {
  slug: string;
  start: string; // HH:MM
  end: string;
  approx: boolean; // duration unknown, assumed 2 h
  fullDay: boolean;
  shifted: boolean; // pushed later than the guest's preferred start
}

export interface DayPlan {
  date: DateStr;
  items: ScheduledItem[];
  overflow: boolean; // ends after 20:00
  conflict: boolean; // a full-day tour shares the date with something else
}

function preferredStart(slot: Slot | undefined): number | null {
  if (!slot) return null;
  if (slot === 'morning') return MORNING;
  if (slot === 'afternoon') return AFTERNOON;
  return /^\d{2}:\d{2}$/.test(slot) ? toMinutes(slot) : null;
}

// Day-by-day timeline. Short activities run one after another with a 30-minute buffer,
// in order of preferred start (items without one keep their added order).
export function buildSchedule(items: TripItem[], catalog: ReadonlyMap<string, Tour>): DayPlan[] {
  const dates = [...new Set(items.map((i) => i.date))].sort();
  return dates.map((date) => {
    const day = items
      .map((item, index) => ({ item, index, tour: catalog.get(item.slug) }))
      .filter((x): x is { item: TripItem; index: number; tour: Tour } => x.item.date === date && !!x.tour);
    const full = day.filter((x) => isFullDay(x.tour));
    if (full.length > 0) {
      return {
        date,
        items: day.map(({ tour }) => ({
          slug: tour.slug,
          start: fromMinutes(DAY_START),
          end: fromMinutes(DAY_END),
          approx: false,
          fullDay: isFullDay(tour),
          shifted: false
        })),
        overflow: false,
        conflict: day.length > 1
      };
    }
    // No preference = as early as possible (09:00); ties keep the order they were added.
    const ordered = [...day].sort(
      (a, b) =>
        (preferredStart(a.item.slot) ?? DAY_START) - (preferredStart(b.item.slot) ?? DAY_START) ||
        a.index - b.index
    );
    let cursor = DAY_START;
    const scheduled: ScheduledItem[] = [];
    for (const { item, tour } of ordered) {
      const wanted = preferredStart(item.slot);
      const start = Math.max(cursor, wanted ?? DAY_START);
      const { minutes, approx } = durationMinutes(tour);
      scheduled.push({
        slug: tour.slug,
        start: fromMinutes(start),
        end: fromMinutes(start + minutes),
        approx,
        fullDay: false,
        shifted: wanted !== null && start > wanted
      });
      cursor = start + minutes + BUFFER_MIN;
    }
    const last = scheduled.at(-1);
    return { date, items: scheduled, overflow: last ? toMinutes(last.end) > DAY_END : false, conflict: false };
  });
}

export function peopleProblem(tour: Tour, people: number): 'tooFew' | 'tooMany' | null {
  if (tour.priceType !== 'per person') return null;
  if (tour.minPeople && people < tour.minPeople) return 'tooFew';
  if (tour.maxPeople && people > tour.maxPeople) return 'tooMany';
  return null;
}

export interface ItemPrice {
  // null = price on request
  total: number | null;
  unitPrice: number | null;
  // per group: how many cars/quads; per person: people
  units: number;
  overnightRate: boolean;
}

export function priceFor(tour: Tour, people: number, staying: boolean): ItemPrice {
  const overnightRate = staying && tour.overnightPrice !== null;
  const unitPrice = overnightRate ? tour.overnightPrice : tour.price;
  if (tour.priceType === 'on request' || unitPrice === null) {
    return { total: null, unitPrice: null, units: 0, overnightRate: false };
  }
  const units = tour.priceType === 'per group' ? Math.ceil(people / (tour.maxPeople || people || 1)) : people;
  return { total: unitPrice * units, unitPrice, units, overnightRate };
}

// Sum of all items, or null when any item's price is on request.
export function tripTotal(items: TripItem[], catalog: ReadonlyMap<string, Tour>, people: number, staying: boolean): number | null {
  let sum = 0;
  for (const item of items) {
    const tour = catalog.get(item.slug);
    if (!tour) continue;
    const { total } = priceFor(tour, people, staying);
    if (total === null) return null;
    sum += total;
  }
  return sum;
}

// Problems that stop a request from being sent (re-checked by the server).
export function tripProblems(items: TripItem[], catalog: ReadonlyMap<string, Tour>, people: number): string[] {
  const problems: string[] = [];
  if (items.length === 0) problems.push('empty');
  for (const item of items) {
    const tour = catalog.get(item.slug);
    if (!tour) problems.push(`unknown:${item.slug}`);
    else {
      if (!isInSeason(tour, item.date)) problems.push(`season:${item.slug}`);
      const p = peopleProblem(tour, people);
      if (p) problems.push(`${p}:${item.slug}`);
    }
  }
  for (const day of buildSchedule(items, catalog)) if (day.conflict) problems.push(`fullDay:${day.date}`);
  return problems;
}

// URL form: ?trip=fishing@2026-10-15,quad-bike@2026-10-16@10:00&people=2&stay=1&transfer=1
export function encodeTrip(items: TripItem[]): string {
  return items.map((i) => [i.slug, i.date, i.slot].filter(Boolean).join('@')).join(',');
}
export function decodeTrip(value: string | null | undefined): TripItem[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => {
      const [slug, date, slot] = part.split('@');
      return { slug, date, ...(slot ? { slot } : {}) };
    })
    .filter((i) => /^[a-z0-9-]{1,60}$/.test(i.slug) && /^\d{4}-\d{2}-\d{2}$/.test(i.date ?? ''))
    .slice(0, 20);
}
