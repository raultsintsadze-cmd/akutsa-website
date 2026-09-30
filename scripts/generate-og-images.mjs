// Generates the 1200x630 Open Graph images and the hero video poster from existing photos.
// Usage: node scripts/generate-og-images.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const OG = [
  ['public/images/terrace.jpg.jpeg', 'public/og/og-default.jpg'],
  ['public/images/terrace.jpg.jpeg', 'public/og/og-guesthouse.jpg'],
  ['public/images/cottage1.jpg.jpeg', 'public/og/og-cottage.jpg'],
  ['public/images/camping1.jpg.jpeg', 'public/og/og-camper.jpg'],
  ['public/images/localtours/loc1.jpg', 'public/og/og-rtveli.jpg']
];

fs.mkdirSync('public/og', { recursive: true });

for (const [src, out] of OG) {
  await sharp(src)
    .rotate() // respect EXIF orientation
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);
  console.log(out, `${Math.round(fs.statSync(out).size / 1024)} KB`);
}

// Lightweight poster shown before (or instead of) the home hero video.
const poster = 'public/videos/hero-poster.jpg';
await sharp('public/images/terrace.jpg.jpeg')
  .rotate()
  .resize({ width: 1280, withoutEnlargement: true })
  .jpeg({ quality: 68, mozjpeg: true })
  .toFile(poster);
console.log(poster, `${Math.round(fs.statSync(poster).size / 1024)} KB`);
