'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';

export type DropdownItem = {
  href: string | { pathname: string; query?: Record<string, string> };
  label: string;
  // Optional thumbnail and second line (e.g. "from 90 GEL / night").
  image?: string;
  sub?: string;
  // Rendered as a highlighted call to action (last entry).
  highlight?: boolean;
};

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-md';

function ItemContent({ item }: { item: DropdownItem }) {
  if (!item.image && !item.sub) return <>{item.label}</>;
  return (
    <span className="flex items-center gap-3">
      {item.image && (
        <span className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-forest/10">
          <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block whitespace-nowrap">{item.label}</span>
        {item.sub && <span className="block text-xs text-gold font-medium whitespace-nowrap">{item.sub}</span>}
      </span>
    </span>
  );
}

// Opens on hover (pointer devices) and on click/tap; Esc closes and returns focus to the button.
export function DesktopNavDropdown({ label, items, wide = false }: { label: string; items: DropdownItem[]; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      // Hover only for mouse/pen; a tap fires the button's click instead.
      onPointerEnter={(e) => e.pointerType !== 'touch' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType !== 'touch' && setOpen(false)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={clsx('flex items-center gap-1 whitespace-nowrap text-forest/80 hover:text-gold transition-colors', focusRing)}
      >
        {label}
        <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute left-0 top-full pt-2 z-50"
      >
        <ul className={clsx('bg-cream border border-forest/10 rounded-xl shadow-lg py-2', wide ? 'w-72' : 'w-56')}>
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-4 py-2 text-sm transition-colors',
                  focusRing,
                  item.highlight
                    ? 'mt-1 border-t border-forest/10 pt-3 font-semibold text-forest hover:text-gold'
                    : 'text-forest/80 hover:bg-forest/5 hover:text-gold'
                )}
              >
                <ItemContent item={item} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MobileNavDropdown({
  label,
  items,
  onNavigate
}: {
  label: string;
  items: DropdownItem[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx('flex items-center justify-between w-full py-1 text-forest/80 hover:text-gold transition-colors text-base', focusRing)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {label}
        <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div id={panelId} hidden={!open} className="mt-2 ml-4 border-l border-forest/10 pl-4">
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
                className={clsx(
                  'block transition-colors text-sm',
                  focusRing,
                  item.highlight ? 'font-semibold text-forest' : 'text-forest/70 hover:text-gold'
                )}
              >
                <ItemContent item={item} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
