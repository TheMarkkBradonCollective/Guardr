import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCT_ICON_LABELS, renderBrandedIcon } from './branded-icon.mjs';

const ROOT = process.cwd();
const ICON_SOURCE = path.join(ROOT, 'assets', 'logos', 'icon-source.png');
const OUT_DIR = path.join(ROOT, 'assets', 'play-store');

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

async function whiteMarkPng(iconMaster, size) {
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

async function renderStoreIcon(iconMaster, size) {
  const logoSize = Math.round(size * 0.62);
  const offset = Math.round((size - logoSize) / 2);
  const logo = await (await whiteMarkPng(iconMaster, logoSize)).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 3, background: '#000000' },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function renderFeatureGraphic(iconMaster) {
  const width = 1024;
  const height = 500;
  const logoSize = 220;
  const logo = await (await whiteMarkPng(iconMaster, logoSize)).toBuffer();

  const titleSvg = Buffer.from(`
    <svg width="640" height="120" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="72" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="#FFFFFF">Guardr</text>
      <text x="0" y="112" font-family="Inter, Arial, sans-serif" font-size="28" fill="#B3B3B3">Security marketplace for guards &amp; clients</text>
    </svg>
  `);

  return sharp({
    create: { width, height, channels: 3, background: '#000000' },
  })
    .composite([
      { input: logo, left: 72, top: Math.round((height - logoSize) / 2) },
      { input: titleSvg, left: 320, top: Math.round((height - 120) / 2) },
    ])
    .png()
    .toBuffer();
}

async function main() {
  const iconMaster = await prepareIconMaster();
  await mkdir(OUT_DIR, { recursive: true });

  await sharp(await renderStoreIcon(iconMaster, 512)).toFile(path.join(OUT_DIR, 'icon-512.png'));
  await sharp(await renderFeatureGraphic(iconMaster)).toFile(path.join(OUT_DIR, 'feature-graphic-1024x500.png'));

  for (const [productApp, label] of Object.entries(PRODUCT_ICON_LABELS)) {
    const dest = path.join(OUT_DIR, `${productApp}-icon-512.png`);
    await sharp(await renderBrandedIcon(iconMaster, 512, { label })).toFile(dest);
  }

  console.log('Generated Play Store assets:');
  console.log(`  ${path.join(OUT_DIR, 'icon-512.png')}  (unlabeled brand)`);
  console.log(`  ${path.join(OUT_DIR, 'feature-graphic-1024x500.png')}`);
  console.log(`  ${path.join(OUT_DIR, 'client-icon-512.png')}  Customer — black + white`);
  console.log(`  ${path.join(OUT_DIR, 'guard-icon-512.png')}  Guard — black + white`);
  console.log(`  ${path.join(OUT_DIR, 'staff-icon-512.png')}  Staff — white + black`);
  console.log('\nUpload the matching 512 icon in each Play Console listing.');
  console.log('Phone screenshots still need to be captured from a device or emulator.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
