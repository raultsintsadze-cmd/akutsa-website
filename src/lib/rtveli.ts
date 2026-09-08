import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_RTVELI_DATABASE_ID = process.env.NOTION_RTVELI_DATABASE_ID;

const notion = NOTION_TOKEN ? new Client({ auth: NOTION_TOKEN }) : null;

export interface RtveliDate {
  id: string;
  date: string;
  vehicle: string;
  totalSeats: number;
  bookedSeats: number;
  seatsRemaining: number;
}

function getProp(page: PageObjectResponse, name: string) {
  const entry = Object.entries(page.properties).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  return entry?.[1];
}

export async function getAvailableRtveliDates(): Promise<RtveliDate[]> {
  if (!notion || !NOTION_RTVELI_DATABASE_ID) return [];

  try {
    const database = await notion.databases.retrieve({ database_id: NOTION_RTVELI_DATABASE_ID });
    const dataSourceId = 'data_sources' in database ? database.data_sources[0]?.id : undefined;
    if (!dataSourceId) return [];

    const today = new Date().toISOString().split('T')[0];

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          { property: 'Active', checkbox: { equals: true } },
          { property: 'Date', date: { on_or_after: today } }
        ]
      },
      sorts: [{ property: 'Date', direction: 'ascending' }]
    });

    const pages = response.results.filter(
      (p): p is PageObjectResponse => p.object === 'page' && 'properties' in p
    );

    const dates: RtveliDate[] = [];

    for (const page of pages) {
      const dateProp = getProp(page, 'Date');
      const vehicleProp = getProp(page, 'Vehicle');
      const totalProp = getProp(page, 'Total Seats');
      const bookedProp = getProp(page, 'Booked Seats');

      const date = dateProp?.type === 'date' ? dateProp.date?.start ?? null : null;
      const vehicle =
        vehicleProp?.type === 'rich_text'
          ? vehicleProp.rich_text.map((t) => t.plain_text).join('')
          : vehicleProp?.type === 'title'
            ? vehicleProp.title.map((t) => t.plain_text).join('')
            : '';
      const total = totalProp?.type === 'number' ? (totalProp.number ?? 0) : 0;
      const booked = bookedProp?.type === 'number' ? (bookedProp.number ?? 0) : 0;
      const remaining = total - booked;

      if (!date || remaining <= 0) continue;

      dates.push({
        id: page.id,
        date,
        vehicle,
        totalSeats: total,
        bookedSeats: booked,
        seatsRemaining: remaining
      });
    }

    return dates;
  } catch (err) {
    console.error('Failed to fetch Rtveli dates:', err);
    return [];
  }
}
