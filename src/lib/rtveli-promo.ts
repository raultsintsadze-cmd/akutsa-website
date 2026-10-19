// One-day Rtveli promo. Everything promo-related reads this object; after `end` the site shows
// normal prices again by itself (pages revalidate at least hourly; the booking API checks per request).
import { RTVELI_PRICES, type RtveliTransport } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export const RTVELI_PROMO = {
  // Shown from 19 Oct 00:00 to 24 Oct 23:59:59, Tbilisi time (UTC+4, no daylight saving).
  start: '2026-10-19T00:00:00+04:00',
  end: '2026-10-24T23:59:59+04:00',
  // The discounted tour date.
  date: '2026-10-24',
  prices: { with: 200, without: 150 } satisfies Record<RtveliTransport, number>,
  newsSlug: 'rtveli-october-24',
  text: {
    ka: {
      headline: 'გრანდიოზული რთველი — შაბათს, 24 ოქტომბერს! ფასი 50 ლარით ნაკლები',
      strip: 'გრანდიოზული რთველი 24 ოქტომბერს — 50 ლარით იაფად',
      book: 'დაჯავშნეთ 24 ოქტომბერი',
      news: 'დეტალები',
      priceWith: 'ტრანსფერით ბათუმიდან',
      priceWithout: 'ტრანსფერის გარეშე',
      onlyDate: 'აქციის ფასი მოქმედებს მხოლოდ 24 ოქტომბერს',
      currency: 'ლარი'
    },
    en: {
      headline: 'Grand Rtveli — Saturday, 24 October! 50 GEL off',
      strip: 'Grand Rtveli on 24 October — 50 GEL off',
      book: 'Book 24 October',
      news: 'Details',
      priceWith: 'With transfer from Batumi',
      priceWithout: 'Without transfer',
      onlyDate: 'Promo price applies on 24 October only',
      currency: 'GEL'
    },
    ru: {
      headline: 'Грандиозный ртвели — суббота, 24 октября! Скидка 50 лари',
      strip: 'Грандиозный ртвели 24 октября — скидка 50 лари',
      book: 'Забронировать 24 октября',
      news: 'Подробнее',
      priceWith: 'С трансфером из Батуми',
      priceWithout: 'Без трансфера',
      onlyDate: 'Акционная цена действует только 24 октября',
      currency: 'лари'
    }
  } satisfies Record<Locale, Record<string, string>>
} as const;

export function isPromoActive(now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= Date.parse(RTVELI_PROMO.start) && t <= Date.parse(RTVELI_PROMO.end);
}

// Per-person price for a tour date: promo price on the promo date while the promo runs.
export function rtveliPrice(transport: RtveliTransport, date: string | null, now: Date = new Date()): number {
  return isPromoActive(now) && date === RTVELI_PROMO.date ? RTVELI_PROMO.prices[transport] : RTVELI_PRICES[transport];
}
