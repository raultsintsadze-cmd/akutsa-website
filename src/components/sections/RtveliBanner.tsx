'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function RtveliBanner() {
  const t = useTranslations('rtveli');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 text-cream">
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

      <div className="container-px max-w-7xl mx-auto py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>🍇</span>
          <div className="min-w-0">
            <span className="font-semibold text-amber-100 text-sm">
              {t('bannerTitle')}
            </span>
            <span className="hidden sm:inline text-amber-200/80 text-sm ml-2">
              — {t('bannerDesc')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/rtveli"
            className="bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wide px-4 py-1.5 rounded-full hover:bg-white transition-colors whitespace-nowrap"
          >
            {t('bannerCta')} →
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-amber-300 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
