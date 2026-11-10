/**
 * Base Web typography — font stacks and the Base Web type scale.
 *
 * Inter Variable is bundled from @fontsource-variable/inter. Guardr Sans is
 * the same family self-hosted in styles/gr-typography.css (/public/fonts)
 * so the PWA and APK still have a face when the bundle face is unavailable.
 */

import type { Theme } from 'baseui';

export const FONT_TEXT =
  '"Inter Variable", "Guardr Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const FONT_DISPLAY =
  '"Inter Variable", "Guardr Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

export const FONT_MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Guardr sets display type tight and body type at zero tracking. */
export const TRACKING = {
  display: '-0.04em',
  heading: '-0.02em',
  title: '-0.01em',
  body: '0',
  label: '0.02em',
  overline: '0.08em',
} as const;

export const LEADING = {
  display: '1.06',
  heading: '1.16',
  body: '1.5',
} as const;

/**
 * Base Web ships Base Web's type ramp but with neutral tracking. Uber's product
 * surfaces tighten display and heading slots, so we re-map them here rather
 * than patching letter-spacing at every call site.
 */
export function withDisplayTypeScale(theme: Theme): Theme {
  const typography = { ...theme.typography } as Theme['typography'] &
    Record<string, Record<string, string | number>>;

  const tighten = (keys: string[], tracking: string, fontFamily: string) => {
    for (const key of keys) {
      const slot = typography[key];
      if (!slot) continue;
      typography[key] = { ...slot, letterSpacing: tracking, fontFamily };
    }
  };

  tighten(
    ['DisplayLarge', 'DisplayMedium', 'DisplaySmall', 'DisplayXSmall'],
    TRACKING.display,
    FONT_DISPLAY,
  );
  tighten(
    ['HeadingXXLarge', 'HeadingXLarge', 'HeadingLarge'],
    TRACKING.heading,
    FONT_DISPLAY,
  );
  tighten(
    ['HeadingMedium', 'HeadingSmall', 'HeadingXSmall'],
    TRACKING.title,
    FONT_DISPLAY,
  );
  tighten(['LabelLarge', 'LabelMedium', 'LabelSmall', 'LabelXSmall'], TRACKING.body, FONT_TEXT);
  tighten(
    ['ParagraphLarge', 'ParagraphMedium', 'ParagraphSmall', 'ParagraphXSmall'],
    TRACKING.body,
    FONT_TEXT,
  );
  tighten(['MonoDisplayLarge', 'MonoDisplayMedium'], TRACKING.body, FONT_MONO);

  return { ...theme, typography };
}
