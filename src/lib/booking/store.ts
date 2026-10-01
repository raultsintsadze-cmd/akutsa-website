import 'server-only';
import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { unstable_cache, revalidateTag } from 'next/cache';
import { UNITS, unitFromNotionName, type UnitId } from '@/lib/booking/units';
import { addDays, todayInTbilisi, type DateStr } from '@/lib/booking/dates';

// Notion database "Akutsa Bookings".
const DATABASE_ID = process.env.NOTION_BOOKINGS_DATABASE_ID ?? 'ad6c980bea6f4b45996ded3350eaf413';
const CACHE_TAG = 'bookings';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Declined' | 'Cancelled';
export type BookingChannel = 'Website' | 'Booking.com' | 'Airbnb' | 'Phone/WhatsApp';
export type BookingLanguage = 'ka' | 'en' | 'ru';

export interface Booking {
  id: string;
  unit: UnitId;
  checkIn: DateStr;
  checkOut: DateStr;
  status: BookingStatus;
  channel: BookingChannel | null;
  createdAt: string;
  guest: string;
  phone: string | null;
  guests: number | null;
  language: BookingLanguage | null;
  estimatedPrice: number | null;
}

function client(): Client | null {
  const auth = process.env.NOTION_TOKEN;
  if (!auth) return null;
  return new Client({
    auth,
    // NOTION_API_BASE_URL is only set by the end-to-end tests (mock Notion server).
    baseUrl: process.env.NOTION_API_BASE_URL || undefined,
    // Next.js caches fetch() responses, including the SDK's POST queries. Bookings must
    // never be read from that cache, or a just-taken date would still look free.
    fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' })
  });
}

let dataSourceId: string | null = null;
async function getDataSourceId(notion: Client): Promise<string> {
  if (dataSourceId) return dataSourceId;
  const database = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const id = 'data_sources' in database ? database.data_sources[0]?.id : undefined;
  if (!id) throw new Error('Bookings database has no data source');
  dataSourceId = id;
  return id;
}

function toBooking(page: PageObjectResponse): Booking | null {
  const p = page.properties;
  const select = (name: string) => (p[name]?.type === 'select' ? (p[name].select?.name ?? null) : null);
  const date = (name: string) => (p[name]?.type === 'date' ? (p[name].date?.start?.slice(0, 10) ?? null) : null);
  const num = (name: string) => (p[name]?.type === 'number' ? p[name].number : null);

  const unit = unitFromNotionName(select('Unit'));
  const checkIn = date('Check-in');
  const checkOut = date('Check-out');
  const status = select('Status') as BookingStatus | null;
  if (!unit || !checkIn || !checkOut || !status || checkOut <= checkIn) return null;

  return {
    id: page.id,
    unit,
    checkIn,
    checkOut,
    status,
    channel: select('Channel') as BookingChannel | null,
    createdAt: page.created_time,
    guest: p['Guest']?.type === 'title' ? p['Guest'].title.map((t) => t.plain_text).join('') : '',
    phone: p['Phone']?.type === 'phone_number' ? p['Phone'].phone_number : null,
    guests: num('Guests'),
    language: select('Language') as BookingLanguage | null,
    estimatedPrice: num('Estimated price GEL')
  };
}

// Pending and Confirmed bookings (all units) that end today or later.
async function queryActiveBookings(): Promise<Booking[]> {
  const notion = client();
  if (!notion) return [];
  const id = await getDataSourceId(notion);
  const since = addDays(todayInTbilisi(), -1);

  const bookings: Booking[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: id,
      filter: {
        and: [
          { property: 'Check-out', date: { on_or_after: since } },
          {
            or: [
              { property: 'Status', select: { equals: 'Confirmed' } },
              { property: 'Status', select: { equals: 'Pending' } }
            ]
          }
        ]
      },
      start_cursor: cursor
    });
    for (const page of res.results) {
      if (page.object !== 'page' || !('properties' in page)) continue;
      const booking = toBooking(page as PageObjectResponse);
      if (booking) bookings.push(booking);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return bookings;
}

const cachedActiveBookings = unstable_cache(queryActiveBookings, ['active-bookings'], {
  revalidate: 60,
  tags: [CACHE_TAG]
});

// `fresh` skips the 60-second cache; used right before a booking is created or confirmed.
// BOOKING_CACHE=off (end-to-end tests) disables the cache entirely.
export function getActiveBookings({ fresh = false } = {}): Promise<Booking[]> {
  return fresh || process.env.BOOKING_CACHE === 'off' ? queryActiveBookings() : cachedActiveBookings();
}

export interface NewBooking {
  unit: UnitId;
  checkIn: DateStr;
  checkOut: DateStr;
  guests: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  language: BookingLanguage;
  estimatedPrice: number;
}

export async function createPendingBooking(input: NewBooking): Promise<string> {
  const notion = client();
  if (!notion) throw new Error('NOTION_TOKEN is not configured');
  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: await getDataSourceId(notion) },
    properties: {
      Guest: { title: [{ text: { content: input.name } }] },
      Unit: { select: { name: UNITS[input.unit].notionName } },
      'Check-in': { date: { start: input.checkIn } },
      'Check-out': { date: { start: input.checkOut } },
      Guests: { number: input.guests },
      Phone: { phone_number: input.phone },
      ...(input.email ? { Email: { email: input.email } } : {}),
      Channel: { select: { name: 'Website' } },
      Status: { select: { name: 'Pending' } },
      Language: { select: { name: input.language } },
      'Estimated price GEL': { number: input.estimatedPrice },
      ...(input.notes ? { Notes: { rich_text: [{ text: { content: input.notes.slice(0, 1900) } }] } } : {})
    }
  });
  revalidateTag(CACHE_TAG);
  return page.id;
}

export async function getBooking(id: string): Promise<Booking | null> {
  const notion = client();
  if (!notion) return null;
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return 'properties' in page ? toBooking(page as PageObjectResponse) : null;
  } catch {
    return null;
  }
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const notion = client();
  if (!notion) throw new Error('NOTION_TOKEN is not configured');
  await notion.pages.update({ page_id: id, properties: { Status: { select: { name: status } } } });
  revalidateTag(CACHE_TAG);
}
