import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  deviceBindingBlocksAccount,
  remoteRoleAppClaimBlocks,
  type DeviceAccountBinding,
} from './deviceBindingStore.ts';

describe('deviceBindingStore', () => {
  it('blocks a different account on the same device id', () => {
    const binding: DeviceAccountBinding = {
      deviceId: 'web:abc',
      accountKind: 'guard',
      accountId: 'g1',
      roleAppClaim: 'guard',
      updatedAt: '',
    };
    assert.equal(deviceBindingBlocksAccount(binding, { kind: 'guard', id: 'g2' }), true);
    assert.equal(deviceBindingBlocksAccount(binding, { kind: 'guard', id: 'g1' }), false);
    assert.equal(deviceBindingBlocksAccount(binding, { kind: 'client', id: 'c1' }), true);
  });

  it('blocks downloading another role app when a claim exists remotely', () => {
    const binding: DeviceAccountBinding = {
      deviceId: 'web:abc',
      accountKind: null,
      accountId: null,
      roleAppClaim: 'guard',
      updatedAt: '',
    };
    assert.equal(remoteRoleAppClaimBlocks('client', binding), true);
    assert.equal(remoteRoleAppClaimBlocks('guard', binding), false);
  });
});
