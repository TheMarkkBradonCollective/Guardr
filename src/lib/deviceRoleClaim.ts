import type { ProductRole } from './productApps';

const DEVICE_ROLE_APP_CLAIM_KEY = 'guardr_device_role_app_claim_v1';

export type DeviceRoleAppClaim = ProductRole;

export const DEVICE_OTHER_ROLE_APP_MESSAGE =
  'This device is already set up for another Guardr app (Guard, Customer, or Staff). You can still install Messenger. To use a different role app, contact support.';

export function readDeviceRoleAppClaim(): DeviceRoleAppClaim | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEVICE_ROLE_APP_CLAIM_KEY);
    if (raw === 'client' || raw === 'guard' || raw === 'staff') return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeDeviceRoleAppClaim(claim: DeviceRoleAppClaim): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEVICE_ROLE_APP_CLAIM_KEY, claim);
  } catch {
    /* ignore */
  }
}

/** Guard / Customer / Staff APKs only — Messenger is always allowed. */
export function canInstallRoleProductApp(target: DeviceRoleAppClaim): boolean {
  const claim = readDeviceRoleAppClaim();
  if (!claim) return true;
  return claim === target;
}

export function canDownloadRoleProductBundle(): boolean {
  return readDeviceRoleAppClaim() === null;
}
