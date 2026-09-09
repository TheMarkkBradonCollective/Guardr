import sharp from 'sharp';

/** Text drawn under the Guardr shield on home-screen icons. */
export const PRODUCT_ICON_LABELS = {
  client: 'Hire',
  guard: 'Work',
  staff: 'Staff',
};

export function iconLabelForProductApp(productApp) {
  return PRODUCT_ICON_LABELS[productApp] ?? null;
}

/** Staff is a white tile with a black mark; Hire/Work stay black with a white mark. */
export function iconChromeForLabel(label) {
  if (label === 'Staff') {
    return { background: '#FFFFFF', mark: 'black', text: '#000000' };
  }
  return { background: '#000000', mark: 'white', text: '#FFFFFF' };
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
 * Role icon: shield + Hire/Work/Staff under the logo.
 * `safeZone` keeps mark + label inside an Android/maskable crop.
 */
export async function renderBrandedIcon(iconMaster, size, {
  label = null,
  background,
  safeZone = false,
} = {}) {
  const chrome = iconChromeForLabel(label);
  const layers = [];
  const markColor = chrome.mark;

  if (label) {
    const logoRatio = safeZone ? 0.42 : 0.5;
    const logoSize = Math.round(size * logoRatio);
    const logoTop = Math.round(size * (safeZone ? 0.2 : 0.12));
    const logoLeft = Math.round((size - logoSize) / 2);
    layers.push({
      input: await tintMarkPng(iconMaster, logoSize, markColor),
      left: logoLeft,
      top: logoTop,
    });

    const fontSize = Math.max(8, Math.round(size * (safeZone ? 0.09 : 0.115)));
    const labelPng = await renderLabelPng(label, size, fontSize, chrome.text);
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
