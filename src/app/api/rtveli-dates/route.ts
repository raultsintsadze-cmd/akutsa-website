import { NextResponse } from 'next/server';
import { getAvailableRtveliDates } from '@/lib/rtveli';

export const runtime = 'nodejs';
// Read Notion on every request; without this the route is frozen at build time.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dates = await getAvailableRtveliDates();
    return NextResponse.json({ dates });
  } catch (err) {
    console.error('Failed to fetch Rtveli dates:', err);
    return NextResponse.json({ dates: [] });
  }
}
