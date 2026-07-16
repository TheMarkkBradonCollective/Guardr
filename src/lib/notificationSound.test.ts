import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('notification sound preferences', () => {
  it('defaults to Guardr tone', async () => {
    const {
      DEFAULT_NOTIFICATION_SOUND,
      labelForNotificationSoundMode,
      loadNotificationSoundPreference,
    } = await import('./notificationSoundPrefs.ts');

    assert.equal(DEFAULT_NOTIFICATION_SOUND.mode, 'guardr');
    assert.equal(labelForNotificationSoundMode('system_default'), 'System default');
    assert.equal(loadNotificationSoundPreference().mode, 'guardr');
  });

  it('persists and reloads saved preference', async () => {
    if (typeof localStorage === 'undefined') return;

    const {
      loadNotificationSoundPreference,
      saveNotificationSoundPreference,
    } = await import('./notificationSoundPrefs.ts');

    saveNotificationSoundPreference({
      mode: 'system_custom',
      uri: 'content://media/internal/audio/media/42',
      label: 'Pixie Dust',
    });

    const loaded = loadNotificationSoundPreference();
    assert.equal(loaded.mode, 'system_custom');
    assert.equal(loaded.uri, 'content://media/internal/audio/media/42');
    assert.equal(loaded.label, 'Pixie Dust');
  });
});

describe('notification sound native availability', () => {
  it('reports unavailable outside native Android', async () => {
    const { isNativeNotificationSoundAvailable } = await import('./guardrNotificationSoundNative.ts');
    assert.equal(isNativeNotificationSoundAvailable(), false);
  });
});
