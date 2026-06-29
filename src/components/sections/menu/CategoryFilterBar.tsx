'use client';

import { clsx } from 'clsx';
import type { MenuCategory } from '@/lib/menuData';
import type { Locale } from '@/i18n/config';

export default function CategoryFilterBar({
  categories,
  locale,
  activeId,
  onSelect
}: {
  categories: MenuCategory[];
  locale: Locale;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-20 z-30 -mx-6 px-6 bg-cream/95 backdrop-blur-sm border-b border-forest/10 py-3 mb-10">
      <div className="flex flex-wrap justify-center gap-2 max-w-7xl mx-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeId === category.id
                ? 'bg-forest text-cream'
                : 'bg-white text-forest/70 hover:bg-forest/10'
            )}
          >
            {category.label[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
