import type { Metadata } from 'next';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { GUESTHOUSE_SHARED_IMAGES } from '@/lib/images';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import RuleIcon from '@/components/ui/RuleIcon';
import FaqAccordion from '@/components/sections/FaqAccordion';
import RetreatContact from '@/components/sections/RetreatContact';
import type { Locale } from '@/i18n/config';

type Item = { icon: string; title: string; text: string };

// Content mirrors the Notion news post "yoga-retreat-adjara" (ka/en/ru).
export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'yoga' });
  return pageMetadata({
    locale,
    path: '/yoga-retreat',
    title: t('metaTitle'),
    description: t('metaDescription'),
    absoluteTitle: true
  });
}

export default function YogaRetreatPage() {
  const t = useTranslations('yoga');
  const teachers = t.raw('teachersItems') as Item[];
  const why = t.raw('whyItems') as Item[];
  const faq = t.raw('faq') as { q: string; a: string }[];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }}
      />

      {/* Hero */}
      <section className="relative min-h-[520px] md:min-h-[600px] flex items-end">
        <Image src={GUESTHOUSE_SHARED_IMAGES.terrace} alt={t('heroTitle')} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="relative container-px max-w-5xl mx-auto w-full py-12 md:py-16 text-cream">
          <p className="text-gold font-medium">{t('heroSubtitle')}</p>
          <h1 className="mt-2 font-serif text-3xl md:text-5xl font-semibold leading-tight max-w-3xl">{t('heroTitle')}</h1>
          <p className="mt-4 text-cream/85 text-sm md:text-base leading-relaxed max-w-2xl">{t('heroText')}</p>
          <a
            href="#contact"
            className="mt-6 inline-flex items-center min-h-12 rounded-pill bg-gold text-ink px-6 font-semibold hover:bg-gold/90 transition-colors"
          >
            {t('heroCta')}
          </a>
        </div>
      </section>

      {/* For yoga teachers */}
      <Section>
        <SectionHeading title={t('teachersTitle')} subtitle={t('teachersIntro')} />
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {teachers.map((item) => (
            <li key={item.title} className="rounded-card bg-white shadow-sm p-6">
              <span className="w-10 h-10 rounded-full bg-gold/15 text-forest flex items-center justify-center">
                <RuleIcon name="check" className="w-5 h-5" />
              </span>
              <h3 className="mt-3 font-serif text-lg text-forest font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-forest/80 leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-3xl mx-auto text-center text-forest/80 leading-relaxed">{t('teachersOffer')}</p>
      </Section>

      {/* For participants */}
      <Section className="bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-forest font-semibold">{t('participantsTitle')}</h2>
          <p className="mt-4 text-forest/80 leading-relaxed">{t('participantsText')}</p>
        </div>
      </Section>

      {/* Why Akutsa */}
      <Section>
        <SectionHeading title={t('whyTitle')} />
        <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {why.map((item) => (
            <div key={item.title} className="rounded-card bg-white shadow-sm p-6 flex gap-4">
              <span className="shrink-0 w-11 h-11 rounded-full bg-gold/15 text-forest flex items-center justify-center">
                <RuleIcon name={item.icon} />
              </span>
              <div>
                <h3 className="font-serif text-lg text-forest font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-forest/80 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-white">
        <SectionHeading title={t('faqTitle')} />
        <FaqAccordion items={faq} />
      </Section>

      {/* Contact */}
      <Section id="contact">
        <SectionHeading title={t('contactTitle')} subtitle={t('contactText')} />
        <RetreatContact />
        <p className="mt-6 text-center text-sm text-forest/75">{t('address')}</p>
      </Section>
    </>
  );
}
