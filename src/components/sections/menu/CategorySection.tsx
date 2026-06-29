import FadeIn from '@/components/ui/FadeIn';
import LeafDivider from './LeafDivider';
import MenuItemCard from './MenuItemCard';
import type { MenuCategory } from '@/lib/menuData';
import type { Locale } from '@/i18n/config';

export default function CategorySection({
  category,
  locale,
  currency,
  quantities,
  onChangeQty,
  registerRef
}: {
  category: MenuCategory;
  locale: Locale;
  currency: string;
  quantities: Record<string, number>;
  onChangeQty: (itemId: string, delta: number) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
}) {
  return (
    <div id={`category-${category.id}`} ref={(el) => registerRef(category.id, el)} className="pt-6">
      <FadeIn>
        <h2 className="text-center font-serif text-2xl md:text-3xl text-forest font-semibold">
          {category.label[locale]}
        </h2>
        <LeafDivider />
      </FadeIn>

      <div className="grid sm:grid-cols-2 gap-4">
        {category.items.map((item, i) => (
          <FadeIn key={item.id} delay={Math.min(i * 0.05, 0.3)}>
            <MenuItemCard
              item={item}
              locale={locale}
              currency={currency}
              qty={quantities[item.id] ?? 0}
              onChange={(delta) => onChangeQty(item.id, delta)}
            />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
