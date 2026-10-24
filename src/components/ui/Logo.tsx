import { clsx } from 'clsx';

// Circle emblem (mountains + house) with the "AKUTSA / GUEST HOUSE" wordmark.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="23" fill="rgb(var(--color-forest))" />
      <circle cx="24" cy="24" r="20.5" fill="none" stroke="rgb(var(--color-gold))" strokeWidth="1.2" />
      {/* mountains */}
      <path d="M7 33 L17 19 L23 27 L29 16 L41 33 Z" fill="rgb(var(--color-gold))" />
      <path d="M29 16 L32.2 20.4 L30.2 19.6 L28.6 21.4 L26.8 19.8 Z" fill="rgb(var(--color-cream))" />
      {/* house */}
      <path d="M18.5 33 V28.4 L23 24.6 L27.5 28.4 V33 Z" fill="rgb(var(--color-cream))" />
      <rect x="21.7" y="29.6" width="2.6" height="3.4" fill="rgb(var(--color-forest))" />
      <path d="M8.5 35.5 H39.5" stroke="rgb(var(--color-cream))" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export default function Logo({
  className,
  compact = false,
  wordmarkClassName
}: {
  className?: string;
  compact?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={compact ? 'w-9 h-9' : 'w-10 h-10 md:w-11 md:h-11'} />
      <span className={clsx('flex flex-col leading-none', wordmarkClassName)}>
        <span className="font-serif text-lg md:text-xl font-semibold tracking-[0.12em] text-forest">AKUTSA</span>{' '}
        <span className="mt-1 text-[9px] md:text-[10px] font-semibold tracking-[0.28em] text-gold">GUEST HOUSE</span>
      </span>
    </span>
  );
}
