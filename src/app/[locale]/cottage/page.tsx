import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PropertyPageTemplate from '@/components/sections/PropertyPageTemplate';
import { COTTAGE_IMAGES } from '@/lib/images';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'cottagePage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website'
    }
  };
}

export default function CottagePage() {
  return (
    <PropertyPageTemplate
      namespace="cottagePage"
      heroImage={COTTAGE_IMAGES[0]}
      galleryImages={[COTTAGE_IMAGES[1], COTTAGE_IMAGES[2]]}
      price="150"
      amenityCount={5}
    />
  );
}
