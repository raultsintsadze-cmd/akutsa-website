import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import PlanBuilder from '@/components/sections/tours/PlanBuilder';
import { TripProvider } from '@/components/sections/tours/TripContext';
import { pageMetadata } from '@/lib/seo';
import { getTours } from '@/lib/tours/catalog';
import type { Locale } from '@/i18n/config';

export const revalidate = 1800;

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'tours' });
  return pageMetadata({ locale, path: '/tours/plan', title: t('planMetaTitle'), description: t('planMetaDescription') });
}

// The trip lives in the URL (?trip=slug@date[@time],...&people=&stay=&transfer=&mode=) and localStorage.
export default async function PlanPage({ params: { locale } }: { params: { locale: Locale } }) {
  const [t, tours] = await Promise.all([getTranslations({ locale, namespace: 'tours' }), getTours()]);
  return (
    <TripProvider tours={tours} syncUrl>
      <Section>
        <SectionHeading as="h1" title={t('planTitle')} subtitle={t('planSubtitle')} />
        <PlanBuilder />
      </Section>
    </TripProvider>
  );
}
