import { Certification, SecurityGuard, SecurityRequest } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import { formatStateName } from './states';

export function isGuardCardCert(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  const id = resolveCertCatalogId(cert);
  return id === 'bsis-guard-card' || /guard card|bsis guard/i.test(cert.name);
}

export function isArmedGuardCardCert(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  const id = resolveCertCatalogId(cert);
  return id === 'bsis-exposed-firearm' || /armed security officer|exposed firearm/i.test(cert.name);
}

export function hasVerifiedGuardCardForState(
  guard: SecurityGuard,
  stateCode: string,
  armedRequired = false
): boolean {
  const state = stateCode.toUpperCase();
  return guard.certifications.some((cert) => {
    if (cert.status !== 'verified' || !isGuardCardCert(cert)) return false;
    if (cert.state?.toUpperCase() !== state) return false;
    if (armedRequired) {
      return guardHasFirearmPermit(guard) || isArmedGuardCardCert(cert);
    }
    return true;
  });
}

export function guardHasFirearmPermit(guard: SecurityGuard): boolean {
  return guard.certifications.some((c) => {
    if (c.status !== 'verified') return false;
    const id = resolveCertCatalogId(c);
    return id === 'bsis-exposed-firearm';
  });
}

export function getVerifiedLicensedStates(guard: SecurityGuard): string[] {
  const states = new Set<string>();
  for (const cert of guard.certifications) {
    if (cert.status === 'verified' && isGuardCardCert(cert) && cert.state) {
      states.add(cert.state.toUpperCase());
    }
  }
  return [...states].sort();
}

export function getPendingLicensedStates(guard: SecurityGuard): string[] {
  const states = new Set<string>();
  for (const cert of guard.certifications) {
    if (cert.status === 'pending' && isGuardCardCert(cert) && cert.state) {
      states.add(cert.state.toUpperCase());
    }
  }
  return [...states].sort();
}

export function guardCanWorkInState(guard: SecurityGuard, stateCode: string, armedRequired = false): boolean {
  if (!stateCode) {
    return guard.certifications.some((c) => c.status === 'verified' && isGuardCardCert(c));
  }
  if (armedRequired) {
    return hasVerifiedGuardCardForState(guard, stateCode, true) && guardHasFirearmPermit(guard);
  }
  return hasVerifiedGuardCardForState(guard, stateCode, false);
}

export function stateLicenseRequirementLabel(job: SecurityRequest): string {
  if (!job.state) return 'BSIS Guard Card';
  const stateName = formatStateName(job.state);
  return job.armedRequired ? `${stateName} Guard Card + Firearm Permit` : `${stateName} BSIS Guard Card`;
}

export function certRequiresState(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  return isGuardCardCert(cert);
}
