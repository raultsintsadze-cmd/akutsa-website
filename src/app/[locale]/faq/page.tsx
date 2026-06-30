import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import FaqAccordion from '@/components/sections/FaqAccordion';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'faq' });
  return { title: t('title'), description: t('subtitle') };
}

export default function FaqPage() {
  const t = useTranslations('faq');

  const items = Array.from({ length: 10 }, (_, i) => ({
    q: t(`q${i + 1}`),
    a: t(`a${i + 1}`)
  }));

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <FaqAccordion items={items} />
    </Section>
  );
}
