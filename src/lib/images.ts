export const img = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// Real guest house room photos
export const ROOM_IMAGES = {
  lemon: '/images/room-lemon.jpg.jpeg',
  strawberry: '/images/room-strawberry.jpg.jpeg',
  blueberry: '/images/room-blueberry.jpg.jpeg',
  fig: '/images/room-fig.jpg.jpg'
};

// Real shared-amenity photos (guest house)
export const GUESTHOUSE_SHARED_IMAGES = {
  kitchen: '/images/kitchen2.jpg.jpeg',
  bathroom: '/images/toilet.jpg.jpg',
  terrace: '/images/terrace.jpg.jpeg',
  diner: '/images/diner.jpg.jpg'
};

// Real cottage photos
export const COTTAGE_IMAGES = [
  '/images/cottage1.jpg.jpeg',
  '/images/cottage2.jpg.jpeg',
  '/images/cottage.jpg.jpeg'
];

// Real camper photos
export const CAMPER_IMAGES = [
  '/images/camping1.jpg.jpeg',
  '/images/camping2.jpg.jpeg',
  '/images/camping3.jpg.jpeg',
  '/images/camping4.jpg.jpeg'
];

export const galleryImages = [
  { src: ROOM_IMAGES.lemon, category: 'guesthouse' },
  { src: ROOM_IMAGES.strawberry, category: 'guesthouse' },
  { src: ROOM_IMAGES.blueberry, category: 'guesthouse' },
  { src: ROOM_IMAGES.fig, category: 'guesthouse' },
  { src: GUESTHOUSE_SHARED_IMAGES.kitchen, category: 'guesthouse' },
  { src: GUESTHOUSE_SHARED_IMAGES.bathroom, category: 'guesthouse' },
  { src: GUESTHOUSE_SHARED_IMAGES.terrace, category: 'guesthouse' },
  { src: GUESTHOUSE_SHARED_IMAGES.diner, category: 'guesthouse' },
  { src: COTTAGE_IMAGES[0], category: 'cottage' },
  { src: COTTAGE_IMAGES[1], category: 'cottage' },
  { src: COTTAGE_IMAGES[2], category: 'cottage' },
  { src: CAMPER_IMAGES[0], category: 'camper' },
  { src: CAMPER_IMAGES[1], category: 'camper' },
  { src: CAMPER_IMAGES[2], category: 'camper' },
  { src: CAMPER_IMAGES[3], category: 'camper' }
];

export const instagramImages = [
  'insta-1',
  'insta-2',
  'insta-3',
  'insta-4',
  'insta-5',
  'insta-6'
];
