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

  it('keeps Guard as a black tile with a white mark', () => {
    assert.deepEqual(iconChromeForLabel('Guard'), {
      background: '#000000',
      mark: 'white',
      text: '#FFFFFF',
    });
    assert.equal(iconChromeForLabel(null).background, '#000000');
  });

  it('draws no word on the Customer launcher', async () => {
    const { iconLabelForProductApp } = await import('./branded-icon.mjs');
    assert.equal(iconLabelForProductApp('client'), null);
    assert.equal(iconLabelForProductApp('guard'), 'Guard');
    assert.equal(iconLabelForProductApp('staff'), 'Staff');
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
