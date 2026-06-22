import { Certification, SecurityGuard, SecurityRequest } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import { guardHasCredentialOnFile } from './guardQualification';
import { formatStateName } from './states';

function isCredentialOnFile(cert: Certification): boolean {
  return cert.status !== 'rejected';
}

export function isGuardCardCert(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  const id = resolveCertCatalogId(cert);
  return id === 'bsis-guard-card' || /guard card|bsis guard/i.test(cert.name);
}

export function isArmedGuardCardCert(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  const id = resolveCertCatalogId(cert);
  return id === 'bsis-exposed-firearm' || /armed security officer|exposed firearm/i.test(cert.name);
}

/** @deprecated Use guardHasCredentialOnFile — kept for call sites that mean “on file” */
export function hasVerifiedGuardCardForState(
  guard: SecurityGuard,
  stateCode: string,
  armedRequired = false
): boolean {
  return hasGuardCardForState(guard, stateCode, armedRequired);
}

export function hasGuardCardForState(
  guard: SecurityGuard,
  stateCode: string,
  armedRequired = false
): boolean {
  const state = stateCode.toUpperCase();
  if (!guardHasCredentialOnFile(guard, 'bsis-guard-card', state)) return false;
  if (armedRequired) {
    return guardHasFirearmPermitOnFile(guard);
  }
  return true;
}

export function guardHasFirearmPermit(guard: SecurityGuard): boolean {
  return guardHasFirearmPermitOnFile(guard);
}

export function guardHasFirearmPermitOnFile(guard: SecurityGuard): boolean {
  return guardHasCredentialOnFile(guard, 'bsis-exposed-firearm');
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

export function getLicensedStatesOnFile(guard: SecurityGuard): string[] {
  const states = new Set<string>();
  for (const cert of guard.certifications) {
    if (isCredentialOnFile(cert) && isGuardCardCert(cert) && cert.state) {
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
    return guardHasCredentialOnFile(guard, 'bsis-guard-card');
  }
  if (armedRequired) {
    return hasGuardCardForState(guard, stateCode, true);
  }
  return hasGuardCardForState(guard, stateCode, false);
}

export function stateLicenseRequirementLabel(
  job: Pick<SecurityRequest, 'state' | 'armedRequired'>
): string {
  if (!job.state) return 'BSIS Guard Card';
  const stateName = formatStateName(job.state);
  return job.armedRequired ? `${stateName} Guard Card + Firearm Permit` : `${stateName} BSIS Guard Card`;
}

export function certRequiresState(cert: Pick<Certification, 'name' | 'catalogId'>): boolean {
  return isGuardCardCert(cert);
}
