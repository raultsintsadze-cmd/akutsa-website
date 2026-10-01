import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
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
  return pageMetadata({ locale, path: '/cottage', title: t('metaTitle'), description: t('metaDescription'), keywords: t('metaKeywords'), image: '/og/og-cottage.jpg' });
}

export default function CottagePage() {
  return (
    <PropertyPageTemplate
      namespace="cottagePage"
      bookUnit="cottage"
      heroImage={COTTAGE_IMAGES[0]}
      galleryImages={[COTTAGE_IMAGES[1], COTTAGE_IMAGES[2]]}
      price="150"
      amenityCount={5}
    />
  );
}
