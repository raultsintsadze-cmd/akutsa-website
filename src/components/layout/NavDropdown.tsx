'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';

type DropdownItem = {
  href: string | { pathname: string; query?: Record<string, string> };
  label: string;
};

export function DesktopNavDropdown({ label, items }: { label: string; items: DropdownItem[] }) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1 text-forest/80 hover:text-gold transition-colors"
      >
        {label}
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
        <div className="bg-cream border border-forest/10 rounded-xl shadow-lg py-2 w-56">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block px-4 py-2 text-sm text-forest/80 hover:bg-forest/5 hover:text-gold transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
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

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-forest/80 hover:text-gold transition-colors text-base"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 ml-4 flex flex-col gap-3 border-l border-forest/10 pl-4">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
              className="text-forest/70 hover:text-gold transition-colors text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
