import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const ICON_SOURCE = path.join(ROOT, 'assets', 'logos', 'icon-source.png');
const RES = path.join(ROOT, 'android/app/src/main/res');

/** APK home-screen icon — black background with brand sage shield (PWA stays white). */
const ICON_BACKGROUND = '#000000';
const SPLASH_BACKGROUND = '#000000';

/** Launcher mipmaps (legacy + round). */
const LAUNCHER_SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

/** Adaptive icon foreground layer (108dp baseline). */
const FOREGROUND_SIZES = [
  { dir: 'mipmap-mdpi', size: 108 },
  { dir: 'mipmap-hdpi', size: 162 },
  { dir: 'mipmap-xhdpi', size: 216 },
  { dir: 'mipmap-xxhdpi', size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

const SPLASH_SCREENS = [
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
];

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

async function prepareIconMaster() {
  const squared = await trimAndSquare(await removeBlackBackground(ICON_SOURCE));
  return sharp(await squared.png().toBuffer());
}

async function coloredMarkPng(iconMaster, size) {
  return iconMaster.clone().resize(size, size).png().toBuffer();
}

/** White background + centered sage shield (launcher icon). */
async function renderLauncherIcon(iconMaster, size) {
  const logoSize = Math.round(size * 0.7);
  const offset = Math.round((size - logoSize) / 2);
  const logo = await coloredMarkPng(iconMaster, logoSize);
  return sharp({
    create: { width: size, height: size, channels: 4, background: ICON_BACKGROUND },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Transparent layer with colored shield for adaptive icon foreground. */
async function renderForegroundIcon(iconMaster, size) {
  const logoSize = Math.round(size * 0.58);
  const offset = Math.round((size - logoSize) / 2);
  const logo = await coloredMarkPng(iconMaster, logoSize);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** APK splash — black fill with centered brand sage shield. */
async function renderSplash(iconMaster, width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.34);
  const offsetX = Math.round((width - logoSize) / 2);
  const offsetY = Math.round((height - logoSize) / 2);
  const logo = await coloredMarkPng(iconMaster, logoSize);
  return sharp({
    create: { width, height, channels: 4, background: SPLASH_BACKGROUND },
  })
    .composite([{ input: logo, left: offsetX, top: offsetY }])
    .png()
    .toBuffer();
}

async function writePng(dir, filename, buffer) {
  const outDir = path.join(RES, dir);
  await mkdir(outDir, { recursive: true });
  await sharp(buffer).toFile(path.join(outDir, filename));
}

async function main() {
  const iconMaster = await prepareIconMaster();

  for (const { dir, size } of LAUNCHER_SIZES) {
    const icon = await renderLauncherIcon(iconMaster, size);
    await writePng(dir, 'ic_launcher.png', icon);
    await writePng(dir, 'ic_launcher_round.png', icon);
  }

  for (const { dir, size } of FOREGROUND_SIZES) {
    const foreground = await renderForegroundIcon(iconMaster, size);
    await writePng(dir, 'ic_launcher_foreground.png', foreground);
  }

  for (const { dir, width, height } of SPLASH_SCREENS) {
    const splash = await renderSplash(iconMaster, width, height);
    await writePng(dir, 'splash.png', splash);
  }

  const defaultSplash = await renderSplash(iconMaster, 480, 800);
  await writePng('drawable', 'splash.png', defaultSplash);

  console.log('Generated Guardr-branded Android icons and splash screens');
  console.log(`Launcher icon background: ${ICON_BACKGROUND}, splash: ${SPLASH_BACKGROUND}, shield: brand sage mark`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
