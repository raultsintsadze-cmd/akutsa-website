'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDays, todayInTbilisi, type DateStr } from '@/lib/booking/dates';
import { checkAdd, decodeTrip, encodeTrip, type TripItem } from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';

export interface TripState {
  items: TripItem[];
  people: number;
  staying: boolean;
  transfer: boolean;
  mode: 'one' | 'many';
}

const EMPTY: TripState = { items: [], people: 2, staying: false, transfer: false, mode: 'many' };
const STORAGE_KEY = 'akutsa-trip-v1';

interface TripApi {
  tours: Tour[];
  catalog: ReadonlyMap<string, Tour>;
  trip: TripState;
  ready: boolean;
  setTrip: (update: (prev: TripState) => TripState) => void;
  // Adds on the first date (from tomorrow, or after the trip's last date) where it fits the rules.
  quickAdd: (slug: string) => void;
  remove: (index: number) => void;
  clear: () => void;
  planHref: string;
}

const TripContext = createContext<TripApi | null>(null);

export function useTrip(): TripApi {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip outside TripProvider');
  return ctx;
}

// Query string for /tours/plan, e.g. "?trip=fishing@2026-10-15&people=2&stay=1".
export function tripQuery(trip: TripState): string {
  const q = new URLSearchParams();
  if (trip.items.length) q.set('trip', encodeTrip(trip.items));
  q.set('people', String(trip.people));
  if (trip.staying) q.set('stay', '1');
  if (trip.transfer) q.set('transfer', '1');
  if (trip.mode === 'one') q.set('mode', 'one');
  return `?${q.toString()}`;
}

function fromQuery(search: string): TripState | null {
  const q = new URLSearchParams(search);
  if (!q.has('trip')) return null;
  const people = Number(q.get('people'));
  return {
    items: decodeTrip(q.get('trip')),
    people: Number.isInteger(people) && people >= 1 && people <= 50 ? people : 2,
    staying: q.get('stay') === '1',
    transfer: q.get('transfer') === '1',
    mode: q.get('mode') === 'one' ? 'one' : 'many'
  };
}

export function TripProvider({ tours, children, syncUrl = false }: { tours: Tour[]; children: React.ReactNode; syncUrl?: boolean }) {
  const catalog = useMemo(() => new Map(tours.map((t) => [t.slug, t])), [tours]);
  const [trip, setTripState] = useState<TripState>(EMPTY);
  const [ready, setReady] = useState(false);

  // URL wins (shared / AI deep links), then localStorage.
  useEffect(() => {
    let initial = fromQuery(window.location.search);
    if (!initial) {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
        if (saved && Array.isArray(saved.items)) initial = { ...EMPTY, ...saved, items: decodeTrip(encodeTrip(saved.items)) };
      } catch {
        // storage unavailable: start empty
      }
    }
    if (initial) setTripState({ ...initial, items: initial.items.filter((i) => catalog.has(i.slug)) });
    setReady(true);
  }, [catalog]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    } catch {
      // ignore
    }
    if (syncUrl) window.history.replaceState(null, '', `${window.location.pathname}${tripQuery(trip)}`);
  }, [trip, ready, syncUrl]);

  const setTrip = useCallback((update: (prev: TripState) => TripState) => setTripState(update), []);

  const quickAdd = useCallback(
    (slug: string) =>
      setTripState((prev) => {
        const tour = catalog.get(slug);
        if (!tour) return prev;
        const tomorrow = addDays(todayInTbilisi(), 1);
        let date: DateStr = prev.mode === 'one' && prev.items[0] ? prev.items[0].date : tomorrow;
        for (let i = 0; i < 400; i++) {
          if (!checkAdd(prev.items, tour, date, catalog)) return { ...prev, items: [...prev.items, { slug, date }] };
          if (prev.mode === 'one' && prev.items.length) break;
          date = addDays(date, 1);
        }
        return prev;
      }),
    [catalog]
  );

  const api: TripApi = {
    tours,
    catalog,
    trip,
    ready,
    setTrip,
    quickAdd,
    remove: (index) => setTripState((p) => ({ ...p, items: p.items.filter((_, i) => i !== index) })),
    clear: () => setTripState((p) => ({ ...p, items: [] })),
    planHref: `/tours/plan${tripQuery(trip)}`
  };

  return <TripContext.Provider value={api}>{children}</TripContext.Provider>;
}
