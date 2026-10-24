import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GOOGLE_MAPS_URL, PHONE_DISPLAY, PHONE_TEL, TELEGRAM_URL, WHATSAPP_URL } from '@/lib/constants';
import SocialIcons from '@/components/ui/SocialIcons';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  const groups = [
    {
      title: tNav('stay'),
      links: [
        { href: '/guesthouse', label: tNav('guesthouse') },
        { href: '/cottage', label: tNav('cottage') },
        { href: '/camper', label: tNav('camper') },
        { href: '/book', label: tNav('checkAvailability') }
      ]
    },
    {
      title: tNav('explore'),
      links: [
        { href: '/tours', label: tNav('tours') },
        { href: '/services', label: tNav('services') },
        { href: '/menu', label: tNav('menu') },
        { href: '/gallery', label: tNav('gallery') },
        { href: '/attractions', label: tNav('attractions') },
        { href: '/news', label: tNav('news') }
      ]
    },
    {
      title: t('quickLinks'),
      links: [
        { href: '/', label: tNav('home') },
        { href: '/tour-planner', label: tNav('tourPlanner') },
        { href: '/contact', label: tNav('contact') },
        { href: '/faq', label: tNav('faq') }
      ]
    }
  ];

  const linkList = (links: { href: string; label: string }[]) => (
    <ul className="text-cream/75 text-[15px] md:text-sm md:space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="flex items-center min-h-11 md:min-h-0 hover:text-gold transition-colors">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const btn = 'flex items-center justify-center min-h-11 rounded-pill text-sm font-semibold';

  return (
    <footer className="bg-forest text-cream/90">
      <div className="container-px max-w-7xl mx-auto py-10 md:py-14 grid gap-8 md:grid-cols-5 md:gap-10">
        {/* Brand + contact */}
        <div className="md:col-span-2">
          <div data-light className="inline-flex rounded-xl bg-cream px-3 py-2">
            <Logo compact />
          </div>
          <p className="mt-3 text-cream/70 max-w-xs text-sm">{t('tagline')}</p>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-start min-h-11 py-2 text-cream/75 text-sm hover:text-gold transition-colors"
          >
            📍 {t('address')}
          </a>
          <a href={PHONE_TEL} className="flex items-center min-h-11 text-lg font-semibold text-gold">
            📞 {PHONE_DISPLAY}
          </a>
          <div className="mt-3 grid grid-cols-2 gap-3 max-w-xs">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#075E54] text-white`}>
              WhatsApp
            </a>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#1A6FA0] text-white`}>
              Telegram
            </a>
          </div>
          <SocialIcons className="mt-5 text-cream/75 flex-wrap" />
        </div>

        {/* Link groups: accordions on phones, columns from md */}
        <div className="md:hidden divide-y divide-cream/10 border-y border-cream/10">
          {groups.map((g) => (
            <details key={g.title} className="group">
              <summary className="flex items-center justify-between min-h-12 cursor-pointer list-none font-semibold text-gold [&::-webkit-details-marker]:hidden">
                {g.title}
                <span className="transition-transform group-open:rotate-180" aria-hidden>
                  ▾
                </span>
              </summary>
              <div className="pb-2">{linkList(g.links)}</div>
            </details>
          ))}
        </div>
        {groups.map((g) => (
          <div key={g.title} className="hidden md:block">
            <h4 className="font-medium mb-3 text-gold">{g.title}</h4>
            {linkList(g.links)}
          </div>
        ))}
      </div>

      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/70">
        &copy; {new Date().getFullYear()} Guest House Akutsa. {t('rights')}
      </div>
    </footer>
  );
}
