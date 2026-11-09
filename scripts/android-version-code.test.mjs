import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INSTALLED_CUSTOMER_BETA_VERSION_CODE,
  androidVersionCode,
} from './android-version-code.mjs';

describe('android versionCode', () => {
  it('keeps 1.1.0-cf-beta above the installed 1.0.131-beta customer APK', () => {
    const code = androidVersionCode('1.1.0-cf-beta');
    assert.equal(code, 1100);
    assert.ok(code > INSTALLED_CUSTOMER_BETA_VERSION_CODE);
    assert.equal(INSTALLED_CUSTOMER_BETA_VERSION_CODE, 231);
  });

  it('uses the same code for every role build of one version', () => {
    const roles = ['client', 'guard', 'staff', 'messenger'];
    const codes = roles.map(() => androidVersionCode('1.1.0-cf-beta'));
    assert.equal(new Set(codes).size, 1);
  });
});
