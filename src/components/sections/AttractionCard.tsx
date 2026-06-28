import Image from 'next/image';
import { useTranslations } from 'next-intl';
import FadeIn from '@/components/ui/FadeIn';

export default function AttractionCard({
  image,
  name,
  description,
  distance,
  delay = 0
}: {
  image: string;
  name: string;
  description: string;
  distance: string;
  delay?: number;
}) {
  const t = useTranslations('common');

  return (
    <FadeIn delay={delay}>
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="relative h-48">
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
        <div className="p-5">
          <h3 className="font-serif text-lg text-forest font-semibold">{name}</h3>
          <p className="mt-2 text-forest/70 text-sm">{description}</p>
          <p className="mt-3 text-xs text-gold font-medium uppercase tracking-wide">
            {t('distance')}: {distance}
          </p>
        </div>
      </div>
    </FadeIn>
  );
}
