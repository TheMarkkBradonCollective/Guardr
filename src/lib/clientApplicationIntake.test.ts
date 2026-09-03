import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clientApplicationIntake, clientApplicationShowsSection } from './clientApplicationIntake';

describe('clientApplicationIntake', () => {
  it('uses different sections per account type', () => {
    assert.equal(clientApplicationShowsSection('personal', 'prior-security-experience'), true);
    assert.equal(clientApplicationShowsSection('security-company', 'prior-security-experience'), false);
    assert.equal(clientApplicationShowsSection('security-company', 'ppo-license'), true);
    assert.equal(clientApplicationShowsSection('business', 'ppo-license'), false);
  });

  it('describes distinct staff review focus per type', () => {
    const personal = clientApplicationIntake('personal');
    const business = clientApplicationIntake('business');
    const security = clientApplicationIntake('security-company');
    assert.match(personal.staffReviewFocus, /personal contracting party/i);
    assert.match(business.staffReviewFocus, /Organization/i);
    assert.match(security.staffReviewFocus, /PPO/i);
    assert.notEqual(personal.staffReviewFocus, security.staffReviewFocus);
  });
});
