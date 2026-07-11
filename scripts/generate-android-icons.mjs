import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SVG = path.join(ROOT, 'logo.svg');
const RES = path.join(ROOT, 'android/app/src/main/res');

const BRAND_SAGE = '#5E7B61';
const WHITE_LOGO = '#FFFFFF';

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

async function logoSvgWithFill(fill) {
  const svg = await readFile(SVG, 'utf8');
  return Buffer.from(svg.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${fill}"`));
}

async function whiteLogoPng(size) {
  const svg = await logoSvgWithFill(WHITE_LOGO);
  return sharp(svg).resize(size, size).png().toBuffer();
}

/** Sage background + centered white shield (maskable-style app icon). */
async function renderLauncherIcon(size) {
  const logoSize = Math.round(size * 0.7);
  const offset = Math.round((size - logoSize) / 2);
  const logo = await whiteLogoPng(logoSize);
  return sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_SAGE },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Transparent layer with white shield for adaptive icon foreground. */
async function renderForegroundIcon(size) {
  const logoSize = Math.round(size * 0.58);
  const offset = Math.round((size - logoSize) / 2);
  const logo = await whiteLogoPng(logoSize);
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

/** Branded splash — sage fill with centered shield. */
async function renderSplash(width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.34);
  const offsetX = Math.round((width - logoSize) / 2);
  const offsetY = Math.round((height - logoSize) / 2);
  const logo = await whiteLogoPng(logoSize);
  return sharp({
    create: { width, height, channels: 4, background: BRAND_SAGE },
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
  for (const { dir, size } of LAUNCHER_SIZES) {
    const icon = await renderLauncherIcon(size);
    await writePng(dir, 'ic_launcher.png', icon);
    await writePng(dir, 'ic_launcher_round.png', icon);
  }

  for (const { dir, size } of FOREGROUND_SIZES) {
    const foreground = await renderForegroundIcon(size);
    await writePng(dir, 'ic_launcher_foreground.png', foreground);
  }

  for (const { dir, width, height } of SPLASH_SCREENS) {
    const splash = await renderSplash(width, height);
    await writePng(dir, 'splash.png', splash);
  }

  // Default splash reference used by styles.xml
  const defaultSplash = await renderSplash(480, 800);
  await writePng('drawable', 'splash.png', defaultSplash);

  console.log('Generated Guardr-branded Android icons and splash screens');
  console.log(`Brand sage: ${BRAND_SAGE}, logo: white shield on sage`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
