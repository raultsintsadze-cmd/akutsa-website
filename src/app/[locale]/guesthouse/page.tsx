import Image from 'next/image';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import BookingButtons from '@/components/ui/BookingButtons';
import FadeIn from '@/components/ui/FadeIn';
import { ROOM_IMAGES, GUESTHOUSE_SHARED_IMAGES } from '@/lib/images';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'guesthousePage' });
  return { title: t('title'), description: t('description') };
}

const ROOMS = [
  { nameKey: 'room1Name', bedsKey: 'room1Beds', image: ROOM_IMAGES.lemon },
  { nameKey: 'room2Name', bedsKey: 'room2Beds', image: ROOM_IMAGES.strawberry },
  { nameKey: 'room3Name', bedsKey: 'room3Beds', image: ROOM_IMAGES.blueberry },
  { nameKey: 'room4Name', bedsKey: 'room4Beds', image: ROOM_IMAGES.fig }
];

const SHARED_AMENITIES = [
  { labelKey: 'sharedKitchenLabel', image: GUESTHOUSE_SHARED_IMAGES.kitchen },
  { labelKey: 'sharedBathroomLabel', image: GUESTHOUSE_SHARED_IMAGES.bathroom },
  { labelKey: 'sharedTerraceLabel', image: GUESTHOUSE_SHARED_IMAGES.terrace },
  { labelKey: 'sharedDinerLabel', image: GUESTHOUSE_SHARED_IMAGES.diner }
];

const AMENITY_KEYS = Array.from({ length: 9 }, (_, i) => `amenity${i + 1}`);
const PRICE = '90';

export default function GuesthousePage() {
  const t = useTranslations('guesthousePage');
  const tCommon = useTranslations('common');

  return (
    <>
      <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center">
        <Image
          src={GUESTHOUSE_SHARED_IMAGES.terrace}
          alt={t('title')}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-forest/50" />
        <div className="relative z-10 text-center text-cream container-px max-w-2xl">
          <FadeIn>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold">{t('title')}</h1>
            <p className="mt-4 text-cream/90">{t('subtitle')}</p>
          </FadeIn>
        </div>
      </section>

      <Section>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <FadeIn>
              <p className="text-forest/80 leading-relaxed">{t('description')}</p>
            </FadeIn>

            <div className="mt-10">
              <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
                {t('roomsTitle')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {ROOMS.map((room, i) => (
                  <FadeIn key={room.nameKey} delay={i * 0.1}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                      <div className="relative h-48">
                        <Image
                          src={room.image}
                          alt={t(room.nameKey)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-medium text-forest">{t(room.nameKey)}</h3>
                        <p className="mt-1 text-sm text-forest/70">{t(room.bedsKey)}</p>
                        <p className="mt-2 text-gold font-medium text-sm">
                          {tCommon('fromPrice', { price: PRICE })}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
                {t('sharedAmenitiesTitle')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {SHARED_AMENITIES.map((item, i) => (
                  <FadeIn key={item.labelKey} delay={i * 0.1}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                      <div className="relative h-48">
                        <Image
                          src={item.image}
                          alt={t(item.labelKey)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-forest text-sm">{t(item.labelKey)}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
                {t('amenitiesTitle')}
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {AMENITY_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-forest/80 text-sm">
                    <span className="text-gold mt-0.5">&#10003;</span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit lg:sticky lg:top-28">
            <p className="text-gold font-medium text-lg">
              {tCommon('fromPrice', { price: PRICE })}
            </p>
            <p className="text-forest/60 text-sm mt-1">{tCommon('perNight')}</p>
            <BookingButtons className="mt-6" />
          </div>
        </div>
      </Section>
    </>
  );
}
