import type { SecurityGuard, Certification } from '../types';
import { credentialRequiresExpiry } from './certCatalog';

export type ComplianceAlertType =
  | 'guard_card_expiring'
  | 'permit_expiring'
  | 'insurance_expiring'
  | 'background_check_due'
  | 'account_suspended';

export interface ComplianceAlertDraft {
  guardId: string;
  alertType: ComplianceAlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  expiresAt?: string;
}

const MS_PER_DAY = 86_400_000;

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / MS_PER_DAY);
}

function certExpiryAlerts(guard: SecurityGuard): ComplianceAlertDraft[] {
  const alerts: ComplianceAlertDraft[] = [];
  for (const cert of guard.certifications ?? []) {
    if (cert.status !== 'verified') continue;
    const days = daysUntil(cert.expiryDate);
    if (days === null) continue;
    if (days <= 0) {
      alerts.push({
        guardId: guard.id,
        alertType: cert.catalogId?.includes('permit') ? 'permit_expiring' : 'guard_card_expiring',
        severity: 'critical',
        title: `${cert.name} expired`,
        body: `Your ${cert.name} (${cert.number}) has expired. Update credentials to accept new jobs.`,
        expiresAt: cert.expiryDate,
      });
    } else if (days <= 14) {
      alerts.push({
        guardId: guard.id,
        alertType: cert.catalogId?.includes('permit') ? 'permit_expiring' : 'guard_card_expiring',
        severity: days <= 7 ? 'critical' : 'warning',
        title: `${cert.name} expires in ${days} day${days === 1 ? '' : 's'}`,
        body: `Renew your ${cert.name} before it expires on ${cert.expiryDate}.`,
        expiresAt: cert.expiryDate,
      });
    }
  }
  return alerts;
}

export function scanGuardCompliance(guard: SecurityGuard): ComplianceAlertDraft[] {
  const alerts = certExpiryAlerts(guard);

  if (guard.userStatus === 'suspended' || guard.userStatus === 'blocked') {
    alerts.push({
      guardId: guard.id,
      alertType: 'account_suspended',
      severity: 'critical',
      title: 'Account restricted',
      body: 'Your account is restricted. Contact Guardr support for assistance.',
    });
  }

  if (!guard.backgroundChecked) {
    alerts.push({
      guardId: guard.id,
      alertType: 'background_check_due',
      severity: 'warning',
      title: 'Background check pending',
      body: 'Complete your background check to unlock full marketplace access.',
    });
  }

  const insurance = guard.insurancePolicy;
  if (insurance?.expiryDate) {
    const days = daysUntil(insurance.expiryDate);
    if (days !== null && days <= 30) {
      alerts.push({
        guardId: guard.id,
        alertType: 'insurance_expiring',
        severity: days <= 7 ? 'critical' : 'warning',
        title: days <= 0 ? 'Insurance expired' : `Insurance expires in ${days} days`,
        body: `Your COI expires on ${insurance.expiryDate}. Upload an updated policy.`,
        expiresAt: insurance.expiryDate,
      });
    }
  }

  return alerts;
}

export function scanAllGuardsCompliance(guards: SecurityGuard[]): ComplianceAlertDraft[] {
  return guards.flatMap(scanGuardCompliance);
}
