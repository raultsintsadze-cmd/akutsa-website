import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { locales, type Locale } from '@/i18n/config';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StickyContactButtons from '@/components/layout/StickyContactButtons';
import StickyTourButton from '@/components/layout/StickyTourButton';
import MobileBookingBar from '@/components/layout/MobileBookingBar';
import { FloatingButtonsProvider } from '@/context/FloatingButtonsContext';
import { SITE_URL } from '@/lib/constants';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('homeTitle'),
      template: `%s | ${t('siteName')}`
    },
    description: t('homeDescription'),
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      siteName: t('siteName'),
      type: 'website',
      locale
    },
    verification: {
      google: '1EUArV0lIlDEKF1hjylfAlklnq087sNDULadiXgcU8Y'
    }
  } as Metadata;
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream text-forest antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SGF4Q9SSR7"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-SGF4Q9SSR7');`}
        </Script>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FloatingButtonsProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <StickyContactButtons />
            <StickyTourButton />
            <MobileBookingBar />
          </FloatingButtonsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
