import React from 'react';
import type { SecurityGuard } from '../../types';
import {
  formatGuardServiceAreasList,
  guardArmedPreferenceLabel,
  guardCardStatusLabel,
  guardHasApplicationIntake,
} from '../../lib/guardApplicationIntake';

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

function ChipList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-full border border-brand-border bg-brand-bg-sec px-2.5 py-0.5 text-xs font-medium text-brand-text"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

interface StaffGuardApplicationSummaryProps {
  guard: SecurityGuard;
}

export function StaffGuardApplicationSummary({ guard }: StaffGuardApplicationSummaryProps) {
  const serviceAreas = formatGuardServiceAreasList(guard.serviceAreas);
  const hasIntake = guardHasApplicationIntake(guard);

  return (
    <section className="rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-brand-text">Application details</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Information submitted at sign-up. Credentials are uploaded after you approve the application.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Phone" value={guard.phone} />
        <DetailRow
          label="Hourly rate"
          value={
            guard.hourlyRateRequirement != null ? `$${guard.hourlyRateRequirement}/hr minimum` : undefined
          }
        />
        <DetailRow
          label="Years in security"
          value={guard.yearsExperience != null ? String(guard.yearsExperience) : undefined}
        />
        <DetailRow label="Armed preference" value={guardArmedPreferenceLabel(guard)} />
        <DetailRow label="Guard card status" value={guardCardStatusLabel(guard.guardCardStatus)} />
        <DetailRow
          label="Reliable transportation"
          value={
            guard.hasReliableTransportation == null
              ? undefined
              : guard.hasReliableTransportation
                ? 'Yes'
                : 'No'
          }
        />
      </div>

      {guard.specialties && guard.specialties.length > 0 && (
        <div>
          <p className="uber-label text-xs">Work types</p>
          <ChipList items={guard.specialties} />
        </div>
      )}

      <DetailRow label="Service areas" value={serviceAreas} />

      <DetailRow label="Recent roles & employers" value={guard.summary} />
      <DetailRow label="Background" value={guard.bio} />
      <DetailRow label="Availability & schedule" value={guard.availabilityNotes} />

      {!hasIntake && (
        <p className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
          This guard signed up before the expanded application form. Review the bio and use Full profile
          if you need more context before approving.
        </p>
      )}
    </section>
  );
}
