import type { Metadata } from 'next';
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
  return { title: t('title'), description: t('description') };
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
