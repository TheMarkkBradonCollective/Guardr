import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FONT_DISPLAY, FONT_MONO, FONT_TEXT, TRACKING, withUberTypeScale } from './typography.ts';

const baseTheme = {
  colors: {},
  typography: {
    DisplayLarge: { fontFamily: 'system-ui', fontSize: '96px', letterSpacing: '0' },
    HeadingLarge: { fontFamily: 'system-ui', fontSize: '36px', letterSpacing: '0' },
    HeadingXSmall: { fontFamily: 'system-ui', fontSize: '16px', letterSpacing: '0' },
    ParagraphMedium: { fontFamily: 'system-ui', fontSize: '16px', letterSpacing: '0.2px' },
    LabelSmall: { fontFamily: 'system-ui', fontSize: '12px', letterSpacing: '0.2px' },
    MonoDisplayLarge: { fontFamily: 'monospace', fontSize: '96px', letterSpacing: '0' },
  },
} as never;

describe('withUberTypeScale', () => {
  it('ships a font stack that names a family the app actually loads', () => {
    // "Guardr Sans" is declared in styles/uber-typography.css from
    // /public/fonts, so the stack resolves without Uber Move installed.
    for (const stack of [FONT_TEXT, FONT_DISPLAY]) {
      assert.ok(stack.includes('Uber Move'), 'keeps Uber Move first when present');
      assert.ok(stack.includes('Guardr Sans'), 'falls back to the self-hosted family');
      assert.ok(stack.endsWith('sans-serif'), 'ends with a generic family');
    }
    assert.ok(FONT_MONO.includes('ui-monospace'));
  });

  it('tightens display and heading tracking, leaving body text at zero', () => {
    const theme = withUberTypeScale(baseTheme) as unknown as {
      typography: Record<string, { letterSpacing: string; fontFamily: string }>;
    };

    assert.equal(theme.typography.DisplayLarge.letterSpacing, TRACKING.display);
    assert.equal(theme.typography.HeadingLarge.letterSpacing, TRACKING.heading);
    assert.equal(theme.typography.HeadingXSmall.letterSpacing, TRACKING.title);
    assert.equal(theme.typography.ParagraphMedium.letterSpacing, TRACKING.body);
    assert.equal(theme.typography.LabelSmall.letterSpacing, TRACKING.body);
  });

  it('routes display slots to the display stack and text slots to the text stack', () => {
    const theme = withUberTypeScale(baseTheme) as unknown as {
      typography: Record<string, { fontFamily: string }>;
    };

    assert.equal(theme.typography.DisplayLarge.fontFamily, FONT_DISPLAY);
    assert.equal(theme.typography.HeadingLarge.fontFamily, FONT_DISPLAY);
    assert.equal(theme.typography.ParagraphMedium.fontFamily, FONT_TEXT);
    assert.equal(theme.typography.MonoDisplayLarge.fontFamily, FONT_MONO);
  });

  it('leaves the source theme untouched', () => {
    const source = JSON.parse(JSON.stringify(baseTheme));
    withUberTypeScale(source as never);
    assert.equal(source.typography.DisplayLarge.letterSpacing, '0');
  });

  it('ignores slots the Base Web theme does not define', () => {
    const sparse = { colors: {}, typography: { ParagraphMedium: { letterSpacing: '1px' } } } as never;
    const theme = withUberTypeScale(sparse) as unknown as {
      typography: Record<string, { letterSpacing: string }>;
    };
    assert.equal(theme.typography.DisplayLarge, undefined);
    assert.equal(theme.typography.ParagraphMedium.letterSpacing, TRACKING.body);
  });
});
