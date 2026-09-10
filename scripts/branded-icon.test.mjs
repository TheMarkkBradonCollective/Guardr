import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MESSENGER_LAUNCHER_BACKGROUND,
  STAFF_LAUNCHER_BACKGROUND,
  iconChromeForLabel,
  iconChromeForProductApp,
  iconLabelForProductApp,
  nativeChromeForProductApp,
} from './branded-icon.mjs';

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

  it('uses a slate unlabeled shield for Messenger', () => {
    assert.deepEqual(iconChromeForProductApp('messenger'), {
      background: MESSENGER_LAUNCHER_BACKGROUND,
      mark: 'white',
      text: '#FFFFFF',
    });
    assert.equal(iconLabelForProductApp('messenger'), null);
    assert.equal(MESSENGER_LAUNCHER_BACKGROUND, '#111827');
    assert.equal(nativeChromeForProductApp('messenger').backgroundColor, MESSENGER_LAUNCHER_BACKGROUND);
  });
});
