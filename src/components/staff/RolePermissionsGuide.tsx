import React from 'react';
import { PlatformRole } from '../../types';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { Shield, Users, Briefcase, DollarSign, Crown, Award } from 'lucide-react';

const STAFF_ROLE_INFO: { role: PlatformRole; icon: typeof Shield; permissions: string[] }[] = [
  {
    role: 'moderator',
    icon: Shield,
    permissions: [
      'Approve guard & client accounts',
      'Review certifications & reports',
      'Review job requests & handle disputes',
      'Suspend users & issue warnings',
      'Monitor platform activity',
    ],
  },
  {
    role: 'administrator',
    icon: Briefcase,
    permissions: [
      'Everything Moderators can do',
      'Manage users & platform settings',
      'Manage payouts, fees & analytics',
      'Manage content & platform configuration',
    ],
  },
  {
    role: 'director',
    icon: Award,
    permissions: [
      'Full unrestricted platform operations',
      'Manage Administrators & Moderators',
      'View all financial data & audit logs',
      'Override system restrictions',
      'Cash payments, job creation & guard assignment',
    ],
  },
  {
    role: 'owner',
    icon: Crown,
    permissions: [
      'Everything Directors can do',
      'Manage Directors and all staff roles',
      'Ultimate platform governance authority',
      'Peer oversight of other Owners and Directors',
    ],
  },
];

interface RolePermissionsGuideProps {
  currentRole: PlatformRole;
}

export function RolePermissionsGuide({ currentRole }: RolePermissionsGuideProps) {
  return (
    <div className="px-4 py-4 border-b border-brand-border bg-brand-bg-sec/50">
      <p className="text-[10px] font-mono uppercase text-brand-text-muted mb-2">Your Role</p>
      <p className="font-bold text-lg">{ROLE_LABELS[currentRole]}</p>
      <p className="text-xs text-brand-text-muted mt-1">{ROLE_DESCRIPTIONS[currentRole]}</p>
    </div>
  );
}

export function StaffRolesReference() {
  return (
    <div className="app-list !border-t-0">
      {STAFF_ROLE_INFO.map(({ role, icon: Icon, permissions }) => (
        <div key={role} className="app-list-row app-list-row-align-top flex-col !items-stretch gap-3">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-brand-primary" />
            <h4 className="font-bold text-sm">{ROLE_LABELS[role]}</h4>
          </div>
          <ul className="space-y-1.5 w-full">
            {permissions.map((p) => (
              <li key={p} className="text-[11px] text-brand-text-muted flex items-start gap-1.5">
                <span className="text-brand-primary shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ClientGuardRolesSummary() {
  return (
    <div className="app-list !border-t-0 sm:grid sm:grid-cols-2 sm:!border-t sm:border-brand-border">
      <div className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2 sm:border-r sm:border-brand-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-primary" />
          <h4 className="font-bold text-sm">Client</h4>
        </div>
        <p className="text-[11px] text-brand-text-muted leading-relaxed">
          Post security requests, hire guards, manage payments, review reports, and rate guards.
        </p>
      </div>
      <div className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-brand-primary" />
          <h4 className="font-bold text-sm">Guard</h4>
        </div>
        <p className="text-[11px] text-brand-text-muted leading-relaxed">
          Map-first job browsing, accept assignments, self-audits, submit reports, view earnings, rate clients.
        </p>
      </div>
    </div>
  );
}
