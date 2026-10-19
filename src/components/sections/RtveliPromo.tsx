import Link from 'next/link';
import { RTVELI_PRICES } from '@/lib/constants';
import { RTVELI_PROMO } from '@/lib/rtveli-promo';
import type { Locale } from '@/i18n/config';

// Big promo banner at the top of /rtveli. Render only while isPromoActive().
export function RtveliPromoBanner({ locale }: { locale: Locale }) {
  const tx = RTVELI_PROMO.text[locale];
  const rows = [
    { label: tx.priceWith, was: RTVELI_PRICES.with, now: RTVELI_PROMO.prices.with, icon: '🚐' },
    { label: tx.priceWithout, was: RTVELI_PRICES.without, now: RTVELI_PROMO.prices.without, icon: '📍' }
  ];
  return (
    <section aria-label={tx.headline} data-testid="rtveli-promo" className="relative bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 text-cream">
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
      <div className="container-px max-w-5xl mx-auto py-6 md:py-8 text-center">
        <p className="font-serif text-2xl md:text-3xl font-semibold text-amber-50">
          <span aria-hidden>🍇 </span>
          {tx.headline}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {rows.map((r) => (
            <div key={r.label} className="rounded-2xl bg-white/10 border border-amber-300/30 px-5 py-3">
              <div className="text-xs text-amber-100/80">
                <span aria-hidden>{r.icon}</span> {r.label}
              </div>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <s className="text-amber-200/70 text-base">{r.was}</s>
                <span className="font-serif text-3xl font-semibold text-white">{r.now}</span>
                <span className="text-sm text-amber-100">{tx.currency}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={`?date=${RTVELI_PROMO.date}#book`}
            className="rounded-full bg-amber-100 text-amber-900 px-6 py-3 text-sm font-bold hover:bg-white transition-colors"
          >
            {tx.book}
          </a>
          <Link
            href={`/${locale}/news/${RTVELI_PROMO.newsSlug}`}
            className="rounded-full border border-amber-200/60 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            {tx.news} →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Thin strip on the home page linking to /rtveli.
export function RtveliPromoStrip({ locale }: { locale: Locale }) {
  return (
    <Link
      href={`/${locale}/rtveli`}
      data-testid="rtveli-promo-strip"
      className="block bg-amber-700 text-amber-50 text-center text-sm font-semibold px-4 py-2.5 hover:bg-amber-800 transition-colors"
    >
      🍇 {RTVELI_PROMO.text[locale].strip} →
    </Link>
  );
}
