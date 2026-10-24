'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFloatingButtons } from '@/context/FloatingButtonsContext';
import { TELEGRAM_URL, WHATSAPP_URL } from '@/lib/constants';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5 shrink-0" aria-hidden>
    <path d="M16 0C7.16 0 0 7.16 0 16c0 2.85.74 5.53 2.04 7.86L0 32l8.34-2.02A15.9 15.9 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.27 19.41c-.4-.2-2.36-1.16-2.72-1.3-.36-.13-.63-.2-.9.2-.26.4-1.02 1.3-1.25 1.56-.23.27-.46.3-.86.1-.4-.2-1.68-.62-3.2-1.98-1.18-1.05-1.98-2.36-2.21-2.76-.23-.4-.02-.62.18-.82.2-.2.45-.5.67-.76.22-.26.3-.45.45-.75.15-.3.07-.55-.05-.75-.13-.2-.83-2-1.14-2.74-.3-.7-.6-.6-.83-.6h-.7c-.24 0-.62.1-.95.45-.32.36-1.25 1.22-1.25 2.97s1.28 3.44 1.46 3.68c.18.24 2.46 3.76 6 5.13 3.53 1.36 3.53.9 4.16.85.64-.06 2.06-.84 2.36-1.66.3-.82.3-1.52.2-1.66-.08-.14-.36-.22-.76-.42z" />
  </svg>
);
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0" aria-hidden>
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.57 8.16-1.79 8.45c-.13.6-.49.75-.99.47l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.79 5.1-4.6c.22-.2-.05-.31-.34-.11l-6.3 3.97-2.72-.85c-.59-.18-.6-.59.12-.87l10.63-4.1c.49-.18.92.12.76.91z" />
  </svg>
);

// Phones only: one sticky action bar instead of floating bubbles. The page reserves its
// height via body padding (globals.css), so it never covers content.
export default function MobileBookingBar() {
  const { hideFloatingButtons } = useFloatingButtons();
  const t = useTranslations('nav');
  const [more, setMore] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!more) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setMore(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [more]);

  if (hideFloatingButtons) return null;

  const cell = 'flex-1 flex items-center justify-center gap-1.5 h-bar text-sm font-semibold';
  return (
    <div
      ref={ref}
      data-testid="mobile-action-bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-forest pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
    >
      {more && (
        <div className="absolute bottom-full right-2 mb-2 rounded-card bg-cream shadow-xl border border-forest/10 py-1">
          <Link
            href="/tour-planner"
            onClick={() => setMore(false)}
            className="flex items-center gap-2 min-h-11 px-4 text-sm font-medium text-forest"
          >
            ✨ {t('tourPlanner')}
          </Link>
        </div>
      )}
      <div className="flex divide-x divide-white/15">
        <Link href="/book" className={`${cell} bg-gold text-ink`}>
          {t('book')}
        </Link>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${cell} text-white`} aria-label="WhatsApp">
          <WhatsAppIcon />
          <span className="max-[359px]:sr-only">WhatsApp</span>
        </a>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${cell} text-white`} aria-label="Telegram">
          <TelegramIcon />
          <span className="max-[359px]:sr-only">Telegram</span>
        </a>
        <button
          type="button"
          aria-label={t('tourPlanner')}
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
          className="w-12 shrink-0 h-bar flex items-center justify-center text-cream text-xl"
        >
          ⋯
        </button>
      </div>
    </div>
  );
}
