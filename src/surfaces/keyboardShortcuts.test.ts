import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { expandCombo, formatCombo } from './desktop/kit/useKeyboardShortcuts.ts';

describe('expandCombo', () => {
  it('maps mod to Cmd on macOS and Ctrl elsewhere', () => {
    assert.deepEqual(expandCombo('mod+k', true), ['meta+k']);
    assert.deepEqual(expandCombo('mod+k', false), ['ctrl+k']);
  });

  it('leaves explicit modifiers alone', () => {
    assert.deepEqual(expandCombo('alt+1', true), ['alt+1']);
    assert.deepEqual(expandCombo('shift+?', false), ['shift+?']);
    assert.deepEqual(expandCombo('escape', false), ['escape']);
  });

  it('normalises case and padding so authored combos are forgiving', () => {
    assert.deepEqual(expandCombo('  Alt+K  ', false), ['alt+k']);
  });
});

describe('formatCombo', () => {
  it('renders platform glyphs on macOS', () => {
    assert.equal(formatCombo('mod+k', true), '⌘ K');
    assert.equal(formatCombo('alt+1', true), '⌥ 1');
    assert.equal(formatCombo('shift+?', true), '⇧ ?');
  });

  it('renders written modifiers elsewhere', () => {
    assert.equal(formatCombo('mod+k', false), 'Ctrl K');
    assert.equal(formatCombo('alt+1', false), 'Alt 1');
    assert.equal(formatCombo('shift+?', false), 'Shift ?');
  });

  it('renders named keys as glyphs or capitalised words', () => {
    assert.equal(formatCombo('escape', false), 'Esc');
    assert.equal(formatCombo('arrowup', false), '↑');
    assert.equal(formatCombo('arrowdown', false), '↓');
    assert.equal(formatCombo('enter', false), '↵');
    assert.equal(formatCombo('home', false), 'Home');
  });

  it('renders the Alt N hints the navigation model produces', () => {
    // `buildDesktopNavigation` emits "Alt 3"; the palette shows it via this path.
    assert.equal(formatCombo('Alt 3'.replace(' ', '+'), false), 'Alt 3');
    assert.equal(formatCombo('Alt 3'.replace(' ', '+'), true), '⌥ 3');
  });
});
