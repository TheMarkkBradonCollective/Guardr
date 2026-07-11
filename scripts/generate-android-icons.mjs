import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SVG = path.join(ROOT, 'logo.svg');
const RES = path.join(ROOT, 'android/app/src/main/res');

const SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function writeIcon(dir, size, name) {
  const outDir = path.join(RES, dir);
  await mkdir(outDir, { recursive: true });
  await sharp(SVG).resize(size, size).png().toFile(path.join(outDir, `${name}.png`));
}

async function main() {
  for (const { dir, size } of SIZES) {
    await writeIcon(dir, size, 'ic_launcher');
    await writeIcon(dir, size, 'ic_launcher_round');
  }
  console.log('Generated Android launcher icons from logo.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
