import { SITE_URL } from '@/lib/constants';
import type { Locale } from '@/i18n/config';
import type { Tour } from '@/lib/tours/types';

// schema.org TouristTrip; `offers` only when the catalog has a price.
export function touristTrip(tour: Tour, locale: Locale) {
  const url = `${SITE_URL}/${locale}/tours/${tour.slug}`;
  return {
    '@type': 'TouristTrip',
    '@id': `${url}#trip`,
    name: tour.name[locale],
    description: tour.description[locale] || undefined,
    url,
    ...(tour.image ? { image: `${SITE_URL}${tour.image}` } : {}),
    touristType: tour.dayType,
    provider: { '@id': `${SITE_URL}/#lodging` },
    ...(tour.price !== null && tour.priceType !== 'on request'
      ? {
          offers: {
            '@type': 'Offer',
            price: tour.price,
            priceCurrency: 'GEL',
            url,
            ...(tour.priceType === 'per group' ? { description: `per group${tour.maxPeople ? ` of up to ${tour.maxPeople}` : ''}` } : {})
          }
        }
      : {})
  };
}

export const jsonLdScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
