import Image from 'next/image';
import { clsx } from 'clsx';

export default function PhotoGrid({
  images,
  alt,
  className,
  imageClassName,
  gridClassName = 'grid-cols-3 sm:grid-cols-5 gap-2'
}: {
  images: readonly string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  gridClassName?: string;
}) {
  return (
    <div className={clsx('grid', gridClassName, className)}>
      {images.map((src, i) => (
        <div
          key={src}
          className={clsx('relative aspect-square rounded-lg overflow-hidden', imageClassName)}
        >
          <Image src={src} alt={`${alt} ${i + 1}`} fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
