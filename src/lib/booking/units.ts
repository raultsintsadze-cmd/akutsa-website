// Bookable units and booking policy. Safe to import from client components.
import { ROOM_IMAGES, COTTAGE_IMAGES, CAMPER_IMAGES } from '@/lib/images';

export const UNIT_IDS = ['lemon', 'strawberry', 'blueberry', 'fig', 'cottage', 'camper'] as const;
export type UnitId = (typeof UNIT_IDS)[number];

export interface Unit {
  id: UnitId;
  // Option name in the Notion "Unit" select.
  notionName: string;
  // Translation key for the display name (root-level, e.g. t('guesthousePage.room1Name')).
  nameKey: string;
  pricePerNight: number; // GEL
  maxGuests: number;
  image: string;
  // Site page describing the unit (without locale prefix).
  page: string;
}

// EDIT ME: the site content only describes beds, not guest limits, so these are assumptions.
export const MAX_GUESTS: Record<UnitId, number> = {
  lemon: 2,
  strawberry: 2,
  blueberry: 2,
  fig: 2,
  cottage: 2,
  camper: 2
};

export const UNITS: Record<UnitId, Unit> = {
  lemon: { id: 'lemon', notionName: 'Lemon', nameKey: 'guesthousePage.room1Name', pricePerNight: 90, maxGuests: MAX_GUESTS.lemon, image: ROOM_IMAGES.lemon, page: '/guesthouse' },
  strawberry: { id: 'strawberry', notionName: 'Strawberry', nameKey: 'guesthousePage.room2Name', pricePerNight: 90, maxGuests: MAX_GUESTS.strawberry, image: ROOM_IMAGES.strawberry, page: '/guesthouse' },
  blueberry: { id: 'blueberry', notionName: 'Blueberry', nameKey: 'guesthousePage.room3Name', pricePerNight: 90, maxGuests: MAX_GUESTS.blueberry, image: ROOM_IMAGES.blueberry, page: '/guesthouse' },
  fig: { id: 'fig', notionName: 'Fig', nameKey: 'guesthousePage.room4Name', pricePerNight: 90, maxGuests: MAX_GUESTS.fig, image: ROOM_IMAGES.fig, page: '/guesthouse' },
  cottage: { id: 'cottage', notionName: 'Cottage', nameKey: 'properties.cottage.name', pricePerNight: 150, maxGuests: MAX_GUESTS.cottage, image: COTTAGE_IMAGES[0], page: '/cottage' },
  camper: { id: 'camper', notionName: 'Camper', nameKey: 'properties.camper.name', pricePerNight: 100, maxGuests: MAX_GUESTS.camper, image: CAMPER_IMAGES[0], page: '/camper' }
};

export const UNIT_LIST: Unit[] = UNIT_IDS.map((id) => UNITS[id]);

export function isUnitId(value: unknown): value is UnitId {
  return typeof value === 'string' && (UNIT_IDS as readonly string[]).includes(value);
}

export function unitFromNotionName(name: string | null | undefined): UnitId | null {
  return UNIT_LIST.find((u) => u.notionName === name)?.id ?? null;
}

export const BOOKING_POLICY = {
  checkInTime: '14:00',
  checkOutTime: '12:00',
  freeCancellationHours: 48,
  maxNights: 30,
  // How far ahead the calendar lets guests book.
  horizonDays: 365
} as const;
