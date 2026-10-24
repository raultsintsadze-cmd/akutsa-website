import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import MenuExperience from '@/components/sections/menu/MenuExperience';
import type { Locale } from '@/i18n/config';
import { MENU_CATEGORIES } from '@/lib/menuData';
import { SITE_URL } from '@/lib/constants';

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: t('title'),
    url: `${SITE_URL}/${locale}/menu`,
    inLanguage: locale,
    hasMenuSection: MENU_CATEGORIES.map((c) => ({
      '@type': 'MenuSection',
      name: c.label[locale],
      hasMenuItem: c.items.map((i) => ({
        '@type': 'MenuItem',
        name: i.name[locale],
        ...(i[`description_${locale}`] ? { description: i[`description_${locale}`] } : {}),
        offers: { '@type': 'Offer', price: i.price, priceCurrency: 'GEL' }
      }))
    }))
  };

  return (
    <Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }} />
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <MenuExperience />
    </Section>
  );
}
