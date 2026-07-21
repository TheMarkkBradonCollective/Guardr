import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  downloadLiveContextMessage,
  downloadScreenIntro,
  downloadScreenTitle,
} from './installSurfaceCopy.ts';

describe('installSurfaceCopy', () => {
  it('titles PWA as app versions, not as the Android APK screen', () => {
    assert.equal(downloadScreenTitle('apk'), 'App update');
    assert.equal(downloadScreenTitle('pwa'), 'App versions');
    assert.equal(downloadScreenTitle('browser'), 'Install Guardr');
  });

  it('does not claim the PWA is the full Android app', () => {
    const apkMsg = downloadLiveContextMessage('apk');
    const pwaMsg = downloadLiveContextMessage('pwa');
    assert.match(apkMsg, /full Android app/i);
    assert.match(pwaMsg, /PWA|home-screen|auto-update/i);
    assert.doesNotMatch(pwaMsg, /You are on the full Android app/i);
  });

  it('notes that the PWA auto-updates ahead of manual APK installs', () => {
    assert.match(downloadScreenIntro('pwa'), /auto-update/i);
  });
});
