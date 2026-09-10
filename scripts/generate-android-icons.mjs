import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  blackMarkPng,
  iconChromeForProductApp,
  iconLabelForProductApp,
  renderBrandedIcon,
  renderMessengerBubbleMark,
  whiteMarkPng,
} from './branded-icon.mjs';

const ROOT = process.cwd();
const ICON_SOURCE = path.join(ROOT, 'assets', 'logos', 'icon-source.png');
const RES = path.join(ROOT, 'android/app/src/main/res');

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

function parseProductAppArg() {
  const arg = process.argv.find((item) => item.startsWith('--productApp='));
  const value = (arg?.slice('--productApp='.length) || process.env.GUARDR_PRODUCT_APP || '').trim();
  if (value === 'client' || value === 'guard' || value === 'staff' || value === 'messenger') return value;
  return null;
}

/** Role launcher: Guard white + black; Staff grey + white; Customer black + white. */
async function renderLauncherIcon(iconMaster, size, productApp) {
  return renderBrandedIcon(iconMaster, size, {
    productApp,
    label: iconLabelForProductApp(productApp),
    safeZone: false,
  });
}

/** Transparent adaptive foreground — label stays inside the maskable safe zone. */
async function renderForegroundIcon(iconMaster, size, productApp) {
  return renderBrandedIcon(iconMaster, size, {
    productApp,
    label: iconLabelForProductApp(productApp),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    safeZone: true,
  });
}

/** APK splash — Guard white + black shield; Staff grey + white shield; Customer black + white; Messenger bubble. */
async function renderSplash(iconMaster, width, height, productApp) {
  const chrome = iconChromeForProductApp(productApp);
  const logoSize = Math.round(Math.min(width, height) * (productApp === 'messenger' ? 0.42 : 0.34));
  const offsetX = Math.round((width - logoSize) / 2);
  const offsetY = Math.round((height - logoSize) / 2);
  const logo =
    productApp === 'messenger'
      ? await renderMessengerBubbleMark(iconMaster, logoSize)
      : chrome.mark === 'black'
        ? await blackMarkPng(iconMaster, logoSize)
        : await whiteMarkPng(iconMaster, logoSize);
  return sharp({
    create: { width, height, channels: 4, background: chrome.background },
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
  const productApp = parseProductAppArg();
  const label = iconLabelForProductApp(productApp);

  for (const { dir, size } of LAUNCHER_SIZES) {
    const icon = await renderLauncherIcon(iconMaster, size, productApp);
    await writePng(dir, 'ic_launcher.png', icon);
    await writePng(dir, 'ic_launcher_round.png', icon);
  }

  for (const { dir, size } of FOREGROUND_SIZES) {
    const foreground = await renderForegroundIcon(iconMaster, size, productApp);
    await writePng(dir, 'ic_launcher_foreground.png', foreground);
  }

  for (const { dir, width, height } of SPLASH_SCREENS) {
    const splash = await renderSplash(iconMaster, width, height, productApp);
    await writePng(dir, 'splash.png', splash);
  }

  const defaultSplash = await renderSplash(iconMaster, 480, 800, productApp);
  await writePng('drawable', 'splash.png', defaultSplash);

  const chrome = iconChromeForProductApp(productApp);
  console.log('Generated Guardr-branded Android icons and splash screens');
  console.log(
    label
      ? `Launcher icon: ${chrome.background} field + ${chrome.mark} shield + "${label}" under the logo`
      : productApp === 'messenger'
        ? `Launcher icon: ${chrome.background} field + white chat bubble + black shield; splash: ${chrome.background}`
        : `Launcher icon: ${chrome.background} field + ${chrome.mark} shield (no role label); splash: ${chrome.background}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
