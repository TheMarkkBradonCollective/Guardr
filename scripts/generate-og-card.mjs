// Phase 8: 1200x630 social card for og:image / twitter:image.
// Black and white only, built from the website icon. Run: node scripts/generate-og-card.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const W = 1200;
const H = 630;

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .t { font-family: Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif; fill: #ffffff; }
  </style>
  <text class="t" x="470" y="270" font-size="96" font-weight="800" letter-spacing="-2">Guardr</text>
  <text class="t" x="474" y="340" font-size="34" font-weight="500" fill-opacity="0.82">Post coverage. Hire licensed guards.</text>
  <text class="t" x="474" y="392" font-size="26" font-weight="400" fill-opacity="0.6">Independent security marketplace · guardr.co</text>
  <rect x="474" y="440" width="120" height="4" fill="#ffffff"/>
</svg>`);

const icon = await sharp(path.join(PUBLIC, 'icon-512.png')).resize(300, 300).toBuffer();

await sharp({ create: { width: W, height: H, channels: 3, background: '#000000' } })
  .composite([
    { input: icon, left: 120, top: 165 },
    { input: text, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'og-card.png'));

console.log('Wrote public/og-card.png (1200x630)');
