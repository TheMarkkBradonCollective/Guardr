import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const SVG = path.join(ROOT, 'logo.svg');

const BRAND_SAGE = '#5E7B61';

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  await copyFile(SVG, path.join(PUBLIC, 'logo.svg'));

  // Transparent PNG — primary logo for UI overlays (dark/light/grey themes)
  await sharp(SVG).resize(512, 512).png().toFile(path.join(PUBLIC, 'logo.png'));

  // Opaque JPG on black — social previews, email, contexts without alpha
  await sharp(SVG)
    .resize(512, 512)
    .flatten({ background: '#000000' })
    .jpeg({ quality: 92 })
    .toFile(path.join(PUBLIC, 'logo.jpg'));

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(SVG).resize(size, size).png().toFile(path.join(PUBLIC, name));
  }

  console.log('Generated public logo assets from logo.svg');
  console.log(`Brand sage: ${BRAND_SAGE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
