import React from 'react';
import { Client } from '../../types';
import { guardCompanyRosterMemberships } from '../../lib/guardCompanyRoster';
import { WfBadge } from '../ui/wireframe';
import { Building2 } from 'lucide-react';

interface GuardCompanyRosterPanelProps {
  guardId: string;
  clients: Client[];
}

/** Phase D — guards see which licensed PPOs keep them on roster (marketplace + roster dual mode). */
export function GuardCompanyRosterPanel({ guardId, clients }: GuardCompanyRosterPanelProps) {
  const memberships = guardCompanyRosterMemberships(guardId, clients);
  if (memberships.length === 0) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface-elevated/40 px-3 py-3 space-y-3">
      <div className="flex items-start gap-2">
        <Building2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-text">Company rosters</p>
          <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
            You are on independent contractor rosters for these licensed security companies. You still
            accept each job individually — this is not employment.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {memberships.map((m) => (
          <div
            key={m.clientId}
            className="flex items-center justify-between gap-2 rounded-lg border border-brand-border/80 bg-brand-surface px-3 py-2"
          >
            <span className="text-sm font-medium text-brand-text">{m.companyName}</span>
            <WfBadge tone="primary">IC roster</WfBadge>
          </div>
        ))}
      </div>
    </div>
  );
}
