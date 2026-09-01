#!/usr/bin/env node
/**
 * Render Guardr marketing boards to PNG (and flyer PDFs).
 *
 *   npm run generate:marketing
 *
 * Optional live-app captures (dev server on :3000):
 *   GUARDR_CAPTURE_APP=1 npm run generate:marketing
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const ROOT = process.cwd();
const BOARDS = path.join(ROOT, 'assets/marketing/templates/boards.html');
const OUT = path.join(ROOT, 'assets/marketing/export');
const SHOTS = path.join(ROOT, 'assets/marketing/screenshots');
const PUBLIC_KIT = path.join(ROOT, 'public/marketing/kit');

async function screenshotBoards(page) {
  await page.goto(pathToFileURL(BOARDS).href, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(600);

  const boards = await page.$$eval('[data-export]', (els) =>
    els.map((el) => ({
      name: el.getAttribute('data-export'),
      w: Number(el.getAttribute('data-w')),
      h: Number(el.getAttribute('data-h')),
    })),
  );

  for (const board of boards) {
    const loc = page.locator(`[data-export="${board.name}"]`);
    await loc.scrollIntoViewIfNeeded();
    const dest = path.join(OUT, `${board.name}.png`);
    await loc.screenshot({ path: dest, type: 'png' });
    const jpg = path.join(OUT, `${board.name}.jpg`);
    await sharp(dest).jpeg({ quality: 88, mozjpeg: true }).toFile(jpg);
    console.log(`  ${board.name}.png  ${board.w}×${board.h}`);
  }

  return boards;
}

async function flyerPdfs() {
  const flyers = ['flyer-sacramento', 'flyer-independent-contractors'];
  for (const name of flyers) {
    const png = path.join(OUT, `${name}.png`);
    const printPng = path.join(OUT, `${name}-print-300dpi.png`);
    await sharp(png).resize(2550, 3300, { fit: 'fill' }).png().toFile(printPng);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const bytes = await readFile(png);
    const image = await pdf.embedPng(bytes);
    page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
    await writeFile(path.join(OUT, `${name}.pdf`), await pdf.save());
    console.log(`  ${name}.pdf`);
  }
}

async function captureApp(browser) {
  const base = process.env.GUARDR_APP_URL || 'http://127.0.0.1:3000';
  const hideSwitcher = '.sfp-switcher{display:none !important}';

  async function shot(name, viewport, afterGoto) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: viewport.width < 500 ? 2 : 1 });
    try {
      await page.goto(`${base}/?ui-preview=1`, { waitUntil: 'networkidle', timeout: 30_000 });
      if (afterGoto) await afterGoto(page);
      await page.waitForSelector('.sfp-stage', { timeout: 15_000 });
      await page.waitForTimeout(1200);
      await page.addStyleTag({ content: hideSwitcher });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(SHOTS, name), type: 'png' });
      console.log(`  ${name}`);
    } catch (err) {
      console.warn(`  skip ${name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await shot('app-mobile-shifts.png', { width: 390, height: 844 });
  await shot('app-tablet-shifts.png', { width: 1024, height: 768 }, async (page) => {
    await page.locator('.sfp-switcher button', { hasText: 'Tablet' }).click();
    await page.waitForTimeout(400);
  });
  await shot('app-desktop-ops.png', { width: 1440, height: 900 }, async (page) => {
    await page.locator('.sfp-switcher button', { hasText: 'Desktop' }).click();
    await page.waitForTimeout(400);
  });

  try {
    const landing = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await landing.goto(base, { waitUntil: 'networkidle', timeout: 30_000 });
    await landing.waitForTimeout(900);
    await landing.screenshot({ path: path.join(SHOTS, 'landing-desktop.png'), type: 'png' });
    console.log('  landing-desktop.png');
    await landing.close();

    const mobileLanding = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await mobileLanding.goto(base, { waitUntil: 'networkidle', timeout: 30_000 });
    await mobileLanding.waitForTimeout(900);
    await mobileLanding.screenshot({ path: path.join(SHOTS, 'landing-mobile.png'), type: 'png' });
    console.log('  landing-mobile.png');
    await mobileLanding.close();
  } catch (err) {
    console.warn('Landing capture skipped:', err.message);
  }
}

async function copyPublicKit() {
  const { cp } = await import('node:fs/promises');
  await mkdir(PUBLIC_KIT, { recursive: true });
  const featured = [
    'sacramento-launch-square.png',
    'sacramento-launch-story.png',
    'sacramento-launch-landscape.png',
    'ic-photo-square.png',
    'ic-cartoon-square.png',
    'need-photo-square.png',
    'need-cartoon-square.png',
    'og-image.png',
  ];
  for (const file of featured) {
    await cp(path.join(OUT, file), path.join(PUBLIC_KIT, file)).catch(() => undefined);
  }
}

async function main() {
  const { rm } = await import('node:fs/promises');
  await rm(OUT, { recursive: true, force: true });
  await rm(PUBLIC_KIT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });

  console.log('Rendering marketing boards…');
  await screenshotBoards(page);
  await page.close();
  await flyerPdfs();

  if (process.env.GUARDR_CAPTURE_APP === '1') {
    console.log('Capturing live app…');
    await captureApp(browser);
  }

  await copyPublicKit();
  await browser.close();
  console.log(`\nWrote PNG/JPG to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
