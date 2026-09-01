import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import Section from '@/components/ui/Section';
import FadeIn from '@/components/ui/FadeIn';
import BookingButtons from '@/components/ui/BookingButtons';
import { TOURS_IMAGES, MASTERCLASS_IMAGES, PICNIC_IMAGES } from '@/lib/images';
import { SITE_URL } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'rtveli' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: `${SITE_URL}/${locale}/rtveli` }
  };
}

const STEPS = [
  { emoji: '🚐', colorClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  { emoji: '💧', colorClass: 'bg-sky-100 text-sky-700 border-sky-200' },
  { emoji: '🍇', colorClass: 'bg-purple-100 text-purple-700 border-purple-200' },
  { emoji: '🍽️', colorClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  { emoji: '🏡', colorClass: 'bg-green-100 text-green-700 border-green-200' }
] as const;

export default function RtveliPage() {
  const t = useTranslations('rtveli');
  const tCommon = useTranslations('common');

  const steps = [
    { time: t('step1Time'), title: t('step1Title'), desc: t('step1Desc') },
    { time: t('step2Time'), title: t('step2Title'), desc: t('step2Desc') },
    { time: t('step3Time'), title: t('step3Title'), desc: t('step3Desc') },
    { time: t('step4Time'), title: t('step4Title'), desc: t('step4Desc') },
    { time: t('step5Time'), title: t('step5Title'), desc: t('step5Desc') }
  ];

  return (
    <>
      {/* ── Autumn Hero ──────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <Image
          src={TOURS_IMAGES[0]}
          alt={t('heroTitle')}
          fill
          priority
          className="object-cover"
        />
        {/* Warm amber-to-forest gradient overlay — autumn feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/75 via-amber-800/55 to-forest/70" />

        {/* Decorative leaf/grape motif strip at top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="relative z-10 text-center text-cream container-px max-w-3xl px-6">
          <FadeIn>
            {/* Season badge */}
            <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              🍂 {t('seasonNote')}
            </span>

            {/* Decorative grape cluster */}
            <div className="text-5xl mb-2 select-none" aria-hidden>🍇</div>

            <h1 className="font-serif text-5xl md:text-7xl font-semibold leading-none text-amber-100 drop-shadow-lg">
              {t('heroTitle')}
            </h1>
            <p className="mt-2 font-serif text-xl md:text-2xl text-amber-200/90 italic">
              {t('heroSubtitle')}
            </p>
            <p className="mt-6 text-base md:text-lg text-cream/85 max-w-2xl mx-auto leading-relaxed">
              {t('heroDesc')}
            </p>
            <div className="mt-8 flex justify-center">
              <BookingButtons />
            </div>
          </FadeIn>
        </div>

        {/* Bottom fade to cream */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />
      </section>

      {/* ── Itinerary ─────────────────────────────────────────── */}
      <Section>
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-forest font-semibold">
              {t('itineraryTitle')}
            </h2>
            <div className="mt-2 flex justify-center gap-1" aria-hidden>
              {'🍇🍂🌿'.split('').map((ch, i) => (
                <span key={i} className="text-xl">{ch}</span>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="max-w-2xl mx-auto">
          {steps.map((step, i) => {
            const meta = STEPS[i];
            const isLast = i === steps.length - 1;
            return (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex gap-5">
                  {/* Left: connector line + icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl shrink-0 shadow-sm ${meta.colorClass}`}
                    >
                      {meta.emoji}
                    </div>
                    {!isLast && (
                      <div className="flex-1 w-0.5 bg-gradient-to-b from-amber-300 to-amber-100 my-1 min-h-[2.5rem]" />
                    )}
                  </div>

                  {/* Right: content */}
                  <div className={`pb-8 ${isLast ? '' : ''}`}>
                    <span className="inline-block bg-gold/15 text-gold text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1">
                      {step.time}
                    </span>
                    <h3 className="font-serif text-xl text-forest font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-forest/70 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </Section>

      {/* ── Photo strip ───────────────────────────────────────── */}
      <div className="overflow-hidden">
        <div className="flex gap-1 h-48 md:h-64">
          {[MASTERCLASS_IMAGES[0], TOURS_IMAGES[2], PICNIC_IMAGES[0], MASTERCLASS_IMAGES[3], TOURS_IMAGES[4]].map(
            (src, i) => (
              <div key={i} className="relative flex-1 overflow-hidden">
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Overnight option ──────────────────────────────────── */}
      <Section>
        <FadeIn>
          <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden grid md:grid-cols-2 shadow-lg border border-amber-200/60">
            <div className="relative h-56 md:h-auto">
              <Image
                src={TOURS_IMAGES[1]}
                alt={t('overnightTitle')}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-amber-900/30" />
            </div>
            <div className="bg-amber-50 p-8 flex flex-col justify-center">
              <div className="text-3xl mb-2" aria-hidden>🌙</div>
              <h3 className="font-serif text-2xl text-forest font-semibold">
                {t('overnightTitle')}
              </h3>
              <p className="mt-3 text-forest/70 text-sm leading-relaxed">
                {t('overnightDesc')}
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-forest transition-colors"
              >
                {t('overnightCta')} →
              </Link>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── Pricing & CTA ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-900 via-forest to-forest text-cream py-20 px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-4xl mb-4" aria-hidden>🍇</div>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-amber-100">
              {t('bookCta')}
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-sm px-4 py-2 rounded-full">
              <span>💰</span> {t('pricingNote')}
            </div>
            <p className="mt-3 text-cream/60 text-xs uppercase tracking-widest">
              🍂 {t('seasonNote')}
            </p>
            <div className="mt-8 flex justify-center">
              <BookingButtons />
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
