'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { TELEGRAM_URL } from '@/lib/constants';

export default function Header() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: t('home') },
    { href: '/guesthouse', label: t('guesthouse') },
    { href: '/cottage', label: t('cottage') },
    { href: '/camper', label: t('camper') },
    { href: '/services', label: t('services') },
    { href: '/gallery', label: t('gallery') },
    { href: '/attractions', label: t('attractions') },
    { href: '/news', label: t('news') },
    { href: '/contact', label: t('contact') }
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-forest/10">
      <div className="container-px max-w-7xl mx-auto flex items-center justify-between h-20">
        <Link href="/" className="font-serif text-xl md:text-2xl text-forest font-semibold">
          Akutsa
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-forest/80 hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          <LanguageSwitcher />
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-forest text-cream px-5 py-2 text-sm font-medium hover:bg-forest/90 transition-colors"
          >
            {t('bookNow')}
          </a>
        </div>

        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-[2px] bg-forest" />
          <span className="block w-6 h-[2px] bg-forest" />
          <span className="block w-6 h-[2px] bg-forest" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-cream border-t border-forest/10 px-6 py-6 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-forest/80 hover:text-gold transition-colors text-base"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex items-center justify-between">
            <LanguageSwitcher />
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-forest text-cream px-5 py-2 text-sm font-medium"
            >
              {t('bookNow')}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
