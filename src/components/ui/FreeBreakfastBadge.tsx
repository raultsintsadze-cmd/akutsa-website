import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';

// Direct-booking perk. `onDark` is for use over photos/dark backgrounds (home hero).
export default function FreeBreakfastBadge({
  onDark = false,
  className
}: {
  onDark?: boolean;
  className?: string;
}) {
  const t = useTranslations('common');
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold leading-tight',
        onDark
          ? 'bg-gold text-forest shadow-md'
          : 'bg-gold/15 text-forest border border-gold/40',
        className
      )}
    >
      <span aria-hidden>☕</span>
      {t('freeBreakfastBadge')}
    </span>
  );
}
