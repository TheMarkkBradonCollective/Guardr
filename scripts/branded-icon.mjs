import sharp from 'sharp';

/** Text drawn under the Guardr shield on home-screen icons. All three role icons are shield-only. */
export const PRODUCT_ICON_LABELS = {
  client: null,
  guard: null,
  staff: null,
  messenger: null,
};

/** Staff tile — mid grey so it sits between Customer black and Guard white. */
export const STAFF_LAUNCHER_BACKGROUND = '#6B6B6B';
/** Messenger companion — logo black, same field as Customer. */
export const MESSENGER_LAUNCHER_BACKGROUND = '#000000';

export function iconLabelForProductApp(productApp) {
  return PRODUCT_ICON_LABELS[productApp] || null;
}

/**
 * Guard: white + black mark. Customer: black + white mark.
 * Staff: grey + white mark. None of the role icons paint a word.
 */
export function iconChromeForProductApp(productApp) {
  if (productApp === 'staff') {
    return { background: STAFF_LAUNCHER_BACKGROUND, mark: 'white', text: '#FFFFFF' };
  }
  if (productApp === 'guard') {
    return { background: '#FFFFFF', mark: 'black', text: '#000000' };
  }
  if (productApp === 'messenger') {
    return { background: MESSENGER_LAUNCHER_BACKGROUND, mark: 'black', text: '#000000' };
  }
  return { background: '#000000', mark: 'white', text: '#FFFFFF' };
}

export function iconChromeForLabel(label) {
  if (label === 'Staff') return iconChromeForProductApp('staff');
  if (label === 'Guard') return iconChromeForProductApp('guard');
  return iconChromeForProductApp(null);
}

/** Capacitor splash / status bar. Staff is a grey shell; Guard is white; Customer is black. */
export function nativeChromeForProductApp(productApp) {
  if (productApp === 'staff') {
    return { backgroundColor: STAFF_LAUNCHER_BACKGROUND, statusBarStyle: 'DARK' };
  }
  if (productApp === 'guard') {
    return { backgroundColor: '#FFFFFF', statusBarStyle: 'LIGHT' };
  }
  if (productApp === 'messenger') {
    return { backgroundColor: MESSENGER_LAUNCHER_BACKGROUND, statusBarStyle: 'DARK' };
  }
  return { backgroundColor: '#000000', statusBarStyle: 'DARK' };
}

