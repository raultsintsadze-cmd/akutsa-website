'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';
import { GUESTHOUSE_SHARED_IMAGES, COTTAGE_IMAGES, CAMPER_IMAGES } from '@/lib/images';
import LanguageSwitcher from './LanguageSwitcher';
import { DesktopNavDropdown, MobileNavDropdown, type DropdownItem } from './NavDropdown';

const linkClass =
  'whitespace-nowrap text-forest/80 hover:text-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-md';

export default function Header() {
  const t = useTranslations('nav');
  const tNews = useTranslations('news');
  const tProps = useTranslations('properties');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Esc closes the mobile menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Prices come from the same messages the property cards use.
  const stayDropdown: DropdownItem[] = [
    { href: '/guesthouse', label: t('guesthouse'), image: GUESTHOUSE_SHARED_IMAGES.terrace, sub: tCommon('fromPrice', { price: tProps('guesthouse.price') }) },
    { href: '/cottage', label: tProps('cottage.name'), image: COTTAGE_IMAGES[0], sub: tCommon('fromPrice', { price: tProps('cottage.price') }) },
    { href: '/camper', label: t('camper'), image: CAMPER_IMAGES[0], sub: tCommon('fromPrice', { price: tProps('camper.price') }) },
    { href: '/book', label: `📅 ${t('checkAvailability')}`, highlight: true }
  ];

  const servicesDropdown: DropdownItem[] = [
    { href: '/services', label: t('services') },
    { href: '/menu', label: t('menu') }
  ];

  const exploreDropdown: DropdownItem[] = [
    { href: '/gallery', label: t('exploreGallery') },
    { href: '/attractions', label: t('attractions') }
  ];

  const newsDropdown: DropdownItem[] = [
    { href: '/news', label: tNews('dropdownAll') },
    { href: { pathname: '/news', query: { category: 'guests' } }, label: tNews('dropdownGuests') },
    { href: { pathname: '/news', query: { category: 'events' } }, label: tNews('dropdownEvents') }
  ];

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'bg-cream/95 backdrop-blur-md shadow-sm border-forest/20' : 'bg-cream/90 backdrop-blur-sm border-forest/10'}`}>
      <div className="container-px max-w-7xl mx-auto flex items-center justify-between gap-6 h-20">
        <Link href="/" className="shrink-0 font-serif text-xl md:text-2xl text-forest font-semibold">
          Akutsa
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-[13px] xl:text-sm font-medium ml-2 xl:ml-6 mr-auto">
          {/* 1024–1279 px: the logo is the home link, so "Home" is shown only from xl up. */}
          <Link href="/" className={clsx(linkClass, 'hidden xl:inline')}>
            {t('home')}
          </Link>
          <DesktopNavDropdown label={t('stay')} items={stayDropdown} wide />
          <Link href="/tours" className={linkClass}>
            {t('tours')}
          </Link>
          <DesktopNavDropdown label={t('services')} items={servicesDropdown} />
          <DesktopNavDropdown label={t('explore')} items={exploreDropdown} />
          <DesktopNavDropdown label={t('news')} items={newsDropdown} />
          <Link href="/contact" className={linkClass}>
            {t('contact')}
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-3 xl:gap-5 shrink-0">
          <LanguageSwitcher />
          <Link
            href="/book"
            className="whitespace-nowrap rounded-full bg-gold text-forest px-4 xl:px-5 py-2 text-sm font-semibold shadow-sm hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          >
            {t('book')}
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span className="block w-6 h-[2px] bg-forest" />
          <span className="block w-6 h-[2px] bg-forest" />
          <span className="block w-6 h-[2px] bg-forest" />
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="lg:hidden bg-cream border-t border-forest/10 px-6 py-6 flex flex-col gap-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <Link href="/" onClick={() => setOpen(false)} className={clsx(linkClass, 'text-base')}>
            {t('home')}
          </Link>
          <MobileNavDropdown label={t('stay')} items={stayDropdown} onNavigate={() => setOpen(false)} />
          <Link href="/tours" onClick={() => setOpen(false)} className={clsx(linkClass, 'text-base')}>
            {t('tours')}
          </Link>
          <MobileNavDropdown label={t('services')} items={servicesDropdown} onNavigate={() => setOpen(false)} />
          <MobileNavDropdown label={t('explore')} items={exploreDropdown} onNavigate={() => setOpen(false)} />
          <MobileNavDropdown label={t('news')} items={newsDropdown} onNavigate={() => setOpen(false)} />
          <Link href="/contact" onClick={() => setOpen(false)} className={clsx(linkClass, 'text-base')}>
            {t('contact')}
          </Link>

          <div className="pt-2 flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gold text-forest px-5 py-2 text-sm font-semibold"
            >
              {t('bookNow')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
