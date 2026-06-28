import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PropertyPageTemplate from '@/components/sections/PropertyPageTemplate';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'guesthousePage' });
  return { title: t('title'), description: t('description') };
}

export default function GuesthousePage() {
  return (
    <PropertyPageTemplate
      namespace="guesthousePage"
      heroSeed="akutsa-gh-1"
      gallerySeeds={['akutsa-gh-2', 'akutsa-gh-3', 'akutsa-gh-4']}
      price="80"
      rooms={[
        { nameKey: 'room1Name', descKey: 'room1Desc' },
        { nameKey: 'room2Name', descKey: 'room2Desc' }
      ]}
    />
  );
}
