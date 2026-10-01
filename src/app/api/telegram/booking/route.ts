import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAvailable } from '@/lib/availability';
import { getBooking, setBookingStatus } from '@/lib/booking/store';
import {
  guestConfirmedMessage,
  guestDeclinedMessage,
  whatsappLink,
  type Lang
} from '@/lib/booking/messages';
import { OWNER_CHAT_ID, bookingKeyboard, parseBookingCallback, telegram } from '@/lib/booking/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface CallbackQuery {
  id: string;
  data?: string;
  from?: { id: number };
  message?: { message_id: number; chat: { id: number }; text?: string };
}

// Telegram webhook for the ✅ Confirm / ❌ Decline buttons on booking requests.
// Telegram sends the secret set in setWebhook as X-Telegram-Bot-Api-Secret-Token.
// Any other kind of update is acknowledged and ignored, so nothing else the bot does changes.
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !secretMatches(req.headers.get('x-telegram-bot-api-secret-token'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as { callback_query?: CallbackQuery } | null;
  const query = update?.callback_query;
  const parsed = parseBookingCallback(query?.data);
  if (!query || !parsed) return NextResponse.json({ ok: true });

  const answer = (text: string) =>
    telegram('answerCallbackQuery', { callback_query_id: query.id, text, show_alert: false });

  // Only the owner chat may confirm or decline.
  const chatId = query.message?.chat.id;
  if (String(chatId) !== String(OWNER_CHAT_ID)) {
    await answer('⛔');
    return NextResponse.json({ ok: true });
  }

  try {
    const booking = await getBooking(parsed.bookingId);
    const original = query.message?.text ?? '';
    const edit = (suffix: string, keepButtons = false) =>
      telegram('editMessageText', {
        chat_id: chatId,
        message_id: query.message?.message_id,
        text: `${original}\n\n${suffix}`,
        ...(keepButtons && booking ? { reply_markup: bookingKeyboard(booking.id) } : {})
      });

    if (!booking) {
      await answer('ჯავშანი ვერ მოიძებნა');
      return NextResponse.json({ ok: true });
    }
    if (booking.status !== 'Pending') {
      await edit(`ℹ️ სტატუსი უკვე არის: ${booking.status}`);
      await answer(`უკვე: ${booking.status}`);
      return NextResponse.json({ ok: true });
    }

    const lang: Lang = booking.language ?? 'en';
    const summary = {
      unit: booking.unit,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests ?? 1,
      name: booking.guest,
      total: booking.estimatedPrice ?? 0
    };

    if (parsed.action === 'confirm') {
      // Final check against confirmed bookings and fresh Booking.com / Airbnb calendars.
      const free = await isAvailable(booking.unit, booking.checkIn, booking.checkOut, {
        fresh: true,
        excludeBookingId: booking.id,
        includePending: false
      });
      if (!free) {
        await edit('⚠️ ვერ დადასტურდა: ეს თარიღები უკვე დაკავებულია (სხვა ჯავშანი ან Booking.com/Airbnb). შეამოწმეთ კალენდარი ან უარყავით.', true);
        await answer('თარიღები დაკავებულია');
        return NextResponse.json({ ok: true });
      }
      await setBookingStatus(booking.id, 'Confirmed');
      await edit('✅ დადასტურებულია');
    } else {
      await setBookingStatus(booking.id, 'Declined');
      await edit('❌ უარყოფილია');
    }

    if (booking.phone) {
      const text =
        parsed.action === 'confirm' ? guestConfirmedMessage(summary, lang) : guestDeclinedMessage(summary, lang);
      await telegram('sendMessage', {
        chat_id: chatId,
        text: `📲 გაუგზავნეთ სტუმარს WhatsApp-ით (${lang}):\n${whatsappLink(booking.phone, text)}`,
        disable_web_page_preview: true
      });
    }
    await answer(parsed.action === 'confirm' ? 'დადასტურდა ✅' : 'უარყოფილია ❌');
  } catch (err) {
    console.error('Telegram booking action failed:', err);
    await answer('შეცდომა — სცადეთ თავიდან');
  }

  // Always 200 so Telegram doesn't retry the same button press.
  return NextResponse.json({ ok: true });
}
