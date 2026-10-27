import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import FaqAccordion from '@/components/sections/FaqAccordion';
import TourCard from '@/components/sections/tours/TourCard';
import TripDrawer from '@/components/sections/tours/TripDrawer';
import { TripProvider } from '@/components/sections/tours/TripContext';
import { pageMetadata } from '@/lib/seo';
import { getTours } from '@/lib/tours/catalog';
import { jsonLdScript, touristTrip } from '@/lib/tours/jsonld';
import { SITE_URL } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export const revalidate = 1800;

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'tours' });
  return pageMetadata({ locale, path: '/tours', title: t('metaTitle'), description: t('metaDescription'), absoluteTitle: true });
}

export default async function ToursPage({ params: { locale } }: { params: { locale: Locale } }) {
  const [t, tours] = await Promise.all([getTranslations({ locale, namespace: 'tours' }), getTours()]);
  const faq = [1, 2, 3, 4].map((n) => ({ q: t(`faq${n}q`), a: t(`faq${n}a`) }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        url: `${SITE_URL}/${locale}/tours`,
        itemListElement: tours.map((tour, i) => ({ '@type': 'ListItem', position: i + 1, item: touristTrip(tour, locale) }))
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }
    ]
  };

  return (
    <TripProvider tours={tours}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Section>
        <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </Section>
      <Section className="bg-white">
        <h2 className="font-serif text-2xl md:text-3xl text-forest font-semibold text-center mb-8">{t('faqTitle')}</h2>
        <FaqAccordion items={faq} />
      </Section>
      <TripDrawer />
    </TripProvider>
  );
}
