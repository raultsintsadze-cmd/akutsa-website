import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import BookingButtons from '@/components/ui/BookingButtons';
import ContactForm from '@/components/sections/ContactForm';
import FadeIn from '@/components/ui/FadeIn';
import { GOOGLE_MAPS_EMBED_SRC } from '@/lib/constants';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('subtitle') };
}

export default function ContactPage() {
  const t = useTranslations('contact');

  return (
    <Section>
      <SectionHeading title={t('title')} subtitle={t('subtitle')} />

      <div className="grid lg:grid-cols-2 gap-12">
        <FadeIn>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gold mb-1">{t('addressTitle')}</h3>
              <p className="text-forest/80 text-sm">{t('address')}</p>
            </div>
            <div>
              <h3 className="font-medium text-gold mb-2">{t('phoneTitle')}</h3>
              <BookingButtons size="sm" />
            </div>
            <div>
              <h3 className="font-medium text-gold mb-2">{t('mapTitle')}</h3>
              <div className="rounded-2xl overflow-hidden h-72">
                <iframe
                  src={GOOGLE_MAPS_EMBED_SRC}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Guest House Akutsa location"
                />
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <ContactForm />
        </FadeIn>
      </div>
    </Section>
  );
}
