import { NextResponse } from 'next/server';
import { getAvailableRtveliDates } from '@/lib/rtveli';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const dates = await getAvailableRtveliDates();
    return NextResponse.json({ dates });
  } catch (err) {
    console.error('Failed to fetch Rtveli dates:', err);
    return NextResponse.json({ dates: [] });
  }
}
