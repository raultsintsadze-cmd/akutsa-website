import { NextResponse } from 'next/server';
import { TELEGRAM_ORDER_CHAT_ID } from '@/lib/constants';

export const runtime = 'nodejs';

interface BookingRequest {
  date: string;
  vehicle: string;
  seats: number;
  name: string;
  contact: string;
}

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  }

  let body: Partial<BookingRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const vehicle = typeof body.vehicle === 'string' ? body.vehicle.trim() : '';
  const seats = Number(body.seats);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';

  if (!date || !name || !contact || !Number.isFinite(seats) || seats < 1 || seats > 6) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const text = [
    '🍇 New Rtveli Booking Request',
    '',
    `📅 Date: ${formattedDate}`,
    `👥 Seats requested: ${seats}`,
    `🚐 Vehicle: ${vehicle || 'Not specified'}`,
    `👤 Name: ${name}`,
    `📱 Contact: ${contact}`
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_ORDER_CHAT_ID, text })
    });

    if (!res.ok) {
      console.error('Telegram error:', await res.text());
      return NextResponse.json({ error: 'Failed to send booking.' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telegram request failed:', err);
    return NextResponse.json({ error: 'Failed to send booking.' }, { status: 502 });
  }
}
