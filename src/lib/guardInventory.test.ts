import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GuardInventoryEquipmentItem, SecurityGuard } from '../types';
import {
  getClientVisibleInventoryEquipment,
  guardCanListInventoryEquipmentType,
  normalizeInventoryEquipment,
  syncLegacyGearFromInventory,
} from './guardInventory';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@example.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: false,
    verified: false,
    rating: 5,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    ...overrides,
  };
}

function verifiedCert(catalogId: string, category: SecurityGuard['certifications'][number]['category'] = 'bsis-training') {
  return {
    id: catalogId,
    catalogId,
    name: catalogId,
    issuer: 'BSIS',
    number: catalogId,
    issueDate: '2024-01-01',
    state: catalogId === 'bsis-guard-card' ? 'CA' : undefined,
    expiryDate: category === 'bsis-permit' ? '2099-12-31' : undefined,
    status: 'verified' as const,
    imageUrl: 'scan',
    category,
  };
}

describe('guardInventory', () => {
  it('normalizes equipment quantity to at least 1', () => {
    const items = normalizeInventoryEquipment([
      {
        id: 'eq-1',
        typeId: 'flashlight',
        quantity: 0,
      },
    ]);
    assert.equal(items[0]?.quantity, 1);
  });

  it('syncs legacy weapon and equipment gear from inventory items', () => {
    const guard = baseGuard({
      certifications: [verifiedCert('bsis-guard-card', 'guard-card')],
    });
    const equipment: GuardInventoryEquipmentItem[] = [
      { id: 'eq-1', typeId: 'flashlight', quantity: 1 },
      { id: 'eq-2', typeId: 'body-camera', quantity: 1 },
      { id: 'eq-3', typeId: 'radio', quantity: 1 },
    ];
    const legacy = syncLegacyGearFromInventory(guard, equipment);
    assert.deepEqual(legacy.listedWeaponGear, ['flashlight']);
    assert.deepEqual(legacy.listedEquipmentGear, ['body-cam', 'walkie-talkie']);
  });

  it('hides certified equipment from clients when credentials are missing', () => {
    const guard = baseGuard({
      inventoryEquipment: [
        { id: 'eq-1', typeId: 'body-camera', quantity: 1 },
        { id: 'eq-2', typeId: 'firearm', quantity: 1, brand: 'Glock' },
      ],
    });
    const visible = getClientVisibleInventoryEquipment(guard);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.typeId, 'body-camera');
    assert.equal(guardCanListInventoryEquipmentType(guard, 'firearm'), false);
  });
});
