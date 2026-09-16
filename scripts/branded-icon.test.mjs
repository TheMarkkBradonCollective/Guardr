import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  MESSENGER_LAUNCHER_BACKGROUND,
  STAFF_LAUNCHER_BACKGROUND,
  iconChromeForLabel,
  iconChromeForProductApp,
  iconLabelForProductApp,
  nativeChromeForProductApp,
  renderBrandedIcon,
} from './branded-icon.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ICON_SOURCE = path.join(ROOT, 'assets', 'logos', 'icon-source.png');

async function prepareIconMaster() {
  const { data, info } = await sharp(ICON_SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 40 && g < 40 && b < 40) data[i + 3] = 0;
  }
  const transparent = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
  const trimmed = await transparent.trim({ threshold: 10 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(meta.width, meta.height) * 0.08);
  const side = Math.max(meta.width, meta.height) + pad * 2;
  const left = Math.floor((side - meta.width) / 2);
  const top = Math.floor((side - meta.height) / 2);
  return sharp(
    await sharp({
      create: {
        width: side,
        height: side,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: trimmed, left, top }])
      .png()
      .toBuffer(),
  );
}

function hasNear(pixels, r, g, b, tolerance = 18) {
  for (let i = 0; i < pixels.length; i += 4) {
    if (
      pixels[i + 3] > 200 &&
      Math.abs(pixels[i] - r) <= tolerance &&
      Math.abs(pixels[i + 1] - g) <= tolerance &&
      Math.abs(pixels[i + 2] - b) <= tolerance
    ) {
      return true;
    }
  }
  return false;
}

describe('Staff launcher chrome', () => {
  it('is a grey tile with a white mark and no Staff word', () => {
    assert.deepEqual(iconChromeForProductApp('staff'), {
      background: STAFF_LAUNCHER_BACKGROUND,
      mark: 'white',
      text: '#FFFFFF',
    });
    assert.equal(iconLabelForProductApp('staff'), null);
    assert.deepEqual(iconChromeForLabel('Staff'), iconChromeForProductApp('staff'));
  });

  it('keeps Guard white and Customer black, both unlabeled', () => {
    assert.deepEqual(iconChromeForProductApp('guard'), {
      background: '#FFFFFF',
      mark: 'black',
      text: '#000000',
    });
    assert.equal(iconChromeForProductApp('client').background, '#000000');
    assert.equal(iconChromeForLabel(null).background, '#000000');
    assert.equal(iconLabelForProductApp('client'), null);
    assert.equal(iconLabelForProductApp('guard'), null);
  });

  it('uses a grey Capacitor splash for Staff and white for Guard', () => {
    assert.deepEqual(nativeChromeForProductApp('staff'), {
      backgroundColor: STAFF_LAUNCHER_BACKGROUND,
      statusBarStyle: 'DARK',
    });
    assert.deepEqual(nativeChromeForProductApp('guard'), {
      backgroundColor: '#FFFFFF',
      statusBarStyle: 'LIGHT',
    });
    assert.equal(nativeChromeForProductApp('client').backgroundColor, '#000000');
  });

  it('uses a black field for Messenger with no word on the icon', () => {
    assert.deepEqual(iconChromeForProductApp('messenger'), {
      background: MESSENGER_LAUNCHER_BACKGROUND,
      mark: 'black',
      text: '#000000',
    });
    assert.equal(iconLabelForProductApp('messenger'), null);
    assert.equal(MESSENGER_LAUNCHER_BACKGROUND, '#000000');
    assert.equal(nativeChromeForProductApp('messenger').backgroundColor, MESSENGER_LAUNCHER_BACKGROUND);
  });

  it('puts a black G-shield inside a solid white chat bubble on a black tile', async () => {
    const iconMaster = await prepareIconMaster();
    const png = await renderBrandedIcon(iconMaster, 96, { productApp: 'messenger' });
    const { data } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(hasNear(data, 0, 0, 0), true, 'black field and shield');
    assert.equal(hasNear(data, 255, 255, 255), true, 'white bubble');
  });

  it('keeps the comment box inside a circular launcher crop', async () => {
    const iconMaster = await prepareIconMaster();
    const size = 96;
    const png = await renderBrandedIcon(iconMaster, size, { productApp: 'messenger' });
    const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const at = (x, y) => {
      const i = (y * info.width + x) * 4;
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    };
    const isWhite = ([r, g, b, a]) => a > 200 && r > 230 && g > 230 && b > 230;
    for (const [x, y] of [
      [1, 1],
      [size - 2, 1],
      [1, size - 2],
      [size - 2, size - 2],
    ]) {
      assert.equal(isWhite(at(x, y)), false, `corner ${x},${y} must stay the black field`);
    }
    const cx = (size - 1) / 2;
    const rim = size / 2 - 2;
    for (const angle of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
      const x = Math.round(cx + rim * Math.cos(angle));
      const y = Math.round(cx + rim * Math.sin(angle));
      assert.equal(isWhite(at(x, y)), false, `circle rim ${x},${y} must not clip the bubble`);
    }
  });
});
