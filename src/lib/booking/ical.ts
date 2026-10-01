import ICAL from 'ical.js';
import { icalEventRange, type Range } from '@/lib/booking/dates';

// Booked ranges from an iCal feed (Booking.com / Airbnb export). Cancelled events are ignored.
export function parseIcal(text: string): Range[] {
  const calendar = new ICAL.Component(ICAL.parse(text));
  const ranges: Range[] = [];
  for (const vevent of calendar.getAllSubcomponents('vevent')) {
    if (String(vevent.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED') continue;
    const event = new ICAL.Event(vevent);
    if (!event.startDate) continue;
    ranges.push(icalEventRange(event.startDate, vevent.hasProperty('dtend') ? event.endDate : null));
  }
  return ranges;
}
