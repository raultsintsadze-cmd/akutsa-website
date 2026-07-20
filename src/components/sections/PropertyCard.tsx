import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FadeIn from '@/components/ui/FadeIn';

export default function PropertyCard({
  href,
  image,
  name,
  description,
  price,
  delay = 0
}: {
  href: string;
  image: string;
  name: string;
  description: string;
  price: string;
  delay?: number;
}) {
  const t = useTranslations('common');

  return (
    <FadeIn delay={delay}>
      <Link
        href={href}
        className="group block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="relative h-64 overflow-hidden">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-6">
          <h3 className="font-serif text-xl text-forest font-semibold">{name}</h3>
          <p className="mt-2 text-forest/70 text-sm">{description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-gold font-medium text-sm">
              {t('fromPrice', { price })}
            </span>
            <span className="text-sm font-medium px-3 py-1 rounded-full border border-forest/20 text-forest group-hover:bg-forest group-hover:text-cream group-hover:border-forest transition-all duration-300">
              {t('viewDetails')} &rarr;
            </span>
          </div>
        </div>
      </Link>
    </FadeIn>
  );
}
