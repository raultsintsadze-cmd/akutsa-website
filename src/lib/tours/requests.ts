import 'server-only';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { TOUR_REQUESTS_DATABASE_ID, dataSourceId, notionClient } from '@/lib/tours/catalog';

export type RequestStatus = 'Pending' | 'Confirmed' | 'Declined' | 'Cancelled';

// Options of the "Tours" multi-select in "Akutsa Tour Requests". A tour maps onto the option
// its English name starts with ("Wine cellar & tasting" -> "Wine cellar").
export const TOUR_OPTIONS = [
  'Fishing',
  'Mushroom picking',
  'Wine cellar',
  'Honey & bees',
  'Off-road 4x4',
  'Quad bike',
  'Zipline',
  'Rafting',
  'Horse riding'
] as const;

export function tourOption(nameEn: string): string | null {
  const lower = nameEn.toLowerCase();
  return TOUR_OPTIONS.find((o) => lower.startsWith(o.toLowerCase())) ?? null;
}

export interface NewTourRequest {
  guest: string;
  itinerary: string;
  tourNamesEn: string[];
  firstDate: string;
  lastDate: string;
  people: number;
  phone: string;
  email?: string;
  language: 'ka' | 'en' | 'ru';
  staying: boolean;
  transfer: boolean;
  estimatedTotal: number | null;
  notes?: string;
}

const rich = (content: string) => ({ rich_text: [{ text: { content: content.slice(0, 1990) } }] });

export async function createTourRequest(input: NewTourRequest): Promise<string> {
  const notion = notionClient();
  if (!notion) throw new Error('NOTION_TOKEN is not configured');
  const options = [...new Set(input.tourNamesEn.map(tourOption).filter((o): o is string => o !== null))];
  const page = await notion.pages.create({
    parent: { type: 'data_source_id', data_source_id: await dataSourceId(notion, TOUR_REQUESTS_DATABASE_ID) },
    properties: {
      Guest: { title: [{ text: { content: input.guest } }] },
      Itinerary: rich(input.itinerary),
      Tours: { multi_select: options.map((name) => ({ name })) },
      'First date': { date: { start: input.firstDate } },
      'Last date': { date: { start: input.lastDate } },
      People: { number: input.people },
      Phone: { phone_number: input.phone },
      ...(input.email ? { Email: { email: input.email } } : {}),
      Language: { select: { name: input.language } },
      'Staying with us': { checkbox: input.staying },
      'Transfer from Batumi': { checkbox: input.transfer },
      'Estimated total GEL': { number: input.estimatedTotal },
      Status: { select: { name: 'Pending' } },
      ...(input.notes ? { Notes: rich(input.notes) } : {})
    }
  });
  return page.id;
}

export interface TourRequest {
  id: string;
  guest: string;
  itinerary: string;
  phone: string | null;
  people: number | null;
  language: 'ka' | 'en' | 'ru';
  estimatedTotal: number | null;
  transfer: boolean;
  status: RequestStatus | null;
}

export async function getTourRequest(id: string): Promise<TourRequest | null> {
  const notion = notionClient();
  if (!notion) return null;
  try {
    const page = (await notion.pages.retrieve({ page_id: id })) as PageObjectResponse;
    if (!('properties' in page)) return null;
    const parent = page.parent as { database_id?: string };
    if (parent.database_id?.replace(/-/g, '') !== TOUR_REQUESTS_DATABASE_ID.replace(/-/g, '')) return null;
    const p = page.properties;
    const lang = p['Language']?.type === 'select' ? p['Language'].select?.name : null;
    return {
      id: page.id,
      guest: p['Guest']?.type === 'title' ? p['Guest'].title.map((t) => t.plain_text).join('') : '',
      itinerary: p['Itinerary']?.type === 'rich_text' ? p['Itinerary'].rich_text.map((t) => t.plain_text).join('') : '',
      phone: p['Phone']?.type === 'phone_number' ? p['Phone'].phone_number : null,
      people: p['People']?.type === 'number' ? p['People'].number : null,
      language: lang === 'ka' || lang === 'ru' ? lang : 'en',
      estimatedTotal: p['Estimated total GEL']?.type === 'number' ? p['Estimated total GEL'].number : null,
      transfer: p['Transfer from Batumi']?.type === 'checkbox' ? p['Transfer from Batumi'].checkbox : false,
      status: (p['Status']?.type === 'select' ? p['Status'].select?.name : null) as RequestStatus | null
    };
  } catch {
    return null;
  }
}

export async function setTourRequestStatus(id: string, status: RequestStatus): Promise<void> {
  const notion = notionClient();
  if (!notion) throw new Error('NOTION_TOKEN is not configured');
  await notion.pages.update({ page_id: id, properties: { Status: { select: { name: status } } } });
}
