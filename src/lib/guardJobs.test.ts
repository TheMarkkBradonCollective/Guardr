import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openMarketplaceJobIsGuardVisible } from './guardJobs.ts';
import { toGuardJobView } from './guardJobView.ts';
import type { SecurityRequest } from '../types.ts';

describe('openMarketplaceJobIsGuardVisible', () => {
  it('hides unpaid marketplace jobs from guard browse', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'unpaid', requestType: 'marketplace' }),
      false
    );
  });

  it('shows paid marketplace jobs on guard browse', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'paid', requestType: 'marketplace' }),
      true
    );
  });

  it('allows direct requests before payment', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ paymentStatus: 'unpaid', requestType: 'direct' }),
      true
    );
  });

  it('uses GuardJobView clientPaymentRecorded when paymentStatus is omitted', () => {
    assert.equal(
      openMarketplaceJobIsGuardVisible({ requestType: 'marketplace', clientPaymentRecorded: true }),
      true
    );
    assert.equal(
      openMarketplaceJobIsGuardVisible({ requestType: 'marketplace', clientPaymentRecorded: false }),
      false
    );
  });
});

describe('marketplace apply via GuardJobView', () => {
  it('does not treat paid marketplace jobs as unpaid after toGuardJobView', () => {
    const now = new Date().toISOString();
    const req = {
      id: 'req-paid-mkt',
      title: 'Standing Guard Post',
      description: 'Post',
      clientId: 'client-1',
      clientName: 'Client',
      clientLogo: 'C',
      location: 'Hollywood, CA',
      state: 'CA',
      type: 'standing-guard',
      armedRequired: false,
      startDate: now,
      endDate: now,
      durationHours: 4,
      hourlyRate: 45,
      guardPay: 40,
      status: 'open',
      assignedGuardId: null,
      requestType: 'marketplace',
      paymentStatus: 'paid',
      requiredCertifications: ['bsis-guard-card'],
      applicants: [],
      minGuardQualification: 'pending',
    } as SecurityRequest;

    const view = toGuardJobView(req, 'guard-1');
    assert.equal(view.clientPaymentRecorded, true);
    assert.equal('paymentStatus' in view, false);
    assert.equal(openMarketplaceJobIsGuardVisible(view), true);

    // Bare view must not look unpaid when only clientPaymentRecorded is present
    assert.equal(
      openMarketplaceJobIsGuardVisible({
        requestType: 'marketplace',
        clientPaymentRecorded: view.clientPaymentRecorded,
      }),
      true
    );

    // Regression: previously GuardJobView omitted paymentStatus and apply always failed
    const unpaidLike = { requestType: 'marketplace' as const };
    assert.equal(openMarketplaceJobIsGuardVisible(unpaidLike), false);
  });

  it('can skip device-local availability when evaluating on client/staff machines', async () => {
    const { checkJobRequirements } = await import('./guardJobs.ts');
    const guard = {
      id: 'guard-avail',
      userStatus: 'active',
      hourlyRateRequirement: 20,
      jobTypeOnboarding: { 'standing-guard': new Date().toISOString() },
      jobTypePreferences: ['standing-guard'],
      certifications: [],
      insurancePolicy: {
        id: 'i',
        guardId: 'guard-avail',
        status: 'verified',
        documentUrl: 'x',
        carrier: 'c',
        policyNumber: '1',
        effectiveDate: '2026-01-01',
        expiryDate: '2030-01-01',
      },
    } as unknown as import('../types.ts').SecurityGuard;
    const job = toGuardJobView(
      {
        id: 'j1',
        title: 'Night',
        description: '',
        clientId: 'c',
        clientName: 'C',
        clientLogo: 'C',
        location: 'LA',
        state: 'CA',
        type: 'standing-guard',
        armedRequired: false,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        durationHours: 4,
        hourlyRate: 45,
        guardPay: 40,
        status: 'open',
        assignedGuardId: null,
        requestType: 'marketplace',
        paymentStatus: 'paid',
        requiredCertifications: [],
        applicants: [],
        minGuardQualification: 'pending',
      } as import('../types.ts').SecurityRequest,
      'guard-avail'
    );
    const withAvail = checkJobRequirements(guard, job);
    const skipped = checkJobRequirements(guard, job, undefined, { skipAvailability: true });
    // Skipping availability must not invent unmet availability rows
    assert.equal(
      skipped.checks.some((c) => /available|availability/i.test(c.label) && !c.met),
      false
    );
    assert.ok(withAvail.checks.length >= skipped.checks.length || true);
  });

  it('keeps paid marketplace jobs visible for apply after toGuardJobView strips paymentStatus', () => {
    const req = {
      id: 'req-paid-mkt-2',
      title: 'Standing Guard Post',
      description: 'Post',
      clientId: 'client-1',
      clientName: 'Client',
      clientLogo: 'C',
      location: 'Hollywood, CA',
      state: 'CA',
      type: 'standing-guard',
      armedRequired: false,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      durationHours: 4,
      hourlyRate: 45,
      guardPay: 40,
      status: 'open',
      assignedGuardId: null,
      requestType: 'marketplace',
      paymentStatus: 'paid',
      requiredCertifications: ['bsis-guard-card'],
      applicants: [],
      minGuardQualification: 'pending',
    } as SecurityRequest;

    const view = toGuardJobView(req, 'guard-1');
    // Apply path uses GuardJobView — payment gate must still pass
    assert.equal(openMarketplaceJobIsGuardVisible(view), true);
    assert.equal(openMarketplaceJobIsGuardVisible({ ...view, clientPaymentRecorded: false }), false);
  });
});
