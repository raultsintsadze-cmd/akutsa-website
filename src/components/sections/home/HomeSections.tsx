import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import SectionHeading from '@/components/ui/SectionHeading';
import { GUESTHOUSE_SHARED_IMAGES, COTTAGE_IMAGES, CAMPER_IMAGES } from '@/lib/images';
import {
  GOOGLE_MAPS_EMBED_SRC,
  GOOGLE_MAPS_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
  TELEGRAM_URL,
  WHATSAPP_URL
} from '@/lib/constants';
import { getTours } from '@/lib/tours/catalog';
import type { Tour } from '@/lib/tours/types';
import type { Locale } from '@/i18n/config';

const cardImgSizes = '(max-width: 767px) 82vw, 33vw';

// Swipe row on phones (scroll-snap with a peek of the next card), 3-column grid from md.
export function StayCards() {
  const t = useTranslations('home');
  const tProps = useTranslations('properties');
  const stays = [
    { href: '/guesthouse', image: GUESTHOUSE_SHARED_IMAGES.terrace, name: tProps('guesthouse.name'), price: tProps('guesthouse.price'), features: [t('gh1'), t('gh2'), t('gh3')] },
    { href: '/cottage', image: COTTAGE_IMAGES[0], name: tProps('cottage.name'), price: tProps('cottage.price'), features: [t('co1'), t('co2'), t('co3')] },
    { href: '/camper', image: CAMPER_IMAGES[0], name: tProps('camper.name'), price: tProps('camper.price'), features: [t('ca1'), t('ca2'), t('ca3')] }
  ];
  return (
    <ul className="swipe-row" data-testid="stay-cards">
      {stays.map((s) => (
        <li key={s.href} className="bg-white rounded-card overflow-hidden shadow-sm flex flex-col">
          <div className="relative aspect-[4/3]">
            <Image src={s.image} alt={s.name} fill sizes={cardImgSizes} className="object-cover" />
          </div>
          <div className="p-4 md:p-5 flex flex-col flex-1">
            <h3 className="font-serif text-xl text-forest font-semibold">{s.name}</h3>
            <p className="mt-1 text-gold font-semibold">{t('fromPriceShort', { price: s.price })}</p>
            <ul className="mt-3 space-y-1 text-sm text-forest/75 flex-1">
              {s.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-gold" aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={s.href}
              className="mt-4 inline-flex items-center justify-center min-h-11 rounded-pill border border-forest/20 text-forest font-semibold text-sm hover:bg-forest hover:text-cream transition-colors"
            >
              {t('view')} →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WhyAkutsa() {
  const t = useTranslations('home');
  const tiles = [
    { icon: '🚗', title: t('why1'), text: t('why1d') },
    { icon: '☕', title: t('why2'), text: t('why2d') },
    { icon: '🍲', title: t('why3'), text: t('why3d') },
    { icon: '🧭', title: t('why4'), text: t('why4d'), href: '/tours' }
  ];
  return (
    <>
      <SectionHeading title={t('whyTitle')} />
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 -mt-4 md:mt-0">
        {tiles.map((x) => {
          const body = (
            <>
              <span className="text-2xl" aria-hidden>{x.icon}</span>
              <span className="mt-2 block font-semibold text-forest leading-snug">{x.title}</span>
              <span className="mt-1 block text-xs md:text-sm text-forest/75 leading-snug">{x.text}</span>
            </>
          );
          return (
            <li key={x.title} className="bg-white rounded-card p-4 shadow-sm">
              {x.href ? (
                <Link href={x.href} className="block">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function tourPrice(tour: Tour, t: (key: string, values?: Record<string, string | number>) => string): string {
  if (tour.priceType === 'on request' || tour.price === null) return t('onRequest');
  if (tour.priceType === 'per group')
    return tour.maxPeople ? t('perGroup', { price: tour.price, max: tour.maxPeople }) : t('perGroupNoMax', { price: tour.price });
  return t('perPerson', { price: tour.price });
}

export async function ToursCarousel({ locale }: { locale: Locale }) {
  const [tours, t, tHome] = await Promise.all([
    getTours(),
    getTranslations({ locale, namespace: 'tours' }),
    getTranslations({ locale, namespace: 'home' })
  ]);
  if (tours.length === 0) return null;
  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5 md:mb-8">
        <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">{tHome('toursTitle')}</h2>
        <Link href="/tours" className="shrink-0 min-h-11 inline-flex items-center text-sm font-semibold text-gold">
          {tHome('toursAll')} →
        </Link>
      </div>
      <ul className="swipe-row [--cols:4]" data-testid="tour-cards">
        {tours.map((tour) => (
          <li key={tour.slug} className="bg-white rounded-card overflow-hidden shadow-sm">
            <Link href={`/tours/${tour.slug}`} className="flex flex-col h-full">
              <div className="relative aspect-[4/3] bg-forest/10">
                {tour.image ? (
                  <Image src={tour.image} alt={tour.name[locale]} fill sizes={cardImgSizes} className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden>
                    {tour.dayType === 'Full day' ? '🌄' : '🧗'}
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-serif text-lg text-forest font-semibold">{tour.name[locale]}</h3>
                <p className="mt-1 text-sm text-forest/70 line-clamp-2 flex-1">{tour.description[locale]}</p>
                <p className="mt-2 text-sm font-semibold text-gold">{tourPrice(tour, t)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ContactMap() {
  const t = useTranslations('home');
  const tFooter = useTranslations('footer');
  const btn = 'flex items-center justify-center gap-2 min-h-12 rounded-pill font-semibold text-sm';
  return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold">{t('contactTitle')}</h2>
        <p className="mt-3 text-cream/80">{tFooter('address')}</p>
        <a href={PHONE_TEL} className="mt-2 inline-block min-h-11 py-2 text-lg font-semibold text-gold">
          {PHONE_DISPLAY}
        </a>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a href={PHONE_TEL} className={`${btn} bg-gold text-ink`}>📞 {t('call')}</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#075E54] text-white`}>WhatsApp</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1A6FA0] text-white`}>Telegram</a>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className={`${btn} border border-cream/30 text-cream`}>📍 {t('directions')}</a>
        </div>
      </div>
      <div className="rounded-card overflow-hidden aspect-[4/3] md:aspect-auto md:h-80 bg-forest/40">
        <iframe
          src={GOOGLE_MAPS_EMBED_SRC}
          title="Guest House Akutsa — map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
