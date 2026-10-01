import { NextResponse } from 'next/server';
import { isAvailable, suggestAlternatives } from '@/lib/availability';
import { BOOKING_POLICY, UNITS, UNIT_IDS, isUnitId, type UnitId } from '@/lib/booking/units';
import { addDays, isDateStr, nightsBetween, todayInTbilisi } from '@/lib/booking/dates';
import { bookUrl, unitLabel, type Lang } from '@/lib/booking/messages';

export const runtime = 'nodejs';

// OPENAI_API_BASE_URL is only set by the end-to-end tests (mock OpenAI server).
const OPENAI_BASE_URL = process.env.OPENAI_API_BASE_URL ?? 'https://api.openai.com/v1';

interface TourRequest {
  days: number;
  people: number;
  interests: string[];
  budget: 'low' | 'medium' | 'high';
  locale: 'ka' | 'en' | 'ru';
  // Optional: arrival date (YYYY-MM-DD) and a free-text question about the stay.
  startDate?: string;
  question?: string;
}


const SYSTEM_PROMPT = `You are an expert local tour guide for the Keda Municipality and Adjara region of Georgia. You have deep knowledge of the area. Always respond in English only, regardless of the language used in the request.

LOCATION BASE: Guest House Akutsa, Village Akutsa, Keda Municipality, Adjara, Georgia (3km from Keda center, 40km / about 1 hour by car from Batumi)

AVAILABLE TRANSPORT:
- Mitsubishi Delica 4x4 (7 passengers) - perfect for mountain/off-road routes
- Mercedes Sprinter minivan (8 passengers) - comfortable for longer trips

NEARBY ATTRACTIONS WITH REAL DISTANCES FROM AKUTSA:
1. Akutsa Mosque (Akutsa Jame) - 150m - historical wooden mosque, late medieval
2. Keda Historical Museum - 3km - archaeological artifacts, ethnographic materials
3. Keda Wine Factory - 3km - local wine production, tastings available
4. Khalvashi Park - 3km - central park in Keda
5. Restaurant Maspidzeli - 3km - authentic Adjarian cuisine
6. Zvari St. George Church - 5km - Byzantine-style church
7. Kaviani Fortress - 6km - ancient stone fortress
8. Dzenwmani Waterfall - 7km - beautiful waterfall, 100m walk from road
9. Makhuntseti Waterfall - 10km - most famous waterfall in Adjara, 50m high, restaurants nearby
10. Merisi Waterfall - 12km - scenic waterfall with cafe
11. Batumi - 40km (about 1 hour by car) - Black Sea coast, botanical garden, old town, beaches
12. Goderdzi Pass - 55km - mountain pass, panoramic views, connects to Samtskhe-Javakheti
13. Black Sea Coast (Kobuleti, Ureki) - 65km

LOCAL EXPERIENCES AVAILABLE AT AKUTSA:
- Beekeeping masterclass (20 GEL/person) - visit real beehives, taste fresh honey
- Culinary masterclass - cook traditional Adjarian dishes (50 GEL/person, only for guests staying overnight at Guest House Akutsa)
- Picnic space for up to 60 people (5 GEL/person)
- Local products: natural honey (30 GEL), wine (15 GEL), chacha/vodka (12 GEL/500ml), fresh fruits (5 GEL)
- Home-cooked traditional Adjarian breakfast: FREE for guests who book directly through the website (WhatsApp/Telegram/phone); otherwise ordered from the menu

TRADITIONAL ADJARIAN DISHES TO RECOMMEND:
Borano (cheese+butter dish), Sinori (dough layers with walnut), Iakhni (beef with walnut), Chakhokhbili Adjarian style (chicken+rice+walnut), Malakhto (bean dish), Pkhal-Lobio, Qaisapa (plum dessert), Milk Halva, Burme (baklava-style sweet), Chirbuli (eggs+tomato)

ACCOMMODATION:
- Guest House "Akutsa": 4 rooms (Lemon, Strawberry, Blueberry, Fig) - 90 GEL/night each, shared kitchen/bathroom
- Cottage "Panorama Akutsa": 20sqm private cottage, own kitchen/bathroom/balcony, mountain views - 150 GEL/night
- Akutsa Camper: stationary fully-equipped house truck - 100 GEL/night

TOUR GENERATION RULES:
1. Always start and end tours at Guest House Akutsa
2. Consider the number of days, people, interests and budget provided
3. Include realistic travel times (Delica for mountain routes, Sprinter for comfort)
4. Suggest local food and experiences at Akutsa
5. For 1-day tours: max 3-4 attractions
6. For multi-day tours: mix nature, culture, and food experiences
7. Always include prices and distances
8. Recommend booking transport via Telegram @raultsintsadze or WhatsApp +995577225289
9. Be enthusiastic and personal — you love this region!
10. Format the tour clearly with times, distances, and costs
11. Always write in English only. Begin your response with the line: "Tour generated in English for international guests." then a blank line, then "Day 1".`;

