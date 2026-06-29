'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import { TELEGRAM_URL } from '@/lib/constants';

export default function Header() {
  const t = useTranslations('nav');
  const tNews = useTranslations('news');
  const [open, setOpen] = useState(false);
  const [mobileNewsOpen, setMobileNewsOpen] = useState(false);

  const links = [
    { href: '/', label: t('home') },
    { href: '/guesthouse', label: t('guesthouse') },
    { href: '/cottage', label: t('cottage') },
    { href: '/camper', label: t('camper') },
    { href: '/services', label: t('services') },
    { href: '/gallery', label: t('gallery') },
    { href: '/attractions', label: t('attractions') }
  ];

  const newsDropdown = [
    { href: '/news', label: tNews('dropdownAll') },
    { href: { pathname: '/news', query: { category: 'guests' } }, label: tNews('dropdownGuests') },
    { href: { pathname: '/news', query: { category: 'events' } }, label: tNews('dropdownEvents') }
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

          <div className="relative group">
            <Link
              href="/news"
              className="flex items-center gap-1 text-forest/80 hover:text-gold transition-colors"
            >
              {t('news')}
              <ChevronDown className="w-4 h-4" />
            </Link>
            <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
              <div className="bg-cream border border-forest/10 rounded-xl shadow-lg py-2 w-56">
                {newsDropdown.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-forest/80 hover:bg-forest/5 hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/contact" className="text-forest/80 hover:text-gold transition-colors">
            {t('contact')}
          </Link>
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

          <div>
            <button
              type="button"
              onClick={() => setMobileNewsOpen(!mobileNewsOpen)}
              className="flex items-center justify-between w-full text-forest/80 hover:text-gold transition-colors text-base"
              aria-expanded={mobileNewsOpen}
            >
              {t('news')}
              <ChevronDown
                className={clsx('w-4 h-4 transition-transform', mobileNewsOpen && 'rotate-180')}
              />
            </button>
            {mobileNewsOpen && (
              <div className="mt-2 ml-4 flex flex-col gap-3 border-l border-forest/10 pl-4">
                {newsDropdown.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setMobileNewsOpen(false);
                    }}
                    className="text-forest/70 hover:text-gold transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="text-forest/80 hover:text-gold transition-colors text-base"
          >
            {t('contact')}
          </Link>

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
