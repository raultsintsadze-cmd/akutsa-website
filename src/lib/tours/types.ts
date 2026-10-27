// Tour catalog types. Safe to import from client components.
import type { Locale } from '@/i18n/config';

export type DayType = 'Full day' | 'Short activity';
export type PriceType = 'per person' | 'per group' | 'on request';

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export type Month = (typeof MONTHS)[number];

export interface Tour {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  // Name EN, used to map onto the "Tours" multi-select of the requests database.
  nameEn: string;
  price: number | null;
  priceType: PriceType;
  overnightPrice: number | null;
  durationHours: number | null;
  // e.g. ["10:00", "15:00"]; empty = time agreed with the host.
  startTimes: string[];
  minPeople: number | null;
  maxPeople: number | null;
  // Empty = available all year.
  seasonMonths: Month[];
  dayType: DayType;
  operator: 'Akutsa' | 'Partner' | null;
  distanceKm: number | null;
  includes: string;
  // Stable image path through the proxy, or null.
  image: string | null;
  // Further "Photo" files, as /api/tour-image paths.
  gallery: string[];
  // First "Video" file, as an /api/tour-video path (redirects to Notion's signed URL).
  video: string | null;
  sortOrder: number;
}
