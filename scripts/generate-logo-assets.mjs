import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const ICONS_DIR = path.join(PUBLIC, 'icons');
const ASSETS = path.join(ROOT, 'assets', 'logos');

const BRAND_SAGE = '#5E7B61';

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

/** Colored shield centered on a solid theme background (PWA / favicon). */
async function renderIconOnBackground(iconMaster, size, background) {
  const markSize = Math.round(size * 0.72);
  const offset = Math.round((size - markSize) / 2);
  const mark = await iconMaster.clone().resize(markSize, markSize).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Maskable safe-zone icon on theme background. */
async function renderMaskableOnBackground(iconMaster, size, background) {
  const markSize = Math.round(size * 0.56);
  const offset = Math.round((size - markSize) / 2);
  const mark = await iconMaster.clone().resize(markSize, markSize).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png()
    .toBuffer();
}

async function writeThemeIcons(iconMaster) {
  await mkdir(ICONS_DIR, { recursive: true });

  for (const [theme, background] of Object.entries(THEME_ICON_BACKGROUNDS)) {
    const icon192 = await renderIconOnBackground(iconMaster, 192, background);
    const icon512 = await renderIconOnBackground(iconMaster, 512, background);
    const appleTouch = await renderIconOnBackground(iconMaster, 180, background);
    const favicon = await renderIconOnBackground(iconMaster, 64, background);
    const maskable = await renderMaskableOnBackground(iconMaster, 512, background);

    await sharp(icon192).toFile(path.join(ICONS_DIR, `icon-${theme}-192.png`));
    await sharp(icon512).toFile(path.join(ICONS_DIR, `icon-${theme}-512.png`));
    await sharp(appleTouch).toFile(path.join(ICONS_DIR, `apple-touch-icon-${theme}.png`));
    await sharp(favicon).toFile(path.join(ICONS_DIR, `favicon-${theme}.png`));
    await sharp(maskable).toFile(path.join(ICONS_DIR, `maskable-${theme}-512.png`));
  }

  // Default install assets use the light (white) theme.
  await sharp(await renderIconOnBackground(iconMaster, 192, THEME_ICON_BACKGROUNDS.light)).toFile(
    path.join(PUBLIC, 'icon-192.png')
  );
  await sharp(await renderIconOnBackground(iconMaster, 512, THEME_ICON_BACKGROUNDS.light)).toFile(
    path.join(PUBLIC, 'icon-512.png')
  );
  await sharp(await renderIconOnBackground(iconMaster, 180, THEME_ICON_BACKGROUNDS.light)).toFile(
    path.join(PUBLIC, 'apple-touch-icon.png')
  );
  await sharp(await renderMaskableOnBackground(iconMaster, 512, THEME_ICON_BACKGROUNDS.light)).toFile(
    path.join(PUBLIC, 'icon-maskable-512.png')
  );
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

  await writeThemeIcons(iconMaster);

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
  console.log(`Theme icon backgrounds: light=#FFFFFF (default), dark=#000000, grey=#101417`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
