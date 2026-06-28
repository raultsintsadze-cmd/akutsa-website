import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import BookingButtons from '@/components/ui/BookingButtons';
import FadeIn from '@/components/ui/FadeIn';
import { Link } from '@/i18n/navigation';
import PropertyCard from '@/components/sections/PropertyCard';
import ReviewCard from '@/components/sections/ReviewCard';
import AttractionCard from '@/components/sections/AttractionCard';
import {
  img,
  instagramImages,
  GUESTHOUSE_SHARED_IMAGES,
  COTTAGE_IMAGES,
  CAMPER_IMAGES
} from '@/lib/images';
import { SOCIAL_LINKS, SITE_URL } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: { canonical: `${SITE_URL}/${locale}` }
  };
}

export default function HomePage() {
  const t = useTranslations('home');
  const tProps = useTranslations('properties');
  const tAttr = useTranslations('attractions');
  const tReviews = useTranslations('reviews');
  const tMeta = useTranslations('meta');
  const tExp = useTranslations('experiences');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: tMeta('siteName'),
    description: tMeta('homeDescription'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sofel Akutsa',
      addressLocality: 'Keda',
      addressRegion: 'Adjara',
      addressCountry: 'GE'
    },
    image: GUESTHOUSE_SHARED_IMAGES.terrace,
    priceRange: '90-150 GEL'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center">
        <Image
          src={GUESTHOUSE_SHARED_IMAGES.terrace}
          alt="Guest House Akutsa"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest/50" />
        <div className="relative z-10 text-center text-cream container-px max-w-3xl">
          <FadeIn>
            <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 text-base md:text-lg text-cream/90">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex justify-center">
              <BookingButtons />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Intro */}
      <Section>
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">
              {t('introTitle')}
            </h2>
            <p className="mt-5 text-forest/80 leading-relaxed">{t('introText')}</p>
          </div>
        </FadeIn>
      </Section>

      {/* Stay options */}
      <Section className="bg-white">
        <SectionHeading title={t('stayOptionsTitle')} subtitle={t('stayOptionsSubtitle')} />
        <div className="grid md:grid-cols-3 gap-8">
          <PropertyCard
            href="/guesthouse"
            image={GUESTHOUSE_SHARED_IMAGES.terrace}
            name={tProps('guesthouse.name')}
            description={tProps('guesthouse.short')}
            price={tProps('guesthouse.price')}
          />
          <PropertyCard
            href="/cottage"
            image={COTTAGE_IMAGES[0]}
            name={tProps('cottage.name')}
            description={tProps('cottage.short')}
            price={tProps('cottage.price')}
            delay={0.1}
          />
          <PropertyCard
            href="/camper"
            image={CAMPER_IMAGES[0]}
            name={tProps('camper.name')}
            description={tProps('camper.short')}
            price={tProps('camper.price')}
            delay={0.2}
          />
        </div>
      </Section>

      {/* Experiences & Local Products preview */}
      <Section className="bg-white">
        <SectionHeading title={tExp('sectionTitle')} subtitle={tExp('sectionSubtitle')} />
        <div className="grid md:grid-cols-3 gap-8">
          <FadeIn>
            <Link
              href="/services#picnic"
              className="block bg-cream rounded-2xl p-6 shadow-sm h-full hover:shadow-md transition-shadow"
            >
              <h3 className="font-serif text-xl text-forest font-semibold">
                {tExp('picnicTitle')}
              </h3>
              <p className="mt-3 text-forest/70 text-sm leading-relaxed">{tExp('picnicDesc')}</p>
              <p className="mt-4 text-gold font-medium text-sm">{tExp('picnicPrice')}</p>
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Link
              href="/services#masterclasses"
              className="block bg-cream rounded-2xl p-6 shadow-sm h-full hover:shadow-md transition-shadow"
            >
              <h3 className="font-serif text-xl text-forest font-semibold">
                {tExp('masterclassesTitle')}
              </h3>
              <p className="mt-3 text-forest/70 text-sm leading-relaxed">
                {tExp('masterclassesSubtitle')}
              </p>
              <p className="mt-4 text-gold font-medium text-sm">
                {tExp('beekeepingPrice')} &middot; {tExp('culinaryPrice')}
              </p>
            </Link>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Link
              href="/services#products"
              className="block bg-cream rounded-2xl p-6 shadow-sm h-full hover:shadow-md transition-shadow"
            >
              <h3 className="font-serif text-xl text-forest font-semibold">
                {tExp('productsTitle')}
              </h3>
              <p className="mt-3 text-forest/70 text-sm leading-relaxed">
                {tExp('productsSubtitle')}
              </p>
              <p className="mt-4 text-gold font-medium text-sm">
                {tExp('honeyName')} &middot; {tExp('wineName')} &middot; {tExp('chachaName')} &middot;{' '}
                {tExp('fruitName')}
              </p>
            </Link>
          </FadeIn>
        </div>
      </Section>

      {/* Attractions teaser */}
      <Section>
        <SectionHeading title={t('attractionsTitle')} subtitle={t('attractionsSubtitle')} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AttractionCard
            image={img('akutsa-waterfall')}
            name={tAttr('waterfallName')}
            description={tAttr('waterfallDesc')}
            distance={tAttr('waterfallDistance')}
          />
          <AttractionCard
            image={img('akutsa-pass')}
            name={tAttr('passName')}
            description={tAttr('passDesc')}
            distance={tAttr('passDistance')}
            delay={0.1}
          />
          <AttractionCard
            image={img('akutsa-batumi')}
            name={tAttr('batumiName')}
            description={tAttr('batumiDesc')}
            distance={tAttr('batumiDistance')}
            delay={0.2}
          />
          <AttractionCard
            image={img('akutsa-sea')}
            name={tAttr('seaName')}
            description={tAttr('seaDesc')}
            distance={tAttr('seaDistance')}
            delay={0.3}
          />
        </div>
      </Section>

      {/* Reviews */}
      <Section className="bg-white">
        <SectionHeading title={t('reviewsTitle')} />
        <div className="grid md:grid-cols-3 gap-6">
          <ReviewCard name={tReviews('review1Name')} text={tReviews('review1Text')} />
          <ReviewCard name={tReviews('review2Name')} text={tReviews('review2Text')} delay={0.1} />
          <ReviewCard name={tReviews('review3Name')} text={tReviews('review3Text')} delay={0.2} />
        </div>
      </Section>

      {/* Instagram */}
      <Section>
        <SectionHeading title={t('instagramTitle')} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {instagramImages.map((seed, i) => (
            <a
              key={seed}
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image
                src={img(seed, 400, 400)}
                alt={`Instagram ${i + 1}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </a>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-forest text-cream text-center">
        <FadeIn>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold">{t('ctaTitle')}</h2>
          <p className="mt-4 text-cream/80 max-w-xl mx-auto">{t('ctaSubtitle')}</p>
          <div className="mt-8 flex justify-center">
            <BookingButtons />
          </div>
        </FadeIn>
      </Section>
    </>
  );
}
