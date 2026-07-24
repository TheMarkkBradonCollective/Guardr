import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCertificationImagesToGuard,
  certificationRowsNeedImageHydration,
  mergeCertificationImagesIntoGuards,
} from './certificationLoad';
import type { SecurityGuard } from '../types';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'guard-1',
    name: 'Test Guard',
    email: 'test@example.com',
    badgeNumber: 'GR-1',
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

describe('certificationLoad', () => {
  it('merges image urls into matching guard certifications', () => {
    const guards = [
      baseGuard({
        certifications: [
          {
            id: 'cert-1',
            name: 'BSIS Guard Card',
            issuer: 'BSIS',
            number: 'GC-1',
            status: 'pending',
            issueDate: '2026-01-01',
            catalogId: 'bsis-guard-card',
          },
        ],
      }),
    ];

    const merged = mergeCertificationImagesIntoGuards(
      guards,
      new Map([['guard-1', new Map([['cert-1', 'data:image/jpeg;base64,abc']])]])
    );

    assert.equal(merged[0].certifications[0].imageUrl, 'data:image/jpeg;base64,abc');
  });

  it('flags guards that still need image hydration', () => {
    const guards = [
      baseGuard({
        id: 'ashanti',
        certifications: [
          {
            id: 'cert-card',
            name: 'BSIS Guard Card',
            issuer: 'BSIS',
            number: 'GC-9',
            status: 'pending',
            issueDate: '2026-01-01',
            catalogId: 'bsis-guard-card',
          },
        ],
      }),
    ];

    assert.deepEqual(certificationRowsNeedImageHydration(guards, ['ashanti']), ['ashanti']);
  });

  it('applies per-cert images to a single guard', () => {
    const guard = baseGuard({
      certifications: [
        {
          id: 'cert-card',
          name: 'BSIS Guard Card',
          issuer: 'BSIS',
          number: 'GC-9',
          status: 'pending',
          issueDate: '2026-01-01',
          catalogId: 'bsis-guard-card',
        },
      ],
    });

    const next = applyCertificationImagesToGuard(
      guard,
      new Map([['cert-card', 'data:image/jpeg;base64,xyz']])
    );

    assert.equal(next.certifications[0].imageUrl, 'data:image/jpeg;base64,xyz');
  });
});
