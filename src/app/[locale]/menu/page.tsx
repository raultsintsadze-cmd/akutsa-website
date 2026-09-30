import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import MenuExperience from '@/components/sections/menu/MenuExperience';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'menu' });
  return pageMetadata({ locale, path: '/menu', title: t('metaTitle'), description: t('metaDescription'), keywords: t('metaKeywords') });
}

export default async function MenuPage({
  params: { locale }
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: 'menu' });

  return (
    <Section>
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <MenuExperience />
    </Section>
  );
}
