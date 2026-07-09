import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const ASSETS = path.join(ROOT, 'assets', 'logos');

const BRAND_SAGE = '#5E7B61';

const ICON_SOURCE = path.join(ASSETS, 'icon-source.png');
const WORDMARK_SOURCE = path.join(ASSETS, 'wordmark-source.png');

/** Turn near-black pixels transparent (uploaded RGB masters use black, not alpha). */
async function removeBlackBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 40 && g < 40 && b < 40) {
      data[i + 3] = 0;
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

/** Trim transparent edges and pad to a centered square. */
async function trimAndSquare(input, paddingRatio = 0.08) {
  const trimmed = await input.trim({ threshold: 10 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(meta.width, meta.height) * paddingRatio);
  const side = Math.max(meta.width, meta.height) + pad * 2;
  const left = Math.floor((side - meta.width) / 2);
  const top = Math.floor((side - meta.height) / 2);
  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: trimmed, left, top }]);
}

/** Trim transparent edges, keep natural aspect ratio with light padding. */
async function trimWithPadding(input, paddingRatio = 0.06) {
  const trimmed = await input.trim({ threshold: 10 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const padX = Math.round(meta.width * paddingRatio);
  const padY = Math.round(meta.height * paddingRatio);
  return sharp({
    create: {
      width: meta.width + padX * 2,
      height: meta.height + padY * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: trimmed, left: padX, top: padY }]);
}

/** Render the mark as solid white, preserving alpha from the source. */
async function whiteMarkFromIcon(iconMaster, size) {
  const { data, info } = await iconMaster
    .clone()
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function prepareIconMaster() {
  const squared = await trimAndSquare(await removeBlackBackground(ICON_SOURCE));
  return sharp(await squared.png().toBuffer());
}

async function prepareWordmarkMaster() {
  const padded = await trimWithPadding(await removeBlackBackground(WORDMARK_SOURCE));
  return sharp(await padded.png().toBuffer());
}

async function writeIconPng(master, size, dest) {
  await master.clone().resize(size, size).png().toFile(dest);
}

async function writeWordmarkPng(master, height, dest) {
  await master.clone().resize({ height }).png().toFile(dest);
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });

  const iconMaster = await prepareIconMaster();
  const wordmarkMaster = await prepareWordmarkMaster();

  // Transparent PNG — primary mark for UI overlays (dark/light/grey themes)
  await writeIconPng(iconMaster, 512, path.join(PUBLIC, 'logo.png'));
  for (const size of [64, 128, 256]) {
    await writeIconPng(iconMaster, size, path.join(PUBLIC, `logo-${size}.png`));
  }

  // Full wordmark (shield + Guardr text) — loading screen, hero contexts
  await writeWordmarkPng(wordmarkMaster, 512, path.join(PUBLIC, 'logo-wordmark.png'));
  for (const height of [128, 256]) {
    await writeWordmarkPng(wordmarkMaster, height, path.join(PUBLIC, `logo-wordmark-${height}.png`));
  }

  // Opaque JPG on black — social previews, email, contexts without alpha
  await iconMaster
    .clone()
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
    await writeIconPng(iconMaster, size, path.join(PUBLIC, name));
  }

  // Dedicated maskable icon keeps the shield inside Android's safe zone.
  const whiteMark = await (await whiteMarkFromIcon(iconMaster, 360)).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BRAND_SAGE,
    },
  })
    .composite([{ input: whiteMark, left: 76, top: 76 }])
    .png()
    .toFile(path.join(PUBLIC, 'icon-maskable-512.png'));

  // Android notification badges are expected to be simple monochrome marks.
  await (await whiteMarkFromIcon(iconMaster, 72)).toFile(path.join(PUBLIC, 'badge-72.png'));

  // Keep a simple SVG favicon derived from the 512px mark for crisp scaling.
  const icon512 = await iconMaster.clone().resize(512, 512).png().toBuffer();
  const iconDataUri = `data:image/png;base64,${icon512.toString('base64')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${iconDataUri}" width="512" height="512"/></svg>`;
  await writeFile(path.join(PUBLIC, 'logo.svg'), svg);
  await writeFile(path.join(ROOT, 'logo.svg'), svg);

  console.log('Generated public logo assets from real transparent uploads');
  console.log(`  icon: ${path.relative(ROOT, ICON_SOURCE)}`);
  console.log(`  wordmark: ${path.relative(ROOT, WORDMARK_SOURCE)}`);
  console.log(`Brand sage: ${BRAND_SAGE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
