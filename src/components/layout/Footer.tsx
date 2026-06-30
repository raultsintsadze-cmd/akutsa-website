import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GOOGLE_MAPS_URL } from '@/lib/constants';
import SocialIcons from '@/components/ui/SocialIcons';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  const links = [
    { href: '/', label: tNav('home') },
    { href: '/guesthouse', label: tNav('guesthouse') },
    { href: '/cottage', label: tNav('cottage') },
    { href: '/camper', label: tNav('camper') },
    { href: '/services', label: tNav('services') },
    { href: '/menu', label: tNav('menu') },
    { href: '/gallery', label: tNav('gallery') },
    { href: '/attractions', label: tNav('attractions') },
    { href: '/news', label: tNav('news') },
    { href: '/contact', label: tNav('contact') },
    { href: '/faq', label: tNav('faq') }
  ];

  return (
    <footer className="bg-forest text-cream/90">
      <div className="container-px max-w-7xl mx-auto py-14 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl mb-3">Akutsa</h3>
          <p className="text-cream/70 max-w-xs">{t('tagline')}</p>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-gold">{t('quickLinks')}</h4>
          <ul className="space-y-2 text-cream/70 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gold transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-gold">{t('contact')}</h4>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/70 text-sm hover:text-gold transition-colors block mb-4"
          >
            {t('address')}
          </a>
          <h4 className="font-medium mb-3 text-gold">{t('followUs')}</h4>
          <SocialIcons className="text-cream/70" />
        </div>
      </div>

      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        &copy; {new Date().getFullYear()} Guest House Akutsa. {t('rights')}
      </div>
    </footer>
  );
}
