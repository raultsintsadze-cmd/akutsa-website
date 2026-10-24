'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { Link } from '@/i18n/navigation';
import { GUESTHOUSE_SHARED_IMAGES, COTTAGE_IMAGES, CAMPER_IMAGES } from '@/lib/images';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from '@/components/ui/Logo';
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

  // Esc closes the full-screen mobile menu; page scroll is locked while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.setAttribute('data-menu-open', '');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.removeAttribute('data-menu-open');
    };
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
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled ? 'shadow-sm border-forest/20' : 'border-forest/10'}`}>
      {/* Blur lives on this layer, not on <header>: a backdrop-filter on the header would trap the
          fixed full-screen mobile menu inside the header box. */}
      <div aria-hidden className={`absolute inset-0 -z-10 ${scrolled ? 'bg-cream/95 backdrop-blur-md' : 'bg-cream/90 backdrop-blur-sm'}`} />
      <div className="container-px max-w-7xl mx-auto flex items-center justify-between gap-3 lg:gap-6 h-header">
        <Link href="/" className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
          {/* 1024–1279 px: emblem only, so the Georgian/Russian menu fits on one line. */}
          <Logo compact wordmarkClassName="lg:max-xl:sr-only" />
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
            className="whitespace-nowrap rounded-full bg-gold text-ink px-4 xl:px-5 py-2 text-sm font-semibold shadow-sm hover:bg-gold/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          >
            {t('book')}
          </Link>
        </div>

        <Link
          href="/book"
          className="lg:hidden ml-auto inline-flex items-center min-h-11 whitespace-nowrap rounded-pill bg-gold text-ink px-4 text-sm font-semibold"
        >
          {t('book')}
        </Link>
        <button
          type="button"
          className="lg:hidden flex flex-col items-center justify-center gap-1.5 w-11 h-11 -mr-2"
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
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="lg:hidden fixed inset-x-0 bottom-0 top-[var(--header-h)] z-50 bg-cream overflow-y-auto overscroll-contain border-t border-forest/10"
        >
          <div className="container-px py-4 flex flex-col min-h-full">
            <div className="flex flex-col divide-y divide-forest/10 text-lg">
              <Link href="/" onClick={() => setOpen(false)} className={clsx(linkClass, 'flex items-center min-h-14')}>
                {t('home')}
              </Link>
              <div className="py-2.5"><MobileNavDropdown label={t('stay')} items={stayDropdown} onNavigate={() => setOpen(false)} /></div>
              <Link href="/tours" onClick={() => setOpen(false)} className={clsx(linkClass, 'flex items-center min-h-14')}>
                {t('tours')}
              </Link>
              <div className="py-2.5"><MobileNavDropdown label={t('services')} items={servicesDropdown} onNavigate={() => setOpen(false)} /></div>
              <div className="py-2.5"><MobileNavDropdown label={t('explore')} items={exploreDropdown} onNavigate={() => setOpen(false)} /></div>
              <div className="py-2.5"><MobileNavDropdown label={t('news')} items={newsDropdown} onNavigate={() => setOpen(false)} /></div>
              <Link href="/tour-planner" onClick={() => setOpen(false)} className={clsx(linkClass, 'flex items-center min-h-14')}>
                ✨ {t('tourPlanner')}
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)} className={clsx(linkClass, 'flex items-center min-h-14')}>
                {t('contact')}
              </Link>
              <Link href="/faq" onClick={() => setOpen(false)} className={clsx(linkClass, 'flex items-center min-h-14')}>
                {t('faq')}
              </Link>
            </div>

            <div className="mt-auto pt-6 pb-2 flex flex-col gap-4">
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center min-h-12 rounded-pill bg-gold text-ink font-semibold"
              >
                {t('bookNow')}
              </Link>
              <div className="flex justify-center">
                <LanguageSwitcher large />
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
