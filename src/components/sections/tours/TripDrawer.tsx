'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { useTrip } from './TripContext';

// Sticky "My trip (n)" bar on tour pages. Sits above the mobile booking bar on phones.
export default function TripDrawer() {
  const t = useTranslations('tours');
  const locale = useLocale() as Locale;
  const { trip, catalog, ready, remove, clear, planHref } = useTrip();
  const [open, setOpen] = useState(false);
  const visible = ready && trip.items.length > 0;

  // Lets other floating buttons (the AI planner button) move up out of the bar's way.
  useEffect(() => {
    if (!visible) return;
    document.documentElement.setAttribute('data-trip-bar', '');
    return () => document.documentElement.removeAttribute('data-trip-bar');
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed left-0 right-0 z-40 bottom-[calc(56px+env(safe-area-inset-bottom))] sm:bottom-4 px-3 pointer-events-none">
      <div className="max-w-xl mx-auto bg-forest text-cream rounded-2xl shadow-xl pointer-events-auto">
        {open && (
          <ul id="trip-drawer-list" className="px-4 pt-3 space-y-2 text-sm max-h-60 overflow-y-auto">
            {trip.items.map((item, i) => (
              <li key={`${item.slug}-${item.date}`} className="flex items-center justify-between gap-3">
                <span>
                  {item.date.split('-').reverse().join('.')} · {catalog.get(item.slug)?.name[locale] ?? item.slug}
                </span>
                <button type="button" onClick={() => remove(i)} className="text-cream/60 hover:text-cream" aria-label={t('remove')}>
                  ✕
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={clear} className="text-xs text-cream/60 underline">
                {t('clearTrip')}
              </button>
            </li>
          </ul>
        )}
        <div className="flex items-center gap-2 p-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="trip-drawer-list"
            className="flex-1 text-left px-3 py-2 font-semibold"
          >
            🧭 {t('myTrip', { count: trip.items.length })} {open ? '▾' : '▴'}
          </button>
          <Link href={planHref} className="rounded-full bg-gold text-forest px-4 py-2.5 text-sm font-semibold">
            {t('openPlanner')}
          </Link>
        </div>
      </div>
    </div>
  );
}
