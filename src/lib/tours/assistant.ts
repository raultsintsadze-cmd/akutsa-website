import 'server-only';
import { SITE_URL } from '@/lib/constants';
import { isDateStr, todayInTbilisi } from '@/lib/booking/dates';
import type { Locale } from '@/i18n/config';
import { getTourCatalog, getTours } from '@/lib/tours/catalog';
import { buildSchedule, encodeTrip, tripProblems, tripTotal, type TripItem } from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';

// Tours for the AI planner: live catalog facts in the prompt, plus a tool that validates a
// proposed itinerary with the same rules as the site and returns a prefilled planner link.

function priceText(t: Tour): string {
  if (t.priceType === 'on request' || t.price === null) return 'price on request';
  if (t.priceType === 'per group') return `${t.price} GEL per group/vehicle${t.maxPeople ? ` of up to ${t.maxPeople} people` : ''}`;
  return `${t.price} GEL per person`;
}

export async function toursPromptBlock(): Promise<string> {
  const tours = await getTours();
  if (tours.length === 0) return '';
  const lines = tours.map(
    (t) =>
      `- ${t.slug}: ${t.name.en} — ${t.dayType}; ${t.dayType === 'Full day' ? 'takes the whole day' : t.durationHours ? `${t.durationHours} h` : 'duration not set (assume ~2 h)'}; ${priceText(t)}; ${t.seasonMonths.length ? `season ${t.seasonMonths.join(', ')}` : 'all year'}${t.startTimes.length ? `; starts ${t.startTimes.join(', ')}` : ''}`
  );
  return `

TOURS & ACTIVITIES OFFERED BY GUEST HOUSE AKUTSA (live catalog — use only these facts, never invent prices or durations):
${lines.join('\n')}

TOUR SCHEDULING RULES (strict):
- A "Full day" tour occupies its whole date: never put any other tour or activity on that date.
- "Short activity" tours can share a day, one after another with 30 minutes between them, between 09:00 and 20:00.
- Only plan a tour in its season months.
- Per group prices: units = ceil(people / max people), e.g. 4 people on quads = 2 quads.
- When you propose Akutsa tours, call plan_tours_link with the tours and dates and give the guest the returned url so they can send a request. You cannot book or confirm tours; never say they are booked.`;
}

export const TOURS_TOOL = {
  type: 'function',
  function: {
    name: 'plan_tours_link',
    description:
      'Validate a proposed itinerary of Akutsa tours against the scheduling rules and return a link to the trip planner with everything prefilled. Does not book anything.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Tour slug from the catalog.' },
              date: { type: 'string', description: 'YYYY-MM-DD' },
              time: { type: 'string', description: 'Optional start: HH:MM, "morning" or "afternoon".' }
            },
            required: ['slug', 'date'],
            additionalProperties: false
          }
        },
        people: { type: 'integer', minimum: 1, maximum: 50 }
      },
      required: ['items', 'people'],
      additionalProperties: false
    }
  }
} as const;

export async function runToursTool(rawArgs: string, locale: Locale): Promise<unknown> {
  let args: { items?: { slug?: string; date?: string; time?: string }[]; people?: number };
  try {
    args = JSON.parse(rawArgs);
  } catch {
    return { error: 'Invalid arguments.' };
  }
  const people = Number.isInteger(args.people) && args.people! >= 1 && args.people! <= 50 ? args.people! : 2;
  const items: TripItem[] = (args.items ?? [])
    .filter((i) => typeof i.slug === 'string' && isDateStr(i.date))
    .slice(0, 20)
    .map((i) => ({
      slug: i.slug!,
      date: i.date!,
      ...(i.time && /^(\d{2}:\d{2}|morning|afternoon)$/.test(i.time) ? { slot: i.time } : {})
    }));
  if (items.length === 0) return { error: 'No valid items.' };
  if (items.some((i) => i.date < todayInTbilisi())) return { error: 'Dates must not be in the past.' };

  const catalog = await getTourCatalog();
  const problems = tripProblems(items, catalog, people);
  const query = new URLSearchParams({ trip: encodeTrip(items), people: String(people) });
  return {
    valid: problems.length === 0,
    problems,
    schedule: buildSchedule(items, catalog).map((d) => ({
      date: d.date,
      items: d.items.map((i) => `${i.fullDay ? 'full day' : `${i.start}-${i.end}${i.approx ? ' (approx.)' : ''}`} ${catalog.get(i.slug)?.name.en}`),
      ends_after_20: d.overflow
    })),
    estimated_total_gel: tripTotal(items, catalog, people, false),
    url: `${SITE_URL}/${locale}/tours/plan?${query.toString()}`,
    note: 'Not a booking. The guest sends the request from this page; the host confirms via WhatsApp.'
  };
}
