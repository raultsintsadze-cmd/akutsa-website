'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Tour } from '@/lib/tours/types';
import { MONTHS } from '@/lib/tours/types';
import { todayInTbilisi } from '@/lib/booking/dates';
import { isInSeason } from '@/lib/tours/schedule';

export function monthNames(tour: Tour, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-GB', { month: 'short', timeZone: 'UTC' });
  return tour.seasonMonths.map((m) => fmt.format(new Date(Date.UTC(2026, MONTHS.indexOf(m), 1)))).join(', ');
}

export function usePriceLabel() {
  const t = useTranslations('tours');
  return (tour: Tour) => {
    if (tour.priceType === 'on request' || tour.price === null) return t('onRequest');
    if (tour.priceType === 'per group')
      return tour.maxPeople ? t('perGroup', { price: tour.price, max: tour.maxPeople }) : t('perGroupNoMax', { price: tour.price });
    return t('perPerson', { price: tour.price });
  };
}

export function useDurationLabel() {
  const t = useTranslations('tours');
  return (tour: Tour) =>
    tour.dayType === 'Full day'
      ? t('durationFullDay')
      : tour.durationHours
        ? t('durationHours', { hours: tour.durationHours })
        : t('durationApprox');
}

// Badges + price line used on cards and detail pages.
export default function TourFacts({ tour }: { tour: Tour }) {
  const t = useTranslations('tours');
  const locale = useLocale();
  const price = usePriceLabel()(tour);
  const duration = useDurationLabel()(tour);
  const inSeasonNow = isInSeason(tour, todayInTbilisi());
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {tour.dayType === 'Full day' && (
        <span className="rounded-full bg-forest text-cream px-2.5 py-1 font-semibold">{t('fullDay')}</span>
      )}
      <span className="rounded-full bg-forest/5 text-forest/80 px-2.5 py-1">⏱ {duration}</span>
      <span className="rounded-full bg-gold/15 text-forest px-2.5 py-1 font-semibold">{price}</span>
      {tour.seasonMonths.length > 0 && (
        <span className={`rounded-full px-2.5 py-1 ${inSeasonNow ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
          {inSeasonNow ? t('seasonOnly', { months: monthNames(tour, locale) }) : t('outOfSeason', { months: monthNames(tour, locale) })}
        </span>
      )}
    </div>
  );
}
