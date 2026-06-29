import { NextResponse } from 'next/server';
import { findMenuItem } from '@/lib/menuData';
import { TELEGRAM_ORDER_CHAT_ID } from '@/lib/constants';

export const runtime = 'nodejs';

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00'
];

interface OrderLine {
  itemId: string;
  qty: number;
}

interface OrderRequest {
  lines: OrderLine[];
  name: string;
  date: string;
  time: string;
  note?: string;
}

function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN is not configured on the server.' },
      { status: 500 }
    );
  }

  let body: Partial<OrderRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const time = typeof body.time === 'string' ? body.time : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  if (
    lines.length === 0 ||
    !name ||
    !isValidDate(date) ||
    !TIME_SLOTS.includes(time)
  ) {
    return NextResponse.json(
      { error: 'Order must include items, a name, a valid future date, and a valid time slot.' },
      { status: 400 }
    );
  }

  const resolvedLines: { name: string; qty: number; price: number }[] = [];
  let total = 0;

  for (const line of lines) {
    const qty = Number(line?.qty);
    if (!line?.itemId || !Number.isFinite(qty) || qty < 1 || qty > 50) continue;

    const found = findMenuItem(line.itemId);
    if (!found) continue;

    total += found.item.price * qty;
    resolvedLines.push({ name: found.item.name.ka, qty, price: found.item.price });
  }

  if (resolvedLines.length === 0) {
    return NextResponse.json({ error: 'No valid menu items in order.' }, { status: 400 });
  }

  const itemsText = resolvedLines
    .map((l) => `- ${l.name} x${l.qty} — ${l.price * l.qty} ₾`)
    .join('\n');

  const dateText = new Date(`${date}T00:00:00`).toLocaleDateString('ka-GE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const messageLines = [
    '🍽️ ახალი შეკვეთა - Guest House Akutsa',
    '',
    `👤 სახელი: ${name}`,
    `📅 თარიღი: ${dateText}`,
    `🕐 საათი: ${time}`,
    '',
    'კერძები:',
    itemsText,
    '',
    `💰 სულ: ${total} ₾`
  ];

  if (note) {
    messageLines.push(`📝 შენიშვნა: ${note}`);
  }

  const text = messageLines.join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ORDER_CHAT_ID,
        text
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Telegram API error:', response.status, errText);
      return NextResponse.json(
        { error: 'Failed to send order. Please try again later.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, total });
  } catch (err) {
    console.error('Telegram request failed:', err);
    return NextResponse.json(
      { error: 'Failed to send order. Please try again later.' },
      { status: 502 }
    );
  }
}
