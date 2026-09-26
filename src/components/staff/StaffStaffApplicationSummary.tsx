import React from 'react';
import type { SecurityGuard } from '../../types';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, staffRoleToPlatformRole } from '../../lib/permissions';
import { getGuardIdVerificationStatus } from '../../lib/guardIdentityVerification';
import { getStaffActivationChecklist, staffHasApplicationIntake } from '../../lib/staffAccountActivation';
import { getStaffRequestedRoleLabel } from '../../lib/staffProfile';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';
import { WfSectionHeader } from '../ui/wireframe';

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  return (
    <div>
      <p className="uber-label text-xs">{label}</p>
      <p className="text-sm text-brand-text mt-0.5 leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

interface StaffStaffApplicationSummaryProps {
  member: SecurityGuard;
}

export function StaffStaffApplicationSummary({ member }: StaffStaffApplicationSummaryProps) {
  const isFinanceDesk = !member.staffRole && member.sideRole === 'Finance';
  const staffRole = member.staffRole || (isFinanceDesk ? null : 'Support');
  const platformRole = staffRole ? staffRoleToPlatformRole(staffRole) : 'finance';
  const cities = (member.managedCities ?? []).filter(Boolean);
  const hasIntake = staffHasApplicationIntake(member);
  const requestedRoleLabel = getStaffRequestedRoleLabel(member);

  return (
    <section className="staff-detail-section space-y-4">
      <WfSectionHeader title="Application details" className="!px-0 !mb-0" />

      {/* Name, staff ID, and work email are already in the profile header. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Requested role" value={requestedRoleLabel} />
        <DetailRow label="Personal email" value={member.personalEmail} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Years of experience" value={member.yearsExperience?.toString()} />
        <DetailRow label="Availability" value={member.availabilityNotes} />
        <DetailRow label="Referred by" value={member.referredBy} />
      </div>

      <div>
        <p className="uber-label text-xs">Role scope</p>
        <p className="text-sm text-brand-text mt-0.5 leading-relaxed">{ROLE_DESCRIPTIONS[platformRole]}</p>
      </div>

      {cities.length > 0 && (
        <div>
          <p className="uber-label text-xs">Service areas</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {cities.map((city) => (
              <span key={city} className="text-sm text-brand-text">
                {city}
              </span>
            ))}
          </div>
        </div>
      )}

      <DetailRow label="Notes" value={member.bio} />

      <div>
        <p className="uber-label text-xs">Onboarding checklist</p>
        <ul className="mt-2 space-y-1">
          {getStaffActivationChecklist(member).map((step) => (
            <li key={step.id} className="text-sm text-brand-text">
              {step.complete ? '✓' : '○'} {step.label}
              {step.detail ? ` — ${step.detail}` : ''}
            </li>
          ))}
        </ul>
        <p className="text-xs text-brand-text-muted mt-2">
          Government ID: {getGuardIdVerificationStatus(member)} · Stripe:{' '}
          {member.stripeConnectAccountId ? 'connected' : 'not connected'}
        </p>
      </div>

      {!hasIntake && (
        <AppNoticeChip
          label="Limited intake"
          title="Limited application intake"
          message="This staff account has limited intake details on file. Review the role and contact info before approving."
        />
      )}
    </section>
  );
}
