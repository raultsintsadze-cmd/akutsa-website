import 'server-only';
import { whatsappLink } from '@/lib/booking/messages';
import { telegram } from '@/lib/booking/telegram';
import { getTourRequest, setTourRequestStatus } from '@/lib/tours/requests';
import { guestTourDecisionMessage } from '@/lib/tours/messages';

// ✅ / ❌ on a tour request in the owner chat (called by /api/telegram/booking).
export async function handleTourDecision(
  action: 'confirm' | 'decline',
  requestId: string,
  chatId: number | undefined,
  message: { message_id: number; text?: string } | undefined,
  answer: (text: string) => Promise<unknown>
): Promise<void> {
  const request = await getTourRequest(requestId);
  if (!request) {
    await answer('მოთხოვნა ვერ მოიძებნა');
    return;
  }
  const edit = (suffix: string) =>
    telegram('editMessageText', {
      chat_id: chatId,
      message_id: message?.message_id,
      text: `${message?.text ?? ''}\n\n${suffix}`
    });

  if (request.status !== 'Pending') {
    await edit(`ℹ️ სტატუსი უკვე არის: ${request.status}`);
    await answer(`უკვე: ${request.status}`);
    return;
  }

  const confirmed = action === 'confirm';
  await setTourRequestStatus(request.id, confirmed ? 'Confirmed' : 'Declined');
  await edit(confirmed ? '✅ დადასტურებულია' : '❌ უარყოფილია');

  if (request.phone) {
    const text = guestTourDecisionMessage(confirmed, request.guest, request.itinerary, request.estimatedTotal, request.language);
    await telegram('sendMessage', {
      chat_id: chatId,
      text: `📲 გაუგზავნეთ სტუმარს WhatsApp-ით (${request.language}):\n${whatsappLink(request.phone, text)}`,
      disable_web_page_preview: true
    });
  }
  await answer(confirmed ? 'დადასტურდა ✅' : 'უარყოფილია ❌');
}
