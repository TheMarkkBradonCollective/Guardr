import React from 'react';
import { PlatformRole } from '../../types';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { Shield, Users, Briefcase, DollarSign, Crown, Award } from 'lucide-react';

const STAFF_ROLE_INFO: { role: PlatformRole; icon: typeof Shield; permissions: string[] }[] = [
  {
    role: 'support',
    icon: Users,
    permissions: [
      'Review incident reports & monitor platform activity',
      'Handle support messages in the staff inbox',
      'Access job & staff messages',
      'View shift violations',
      'No account approvals, credential verification, or job reviews',
    ],
  },
  {
    role: 'moderator',
    icon: Shield,
    permissions: [
      'Everything Support can do',
      'Approve guard & hiring-account applications',
      'Activate approved guard accounts (manual)',
      'Review reports & monitor platform activity',
      'View performance stats',
      'No credential verification, job reviews, or disputes',
    ],
  },
  {
    role: 'administrator',
    icon: Briefcase,
    permissions: [
      'Everything Moderators can do',
      'Verify credentials & government ID (Administrator+)',
      'Review job requests & handle disputes',
      'Suspend users & issue warnings',
      'Manage users, analytics, stats, integrations & locations',
      'No payouts, payment settings, audit log, or agreements',
    ],
  },
  {
    role: 'manager',
    icon: DollarSign,
    permissions: [
      'Everything Administrators can do',
      'Payments, payouts, fees, and financial data',
      'Audit log and company operations',
      'City actions follow assigned markets',
    ],
  },
  {
    role: 'finance',
    icon: DollarSign,
    permissions: [
      'Finance side seat — payment desk only when ladder role is null',
      'Payouts, fees, financial data, and audit log',
      'No ops approvals, credentials, disputes, or city markets',
    ],
  },
  {
    role: 'director',
    icon: Award,
    permissions: [
      'Full unrestricted platform operations',
      'Manage Administrators & Moderators (not other Directors)',
      'Payments, payment settings, agreements & audit log',
      'View all financial data & override system restrictions',
      'Payments & job creation',
    ],
  },
  {
    role: 'owner',
    icon: Crown,
    permissions: [
      'Everything Directors can do',
      'Platform governance overseer — manages all staff tiers',
      'Manage Directors, Administrators & Moderators',
      'Change payment methods (Stripe)',
      'Cannot moderate other Founders',
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
          <h4 className="font-bold text-sm">Hiring account</h4>
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