// ── Live availability for the assistant ────────────────────────────────────────────────
// The model never books anything: it can only read availability and hand out /book links.

const AVAILABILITY_RULES = `

ACCOMMODATION AVAILABILITY (strict rules):
- You have a tool, check_availability, that returns LIVE availability for the 6 units (lemon, strawberry, blueberry, fig = guest house rooms; cottage; camper). Use it whenever the guest asks whether something is free on certain dates, or when dates are given.
- Never guess availability and never say a unit is free or booked without tool data or the "LIVE AVAILABILITY" block in the request.
- You cannot make, hold or confirm a booking. Never say "booked", "reserved" or "confirmed". Always tell the guest to send a request on the booking page and give the exact book_url from the tool result or the availability block.
- If the requested unit is not free, offer the alternatives returned by the tool (other dates for the same unit, or other units for the same dates), each with its book_url.
- When availability was checked, put a short "Where to stay" section right after the first line, before "Day 1".`;

const AVAILABILITY_TOOL = {
  type: 'function',
  function: {
    name: 'check_availability',
    description:
      'Check live availability of accommodation at Guest House Akutsa for a date range. Returns whether each unit is free, alternatives if not, and the booking page URL to give to the guest. This does not create a booking.',
    parameters: {
      type: 'object',
      properties: {
        unit: {
          type: 'string',
          enum: [...UNIT_IDS, 'any'],
          description: 'Unit to check, or "any" to check all six units.'
        },
        check_in: { type: 'string', description: 'Arrival date, YYYY-MM-DD.' },
        check_out: { type: 'string', description: 'Departure date, YYYY-MM-DD (must be after check_in).' }
      },
      required: ['unit', 'check_in', 'check_out'],
      additionalProperties: false
    }
  }
} as const;

interface UnitAvailability {
  unit: UnitId;
  name: string;
  available: boolean;
  price_per_night_gel: number;
  max_guests: number;
  book_url: string;
}

async function unitAvailability(unit: UnitId, checkIn: string, checkOut: string, locale: Lang): Promise<UnitAvailability> {
  return {
    unit,
    name: unitLabel(unit, 'en'),
    available: await isAvailable(unit, checkIn, checkOut),
    price_per_night_gel: UNITS[unit].pricePerNight,
    max_guests: UNITS[unit].maxGuests,
    book_url: bookUrl(locale, { unit, checkIn, checkOut })
  };
}

async function runAvailabilityTool(rawArgs: string, locale: Lang): Promise<unknown> {
  let args: { unit?: string; check_in?: string; check_out?: string };
  try {
    args = JSON.parse(rawArgs);
  } catch {
    return { error: 'Invalid arguments.' };
  }
  const { unit, check_in: checkIn, check_out: checkOut } = args;
  if (!isDateStr(checkIn) || !isDateStr(checkOut) || checkOut <= checkIn) {
    return { error: 'check_in and check_out must be YYYY-MM-DD with check_out after check_in.' };
  }
  if (checkIn < todayInTbilisi()) return { error: 'check_in is in the past.' };
  const nights = nightsBetween(checkIn, checkOut);
  if (nights > BOOKING_POLICY.maxNights) return { error: `Stays are limited to ${BOOKING_POLICY.maxNights} nights.` };

  const note = 'Live data, not a reservation. The guest must send a request at book_url; the host confirms via WhatsApp.';
  try {
    if (!isUnitId(unit)) {
      return { check_in: checkIn, check_out: checkOut, nights, units: await Promise.all(UNIT_IDS.map((u) => unitAvailability(u, checkIn, checkOut, locale))), note };
    }
    const result = await unitAvailability(unit, checkIn, checkOut, locale);
    if (result.available) return { check_in: checkIn, check_out: checkOut, nights, ...result, note };
    const alt = await suggestAlternatives(unit, checkIn, nights);
    return {
      check_in: checkIn,
      check_out: checkOut,
      nights,
      ...result,
      alternatives: {
        same_unit_other_dates: alt.sameUnit.map((r) => ({ check_in: r.start, check_out: r.end, book_url: bookUrl(locale, { unit, checkIn: r.start, checkOut: r.end }) })),
        other_units_same_dates: alt.otherUnits.map((u) => ({ unit: u, name: unitLabel(u, 'en'), price_per_night_gel: UNITS[u].pricePerNight, book_url: bookUrl(locale, { unit: u, checkIn, checkOut }) }))
      },
      note
    };
  } catch (err) {
    console.error('Availability tool failed:', err);
    return { error: `Availability is temporarily unavailable. Send the guest to ${bookUrl(locale)} to check dates.` };
  }
}

