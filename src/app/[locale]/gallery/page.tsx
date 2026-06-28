import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import GalleryGrid from '@/components/sections/GalleryGrid';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function GalleryPage({
  params: { locale }
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'gallery' });

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <GalleryGrid />
    </Section>
  );
}
