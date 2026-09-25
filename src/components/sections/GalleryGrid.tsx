'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { galleryImages } from '@/lib/images';
import { clsx } from 'clsx';
import Lightbox from '@/components/ui/Lightbox';

const filters = ['all', 'guesthouse', 'cottage', 'camper', 'nature'] as const;

export default function GalleryGrid() {
  const t = useTranslations('gallery');
  const [active, setActive] = useState<(typeof filters)[number]>('all');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filterLabels: Record<(typeof filters)[number], string> = {
    all: t('filterAll'),
    guesthouse: t('filterGuesthouse'),
    cottage: t('filterCottage'),
    camper: t('filterCamper'),
    nature: t('filterNature')
  };

  const images =
    active === 'all'
      ? galleryImages
      : galleryImages.filter((image) => image.category === active);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => {
              setActive(f);
              setLightbox(null);
            }}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
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
            onClick={() => setLightbox(i)}
            className="relative aspect-square rounded-xl overflow-hidden group cursor-zoom-in"
          >
            <Image
              src={image.src}
              alt={image.category}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images.map((image) => image.src)}
        index={lightbox}
        alt={filterLabels[active]}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </div>
  );
}
