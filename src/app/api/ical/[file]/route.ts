import { timingSafeEqual } from 'node:crypto';
import { getActiveBookings } from '@/lib/booking/store';
import { isUnitId } from '@/lib/booking/units';
import { isPendingActive } from '@/lib/booking/dates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function tokenMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const compact = (date: string) => date.replace(/-/g, '');

// GET /api/ical/<unit>.ics?t=<ICAL_EXPORT_TOKEN>
// Calendar of dates booked directly (website / phone) for one unit. Booking.com and Airbnb
// import this URL so those dates get blocked there. Contains no guest data.
export async function GET(req: Request, { params }: { params: { file: string } }) {
  const expected = process.env.ICAL_EXPORT_TOKEN;
  const unit = params.file.replace(/\.ics$/, '');
  if (!expected || !tokenMatches(new URL(req.url).searchParams.get('t'), expected)) {
    return new Response('Not found', { status: 404 });
  }
  if (!params.file.endsWith('.ics') || !isUnitId(unit)) {
    return new Response('Not found', { status: 404 });
  }

  const bookings = (await getActiveBookings({ fresh: true })).filter(
    (b) =>
      b.unit === unit &&
      // Rows imported from the OTAs themselves are not sent back to them.
      (b.channel === 'Website' || b.channel === 'Phone/WhatsApp' || b.channel === null) &&
      (b.status === 'Confirmed' || (b.status === 'Pending' && isPendingActive(b.createdAt)))
  );

  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guest House Akutsa//Direct bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...bookings.flatMap((b) => [
      'BEGIN:VEVENT',
      `UID:${b.id.replace(/-/g, '')}@akutsaresosort.ge`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(b.checkIn)}`,
      // DTEND is exclusive: the check-out day stays bookable.
      `DTEND;VALUE=DATE:${compact(b.checkOut)}`,
      'SUMMARY:Akutsa — booked',
      'END:VEVENT'
    ]),
    'END:VCALENDAR'
  ];

  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${unit}.ics"`,
      'Cache-Control': 'no-store'
    }
  });
}
