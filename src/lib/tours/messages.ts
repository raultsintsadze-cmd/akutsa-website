// Itinerary text and WhatsApp / Telegram messages for tour requests. Client-safe.
import type { Locale } from '@/i18n/config';
import { buildSchedule, type TripItem } from '@/lib/tours/schedule';
import type { Tour } from '@/lib/tours/types';

const WORDS: Record<Locale, { fullDay: string; approx: string; people: string; total: string; onRequest: string; transfer: string; staying: string }> = {
  ka: { fullDay: 'მთელი დღე', approx: 'დაახლ.', people: 'ადამიანი', total: 'სავარაუდო ჯამი', onRequest: 'ფასი შეთანხმებით', transfer: 'ტრანსფერი ბათუმიდან (ფასი შეთანხმებით)', staying: 'ვრჩები სასტუმრო სახლ აქუცაში' },
  en: { fullDay: 'full day', approx: 'approx.', people: 'people', total: 'Estimated total', onRequest: 'price on request', transfer: 'Transfer from Batumi (price on request)', staying: 'Staying at Guest House Akutsa' },
  ru: { fullDay: 'весь день', approx: 'ок.', people: 'чел.', total: 'Ориентировочная сумма', onRequest: 'цена по запросу', transfer: 'Трансфер из Батуми (цена по запросу)', staying: 'Живу в гостевом доме Акуца' }
};

// One line per item: "YYYY-MM-DD HH:MM — Tour name", in order.
export function itineraryLines(items: TripItem[], catalog: ReadonlyMap<string, Tour>, lang: Locale): string[] {
  const w = WORDS[lang];
  return buildSchedule(items, catalog).flatMap((day) =>
    day.items.map((i) => {
      const tour = catalog.get(i.slug)!;
      const note = i.fullDay ? ` (${w.fullDay})` : i.approx ? ` (${w.approx})` : '';
      return `${day.date} ${i.start} — ${tour.name[lang]}${note}`;
    })
  );
}

export interface TripSummary {
  lines: string[];
  people: number;
  total: number | null;
  staying: boolean;
  transfer: boolean;
}

function details(s: TripSummary, lang: Locale): string[] {
  const w = WORDS[lang];
  return [
    `👥 ${s.people} ${w.people}`,
    ...(s.staying ? [`🏡 ${w.staying}`] : []),
    ...(s.transfer ? [`🚐 ${w.transfer}`] : []),
    `💰 ${w.total}: ${s.total === null ? w.onRequest : `${s.total} GEL`}`
  ];
}

// Prefilled WhatsApp text the guest sends right after submitting.
export function guestTourRequestMessage(name: string, s: TripSummary, lang: Locale): string {
  const intro = {
    ka: `გამარჯობა! საიტიდან ტურების მოთხოვნა გამოვგზავნე. სახელი: ${name}.`,
    en: `Hi! I just sent a tour request on your website. Name: ${name}.`,
    ru: `Здравствуйте! Я отправил(а) заявку на туры с сайта. Имя: ${name}.`
  }[lang];
  return [intro, '', ...s.lines, '', ...details(s, lang)].join('\n');
}

// Owner -> guest after ✅ / ❌ in Telegram. `itinerary` is stored in the guest's language.
export function guestTourDecisionMessage(
  confirmed: boolean,
  name: string,
  itinerary: string,
  total: number | null,
  lang: Locale
): string {
  const totalText = total === null ? WORDS[lang].onRequest : `${total} GEL`;
  if (confirmed) {
    return {
      ka: `გამარჯობა, ${name}! თქვენი ტურები დადასტურებულია ✅\n\n${itinerary}\n\nსავარაუდო ჯამი: ${totalText}. გელოდებით!`,
      en: `Hello ${name}! Your tours are confirmed ✅\n\n${itinerary}\n\nEstimated total: ${totalText}. See you soon!`,
      ru: `Здравствуйте, ${name}! Ваши туры подтверждены ✅\n\n${itinerary}\n\nОриентировочная сумма: ${totalText}. Ждём вас!`
    }[lang];
  }
  return {
    ka: `გამარჯობა, ${name}! მადლობა მოთხოვნისთვის. სამწუხაროდ, ამ თარიღებში ეს ტურები ვერ მოვაწყვეთ. მოგვწერეთ და სხვა თარიღებს შევარჩევთ.`,
    en: `Hello ${name}, thank you for your request. Unfortunately we can't run these tours on those dates. Write to us and we'll find other dates.`,
    ru: `Здравствуйте, ${name}! Спасибо за заявку. К сожалению, в эти даты мы не можем провести эти туры. Напишите нам, и мы подберём другие даты.`
  }[lang];
}

// Telegram message to the owner (Georgian names, as the owner reads Georgian).
export function ownerTourRequestMessage(
  r: { name: string; phone: string; email?: string; language: Locale; notes?: string },
  s: TripSummary
): string {
  return [
    '🧭 ახალი ტურების მოთხოვნა (საიტი)',
    '',
    ...s.lines.map((l) => `• ${l}`),
    '',
    ...details(s, 'ka'),
    `👤 ${r.name}`,
    `📱 ${r.phone}`,
    ...(r.email ? [`✉️ ${r.email}`] : []),
    `🌐 ენა: ${r.language}`,
    ...(r.notes ? [`📝 ${r.notes}`] : [])
  ].join('\n');
}
