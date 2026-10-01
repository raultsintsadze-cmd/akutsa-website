import 'server-only';
import { TELEGRAM_ORDER_CHAT_ID } from '@/lib/constants';

// The owner chat that already receives menu orders and Rtveli requests.
export const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID ?? TELEGRAM_ORDER_CHAT_ID;

// TELEGRAM_API_BASE_URL is only set by the end-to-end tests (mock Telegram server).
const API_BASE = process.env.TELEGRAM_API_BASE_URL ?? 'https://api.telegram.org';

export async function telegram(method: string, payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) console.error(`Telegram ${method} failed:`, res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error(`Telegram ${method} failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}

// callback_data for the Confirm / Decline buttons: "bk:c:<notion page id>" / "bk:d:<id>".
export const bookingCallback = (action: 'c' | 'd', bookingId: string) =>
  `bk:${action}:${bookingId.replace(/-/g, '')}`;

export function parseBookingCallback(data: unknown): { action: 'confirm' | 'decline'; bookingId: string } | null {
  const match = typeof data === 'string' ? data.match(/^bk:([cd]):([0-9a-f]{32})$/) : null;
  return match ? { action: match[1] === 'c' ? 'confirm' : 'decline', bookingId: match[2] } : null;
}

export function bookingKeyboard(bookingId: string) {
  return {
    inline_keyboard: [
      [
        { text: '✅ დადასტურება', callback_data: bookingCallback('c', bookingId) },
        { text: '❌ უარყოფა', callback_data: bookingCallback('d', bookingId) }
      ]
    ]
  };
}
