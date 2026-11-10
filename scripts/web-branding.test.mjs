import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFile(path.join(ROOT, rel));

async function pixels(input) {
  const { data } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function hasColour(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const spread = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
    if (spread > 12) return true;
  }
  return false;
}

describe('web branding assets', () => {
  it('SVG favicon embeds a solid black mark that flips to white in dark color scheme', async () => {
    for (const rel of ['public/favicon.svg', 'public/logo.svg', 'logo.svg']) {
      const svg = (await read(rel)).toString('utf8');
      assert.match(svg, /prefers-color-scheme:dark/, rel);
      const match = svg.match(/href="data:image\/png;base64,([^"]+)"/);
      assert.ok(match, `${rel} should embed the mark`);
      const data = await pixels(Buffer.from(match[1], 'base64'));
      let opaque = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 200) {
          opaque += 1;
          assert.ok(data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0, `${rel} mark must be pure black`);
        }
      }
      assert.ok(opaque > 1000, `${rel} should contain the mark`);
    }
  });

  it('website raster icons carry no brand colour (black + white only)', async () => {
    const files = [
      'public/favicon-16x16.png',
      'public/favicon-32x32.png',
      'public/apple-touch-icon.png',
      'public/icon-192.png',
      'public/icon-512.png',
      'public/icon-maskable-512.png',
      'public/logo.jpg',
      'public/icons/favicon-light.png',
      'public/icons/favicon-dark.png',
      'public/icons/apple-touch-icon-light.png',
      'public/icons/apple-touch-icon-dark.png',
    ];
    for (const rel of files) {
      assert.equal(hasColour(await pixels(await read(rel))), false, `${rel} must not contain colour`);
    }
  });

  it('favicon.ico is a valid multi-size icon container', async () => {
    const ico = await read('public/favicon.ico');
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    assert.equal(ico.readUInt16LE(4), 3);
  });

  it('index.html links the black icon set and black theme-color', async () => {
    const html = (await read('index.html')).toString('utf8');
    assert.match(html, /rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"/);
    assert.match(html, /href="\/favicon\.ico"/);
    assert.match(html, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
    assert.doesNotMatch(html, /href="\/logo\.svg"/);
    const themeColors = [...html.matchAll(/name="theme-color" content="([^"]+)"/g)].map((m) => m[1].toLowerCase());
    assert.ok(themeColors.length > 0);
    for (const color of themeColors) assert.equal(color, '#000000');
  });

  it('web manifest points at existing black icons and a black theme', async () => {
    const manifest = JSON.parse((await read('public/manifest.json')).toString('utf8'));
    assert.equal(manifest.theme_color.toLowerCase(), '#000000');
    assert.equal(manifest.background_color.toLowerCase(), '#000000');
    for (const icon of manifest.icons) {
      const data = await pixels(await read(path.join('public', icon.src)));
      assert.equal(hasColour(data), false, `${icon.src} must not contain colour`);
    }
  });
});
