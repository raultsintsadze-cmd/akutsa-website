import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function StickyTourButton() {
  const t = useTranslations('tourGenerator');

  return (
    <div className="fixed bottom-5 left-5 z-50 group">
      <Link
        href="/tour-planner"
        aria-label={t('floatingLabel')}
        className="w-14 h-14 rounded-full bg-forest text-cream flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M12 2.5c.3 0 .55.2.62.49l.84 3.36a5.6 5.6 0 0 0 4.19 4.19l3.36.84a.64.64 0 0 1 0 1.24l-3.36.84a5.6 5.6 0 0 0-4.19 4.19l-.84 3.36a.64.64 0 0 1-1.24 0l-.84-3.36a5.6 5.6 0 0 0-4.19-4.19l-3.36-.84a.64.64 0 0 1 0-1.24l3.36-.84a5.6 5.6 0 0 0 4.19-4.19l.84-3.36c.07-.29.32-.49.62-.49z" />
          <path d="M19 2.5c.24 0 .45.16.5.4l.27 1.13a1.9 1.9 0 0 0 1.4 1.4l1.13.27a.5.5 0 0 1 0 .98l-1.13.27a1.9 1.9 0 0 0-1.4 1.4L19.5 9.5a.5.5 0 0 1-.98 0l-.27-1.13a1.9 1.9 0 0 0-1.4-1.4l-1.13-.27a.5.5 0 0 1 0-.98l1.13-.27a1.9 1.9 0 0 0 1.4-1.4l.27-1.13a.5.5 0 0 1 .48-.4z" />
        </svg>
      </Link>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-forest text-cream text-xs font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {t('floatingLabel')}
      </span>
    </div>
  );
}
