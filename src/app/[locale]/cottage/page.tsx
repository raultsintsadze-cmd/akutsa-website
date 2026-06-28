import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PropertyPageTemplate from '@/components/sections/PropertyPageTemplate';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'cottagePage' });
  return { title: t('title'), description: t('description') };
}

export default function CottagePage() {
  return (
    <PropertyPageTemplate
      namespace="cottagePage"
      heroSeed="akutsa-cottage-1"
      gallerySeeds={['akutsa-cottage-2', 'akutsa-cottage-3', 'akutsa-nature-1']}
      price="120"
    />
  );
}
