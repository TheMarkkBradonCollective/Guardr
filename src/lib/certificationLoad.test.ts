import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCertificationImagesToGuard,
  certNeedsImageHydration,
  collectCertIdsNeedingImageHydration,
  mergeCertificationImagesByCertId,
  mergeCertificationImagesIntoGuards,
  resolveCertImageUrl,
} from './certificationLoad';
import type { SecurityGuard } from '../types';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'guard-1',
    name: 'Test Guard',
    email: 'test@example.com',
    badgeNumber: 'ICN-1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: false,
    verified: false,
    rating: 0,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    hourlyRateRequirement: 25,
    userStatus: 'approved',
    ...overrides,
  };
}

const baseCert = {
  id: 'cert-1',
  name: 'BSIS Guard Card',
  issuer: 'BSIS',
  number: 'GC-1',
  status: 'pending' as const,
  issueDate: '2026-01-01',
  catalogId: 'bsis-guard-card',
};

describe('certificationLoad', () => {
  it('resolves pending update image before hydrated image_url', () => {
    assert.equal(
      resolveCertImageUrl({
        imageUrl: 'data:image/jpeg;base64,main',
        pendingUpdate: {
          submittedAt: '2026-01-02',
          issuer: 'BSIS',
          number: 'GC-2',
          imageUrl: 'data:image/jpeg;base64,pending',
          status: 'pending',
        },
      }),
      'data:image/jpeg;base64,main'
    );
  });

  it('merges image urls into matching guard certifications', () => {
    const guards = [baseGuard({ certifications: [baseCert] })];

    const merged = mergeCertificationImagesIntoGuards(
      guards,
      new Map([['guard-1', new Map([['cert-1', 'data:image/jpeg;base64,abc']])]])
    );

    assert.equal(merged[0].certifications[0].imageUrl, 'data:image/jpeg;base64,abc');
  });

  it('merges image urls by certification id', () => {
    const guards = [baseGuard({ certifications: [baseCert] })];

    const merged = mergeCertificationImagesByCertId(
      guards,
      new Map([['cert-1', 'data:image/jpeg;base64,abc']])
    );

    assert.equal(merged[0].certifications[0].imageUrl, 'data:image/jpeg;base64,abc');
  });

  it('flags only credentials that still need image hydration', () => {
    const guards = [
      baseGuard({
        id: 'ashanti',
        certifications: [
          baseCert,
          {
            ...baseCert,
            id: 'cert-optional',
            status: 'verified',
            imageUrl: 'data:image/jpeg;base64,already',
          },
          {
            ...baseCert,
            id: 'cert-rejected',
            status: 'rejected',
          },
        ],
      }),
    ];

    assert.equal(certNeedsImageHydration(baseCert), true);
    assert.equal(
      certNeedsImageHydration({
        ...baseCert,
        imageUrl: 'data:image/jpeg;base64,already',
      }),
      false
    );
    assert.deepEqual(collectCertIdsNeedingImageHydration(guards, ['ashanti']), ['cert-1']);
  });

  it('skips hydration when pending update already carries the photo', () => {
    const guards = [
      baseGuard({
        certifications: [
          {
            ...baseCert,
            pendingUpdate: {
              submittedAt: '2026-01-02',
              issuer: 'BSIS',
              number: 'GC-2',
              imageUrl: 'data:image/jpeg;base64,pending',
              status: 'pending',
            },
          },
        ],
      }),
    ];

    assert.deepEqual(collectCertIdsNeedingImageHydration(guards, ['guard-1']), []);
  });

  it('applies per-cert images to a single guard', () => {
    const guard = baseGuard({ certifications: [baseCert] });

    const next = applyCertificationImagesToGuard(
      guard,
      new Map([['cert-1', 'data:image/jpeg;base64,xyz']])
    );

    assert.equal(next.certifications[0].imageUrl, 'data:image/jpeg;base64,xyz');
  });
});
