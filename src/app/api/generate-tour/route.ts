import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface TourRequest {
  days: number;
  people: number;
  interests: string[];
  budget: 'low' | 'medium' | 'high';
  locale: 'ka' | 'en' | 'ru';
}

const LANGUAGE_NAMES: Record<TourRequest['locale'], string> = {
  ka: 'Georgian',
  en: 'English',
  ru: 'Russian'
};

function buildPrompt({ days, people, interests, budget, locale }: TourRequest) {
  const interestsText = interests.length > 0 ? interests.join(', ') : 'general sightseeing';

  return `You are a local travel expert for the Adjara region of Georgia (the country), based near Guest House Akutsa in Keda Municipality.

Create a personalized ${days}-day tour itinerary for ${people} ${people === 1 ? 'person' : 'people'} traveling around Adjara.

Traveler interests: ${interestsText}
Budget level: ${budget}

Guidelines:
- Base the itinerary around real Adjara attractions (e.g. Makhuntseti Waterfall, Goderdzi Pass, Batumi Boulevard, Batumi Botanical Garden, Black Sea coast, Keda, Khulo, the Datvisjvari Pass cable car, local wineries, Adjarian House Museums, etc.) and keep travel times between stops realistic for the region.
- Structure the response as "Day 1", "Day 2", etc., each with a short list of morning/afternoon/evening activities.
- Keep recommendations appropriate to the stated budget level.
- Mention approximate costs in GEL (Georgian Lari) where relevant.
- Keep the tone warm and practical, like a knowledgeable local host.
- Write the entire response in ${LANGUAGE_NAMES[locale]}.
- Do not include any preamble or closing remarks — start directly with "Day 1".`;
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
        messages: [{ role: 'user', content: prompt }],
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
