import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import GalleryGrid from '@/components/sections/GalleryGrid';
import { getNewsPhotos } from '@/lib/notion';
import type { Locale } from '@/i18n/config';

// Photos uploaded to Notion news posts appear without a redeploy.
export const revalidate = 1800;

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return pageMetadata({ locale, path: '/gallery', title: t('title'), description: t('subtitle') });
}

export default async function GalleryPage({
  params: { locale }
}: {
  params: { locale: Locale };
}) {
  const [t, newsPhotos] = await Promise.all([
    getTranslations({ locale, namespace: 'gallery' }),
    getNewsPhotos(locale)
  ]);

  return (
    <Section>
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <GalleryGrid newsPhotos={newsPhotos} />
    </Section>
  );
}
