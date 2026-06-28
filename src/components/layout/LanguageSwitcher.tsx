'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      {locales.map((l: Locale, i) => (
        <span key={l} className="flex items-center">
          <button
            onClick={() => router.replace(pathname, { locale: l })}
            className={
              l === locale
                ? 'text-gold uppercase'
                : 'text-forest/60 hover:text-forest uppercase transition-colors'
            }
            aria-label={localeNames[l]}
          >
            {l}
          </button>
          {i < locales.length - 1 && (
            <span className="mx-1 text-forest/30">/</span>
          )}
        </span>
      ))}
    </div>
  );
}
