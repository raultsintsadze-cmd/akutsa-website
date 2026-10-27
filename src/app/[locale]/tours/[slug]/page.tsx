import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import PhotoGrid from '@/components/sections/PhotoGrid';
import TourVideo from '@/components/sections/tours/TourVideo';
import TourFacts from'@/components/sections/tours/TourFacts';
import TripDrawer from '@/components/sections/tours/TripDrawer';
import { AddToTripButton } from '@/components/sections/tours/TourCard';
import { TripProvider } from '@/components/sections/tours/TripContext';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';
import { getTours } from '@/lib/tours/catalog';
import { jsonLdScript, touristTrip } from '@/lib/tours/jsonld';
import { addDays, todayInTbilisi } from '@/lib/booking/dates';
import { locales, type Locale } from '@/i18n/config';

export const revalidate = 1800;

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
          <Link href="/tours" className="text-sm text-forest/75 hover:text-forest">
            ← {t('backToTours')}
          </Link>
          <article className="mt-6 bg-white rounded-2xl overflow-hidden shadow-sm">
            {tour.video ? (
              <div className="relative aspect-[4/5] md:aspect-[4/3] bg-forest/10">
                <TourVideo src={tour.video} poster={tour.image ?? undefined} label={tour.name[locale]} playButton />
              </div>
            ) : tour.image && (
              <div className="relative aspect-[4/3] md:aspect-[16/9]">
                <Image src={tour.image} alt={tour.name[locale]} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
              </div>
            )}
            {/* Gallery: swipeable row on phones, grid from md; tap opens the lightbox. */}
            {tour.gallery.length > 0 && (
              <PhotoGrid
                images={tour.gallery}
                alt={tour.name[locale]}
                className="px-6 md:px-8 pt-4"
                gridClassName="grid-flow-col auto-cols-[78%] overflow-x-auto snap-x snap-mandatory gap-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 md:overflow-visible"
                imageClassName="aspect-[4/3] rounded-lg snap-start"
                sizes="(max-width: 768px) 80vw, 260px"
              />
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
                {tour.operator === 'Partner' && <dd className="text-forest/75 text-xs">{t('partner')}</dd>}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <AddToTripButton tour={tour} />
                <Link href={onlyThis} className="rounded-full bg-gold text-ink px-4 py-2.5 text-sm font-semibold hover:bg-gold/90">
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
