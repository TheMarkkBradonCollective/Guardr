import { Certification, SecurityGuard, SecurityRequest } from '../types';
import { formatStateName } from './states';

export function isGuardCardCert(name: string): boolean {
  return /guard card|guard card license|armed security officer/i.test(name);
}

export function isArmedGuardCardCert(name: string): boolean {
  return /armed security officer|armed.*guard card/i.test(name);
}

export function hasVerifiedGuardCardForState(
  guard: SecurityGuard,
  stateCode: string,
  armedRequired = false
): boolean {
  const state = stateCode.toUpperCase();
  return guard.certifications.some((cert) => {
    if (cert.status !== 'verified' || !isGuardCardCert(cert.name)) return false;
    if (cert.state?.toUpperCase() !== state) return false;
    if (armedRequired && !isArmedGuardCardCert(cert.name) && !guard.isArmed) return false;
    if (armedRequired) {
      return isArmedGuardCardCert(cert.name) || /armed/i.test(cert.name);
    }
    return true;
  });
}

export function getVerifiedLicensedStates(guard: SecurityGuard): string[] {
  const states = new Set<string>();
  for (const cert of guard.certifications) {
    if (cert.status === 'verified' && isGuardCardCert(cert.name) && cert.state) {
      states.add(cert.state.toUpperCase());
    }
  }
  return [...states].sort();
}

export function getPendingLicensedStates(guard: SecurityGuard): string[] {
  const states = new Set<string>();
  for (const cert of guard.certifications) {
    if (cert.status === 'pending' && isGuardCardCert(cert.name) && cert.state) {
      states.add(cert.state.toUpperCase());
    }
  }
  return [...states].sort();
}

export function guardCanWorkInState(guard: SecurityGuard, stateCode: string, armedRequired = false): boolean {
  if (!stateCode) {
    return guard.certifications.some((c) => c.status === 'verified' && isGuardCardCert(c.name));
  }
  return hasVerifiedGuardCardForState(guard, stateCode, armedRequired);
}

export function stateLicenseRequirementLabel(job: SecurityRequest): string {
  if (!job.state) return 'Guard Card (any state)';
  const stateName = formatStateName(job.state);
  return job.armedRequired ? `${stateName} Armed Guard Card` : `${stateName} Guard Card`;
}

export function certRequiresState(cert: Pick<Certification, 'name'>): boolean {
  return isGuardCardCert(cert.name);
}
