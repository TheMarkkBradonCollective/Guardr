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

export async function whiteMarkPng(iconMaster, size) {
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
  })
    .png()
    .toBuffer();
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

async function renderLabelPng(label, width, fontSize) {
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
    fill="#FFFFFF"
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
 * Black (or transparent) field, white shield, optional Hire/Work/Staff under the logo.
 * `safeZone` keeps mark + label inside an Android/PWA maskable crop.
 */
export async function renderBrandedIcon(iconMaster, size, {
  label = null,
  background = '#000000',
  safeZone = false,
} = {}) {
  const layers = [];

  if (label) {
    const logoRatio = safeZone ? 0.42 : 0.5;
    const logoSize = Math.round(size * logoRatio);
    const logoTop = Math.round(size * (safeZone ? 0.2 : 0.12));
    const logoLeft = Math.round((size - logoSize) / 2);
    layers.push({
      input: await whiteMarkPng(iconMaster, logoSize),
      left: logoLeft,
      top: logoTop,
    });

    const fontSize = Math.max(8, Math.round(size * (safeZone ? 0.09 : 0.115)));
    const labelPng = await renderLabelPng(label, size, fontSize);
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
      input: await whiteMarkPng(iconMaster, logoSize),
      left: offset,
      top: offset,
    });
  }

  const canvas =
    background == null || (typeof background === 'object' && background.alpha === 0)
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : parseBackground(background);

  return sharp({
    create: { width: size, height: size, channels: 4, background: canvas },
  })
    .composite(layers)
    .png()
    .toBuffer();
}
