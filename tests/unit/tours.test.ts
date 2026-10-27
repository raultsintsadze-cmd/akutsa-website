import { describe, expect, it } from 'vitest';
import {
  buildSchedule,
  checkAdd,
  decodeTrip,
  encodeTrip,
  isInSeason,
  peopleProblem,
  priceFor,
  tripProblems,
  tripTotal,
  type TripItem
} from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';

function tour(p: Partial<Tour> & Pick<Tour, 'slug' | 'dayType'>): Tour {
  return {
    id: p.slug,
    name: { ka: p.slug, en: p.slug, ru: p.slug },
    description: { ka: '', en: '', ru: '' },
    nameEn: p.slug,
    price: null,
    priceType: 'per person',
    overnightPrice: null,
    durationHours: null,
    startTimes: [],
    minPeople: null,
    maxPeople: null,
    seasonMonths: [],
    operator: null,
    distanceKm: null,
    includes: '',
    image: null,
    gallery: [],
    video: null,
    sortOrder: 0,
    ...p
  };
}

// Mirrors the live "Akutsa Tours" catalog.
const fishing = tour({ slug: 'fishing', dayType: 'Full day', price: 250 });
const wine = tour({ slug: 'wine-cellar', dayType: 'Full day', price: 250 });
const offroad = tour({ slug: 'off-road-4x4', dayType: 'Short activity', price: 300, priceType: 'per group', maxPeople: 7, durationHours: 1 });
const quad = tour({ slug: 'quad-bike', dayType: 'Short activity', price: 150, priceType: 'per group', maxPeople: 2, durationHours: 1 });
const zipline = tour({ slug: 'zipline', dayType: 'Short activity', price: 80 });
const rafting = tour({ slug: 'rafting', dayType: 'Short activity', price: 90, durationHours: 1 });
const horse = tour({ slug: 'horse-riding', dayType: 'Short activity', price: 100, durationHours: 0.5 });
const catalog = new Map([fishing, wine, offroad, quad, zipline, rafting, horse].map((t) => [t.slug, t]));

const D1 = '2026-10-15';
const D2 = '2026-10-16';

describe('full-day exclusivity', () => {
  const trip: TripItem[] = [{ slug: 'fishing', date: D1 }];

  it('blocks a short activity on a full-day date and suggests the next day', () => {
    expect(checkAdd(trip, rafting, D1, catalog)).toEqual({ reason: 'fullDayTaken', blocker: 'fishing', nextFreeDate: D2 });
  });

  it('blocks a second full-day tour on the same date', () => {
    expect(checkAdd(trip, wine, D1, catalog)).toMatchObject({ reason: 'fullDayTaken', nextFreeDate: D2 });
  });

  it('blocks a full-day tour on a date that already has short activities', () => {
    expect(checkAdd([{ slug: 'quad-bike', date: D2 }], wine, D2, catalog)).toEqual({ reason: 'dayNotEmpty', nextFreeDate: '2026-10-17' });
  });

  it('skips taken days when suggesting', () => {
    const busy: TripItem[] = [...trip, { slug: 'zipline', date: D2 }];
    expect(checkAdd(busy, wine, D1, catalog)).toMatchObject({ nextFreeDate: '2026-10-17' });
  });

  it('allows short activities together and on free dates', () => {
    expect(checkAdd(trip, rafting, D2, catalog)).toBeNull();
    expect(checkAdd([{ slug: 'zipline', date: D2 }], rafting, D2, catalog)).toBeNull();
  });

  it('flags a forced conflict in the schedule and as a problem', () => {
    const bad: TripItem[] = [...trip, { slug: 'rafting', date: D1 }];
    expect(buildSchedule(bad, catalog)[0].conflict).toBe(true);
    expect(tripProblems(bad, catalog, 2)).toContain(`fullDay:${D1}`);
  });
});

