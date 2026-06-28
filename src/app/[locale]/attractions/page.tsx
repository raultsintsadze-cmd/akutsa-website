import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import AttractionCard from '@/components/sections/AttractionCard';
import { img } from '@/lib/images';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'attractions' });
  return { title: t('title'), description: t('subtitle') };
}

export default function AttractionsPage() {
  const t = useTranslations('attractions');

  const attractions = [
    { seed: 'akutsa-waterfall', nameKey: 'waterfallName', descKey: 'waterfallDesc', distKey: 'waterfallDistance' },
    { seed: 'akutsa-pass', nameKey: 'passName', descKey: 'passDesc', distKey: 'passDistance' },
    { seed: 'akutsa-batumi', nameKey: 'batumiName', descKey: 'batumiDesc', distKey: 'batumiDistance' },
    { seed: 'akutsa-sea', nameKey: 'seaName', descKey: 'seaDesc', distKey: 'seaDistance' },
    { seed: 'akutsa-keda', nameKey: 'kedaName', descKey: 'kedaDesc', distKey: 'kedaDistance' }
  ];

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {attractions.map((a, i) => (
          <AttractionCard
            key={a.seed}
            image={img(a.seed)}
            name={t(a.nameKey)}
            description={t(a.descKey)}
            distance={t(a.distKey)}
            delay={i * 0.1}
          />
        ))}
      </div>
    </Section>
  );
}
