import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Section from '@/components/ui/Section';
import BookingButtons from '@/components/ui/BookingButtons';
import FadeIn from '@/components/ui/FadeIn';
import { img } from '@/lib/images';

export default function PropertyPageTemplate({
  namespace,
  heroSeed,
  gallerySeeds,
  price,
  rooms
}: {
  namespace: 'guesthousePage' | 'cottagePage' | 'camperPage';
  heroSeed: string;
  gallerySeeds: string[];
  price: string;
  rooms?: { nameKey: string; descKey: string }[];
}) {
  const t = useTranslations(namespace);
  const tCommon = useTranslations('common');

  const amenityKeys = Array.from({ length: 8 }, (_, i) => `amenity${i + 1}`);

  return (
    <>
      <section className="relative h-[60vh] min-h-[420px] flex items-center justify-center">
        <Image src={img(heroSeed, 1920, 1100)} alt={t('title')} fill priority className="object-cover" />
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

            {rooms && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
                  {t('roomsTitle')}
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {rooms.map((room, i) => (
                    <FadeIn key={room.nameKey} delay={i * 0.1}>
                      <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h3 className="font-medium text-forest">{t(room.nameKey)}</h3>
                        <p className="mt-2 text-sm text-forest/70">{t(room.descKey)}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
                {t('amenitiesTitle')}
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {amenityKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-forest/80 text-sm">
                    <span className="text-gold mt-0.5">&#10003;</span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit lg:sticky lg:top-28">
            <p className="text-gold font-medium text-lg">{tCommon('fromPrice', { price })}</p>
            <p className="text-forest/60 text-sm mt-1">{tCommon('perNight')}</p>
            <BookingButtons className="mt-6" />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-serif text-2xl text-forest font-semibold mb-5">
            {tCommon('gallery')}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gallerySeeds.map((seed) => (
              <div key={seed} className="relative h-56 rounded-xl overflow-hidden">
                <Image src={img(seed)} alt={t('title')} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