describe('short-activity sequencing', () => {
  it('runs activities back to back with a 30-minute buffer from 09:00', () => {
    const [day] = buildSchedule(
      [{ slug: 'zipline', date: D1 }, { slug: 'rafting', date: D1 }, { slug: 'horse-riding', date: D1 }],
      catalog
    );
    expect(day.items.map((i) => `${i.slug} ${i.start}-${i.end}`)).toEqual([
      'zipline 09:00-11:00', // duration unknown → 2 h, approx
      'rafting 11:30-12:30',
      'horse-riding 13:00-13:30'
    ]);
    expect(day.items[0].approx).toBe(true);
    expect(day.items[1].approx).toBe(false);
    expect(day.overflow).toBe(false);
  });

  it('orders by preferred start and shifts overlapping ones', () => {
    const [day] = buildSchedule(
      [
        { slug: 'rafting', date: D1, slot: '15:00' },
        { slug: 'quad-bike', date: D1, slot: '14:30' }
      ],
      catalog
    );
    expect(day.items.map((i) => `${i.slug} ${i.start}`)).toEqual(['quad-bike 14:30', 'rafting 16:00']);
    expect(day.items[1].shifted).toBe(true);
  });

  it('places morning/afternoon slots for tours without fixed start times', () => {
    const [day] = buildSchedule([{ slug: 'zipline', date: D1, slot: 'afternoon' }], catalog);
    expect(day.items[0].start).toBe('14:00');
  });

  it('warns when the day runs past 20:00', () => {
    const [day] = buildSchedule(
      [
        { slug: 'zipline', date: D1, slot: '17:00' },
        { slug: 'rafting', date: D1 }
      ],
      catalog
    );
    // rafting (no time) first at 09:00, zipline 17:00–19:00: fits
    expect(day.overflow).toBe(false);
    const [late] = buildSchedule([{ slug: 'zipline', date: D1, slot: '18:30' }], catalog);
    expect(late.items[0].end).toBe('20:30');
    expect(late.overflow).toBe(true);
  });
});

describe('seasons', () => {
  it('treats empty months as all year', () => {
    expect(isInSeason(fishing, '2026-01-10')).toBe(true);
  });
  it('respects season months', () => {
    const mushrooms = tour({ slug: 'mushroom-picking', dayType: 'Full day', price: 250, seasonMonths: ['Sep', 'Oct'] });
    expect(isInSeason(mushrooms, '2026-10-15')).toBe(true);
    expect(isInSeason(mushrooms, '2026-12-01')).toBe(false);
    expect(checkAdd([], mushrooms, '2026-12-01', catalog)).toEqual({ reason: 'outOfSeason' });
  });
});

describe('pricing', () => {
  it('4 people on quads = 2 quads = 300 GEL', () => {
    expect(priceFor(quad, 4, false)).toMatchObject({ total: 300, units: 2 });
  });
  it('9 people off-road = 2 cars = 600 GEL', () => {
    expect(priceFor(offroad, 9, false)).toMatchObject({ total: 600, units: 2 });
  });
  it('per person multiplies by people', () => {
    expect(priceFor(fishing, 3, false).total).toBe(750);
  });
  it('uses the overnight-guest price only when staying and set', () => {
    const honey = tour({ slug: 'honey', dayType: 'Full day', price: 250, overnightPrice: 200 });
    expect(priceFor(honey, 2, true)).toMatchObject({ total: 400, overnightRate: true });
    expect(priceFor(honey, 2, false).total).toBe(500);
    expect(priceFor(fishing, 2, true).total).toBe(500);
  });
  it('never totals when any item is on request', () => {
    const onRequest = tour({ slug: 'special', dayType: 'Short activity', priceType: 'on request' });
    const cat = new Map([...catalog, ['special', onRequest]]);
    expect(tripTotal([{ slug: 'fishing', date: D1 }, { slug: 'special', date: D2 }], cat, 2, false)).toBeNull();
    expect(tripTotal([{ slug: 'fishing', date: D1 }, { slug: 'quad-bike', date: D2 }], catalog, 4, false)).toBe(1300);
  });
  it('checks min/max people for per-person tours only', () => {
    const small = tour({ slug: 'small', dayType: 'Short activity', price: 10, minPeople: 2, maxPeople: 4 });
    expect(peopleProblem(small, 1)).toBe('tooFew');
    expect(peopleProblem(small, 5)).toBe('tooMany');
    expect(peopleProblem(small, 3)).toBeNull();
    expect(peopleProblem(quad, 9)).toBeNull();
  });
});

describe('URL state', () => {
  it('round-trips and drops junk', () => {
    const items: TripItem[] = [{ slug: 'fishing', date: D1 }, { slug: 'quad-bike', date: D2, slot: '10:00' }];
    expect(decodeTrip(encodeTrip(items))).toEqual(items);
    expect(decodeTrip('fishing@nope,<script>@2026-10-15')).toEqual([]);
  });
});
