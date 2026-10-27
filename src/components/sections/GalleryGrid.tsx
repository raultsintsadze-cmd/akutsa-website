'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { galleryImages } from '@/lib/images';
import { clsx } from 'clsx';
import Lightbox from '@/components/ui/Lightbox';
import type { NewsPhoto } from '@/lib/notion';

const filters = ['all', 'accommodation', 'tours', 'news'] as const;
type Filter = (typeof filters)[number];

// Static photos keep their own category; it maps onto the filter chips.
const STATIC_FILTER: Record<string, Filter> = {
  guesthouse: 'accommodation',
  cottage: 'accommodation',
  camper: 'accommodation',
  nature: 'tours'
};

interface Item {
  src: string;
  alt: string;
  filter: Filter;
  caption?: string;
  href?: string;
}

export default function GalleryGrid({ newsPhotos }: { newsPhotos: NewsPhoto[] }) {
  const t = useTranslations('gallery');
  const [active, setActive] = useState<Filter>('all');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filterLabels: Record<Filter, string> = {
    all: t('filterAll'),
    accommodation: t('filterAccommodation'),
    tours: t('filterTours'),
    news: t('filterNews')
  };

  // Static photos first, then news photos (already newest post first).
  const items: Item[] = [
    ...galleryImages.map((image) => ({
      src: image.src,
      alt: image.category,
      filter: STATIC_FILTER[image.category] ?? 'tours'
    })),
    ...newsPhotos.map((photo) => ({
      src: photo.src,
      alt: photo.title,
      filter: 'news' as const,
      caption: photo.title,
      href: photo.href
    }))
  ];
  const images = active === 'all' ? items : items.filter((item) => item.filter === active);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => {
              setActive(f);
              setLightbox(null);
            }}
            className={clsx(
              'px-4 min-h-11 rounded-full text-sm font-medium transition-colors',
              active === f
                ? 'bg-forest text-cream'
                : 'bg-white text-forest/70 hover:bg-forest/10'
            )}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setLightbox(i)}
            aria-label={image.caption ?? `${filterLabels[image.filter]} ${i + 1}`}
            className="relative aspect-square rounded-xl overflow-hidden group cursor-zoom-in"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 300px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images.map((image) => image.src)}
        captions={images.map((image) => image.caption ?? null)}
        links={images.map((image) => image.href ?? null)}
        linkLabel={t('openPost')}
        index={lightbox}
        alt={filterLabels[active]}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </div>
  );
}
