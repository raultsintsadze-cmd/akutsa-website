import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PropertyPageTemplate from '@/components/sections/PropertyPageTemplate';
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
      heroSeed="akutsa-camper-1"
      gallerySeeds={['akutsa-camper-2', 'akutsa-camper-3', 'akutsa-nature-2']}
      price="100"
    />
  );
}
