import Image from 'next/image';
import { useTranslations } from 'next-intl';
import FadeIn from '@/components/ui/FadeIn';
import { mapsSearchUrl } from '@/lib/constants';
import { clsx } from 'clsx';

export default function AttractionCard({
  images,
  name,
  description,
  distance,
  mapsQuery,
  delay = 0
}: {
  images: readonly string[];
  name: string;
  description: string;
  distance: string;
  mapsQuery: string;
  delay?: number;
}) {
  const t = useTranslations('common');
  const tContact = useTranslations('contact');

  return (
    <FadeIn delay={delay}>
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm h-full flex flex-col">
        <div
          className={clsx('relative h-48', images.length > 1 && 'grid grid-cols-2 gap-0.5')}
        >
          {images.map((src, i) => (
            <div key={src} className={clsx('relative', images.length === 1 && 'h-48')}>
              <Image src={src} alt={`${name} ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-serif text-lg text-forest font-semibold">{name}</h3>
          <p className="mt-2 text-forest/70 text-sm flex-1">{description}</p>
          <p className="mt-3 text-xs text-gold font-medium uppercase tracking-wide">
            {t('distance')}: {distance}
          </p>
          <a
            href={mapsSearchUrl(mapsQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-forest text-cream px-4 py-2 text-xs font-medium hover:bg-forest/90 transition-colors"
          >
            {tContact('viewOnMaps')}
          </a>
        </div>
      </div>
    </FadeIn>
  );
}
