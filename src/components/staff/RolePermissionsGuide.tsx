import React from 'react';
import { PlatformRole } from '../../types';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/permissions';
import { Shield, Users, Briefcase, DollarSign, Crown } from 'lucide-react';

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
    icon: Crown,
    permissions: [
      'Full unrestricted platform access',
      'Manage Administrators & Moderators',
      'View all financial data & audit logs',
      'Override system restrictions',
    ],
  },
];

interface RolePermissionsGuideProps {
  currentRole: PlatformRole;
}

export function RolePermissionsGuide({ currentRole }: RolePermissionsGuideProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
      <p className="text-[10px] font-mono uppercase text-slate-500 mb-2">Your Role</p>
      <p className="font-black text-lg text-slate-900">{ROLE_LABELS[currentRole]}</p>
      <p className="text-xs text-slate-600 mt-1">{ROLE_DESCRIPTIONS[currentRole]}</p>
    </div>
  );
}

export function StaffRolesReference() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STAFF_ROLE_INFO.map(({ role, icon: Icon, permissions }) => (
        <div key={role} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm">{ROLE_LABELS[role]}</h4>
          </div>
          <ul className="space-y-1.5">
            {permissions.map((p) => (
              <li key={p} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="text-emerald-500 shrink-0">✓</span>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-brand-primary" />
          <h4 className="font-bold text-sm">Client</h4>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Post security requests, hire guards, manage payments, review reports, and rate guards.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-brand-primary" />
          <h4 className="font-bold text-sm">Guard</h4>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Map-first job browsing, accept assignments, self-audits, submit reports, view earnings, rate clients.
        </p>
      </div>
    </div>
  );
}