async function tintMarkPng(iconMaster, size, color) {
  const { data, info } = await iconMaster
    .clone()
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const r = color === 'black' ? 0 : 255;
  const g = r;
  const b = r;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

export async function whiteMarkPng(iconMaster, size) {
  return tintMarkPng(iconMaster, size, 'white');
}

export async function blackMarkPng(iconMaster, size) {
  return tintMarkPng(iconMaster, size, 'black');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function renderLabelPng(label, width, fontSize, fill) {
  const height = Math.ceil(fontSize * 1.45);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="50%"
    y="52%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="DejaVu Sans, Liberation Sans, Arial Black, Arial, Helvetica, sans-serif"
    font-weight="800"
    font-size="${fontSize}"
    fill="${fill}"
    letter-spacing="${Math.max(0.4, fontSize * 0.04)}"
  >${escapeXml(label)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function parseBackground(background) {
  if (typeof background === 'string') return background;
  return background;
}

/**
 * Exact comment-box silhouette from the Messenger reference
 * (landscape rounded rect, 45° tail at the top-left). ViewBox 0 0 261 179.
 */
export const MESSENGER_BUBBLE_OUTER =
  'M 4 0 L 242 0 A 18 18 0 0 1 260 18 L 260 160 A 18 18 0 0 1 242 178 L 59 178 A 18 18 0 0 1 41 160 L 41 52 L 0 6 Z';
export const MESSENGER_BUBBLE_INNER =
  'M 25 14 L 241 14 A 6 6 0 0 1 247 20 L 247 158 A 6 6 0 0 1 241 164 L 61 164 A 6 6 0 0 1 55 158 L 55 48 Z';
export const MESSENGER_BUBBLE_PATH = MESSENGER_BUBBLE_OUTER;

const MESSENGER_BUBBLE_RATIO = 179 / 261;

/**
 * Solid white comment box + black G-shield (logo black) on a transparent canvas.
 */
export async function renderMessengerBubbleMark(iconMaster, size) {
  const bubbleW = size;
  const bubbleH = Math.max(1, Math.round(size * MESSENGER_BUBBLE_RATIO));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bubbleW}" height="${bubbleH}" viewBox="0 0 261 179">
  <path fill="#FFFFFF" d="${MESSENGER_BUBBLE_OUTER}"/>
</svg>`;
  const bubble = await sharp(Buffer.from(svg)).png().toBuffer();
  const top = Math.round((size - bubbleH) / 2);
  const shieldSize = Math.round(bubbleH * 0.62);
  const shieldLeft = Math.round(bubbleW * (151 / 261) - shieldSize / 2);
  const shieldTop = top + Math.round(bubbleH * (89 / 179) - shieldSize / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: bubble, left: 0, top },
      { input: await blackMarkPng(iconMaster, shieldSize), left: shieldLeft, top: shieldTop },
    ])
    .png()
    .toBuffer();
}

/**
 * Role icon: unlabeled shield on the role field (black / white / grey).
 * Messenger is a white chat bubble with the black G-shield inside.
 * `safeZone` keeps the mark inside an Android/maskable crop.
 */
export async function renderBrandedIcon(iconMaster, size, {
  label = null,
  productApp = null,
  background,
  safeZone = false,
} = {}) {
  const chrome = iconChromeForProductApp(productApp);
  const resolvedLabel = label || iconLabelForProductApp(productApp);
  const layers = [];
  const markColor = chrome.mark;

  if (productApp === 'messenger') {
    const markRatio = safeZone ? 0.68 : 0.86;
    const markSize = Math.round(size * markRatio);
    const offset = Math.round((size - markSize) / 2);
    layers.push({
      input: await renderMessengerBubbleMark(iconMaster, markSize),
      left: offset,
      top: offset,
    });
  } else if (resolvedLabel) {
    const logoRatio = safeZone ? 0.42 : 0.5;
    const logoSize = Math.round(size * logoRatio);
    const logoTop = Math.round(size * (safeZone ? 0.2 : 0.12));
    const logoLeft = Math.round((size - logoSize) / 2);
    layers.push({
      input: await tintMarkPng(iconMaster, logoSize, markColor),
      left: logoLeft,
      top: logoTop,
    });

    const lengthScale = String(resolvedLabel).length > 6 ? 0.82 : 1;
    const fontSize = Math.max(8, Math.round(size * (safeZone ? 0.09 : 0.115) * lengthScale));
    const labelPng = await renderLabelPng(resolvedLabel, size, fontSize, chrome.text);
    const labelMeta = await sharp(labelPng).metadata();
    const labelTop = Math.min(
      size - (labelMeta.height || fontSize) - Math.round(size * (safeZone ? 0.18 : 0.08)),
      logoTop + logoSize + Math.round(size * 0.02),
    );
    layers.push({
      input: labelPng,
      left: 0,
      top: Math.max(0, labelTop),
    });
  } else {
    const logoRatio = safeZone ? 0.58 : 0.7;
    const logoSize = Math.round(size * logoRatio);
    const offset = Math.round((size - logoSize) / 2);
    layers.push({
      input: await tintMarkPng(iconMaster, logoSize, markColor),
      left: offset,
      top: offset,
    });
  }

  const resolvedBackground =
    background !== undefined
      ? background
      : chrome.background;

  const canvas =
    resolvedBackground == null || (typeof resolvedBackground === 'object' && resolvedBackground.alpha === 0)
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : parseBackground(resolvedBackground);

  return sharp({
    create: { width: size, height: size, channels: 4, background: canvas },
  })
    .composite(layers)
    .png()
    .toBuffer();
}
