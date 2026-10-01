// Message texts for WhatsApp (guest's language) and Telegram (owner, Georgian).
import { SITE_URL } from '@/lib/constants';
import { BOOKING_POLICY, UNITS, type UnitId } from '@/lib/booking/units';
import { nightsBetween, type DateStr } from '@/lib/booking/dates';

export type Lang = 'ka' | 'en' | 'ru';

const UNIT_LABELS: Record<UnitId, Record<Lang, string>> = {
  lemon: { ka: 'ოთახი „ლიმონი“', en: 'Lemon Room', ru: 'номер «Лимон»' },
  strawberry: { ka: 'ოთახი „მარწყვი“', en: 'Strawberry Room', ru: 'номер «Клубника»' },
  blueberry: { ka: 'ოთახი „მოცვი“', en: 'Blueberry Room', ru: 'номер «Черника»' },
  fig: { ka: 'ოთახი „ლეღვი“', en: 'Fig Room', ru: 'номер «Инжир»' },
  cottage: { ka: 'კოტეჯი „პანორამა აქუცა“', en: 'Cottage "Panorama Akutsa"', ru: 'коттедж «Панорама Акуца»' },
  camper: { ka: 'კემპერი', en: 'Camper', ru: 'кемпер' }
};

export const unitLabel = (unit: UnitId, lang: Lang) => UNIT_LABELS[unit][lang];

// 2026-10-15 -> 15.10.2026
export const formatDate = (date: DateStr) => date.split('-').reverse().join('.');

export function bookUrl(lang: Lang, params?: { unit?: UnitId; checkIn?: DateStr; checkOut?: DateStr }): string {
  const query = new URLSearchParams();
  if (params?.unit) query.set('unit', params.unit);
  if (params?.checkIn) query.set('in', params.checkIn);
  if (params?.checkOut) query.set('out', params.checkOut);
  const qs = query.toString();
  return `${SITE_URL}/${lang}/book${qs ? `?${qs}` : ''}`;
}

export interface BookingSummary {
  unit: UnitId;
  checkIn: DateStr;
  checkOut: DateStr;
  guests: number;
  name: string;
  total: number;
}

export const estimateTotal = (unit: UnitId, checkIn: DateStr, checkOut: DateStr) =>
  UNITS[unit].pricePerNight * nightsBetween(checkIn, checkOut);

// Prefilled WhatsApp text the guest can send right after submitting the request.
export function guestRequestMessage(b: BookingSummary, lang: Lang): string {
  const dates = `${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}`;
  const unit = unitLabel(b.unit, lang);
  switch (lang) {
    case 'ka':
      return `გამარჯობა! ახლახან საიტიდან გამოვგზავნე ჯავშნის მოთხოვნა: ${unit}, ${dates}, სტუმრები: ${b.guests}. სახელი: ${b.name}.`;
    case 'ru':
      return `Здравствуйте! Я только что отправил(а) заявку на бронирование с сайта: ${unit}, ${dates}, гостей: ${b.guests}. Имя: ${b.name}.`;
    default:
      return `Hi! I just sent a booking request on your website: ${unit}, ${dates}, ${b.guests} guest(s). Name: ${b.name}.`;
  }
}

// Owner -> guest, after pressing Confirm in Telegram.
export function guestConfirmedMessage(b: BookingSummary, lang: Lang): string {
  const dates = `${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}`;
  const nights = nightsBetween(b.checkIn, b.checkOut);
  const unit = unitLabel(b.unit, lang);
  const { checkInTime, checkOutTime, freeCancellationHours } = BOOKING_POLICY;
  switch (lang) {
    case 'ka':
      return `გამარჯობა, ${b.name}! თქვენი ჯავშანი სასტუმრო სახლ აქუცაში დადასტურებულია ✅\n${unit}, ${dates} (${nights} ღამე), სტუმრები: ${b.guests}.\nსავარაუდო ჯამი: ${b.total} ლარი — გადახდა ადგილზე ან საბანკო გადარიცხვით.\nჩასახლება ${checkInTime}-დან, გასვლა ${checkOutTime}-მდე. საუზმე უფასოა.\nუფასო გაუქმება ჩამოსვლამდე ${freeCancellationHours} საათით ადრე. გელოდებით!`;
    case 'ru':
      return `Здравствуйте, ${b.name}! Ваше бронирование в гостевом доме Акуца подтверждено ✅\n${unit}, ${dates} (ночей: ${nights}), гостей: ${b.guests}.\nОриентировочная сумма: ${b.total} лари — оплата на месте или банковским переводом.\nЗаезд с ${checkInTime}, выезд до ${checkOutTime}. Завтрак бесплатный.\nБесплатная отмена за ${freeCancellationHours} часов до заезда. Ждём вас!`;
    default:
      return `Hello ${b.name}! Your booking at Guest House Akutsa is confirmed ✅\n${unit}, ${dates} (${nights} night(s)), ${b.guests} guest(s).\nEstimated total: ${b.total} GEL — payment on arrival or by bank transfer.\nCheck-in from ${checkInTime}, check-out by ${checkOutTime}. Breakfast is free.\nFree cancellation up to ${freeCancellationHours} hours before arrival. See you soon!`;
  }
}

// Owner -> guest, after pressing Decline in Telegram.
export function guestDeclinedMessage(b: BookingSummary, lang: Lang): string {
  const dates = `${formatDate(b.checkIn)} – ${formatDate(b.checkOut)}`;
  const unit = unitLabel(b.unit, lang);
  const link = bookUrl(lang);
  switch (lang) {
    case 'ka':
      return `გამარჯობა, ${b.name}! მადლობა მოთხოვნისთვის. სამწუხაროდ, ${unit} ${dates} თარიღებში თავისუფალი არ არის. სხვა თარიღები ან სხვა ვარიანტები შეგიძლიათ ნახოთ აქ: ${link}`;
    case 'ru':
      return `Здравствуйте, ${b.name}! Спасибо за заявку. К сожалению, ${unit} на ${dates} недоступен. Другие даты и варианты размещения можно посмотреть здесь: ${link}`;
    default:
      return `Hello ${b.name}, thank you for your request. Unfortunately the ${unit} is not available for ${dates}. You can check other dates or units here: ${link}`;
  }
}

// wa.me link to a guest's phone with a prefilled message.
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

// Telegram message to the owner for a new request (plain text, Georgian).
export function ownerRequestMessage(
  b: BookingSummary & { phone: string; language: Lang; email?: string; notes?: string }
): string {
  const nights = nightsBetween(b.checkIn, b.checkOut);
  return [
    '🛎 ახალი ჯავშნის მოთხოვნა (საიტი)',
    '',
    `🏠 ${unitLabel(b.unit, 'ka')}`,
    `📅 ${formatDate(b.checkIn)} – ${formatDate(b.checkOut)} (${nights} ღამე)`,
    `👥 სტუმრები: ${b.guests}`,
    `👤 ${b.name}`,
    `📱 ${b.phone}`,
    ...(b.email ? [`✉️ ${b.email}`] : []),
    `💰 სავარაუდო ჯამი: ${b.total} ₾`,
    `🌐 ენა: ${b.language}`,
    ...(b.notes ? [`📝 ${b.notes}`] : [])
  ].join('\n');
}
