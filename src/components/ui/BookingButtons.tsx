import { useTranslations } from 'next-intl';
import { TELEGRAM_URL, WHATSAPP_URL } from '@/lib/constants';
import { clsx } from 'clsx';

export default function BookingButtons({
  className,
  size = 'md'
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  const t = useTranslations('common');
  const sizing = size === 'sm' ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base';

  return (
    <div className={clsx('flex flex-wrap gap-3', className)}>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          sizing,
          'rounded-full bg-forest text-cream font-medium hover:bg-forest/90 transition-colors'
        )}
      >
        {t('bookTelegram')}
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          sizing,
          'rounded-full bg-gold text-forest font-medium hover:bg-gold/90 transition-colors'
        )}
      >
        {t('bookWhatsapp')}
      </a>
    </div>
  );
}
