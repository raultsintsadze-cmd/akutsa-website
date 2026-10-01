import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Section from '@/components/ui/Section';
import SectionHeading from '@/components/ui/SectionHeading';
import BookingFlow from '@/components/sections/booking/BookingFlow';
import { pageMetadata } from '@/lib/seo';
import { isUnitId, UNITS } from '@/lib/booking/units';
import { isDateStr } from '@/lib/booking/dates';
import type { Locale } from '@/i18n/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'book' });
  return pageMetadata({ locale, path: '/book', title: t('metaTitle'), description: t('metaDescription') });
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /book?unit=cottage&in=2026-10-15&out=2026-10-17&guests=2 preselects the unit and dates.
export default async function BookPage({
  params: { locale },
  searchParams
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations({ locale, namespace: 'book' });

  const unitParam = first(searchParams.unit);
  const unit = isUnitId(unitParam) ? unitParam : null;
  const checkIn = first(searchParams.in);
  const checkOut = first(searchParams.out);
  const validDates = isDateStr(checkIn) && isDateStr(checkOut) && checkOut > checkIn;
  const guests = Number(first(searchParams.guests));

  return (
    <Section>
      <SectionHeading as="h1" title={t('title')} subtitle={t('subtitle')} />
      <BookingFlow
        initialUnit={unit}
        initialCheckIn={validDates ? checkIn : null}
        initialCheckOut={validDates ? checkOut : null}
        initialGuests={
          Number.isInteger(guests) && guests >= 1 && guests <= (unit ? UNITS[unit].maxGuests : 20) ? guests : null
        }
      />
    </Section>
  );
}
