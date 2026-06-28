import Image from 'next/image';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import FadeIn from '@/components/ui/FadeIn';
import { img } from '@/lib/images';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'services' });
  return { title: t('title'), description: t('subtitle') };
}

export default function ServicesPage() {
  const t = useTranslations('services');

  const services = [
    { titleKey: 'breakfastTitle', descKey: 'breakfastDesc', seed: 'akutsa-breakfast' },
    { titleKey: 'toursTitle', descKey: 'toursDesc', seed: 'akutsa-tours' },
    { titleKey: 'transferTitle', descKey: 'transferDesc', seed: 'akutsa-transfer' }
  ];

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid md:grid-cols-3 gap-8">
        {services.map((s, i) => (
          <FadeIn key={s.titleKey} delay={i * 0.1}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full">
              <div className="relative h-48">
                <Image src={img(s.seed)} alt={t(s.titleKey)} fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl text-forest font-semibold">{t(s.titleKey)}</h3>
                <p className="mt-3 text-forest/70 text-sm leading-relaxed">{t(s.descKey)}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
