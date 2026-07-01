import Image from 'next/image';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import FadeIn from '@/components/ui/FadeIn';
import PhotoGrid from '@/components/sections/PhotoGrid';
import TransferSection from '@/components/sections/TransferSection';
import ServiceCard from '@/components/sections/ServiceCard';
import { BREAKFAST_IMAGES, TOURS_IMAGES, PICNIC_IMAGES, MASTERCLASS_IMAGES, PRODUCT_IMAGES, TRANSFER_IMAGES } from '@/lib/images';
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
  const tExp = useTranslations('experiences');


  const transferVehicles = [
    {
      name: t('delikaName'),
      capacity: t('delikaCapacity'),
      type: t('delikaType'),
      photos: TRANSFER_IMAGES.delika
    },
    {
      name: t('minivanName'),
      capacity: t('minivanCapacity'),
      type: t('minivanType'),
      photos: TRANSFER_IMAGES.minivan
    }
  ];

  const transferHighlights = [
    t('transferH1'),
    t('transferH2'),
    t('transferH3'),
    t('transferH4'),
    t('transferH5'),
    t('transferH6'),
    t('transferH7')
  ];

  const masterclasses = [
    {
      titleKey: 'beekeepingTitle',
      descKey: 'beekeepingDesc',
      priceKey: 'beekeepingPrice',
      images: MASTERCLASS_IMAGES.slice(0, 3)
    },
    {
      titleKey: 'culinaryTitle',
      descKey: 'culinaryDesc',
      priceKey: 'culinaryPrice',
      images: MASTERCLASS_IMAGES.slice(3, 6)
    }
  ];

  const products = [
    { nameKey: 'honeyName', priceKey: 'honeyPrice' },
    { nameKey: 'wineName', priceKey: 'winePrice' },
    { nameKey: 'chachaName', priceKey: 'chachaPrice' },
    { nameKey: 'fruitName', priceKey: 'fruitPrice' }
  ];

  return (
    <>
      <Section>
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <ServiceCard
            title={t('breakfastTitle')}
            description={t('breakfastDesc')}
            photos={BREAKFAST_IMAGES}
          />
          <ServiceCard
            title={t('toursTitle')}
            description={t('toursDesc')}
            photos={TOURS_IMAGES}
            delay={0.1}
          />
        </div>
      </Section>

      <Section id="transfer" className="bg-white">
        <TransferSection
          title={t('transferSectionTitle')}
          description={t('transferDescription')}
          highlights={transferHighlights}
          pricing={t('transferPricing')}
          vehicles={transferVehicles}
        />
      </Section>

      <Section id="picnic">
        <FadeIn>
          <div className="rounded-2xl overflow-hidden bg-cream shadow-sm grid md:grid-cols-2">
            <div className="relative h-64 md:h-full">
              <Image
                src={PICNIC_IMAGES[0]}
                alt={tExp('picnicTitle')}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <h2 className="font-serif text-2xl md:text-3xl text-forest font-semibold">
                {tExp('picnicTitle')}
              </h2>
              <p className="mt-3 text-forest/70 text-sm leading-relaxed">{tExp('picnicDesc')}</p>
              <ul className="mt-4 space-y-2 text-sm text-forest/80">
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">&#10003;</span>
                  {tExp('picnicCapacity')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">&#10003;</span>
                  {tExp('picnicIncluded')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gold mt-0.5">&#10003;</span>
                  {tExp('picnicFoodFormat')}
                </li>
              </ul>
              <p className="mt-5 text-gold font-medium">{tExp('picnicPrice')}</p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <PhotoGrid images={PICNIC_IMAGES} alt={tExp('picnicTitle')} className="mt-6" />
        </FadeIn>
      </Section>

      <Section id="masterclasses">
        <SectionHeading title={tExp('masterclassesTitle')} subtitle={tExp('masterclassesSubtitle')} />
        <div className="grid md:grid-cols-2 gap-8">
          {masterclasses.map((m, i) => (
            <FadeIn key={m.titleKey} delay={i * 0.1}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full">
                <PhotoGrid
                  images={m.images}
                  alt={tExp(m.titleKey)}
                  className="p-2"
                  gridClassName="grid-cols-3 gap-1"
                />
                <div className="p-6">
                  <h3 className="font-serif text-xl text-forest font-semibold">{tExp(m.titleKey)}</h3>
                  <p className="mt-3 text-forest/70 text-sm leading-relaxed">{tExp(m.descKey)}</p>
                  <p className="mt-4 text-gold font-medium text-sm">{tExp(m.priceKey)}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section id="products" className="bg-white">
        <SectionHeading title={tExp('productsTitle')} subtitle={tExp('productsSubtitle')} />

        <FadeIn>
          <PhotoGrid
            images={PRODUCT_IMAGES}
            alt={tExp('productsTitle')}
            className="mb-8 max-w-2xl mx-auto"
            gridClassName="grid-cols-3 gap-3"
          />
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <FadeIn key={p.nameKey} delay={i * 0.1}>
              <div className="bg-cream rounded-2xl p-6 text-center shadow-sm h-full flex flex-col items-center justify-center">
                <p className="font-serif text-lg text-forest font-semibold">{tExp(p.nameKey)}</p>
                <p className="mt-2 text-gold font-medium text-sm">{tExp(p.priceKey)}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </>
  );
}
