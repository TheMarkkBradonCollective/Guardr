import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUSINESS_CLIENT_CAPABILITIES,
  PERSONAL_CLIENT_CAPABILITIES,
  SECURITY_COMPANY_CAPABILITIES,
  capabilitiesForClientType,
} from './clientProductModules';

describe('clientProductModules', () => {
  it('keeps personal, business, and security company capability sets distinct', () => {
    const personal = capabilitiesForClientType('personal');
    const business = capabilitiesForClientType('business');
    const security = capabilitiesForClientType('security-company');

    assert.equal(personal.has('personal-protection'), true);
    assert.equal(personal.has('employee-access'), false);
    assert.equal(personal.has('overflow-marketplace'), false);

    assert.equal(business.has('employee-access'), true);
    assert.equal(business.has('reporting'), true);
    assert.equal(business.has('overflow-marketplace'), false);
    assert.equal(business.has('roster-management'), false);

    assert.equal(security.has('overflow-marketplace'), true);
    assert.equal(security.has('roster-management'), true);
    assert.equal(security.has('shift-operations'), true);
    assert.equal(security.has('employee-access'), false);
    assert.equal(security.has('rebook-service'), false);
  });

  it('exports stable capability lists per type', () => {
    assert.ok(PERSONAL_CLIENT_CAPABILITIES.length > 0);
    assert.ok(BUSINESS_CLIENT_CAPABILITIES.length > PERSONAL_CLIENT_CAPABILITIES.length);
    assert.ok(SECURITY_COMPANY_CAPABILITIES.length > 0);
  });
});
