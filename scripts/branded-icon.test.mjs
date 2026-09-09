import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { iconChromeForLabel, nativeChromeForProductApp } from './branded-icon.mjs';

describe('Staff launcher chrome', () => {
  it('is a white tile with a black mark and black Staff label', () => {
    assert.deepEqual(iconChromeForLabel('Staff'), {
      background: '#FFFFFF',
      mark: 'black',
      text: '#000000',
    });
  });

  it('keeps Hire and Work as black tiles with a white mark', () => {
    assert.deepEqual(iconChromeForLabel('Hire'), {
      background: '#000000',
      mark: 'white',
      text: '#FFFFFF',
    });
    assert.equal(iconChromeForLabel('Work').background, '#000000');
  });

  it('uses a white Capacitor splash and light status bar for Staff', () => {
    assert.deepEqual(nativeChromeForProductApp('staff'), {
      backgroundColor: '#FFFFFF',
      statusBarStyle: 'LIGHT',
    });
    assert.equal(nativeChromeForProductApp('client').backgroundColor, '#000000');
    assert.equal(nativeChromeForProductApp('guard').statusBarStyle, 'DARK');
  });
});
