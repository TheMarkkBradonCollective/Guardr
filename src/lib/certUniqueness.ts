import { Certification, SecurityGuard } from '../types';
import { formatStateName } from './states';

export type AddCertificationResult = { ok: true } | { ok: false; error: string };

/** Normalize for comparison — ignores case, spaces, and punctuation. */
export function normalizeCertNumber(number: string): string {
  return number.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export interface CertNumberConflict {
  existingCert: Pick<Certification, 'id' | 'number' | 'state' | 'name'>;
  existingGuardId: string;
  sameGuard: boolean;
}

export function findCertNumberConflict(
  guards: SecurityGuard[],
  input: { number: string; guardId: string; excludeCertId?: string }
): CertNumberConflict | null {
  const normalized = normalizeCertNumber(input.number);
  if (!normalized) return null;

  for (const guard of guards) {
    for (const cert of guard.certifications) {
      if (input.excludeCertId && cert.id === input.excludeCertId) continue;
      if (normalizeCertNumber(cert.number) !== normalized) continue;
      return {
        existingCert: cert,
        existingGuardId: guard.id,
        sameGuard: guard.id === input.guardId,
      };
    }
  }
  return null;
}

export function formatCertNumberConflictMessage(conflict: CertNumberConflict): string {
  const statePart = conflict.existingCert.state
    ? ` for ${formatStateName(conflict.existingCert.state)}`
    : '';

  if (conflict.sameGuard) {
    return `This certificate or license number is already on your profile${statePart}. Each number can only be registered once.`;
  }

  return `This certificate or license number is already registered on another guard account${statePart}. Each number can only be linked to one profile.`;
}

export function validateCertNumberAvailable(
  guards: SecurityGuard[],
  input: { number: string; guardId: string; excludeCertId?: string }
): AddCertificationResult {
  const trimmed = input.number.trim();
  if (!trimmed) {
    return { ok: false, error: 'Certificate or license number is required.' };
  }
  if (!normalizeCertNumber(trimmed)) {
    return { ok: false, error: 'Enter a valid certificate or license number.' };
  }

  const conflict = findCertNumberConflict(guards, input);
  if (conflict) {
    return { ok: false, error: formatCertNumberConflictMessage(conflict) };
  }

  return { ok: true };
}
