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
  const tA = await getTranslations({ locale, namespace: 'menu.allergens' });

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
        // schema.org has no allergen field for MenuItem, so allergens go into the description.
        description: [
          i[`description_${locale}`],
          i.allergens.length
            ? `${tA('title')}: ${i.allergens.map((a) => (a.startsWith('may_') ? `${tA('may')} ${tA(a.slice(4))}` : tA(a))).join(', ')}.`
            : ''
        ].filter(Boolean).join(' ') || undefined,
        offers: { '@type': 'Offer', price: i.price, priceCurrency: 'GEL' }
      }))
    }))
  };

  return (
    <Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }} />
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <p className="max-w-2xl mx-auto -mt-6 mb-8 text-center text-sm text-forest/70 bg-amber-50 border border-amber-200/70 rounded-xl px-4 py-3">
        ⚠️ {t('allergenNote')}
      </p>
      <MenuExperience />
    </Section>
  );
}
