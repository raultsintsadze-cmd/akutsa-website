import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { TELEGRAM_URL, WHATSAPP_URL } from '@/lib/constants';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import RuleIcon from '@/components/ui/RuleIcon';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'houseRules' });
  return pageMetadata({
    locale,
    path: '/house-rules',
    title: t('metaTitle'),
    description: t('metaDescription'),
    absoluteTitle: true
  });
}

export default function HouseRulesPage() {
  const t = useTranslations('houseRules');
  const sections = t.raw('sections') as { icon: string; title: string; text: string }[];

  return (
    <Section>
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
        {sections.map((s) => (
          <article key={s.title} className="rounded-card bg-white shadow-sm p-6 flex gap-4">
            <span className="shrink-0 w-11 h-11 rounded-full bg-gold/15 text-forest flex items-center justify-center">
              <RuleIcon name={s.icon} />
            </span>
            <div>
              <h2 className="font-serif text-lg text-forest font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-forest/80 leading-relaxed">{s.text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 max-w-5xl mx-auto rounded-card bg-forest text-cream p-6 md:p-8 text-center">
        <h2 className="font-serif text-xl font-semibold">{t('questionsTitle')}</h2>
        <p className="mt-2 text-cream/80 text-sm">{t('questionsText')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 rounded-pill bg-[#075E54] text-white px-5 text-sm font-semibold">
            WhatsApp
          </a>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 rounded-pill bg-[#1A6FA0] text-white px-5 text-sm font-semibold">
            Telegram
          </a>
        </div>
      </div>
    </Section>
  );
}
