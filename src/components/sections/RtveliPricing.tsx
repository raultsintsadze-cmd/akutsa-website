import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { RTVELI_PRICES } from '@/lib/constants';
import { RTVELI_PROMO } from '@/lib/rtveli-promo';
import type { Locale } from '@/i18n/config';

// `promo`: show the promo prices (pass isPromoActive() from the server).
export default function RtveliPricing({ className, promo = false }: { className?: string; promo?: boolean }) {
  const t = useTranslations('rtveli');
  const locale = useLocale() as Locale;

  const options = [
    { label: t('priceWith'), price: RTVELI_PRICES.with, promoPrice: RTVELI_PROMO.prices.with, icon: '🚐' },
    { label: t('priceWithout'), price: RTVELI_PRICES.without, promoPrice: RTVELI_PROMO.prices.without, icon: '📍' }
  ];
  const included = [
    t('included1'),
    t('included2'),
    t('included3'),
    t('included4'),
    t('included5'),
    t('includedTransfer')
  ];

  return (
    <div className={clsx('rounded-3xl border border-amber-200/60 bg-amber-50 p-6 md:p-8', className)}>
      <h3 className="font-serif text-2xl text-forest font-semibold text-center">{t('pricingTitle')}</h3>

      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <div key={o.price} className="rounded-2xl bg-white border border-amber-100 p-4 text-center">
            <div className="text-sm text-forest/70">
              <span aria-hidden>{o.icon}</span> {o.label}
            </div>
            {promo ? (
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <s className="text-forest/40 text-lg">{o.price}</s>
                <span className="font-serif text-3xl text-amber-800 font-semibold">{o.promoPrice}</span>
              </div>
            ) : (
              <div className="mt-1 font-serif text-3xl text-amber-800 font-semibold">{o.price}</div>
            )}
            <div className="text-xs text-forest/60">{t('perPerson')}</div>
          </div>
        ))}
      </div>

      {promo && (
        <p className="mt-3 text-center text-sm font-semibold text-amber-800">🍇 {RTVELI_PROMO.text[locale].onlyDate}</p>
      )}

      <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-gold">{t('includedTitle')}</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-forest/80">
        {included.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="text-gold mt-0.5">&#10003;</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
