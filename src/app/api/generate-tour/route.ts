import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface TourRequest {
  days: number;
  people: number;
  interests: string[];
  budget: 'low' | 'medium' | 'high';
  locale: 'ka' | 'en' | 'ru';
}


const SYSTEM_PROMPT = `You are an expert local tour guide for the Keda Municipality and Adjara region of Georgia. You have deep knowledge of the area. Always respond in English only, regardless of the language used in the request.

LOCATION BASE: Guest House Akutsa, Village Akutsa, Keda Municipality, Adjara, Georgia (3km from Keda center, 1 hour from Batumi)

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
11. Batumi - 60km - Black Sea coast, botanical garden, old town, beaches
12. Goderdzi Pass - 55km - mountain pass, panoramic views, connects to Samtskhe-Javakheti
13. Black Sea Coast (Kobuleti, Ureki) - 65km

LOCAL EXPERIENCES AVAILABLE AT AKUTSA:
- Beekeeping masterclass (20 GEL/person) - visit real beehives, taste fresh honey
- Culinary masterclass - cook traditional Adjarian dishes (30 GEL/person)
- Picnic space for up to 60 people (5 GEL/person)
- Local products: natural honey (30 GEL), wine (15 GEL), chacha/vodka (12 GEL/500ml), fresh fruits (5 GEL)
- Home-cooked traditional Adjarian breakfast available

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
11. Always write in English only. Begin your response with the line: "Tour generated in English for international guests." then a blank line, then "Day 1".

function buildPrompt({ days, people, interests, budget, locale }: TourRequest) {
  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing';

  return `Create a personalized ${days}-day tour itinerary for ${people} ${people === 1 ? 'person' : 'people'}.

Traveler interests: ${interestsText}
Budget level: ${budget}

Additional guidelines:
- Structure the response as "Day 1", "Day 2", etc., each with morning/afternoon/evening activities.
- Keep recommendations appropriate to the stated budget level.
- All prices must be in GEL (Georgian Lari).
- Write the entire response in English only.`;
}

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

  const prompt = buildPrompt({
    days,
    people,
    interests,
    budget: budget as TourRequest['budget'],
    locale: locale as TourRequest['locale']
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
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
    const itinerary = data.choices?.[0]?.message?.content;

    if (!itinerary) {
      return NextResponse.json({ error: 'No itinerary was generated.' }, { status: 502 });
    }

    return NextResponse.json({ itinerary });
  } catch (err) {
    console.error('OpenAI request failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate tour. Please try again later.' },
      { status: 502 }
    );
  }
}
