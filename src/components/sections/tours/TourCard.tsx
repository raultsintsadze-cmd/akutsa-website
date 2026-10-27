'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';
import { todayInTbilisi } from '@/lib/booking/dates';
import { isInSeason } from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';
import type { Locale } from '@/i18n/config';
import TourFacts from './TourFacts';
import TourVideo from './TourVideo';
import { useTrip } from './TripContext';

export function AddToTripButton({ tour, className }: { tour: Tour; className?: string }) {
  const t = useTranslations('tours');
  const { trip, quickAdd } = useTrip();
  const added = trip.items.some((i) => i.slug === tour.slug);
  return (
    <button
      type="button"
      data-add={tour.slug}
      onClick={() => quickAdd(tour.slug)}
      aria-pressed={added}
      className={clsx(
        'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
        added ? 'bg-forest/10 text-forest' : 'bg-forest text-cream hover:bg-forest/90',
        className
      )}
    >
      {added ? t('addedToTrip') : t('addToTrip')}
    </button>
  );
}

export default function TourCard({ tour }: { tour: Tour }) {
  const t = useTranslations('tours');
  const locale = useLocale() as Locale;
  const offSeason = !isInSeason(tour, todayInTbilisi());
  return (
    <article
      data-tour={tour.slug}
      className={clsx('bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col', offSeason && 'opacity-60 grayscale')}
    >
      {/* A (vertical) video gets a taller frame on phones; from sm the card frame stays h-44. */}
      <Link
        href={`/tours/${tour.slug}`}
        aria-label={tour.name[locale]}
        className={clsx('block relative bg-forest/10 overflow-hidden', tour.video ? 'aspect-[4/5] sm:aspect-auto sm:h-44' : 'h-44')}
      >
        {tour.video ? (
          <TourVideo src={tour.video} poster={tour.image ?? undefined} label={tour.name[locale]} />
        ) : tour.image ? (
          <Image src={tour.image} alt={tour.name[locale]} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>
            {tour.dayType === 'Full day' ? '🌄' : '🧗'}
          </span>
        )}
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <h2 className="font-serif text-xl text-forest font-semibold">
          <Link href={`/tours/${tour.slug}`} className="hover:text-gold transition-colors">
            {tour.name[locale]}
          </Link>
        </h2>
        <p className="mt-2 text-sm text-forest/70 leading-relaxed flex-1">{tour.description[locale]}</p>
        <div className="mt-4">
          <TourFacts tour={tour} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <AddToTripButton tour={tour} />
          <Link href={`/tours/${tour.slug}`} className="text-sm text-forest/75 underline hover:text-forest">
            {t('details')}
          </Link>
        </div>
      </div>
    </article>
  );
}
