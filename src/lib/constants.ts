export const TELEGRAM_URL = 'https://t.me/raultsintsadze';
export const WHATSAPP_URL = 'https://wa.me/995577225289';
export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/Guest+House+Akutsa/@41.6003593,41.9625711,438m/data=!3m1!1e3!4m9!3m8!1s0x405d5fccc6c655c3:0x624767535c8b1db1!5m2!4m1!1i2!8m2!3d41.6001497!4d41.963986!16s%2Fg%2F11wn5tzvfy';
export const GOOGLE_MAPS_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d438!2d41.9625711!3d41.6003593!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x405d5fccc6c655c3:0x624767535c8b1db1!2sGuest+House+Akutsa!5e0!3m2!1sen!2sge!4v1234567890';

export const SOCIAL_LINKS = {
  facebook:
    'https://www.facebook.com/p/Guest-House-Akutsa-%E1%83%90%E1%83%A5%E1%83%A3%E1%83%AA%E1%83%90-61567529447510/',
  instagram: 'https://www.instagram.com/akutsa_resort/',
  tiktok: 'https://www.tiktok.com/@guesthouseakutsa',
  booking: 'https://www.booking.com/hotel/ge/guest-house-aku-tsa-keda.html'
};

export const SITE_URL = 'https://akutsa-website.vercel.app';

export const mapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
