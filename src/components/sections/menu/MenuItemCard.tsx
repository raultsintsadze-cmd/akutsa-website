import type { MenuItem } from '@/lib/menuData';
import type { Locale } from '@/i18n/config';

export default function MenuItemCard({
  item,
  locale,
  currency,
  qty,
  onChange
}: {
  item: MenuItem;
  locale: Locale;
  currency: string;
  qty: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="pr-3">
        <p className="font-medium text-forest text-sm">{item.name[locale]}</p>
        <p className="text-gold text-sm mt-1 font-medium">
          {item.price} {currency}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onChange(-1)}
          disabled={qty === 0}
          aria-label="-"
          className="w-8 h-8 rounded-full bg-cream text-forest font-medium disabled:opacity-40 hover:bg-forest/10 transition-colors"
        >
          &minus;
        </button>
        <span className="w-5 text-center font-medium text-forest">{qty}</span>
        <button
          type="button"
          onClick={() => onChange(1)}
          aria-label="+"
          className="w-8 h-8 rounded-full bg-forest text-cream font-medium hover:bg-forest/90 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
