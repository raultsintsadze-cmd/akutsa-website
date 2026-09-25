'use client';

import { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import Lightbox from '@/components/ui/Lightbox';

export default function PhotoGrid({
  images,
  alt,
  className,
  imageClassName = 'aspect-square rounded-lg',
  gridClassName = 'grid-cols-3 sm:grid-cols-5 gap-2'
}: {
  images: readonly string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  gridClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className={clsx('grid', gridClassName, className)}>
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${alt} ${i + 1}`}
            className={clsx('group relative overflow-hidden cursor-zoom-in', imageClassName)}
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              sizes="(max-width: 640px) 33vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </button>
        ))}
      </div>
      <Lightbox images={images} index={open} alt={alt} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
}
