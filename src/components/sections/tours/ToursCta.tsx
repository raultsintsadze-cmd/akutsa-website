import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getTours } from '@/lib/tours/catalog';

// "Tours & activities" band, optionally listing specific tours.
export default async function ToursCta({ locale, slugs }: { locale: Locale; slugs?: string[] }) {
  const all = await getTours();
  const tours = slugs ? all.filter((tour) => slugs.includes(tour.slug)) : all;
  if (slugs && tours.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'tours' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });
  return (
    <aside className="rounded-2xl bg-forest text-cream p-6 md:p-8">
      <h2 className="font-serif text-2xl font-semibold">🧭 {tNav('tours')}</h2>
      <p className="mt-2 text-cream/80 text-sm">{t('subtitle')}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tours.map((tour) => (
          <Link
            key={tour.slug}
            href={`/${locale}/tours/${tour.slug}`}
            className="rounded-full border border-cream/30 px-4 py-2 text-sm hover:border-gold hover:text-gold"
          >
            {tour.name[locale]}
          </Link>
        ))}
        <Link href={`/${locale}/tours`} className="rounded-full bg-gold text-forest px-4 py-2 text-sm font-semibold">
          {t('backToTours')} →
        </Link>
      </div>
    </aside>
  );
}

// Which tours a blog post is about (fishing, mushrooms, wine, honey), by keyword stems.
const TOPICS: Record<string, string[]> = {
  fishing: ['fishing', 'fish', 'рыбал', 'рыб', 'თევზ'],
  'mushroom-picking': ['mushroom', 'гриб', 'სოკო'],
  'wine-cellar': ['wine', 'вино', 'винн', 'ღვინ', 'მარან'],
  'honey-bees': ['honey', 'beekeep', 'мёд', 'пчел', 'пчёл', 'пасек', 'пасеч', 'თაფლ', 'ფუტკ']
};

export function tourSlugsForText(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.keys(TOPICS).filter((slug) => TOPICS[slug].some((stem) => lower.includes(stem)));
}
