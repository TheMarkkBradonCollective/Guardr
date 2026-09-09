import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  iconChromeForLabel,
  iconChromeForProductApp,
  iconLabelForProductApp,
  nativeChromeForProductApp,
} from './branded-icon.mjs';

describe('Staff launcher chrome', () => {
  it('is a white tile with a black mark and black Staff label', () => {
    assert.deepEqual(iconChromeForLabel('Staff'), {
      background: '#FFFFFF',
      mark: 'black',
      text: '#000000',
    });
    assert.deepEqual(iconChromeForProductApp('staff'), {
      background: '#FFFFFF',
      mark: 'black',
      text: '#000000',
    });
  });

  it('keeps Guard white like Staff even with no word on the icon', () => {
    assert.deepEqual(iconChromeForProductApp('guard'), {
      background: '#FFFFFF',
      mark: 'black',
      text: '#000000',
    });
    assert.equal(iconChromeForProductApp('client').background, '#000000');
    assert.equal(iconChromeForLabel(null).background, '#000000');
  });

  it('draws no word on the Guard or Customer launchers', () => {
    assert.equal(iconLabelForProductApp('client'), null);
    assert.equal(iconLabelForProductApp('guard'), null);
    assert.equal(iconLabelForProductApp('staff'), 'Staff');
  });

  it('uses a white Capacitor splash and light status bar for Guard and Staff', () => {
    assert.deepEqual(nativeChromeForProductApp('staff'), {
      backgroundColor: '#FFFFFF',
      statusBarStyle: 'LIGHT',
    });
    assert.deepEqual(nativeChromeForProductApp('guard'), {
      backgroundColor: '#FFFFFF',
      statusBarStyle: 'LIGHT',
    });
    assert.equal(nativeChromeForProductApp('client').backgroundColor, '#000000');
  });
});
