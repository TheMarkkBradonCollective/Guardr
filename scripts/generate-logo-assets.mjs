import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCT_ICON_LABELS, renderBrandedIcon } from './branded-icon.mjs';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC, 'icons');
const ASSETS = path.join(ROOT, 'assets', 'logos');

/** Website favicon / share icons — black field with white shield. */
const INSTALL_ICON_BACKGROUND = '#000000';

const THEME_ICON_BACKGROUNDS = {
  light: '#FFFFFF',
  dark: '#000000',
  grey: '#101417',
};

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

/** Render the mark as solid black, preserving alpha from the source. */
async function blackMarkFromIcon(iconMaster, size) {
  const { data, info } = await iconMaster
    .clone()
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
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
  await (await blackMarkFromIcon(master, size)).toFile(dest);
}

async function writeWordmarkPng(master, height, dest) {
  const { data, info } = await master
    .clone()
    .resize({ height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(dest);
}

/**
 * White shield on solid background.
 */
async function renderIconOnBackground(iconMaster, size, background, { markRatio = 0.72 } = {}) {
  const markSize = Math.round(size * markRatio);
  const offset = Math.round((size - markSize) / 2);
  const mark = await (await whiteMarkFromIcon(iconMaster, markSize)).toBuffer();
  const layers = [{ input: mark, left: offset, top: offset }];
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

/** Maskable safe-zone icon — white mark. */
async function renderMaskableOnBackground(iconMaster, size, background) {
  return renderIconOnBackground(iconMaster, size, background, { markRatio: 0.58 });
}

async function writeThemeIcons(iconMaster) {
  await mkdir(ICONS_DIR, { recursive: true });

  for (const [theme, background] of Object.entries(THEME_ICON_BACKGROUNDS)) {
    // Dark / grey: white mark on dark field. Light favicon: white mark on black so
    // browser chrome still matches the install icon (black + white).
    const field = theme === 'light' ? INSTALL_ICON_BACKGROUND : background;
    const icon192 = await renderIconOnBackground(iconMaster, 192, field);
    const icon512 = await renderIconOnBackground(iconMaster, 512, field);
    const appleTouch = await renderIconOnBackground(iconMaster, 180, field);
    const favicon = await renderIconOnBackground(iconMaster, 64, field);
    const maskable = await renderMaskableOnBackground(iconMaster, 512, field);

    await sharp(icon192).toFile(path.join(ICONS_DIR, `icon-${theme}-192.png`));
    await sharp(icon512).toFile(path.join(ICONS_DIR, `icon-${theme}-512.png`));
    await sharp(appleTouch).toFile(path.join(ICONS_DIR, `apple-touch-icon-${theme}.png`));
    await sharp(favicon).toFile(path.join(ICONS_DIR, `favicon-${theme}.png`));
    await sharp(maskable).toFile(path.join(ICONS_DIR, `maskable-${theme}-512.png`));
  }

  // Default website icons: black + white shield (not an installable PWA).
  await sharp(
    await renderIconOnBackground(iconMaster, 192, INSTALL_ICON_BACKGROUND),
  ).toFile(path.join(PUBLIC, 'icon-192.png'));
  await sharp(
    await renderIconOnBackground(iconMaster, 512, INSTALL_ICON_BACKGROUND),
  ).toFile(path.join(PUBLIC, 'icon-512.png'));
  await sharp(
    await renderIconOnBackground(iconMaster, 180, INSTALL_ICON_BACKGROUND),
  ).toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await sharp(
    await renderMaskableOnBackground(iconMaster, 512, INSTALL_ICON_BACKGROUND),
  ).toFile(path.join(PUBLIC, 'icon-maskable-512.png'));
}

async function main() {
  await mkdir(PUBLIC, { recursive: true });

  const iconMaster = await prepareIconMaster();
  const wordmarkMaster = await prepareWordmarkMaster();

  // Transparent PNG — black mark for in-app UI (theme CSS inverts to white in dark mode)
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

  await writeThemeIcons(iconMaster);

  // Android notification badges are expected to be simple monochrome marks.
  await (await whiteMarkFromIcon(iconMaster, 72)).toFile(path.join(PUBLIC, 'badge-72.png'));

  // Keep a simple SVG favicon derived from the 512px mark for crisp scaling.
  const icon512 = await iconMaster.clone().resize(512, 512).png().toBuffer();
  const iconDataUri = `data:image/png;base64,${icon512.toString('base64')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${iconDataUri}" width="512" height="512"/></svg>`;
  await writeFile(path.join(PUBLIC, 'logo.svg'), svg);
  await writeFile(path.join(ROOT, 'logo.svg'), svg);

  // Role download icons: Guard unlabeled on white; Staff unlabeled on grey; Customer unlabeled on black.
  for (const [productApp, label] of Object.entries(PRODUCT_ICON_LABELS)) {
    const any192 = await renderBrandedIcon(iconMaster, 192, { productApp, label: label || null });
    const any512 = await renderBrandedIcon(iconMaster, 512, { productApp, label: label || null });
    const maskable = await renderBrandedIcon(iconMaster, 512, {
      productApp,
      label: label || null,
      safeZone: true,
    });
    await sharp(any192).toFile(path.join(ICONS_DIR, `${productApp}-192.png`));
    await sharp(any512).toFile(path.join(ICONS_DIR, `${productApp}-512.png`));
    await sharp(maskable).toFile(path.join(ICONS_DIR, `${productApp}-maskable-512.png`));
  }
  console.log('Generated public logo assets from real transparent uploads');
  console.log(`  icon: ${path.relative(ROOT, ICON_SOURCE)}`);
  console.log(`  wordmark: ${path.relative(ROOT, WORDMARK_SOURCE)}`);
  console.log('Website icons: black (#000000) + white shield');
  console.log('Role icons: Guard unlabeled white+black, Staff unlabeled grey+white, Customer unlabeled black, Messenger slate + white bubble + black shield, in /icons/{client,guard,staff,messenger}-*.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