function buildPrompt(
  { days, people, interests, budget, question }: TourRequest,
  stay: { checkIn: string; checkOut: string; units: UnitAvailability[] } | null
) {
  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing';
  const availabilityBlock = stay
    ? `

LIVE AVAILABILITY for ${stay.checkIn} to ${stay.checkOut} (checked just now):
${stay.units.map((u) => `- ${u.name}: ${u.available ? 'FREE' : 'BOOKED'} — ${u.price_per_night_gel} GEL/night, max ${u.max_guests} guests — ${u.book_url}`).join('\n')}
Recommend only units marked FREE and give their booking link.`
    : '';
  const questionBlock = question ? `\n\nThe guest also asks: "${question}"` : '';

  return `Today's date: ${todayInTbilisi()}.

Create a personalized ${days}-day tour itinerary for ${people} ${people === 1 ? 'person' : 'people'}.

Traveler interests: ${interestsText}
Budget level: ${budget}${availabilityBlock}${questionBlock}

Additional guidelines:
- Structure the response as "Day 1", "Day 2", etc., each with morning/afternoon/evening activities.
- Keep recommendations appropriate to the stated budget level.
- All prices must be in GEL (Georgian Lari).
- Write the entire response in English only.`;
}

type ChatMessage = Record<string, unknown>;

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: Partial<TourRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const days = Number(body.days);
  const people = Number(body.people);
  const interests = Array.isArray(body.interests) ? body.interests.filter((i) => typeof i === 'string') : [];
  const budget = body.budget;
  const locale = body.locale;
  const startDate = isDateStr(body.startDate) && body.startDate >= todayInTbilisi() ? body.startDate : undefined;
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 300) : '';

  if (
    !Number.isFinite(days) ||
    days < 1 ||
    days > 14 ||
    !Number.isFinite(people) ||
    people < 1 ||
    people > 20 ||
    !budget ||
    !['low', 'medium', 'high'].includes(budget) ||
    !locale ||
    !['ka', 'en', 'ru'].includes(locale)
  ) {
    return NextResponse.json({ error: 'Invalid request parameters.' }, { status: 400 });
  }
  const lang = locale as Lang;

  // Pre-step: with an arrival date, look up all six units before the model writes anything.
  let stay: { checkIn: string; checkOut: string; units: UnitAvailability[] } | null = null;
  if (startDate) {
    const checkOut = addDays(startDate, days);
    try {
      stay = {
        checkIn: startDate,
        checkOut,
        units: await Promise.all(UNIT_IDS.map((u) => unitAvailability(u, startDate, checkOut, lang)))
      };
    } catch (err) {
      console.error('Availability pre-step failed:', err);
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + AVAILABILITY_RULES },
    {
      role: 'user',
      content: buildPrompt(
        { days, people, interests, budget: budget as TourRequest['budget'], locale: lang, startDate, question },
        stay
      )
    }
  ];

  try {
    // The model may call check_availability a few times before writing the final answer.
    for (let round = 0; round < 4; round++) {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          // No tools on the last round, so it has to answer.
          ...(round < 3 ? { tools: [AVAILABILITY_TOOL] } : {})
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('OpenAI API error:', response.status, errText);
        return NextResponse.json(
          { error: 'Failed to generate tour. Please try again later.' },
          { status: 502 }
        );
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const toolCalls: { id: string; function?: { name?: string; arguments?: string } }[] = message?.tool_calls ?? [];

      if (toolCalls.length === 0) {
        const itinerary = message?.content;
        if (!itinerary) {
          return NextResponse.json({ error: 'No itinerary was generated.' }, { status: 502 });
        }
        return NextResponse.json({
          itinerary,
          // Structured copy of the pre-step, so the page can show booking links itself.
          availability: stay
            ? { checkIn: stay.checkIn, checkOut: stay.checkOut, units: stay.units.map(({ unit, available, book_url }) => ({ unit, available, bookUrl: book_url })) }
            : null
        });
      }

      messages.push(message);
      for (const call of toolCalls) {
        const result =
          call.function?.name === 'check_availability'
            ? await runAvailabilityTool(call.function.arguments ?? '{}', lang)
            : { error: 'Unknown tool.' };
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      }
    }

    return NextResponse.json({ error: 'No itinerary was generated.' }, { status: 502 });
  } catch (err) {
    console.error('OpenAI request failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate tour. Please try again later.' },
      { status: 502 }
    );
  }
}
