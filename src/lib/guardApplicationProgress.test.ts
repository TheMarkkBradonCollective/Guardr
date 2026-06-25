import { describe, expect, it } from 'vitest';
import type { SecurityGuard } from '../types';
import { getGuardApplicationProgress } from './guardApplicationProgress';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    phone: '',
    badgeNumber: '',
    hourlyRate: 25,
    certifications: [],
    experience: [],
    education: [],
    userStatus: 'pending',
    verified: false,
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

describe('getGuardApplicationProgress', () => {
  it('returns 0% when nothing is on file', () => {
    const progress = getGuardApplicationProgress(baseGuard());
    expect(progress.percent).toBe(0);
    expect(progress.completedRequirements).toBe(0);
    expect(progress.totalRequirements).toBe(5);
  });

  it('awards partial credit for submitted ID without verification', () => {
    const progress = getGuardApplicationProgress(
      baseGuard({
        idVerificationStatus: 'pending',
        idFrontUrl: 'https://example.com/front.jpg',
        idBackUrl: 'https://example.com/back.jpg',
        idSelfieUrl: 'https://example.com/selfie.jpg',
        idNumber: 'A1234567',
        idState: 'CA',
        idExpirationDate: '2030-01-01',
      })
    );
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThanOrEqual(20);
  });
});
