'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LanguageSwitcher({ large = false }: { large?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className={large ? 'flex items-center gap-2 text-base font-semibold' : 'flex items-center gap-1 text-sm font-medium'}>
      {locales.map((l: Locale, i) => (
        <span key={l} className="flex items-center">
          <button
            onClick={() => router.replace(pathname, { locale: l })}
            aria-current={l === locale ? 'true' : undefined}
            className={
              (large ? 'min-w-12 min-h-11 rounded-pill border px-3 ' : '') +
              (l === locale
                ? 'text-gold uppercase ' + (large ? 'border-gold' : '')
                : 'text-forest/60 hover:text-forest uppercase transition-colors ' + (large ? 'border-forest/15' : ''))
            }
            aria-label={localeNames[l]}
          >
            {l.toUpperCase()}
          </button>
          {!large && i < locales.length - 1 && (
            <span className="mx-1 text-forest/30">/</span>
          )}
        </span>
      ))}
    </div>
  );
}
