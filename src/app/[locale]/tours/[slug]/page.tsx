import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import TourFacts from '@/components/sections/tours/TourFacts';
import TripDrawer from '@/components/sections/tours/TripDrawer';
import { AddToTripButton } from '@/components/sections/tours/TourCard';
import { TripProvider } from '@/components/sections/tours/TripContext';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';
import { getTours } from '@/lib/tours/catalog';
import { jsonLdScript, touristTrip } from '@/lib/tours/jsonld';
import { addDays, todayInTbilisi } from '@/lib/booking/dates';
import { locales, type Locale } from '@/i18n/config';

export const revalidate = 3600;

export async function generateStaticParams() {
  const tours = await getTours();
  return locales.flatMap((locale) => tours.map((t) => ({ locale, slug: t.slug })));
}

export async function generateMetadata({ params: { locale, slug } }: { params: { locale: Locale; slug: string } }): Promise<Metadata> {
  const tour = (await getTours()).find((t) => t.slug === slug);
  if (!tour) return {};
  return pageMetadata({
    locale,
    path: `/tours/${slug}`,
    title: tour.name[locale],
    description: tour.description[locale] || undefined,
    image: tour.image ?? undefined
  });
}

export default async function TourPage({ params: { locale, slug } }: { params: { locale: Locale; slug: string } }) {
  const [t, tours] = await Promise.all([getTranslations({ locale, namespace: 'tours' }), getTours()]);
  const tour = tours.find((x) => x.slug === slug);
  if (!tour) notFound();

  const tomorrow = addDays(todayInTbilisi(), 1);
  const onlyThis = `/tours/plan?trip=${tour.slug}@${tomorrow}&people=2`;

  return (
    <TripProvider tours={tours}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript({ '@context': 'https://schema.org', ...touristTrip(tour, locale) }) }}
      />
      <Section>
        <div className="max-w-3xl mx-auto">
          <Link href="/tours" className="text-sm text-forest/60 hover:text-forest">
            ← {t('backToTours')}
          </Link>
          <article className="mt-6 bg-white rounded-2xl overflow-hidden shadow-sm">
            {tour.image && (
              <div className="relative h-64 md:h-96">
                <Image src={tour.image} alt={tour.name[locale]} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
              </div>
            )}
            <div className="p-6 md:p-8">
              <h1 className="font-serif text-3xl md:text-4xl text-forest font-semibold">{tour.name[locale]}</h1>
              <div className="mt-4">
                <TourFacts tour={tour} />
              </div>
              {tour.description[locale] && <p className="mt-5 text-forest/80 leading-relaxed">{tour.description[locale]}</p>}
              <dl className="mt-6 grid gap-3 text-sm">
                {tour.includes && (
                  <div>
                    <dt className="font-semibold text-forest">{t('includes')}</dt>
                    <dd className="text-forest/70">{tour.includes}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold text-forest">{t('startTimes')}</dt>
                  <dd className="text-forest/70">{tour.startTimes.length ? tour.startTimes.join(', ') : t('timeByAgreement')}</dd>
                </div>
                {(tour.minPeople || tour.maxPeople) && (
                  <div>
                    <dt className="font-semibold text-forest">{t('people')}</dt>
                    <dd className="text-forest/70">{t('peopleRange', { min: tour.minPeople ?? 1, max: tour.maxPeople ?? '—' })}</dd>
                  </div>
                )}
                {tour.distanceKm !== null && (
                  <div>
                    <dd className="text-forest/70">📍 {tour.distanceKm === 0 ? t('atAkutsa') : t('distance', { km: tour.distanceKm })}</dd>
                  </div>
                )}
                {tour.overnightPrice !== null && (
                  <div>
                    <dd className="text-forest/70">🏡 {t('overnightPrice', { price: tour.overnightPrice })}</dd>
                  </div>
                )}
                {tour.operator === 'Partner' && <dd className="text-forest/60 text-xs">{t('partner')}</dd>}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <AddToTripButton tour={tour} />
                <Link href={onlyThis} className="rounded-full bg-gold text-forest px-4 py-2.5 text-sm font-semibold hover:bg-gold/90">
                  {t('bookOnlyThis')}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </Section>
      <TripDrawer />
    </TripProvider>
  );
}
