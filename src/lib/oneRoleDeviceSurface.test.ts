import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveOneRoleDeviceSurface } from './oneRoleDeviceSurface.ts';

describe('resolveOneRoleDeviceSurface', () => {
  it('uses website-tab when not standalone (node default)', () => {
    assert.equal(resolveOneRoleDeviceSurface('/account'), 'website-tab');
    assert.equal(resolveOneRoleDeviceSurface('/client/home'), 'website-tab');
  });
});
