import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import AttractionCard from '@/components/sections/AttractionCard';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'attractions' });
  return { title: t('title'), description: t('subtitle') };
}

const ATTRACTIONS = [
  {
    key: 'item1',
    images: ['/images/attractions/akutsa-mosque1.jpeg'],
    mapsQuery: 'Akutsa Mosque, Keda, Adjara, Georgia'
  },
  {
    key: 'item2',
    images: ['/images/attractions/makhuntseti1.jpg', '/images/attractions/makhuntseti2.jpg'],
    mapsQuery: 'Makhuntseti Waterfall, Keda, Adjara, Georgia'
  },
  {
    key: 'item3',
    images: ['/images/attractions/dzenwmani1.jpg'],
    mapsQuery: 'Dzenwmani Waterfall, Keda, Adjara, Georgia'
  },
  {
    key: 'item4',
    images: ['/images/attractions/merisi1.jpg'],
    mapsQuery: 'Merisi Waterfall, Keda, Adjara, Georgia'
  },
  {
    key: 'item5',
    images: ['/images/attractions/eklesia1.jpg'],
    mapsQuery: 'Zvari St. George Church, Keda, Adjara, Georgia'
  },
  {
    key: 'item6',
    images: ['/images/attractions/muzeumi1.jpg'],
    mapsQuery: 'Keda Historical Museum, Keda, Adjara, Georgia'
  },
  {
    key: 'item7',
    images: ['/images/attractions/kaviani1.jpg'],
    mapsQuery: 'Kaviani Fortress, Khichauri, Keda, Adjara, Georgia'
  },
  {
    key: 'item8',
    images: ['/images/attractions/qarxana1.jpg'],
    mapsQuery: 'Keda Winery, Keda, Adjara, Georgia'
  },
  {
    key: 'item9',
    images: ['/images/attractions/parki1.jpg'],
    mapsQuery: 'Khalvashi Park, Keda, Adjara, Georgia'
  },
  {
    key: 'item10',
    images: ['/images/attractions/maspidzeli1.jpg'],
    mapsQuery: 'Restaurant Maspidzeli, Keda, Adjara, Georgia'
  }
] as const;

export default function AttractionsPage() {
  const t = useTranslations('attractions');

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ATTRACTIONS.map((a, i) => (
          <AttractionCard
            key={a.key}
            images={a.images}
            name={t(`${a.key}Name`)}
            description={t(`${a.key}Desc`)}
            distance={t(`${a.key}Distance`)}
            mapsQuery={a.mapsQuery}
            delay={(i % 3) * 0.1}
          />
        ))}
      </div>
    </Section>
  );
}
