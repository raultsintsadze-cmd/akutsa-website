import { NextResponse } from 'next/server';
import { findMenuItem } from '@/lib/menuData';
import { TELEGRAM_ORDER_CHAT_ID } from '@/lib/constants';

export const runtime = 'nodejs';

interface OrderLine {
  itemId: string;
  qty: number;
}

interface OrderRequest {
  lines: OrderLine[];
  name: string;
  note?: string;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  if (lines.length === 0 || !name) {
    return NextResponse.json({ error: 'Order must include at least one item and a name.' }, {
      status: 400
    });
  }

  const resolvedLines: { name: string; qty: number; subtotal: number }[] = [];
  let total = 0;

  for (const line of lines) {
    const qty = Number(line?.qty);
    if (!line?.itemId || !Number.isFinite(qty) || qty < 1 || qty > 50) continue;

    const found = findMenuItem(line.itemId);
    if (!found) continue;

    const subtotal = found.item.price * qty;
    total += subtotal;
    resolvedLines.push({ name: found.item.name.ka, qty, subtotal });
  }

  if (resolvedLines.length === 0) {
    return NextResponse.json({ error: 'No valid menu items in order.' }, { status: 400 });
  }

  const itemsText = resolvedLines
    .map((l) => `• ${escapeHtml(l.name)} x${l.qty} = ${l.subtotal} ₾`)
    .join('\n');

  const dateText = new Date().toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' });

  const messageLines = [
    '🍽️ <b>ახალი შეკვეთა - Guest House Akutsa</b>',
    '',
    itemsText,
    '',
    `💰 სულ: ${total} ₾`,
    `📅 ${dateText}`,
    `📍 მომხმარებელი: ${escapeHtml(name)}`
  ];

  if (note) {
    messageLines.push(`📝 შენიშვნა: ${escapeHtml(note)}`);
  }

  const text = messageLines.join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ORDER_CHAT_ID,
        text,
        parse_mode: 'HTML'
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
