import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  accountMenuInstallLabel,
  downloadLiveContextMessage,
  downloadScreenIntro,
  downloadScreenTitle,
} from './installSurfaceCopy.ts';

describe('installSurfaceCopy', () => {
  it('titles the native shell as an app update and the website as downloads', () => {
    assert.equal(downloadScreenTitle('apk'), 'App update');
    assert.equal(downloadScreenTitle('browser'), 'Download the apps');
  });

  it('labels the live context as Android app or website', () => {
    assert.match(downloadLiveContextMessage('apk'), /Android app/i);
    assert.equal(downloadLiveContextMessage('browser'), 'Website');
  });

  it('points the website at account Downloads after activation', () => {
    assert.match(downloadScreenIntro('browser'), /Downloads on your website account after activation/);
    assert.match(downloadScreenIntro('browser'), /Sign up and finish activation/);
    assert.doesNotMatch(downloadScreenIntro('browser'), /PWA|home-screen|lite/i);
  });

  it('uses Update in the account menu inside an APK', () => {
    assert.equal(accountMenuInstallLabel('apk'), 'Update');
    assert.equal(accountMenuInstallLabel('browser'), 'Download');
  });
});
