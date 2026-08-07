import React from 'react';
import type { SecurityGuard } from '../../types';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, staffRoleToPlatformRole } from '../../lib/permissions';
import { AppNoticeChip } from '../ui/app/AppBlockedAccess';

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
  const staffRole = member.staffRole || 'Support';
  const platformRole = staffRoleToPlatformRole(staffRole);
  const cities = (member.managedCities ?? []).filter(Boolean);
  const hasIntake =
    Boolean(member.phone?.trim()) ||
    Boolean(member.firstName?.trim()) ||
    Boolean(member.lastName?.trim()) ||
    Boolean(member.bio?.trim()) ||
    cities.length > 0;

  return (
    <section className="staff-detail-section space-y-4 !px-0">
      <div>
        <p className="text-sm font-semibold text-brand-text">Application details</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Full name" value={member.name} />
        <DetailRow label="Staff ID" value={member.badgeNumber} />
        <DetailRow label="Work email" value={member.email} />
        <DetailRow label="Personal email" value={member.personalEmail} />
        <DetailRow label="Phone" value={member.phone} />
        <DetailRow label="Requested role" value={`${staffRole} — ${ROLE_LABELS[platformRole]}`} />
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
