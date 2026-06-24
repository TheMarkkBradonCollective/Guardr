import sharp from 'sharp';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const SVG = path.join(ROOT, 'logo.svg');

const BRAND_SAGE = '#5E7B61';
const WHITE_LOGO = '#FFFFFF';

async function logoSvgWithFill(fill) {
  const svg = await readFile(SVG, 'utf8');
  return Buffer.from(svg.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${fill}"`));
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });
  await copyFile(SVG, path.join(PUBLIC, 'logo.svg'));

  // Transparent PNG — primary logo for UI overlays (dark/light/grey themes)
  await sharp(SVG).resize(512, 512).png().toFile(path.join(PUBLIC, 'logo.png'));

  for (const size of [64, 128, 256]) {
    await sharp(SVG).resize(size, size).png().toFile(path.join(PUBLIC, `logo-${size}.png`));
  }

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

  const whiteLogo = await logoSvgWithFill(WHITE_LOGO);

  // Dedicated maskable icon keeps the shield inside Android's safe zone.
  const maskableMark = await sharp(whiteLogo).resize(360, 360).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BRAND_SAGE,
    },
  })
    .composite([{ input: maskableMark, left: 76, top: 76 }])
    .png()
    .toFile(path.join(PUBLIC, 'icon-maskable-512.png'));

  // Android notification badges are expected to be simple monochrome marks.
  await sharp(whiteLogo).resize(72, 72).png().toFile(path.join(PUBLIC, 'badge-72.png'));

  console.log('Generated public logo assets from logo.svg');
  console.log(`Brand sage: ${BRAND_SAGE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
