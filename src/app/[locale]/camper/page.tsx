import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import PropertyPageTemplate from '@/components/sections/PropertyPageTemplate';
import { CAMPER_IMAGES } from '@/lib/images';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'camperPage' });
  return pageMetadata({ locale, path: '/camper', title: t('metaTitle'), description: t('metaDescription'), keywords: t('metaKeywords'), image: '/og/og-camper.jpg' });
}

export default function CamperPage() {
  return (
    <PropertyPageTemplate
      namespace="camperPage"
      heroImage={CAMPER_IMAGES[0]}
      galleryImages={[CAMPER_IMAGES[1], CAMPER_IMAGES[2], CAMPER_IMAGES[3]]}
      price="100"
    />
  );
}
