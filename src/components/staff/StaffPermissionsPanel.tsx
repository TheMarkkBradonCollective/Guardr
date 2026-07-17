import React, { useMemo, useState } from 'react';
import { SessionUser, StaffRole } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import {
  STAFF_PERMISSION_CATALOG,
  STAFF_ROLES_ORDERED,
  ROLE_LABELS,
  canManageStaffPermissions,
  getConfiguredStaffRolePermissions,
  getDefaultStaffRolePermissions,
  staffRoleToPlatformRole,
  type Permission,
  type StaffRolePermissionOverrides,
} from '../../lib/permissions';
import { StaffJobApprovalSettings } from './StaffJobApprovalSettings';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';

export type StaffPermissionsPatch = Pick<
  PlatformSettings,
  'jobReviewMode' | 'trustedClientAutoPublish' | 'staffRolePermissions'
>;

interface StaffPermissionsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdateStaffPermissions?: (patch: StaffPermissionsPatch) => void | Promise<void>;
}

function DesktopCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`adm-card adm-platform-settings-card ${className}`.trim()}>
      <h3 className="adm-card-title adm-platform-settings-card-title">{title}</h3>
      {children}
    </section>
  );
}

function groupCatalogBySection() {
  const groups: { title: string; items: typeof STAFF_PERMISSION_CATALOG }[] = [];
  for (const item of STAFF_PERMISSION_CATALOG) {
    const existing = groups.find((g) => g.title === item.group);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ title: item.group, items: [item] });
    }
  }
  return groups;
}

function StaffRolePermissionsEditor({
  staffRole,
  platformSettings,
  canEdit,
  onUpdateStaffPermissions,
}: {
  staffRole: StaffRole;
  platformSettings: PlatformSettings;
  canEdit: boolean;
  onUpdateStaffPermissions?: (patch: StaffPermissionsPatch) => void | Promise<void>;
}) {
  const overrides = platformSettings.staffRolePermissions;
  const activePermissions = useMemo(
    () => getConfiguredStaffRolePermissions(staffRole, overrides),
    [staffRole, overrides],
  );
  const hasCustomConfig = Boolean(overrides?.[staffRole]);
  const groups = useMemo(() => groupCatalogBySection(), []);

  const persistRolePermissions = (nextPermissions: Permission[]) => {
    if (!onUpdateStaffPermissions || !canEdit) return;
    const nextOverrides: StaffRolePermissionOverrides = {
      ...(overrides ?? {}),
      [staffRole]: nextPermissions,
    };
    void onUpdateStaffPermissions({ staffRolePermissions: nextOverrides });
  };

  const togglePermission = (permission: Permission, enabled: boolean) => {
    const next = enabled
      ? [...activePermissions, permission]
      : activePermissions.filter((p) => p !== permission);
    persistRolePermissions(next);
  };

  const resetToDefaults = () => {
    if (!onUpdateStaffPermissions || !canEdit) return;
    const nextOverrides = { ...(overrides ?? {}) };
    delete nextOverrides[staffRole];
    const cleaned =
      Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined;
    void onUpdateStaffPermissions({ staffRolePermissions: cleaned });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-brand-text-muted">
          Toggle capabilities for the {ROLE_LABELS[staffRoleToPlatformRole(staffRole)]} role.
          {hasCustomConfig ? ' Custom configuration active.' : ' Using platform defaults.'}
        </p>
        {canEdit && hasCustomConfig ? (
          <button
            type="button"
            className="text-xs font-medium text-brand-primary hover:underline"
            onClick={resetToDefaults}
          >
            Reset to defaults
          </button>
        ) : null}
      </div>
      {groups.map((group) => (
        <div key={group.title}>
          <p className="uber-label mb-2">{group.title}</p>
          <div className="space-y-2">
            {group.items.map(({ permission, label }) => (
              <label
                key={permission}
                className="flex items-start gap-2.5 text-sm py-1.5 border-b border-brand-border/40 last:border-0"
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={activePermissions.includes(permission)}
                  disabled={!canEdit}
                  onChange={(e) => togglePermission(permission, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StaffPermissionsPanel({
  currentUser,
  platformSettings,
  onUpdateStaffPermissions,
}: StaffPermissionsPanelProps) {
  const { formFactor } = useDevice();
  const canEdit = canManageStaffPermissions(currentUser);
  const isDesktop = formFactor === 'desktop';
  const [activeRole, setActiveRole] = useState<StaffRole>('Moderator');

  const persistApprovalSettings = async (patch: Partial<PlatformSettings>) => {
    if (!onUpdateStaffPermissions || !canEdit) return;
    await onUpdateStaffPermissions(patch);
  };

  const approvalSection = (
    <StaffJobApprovalSettings
      currentUser={currentUser}
      platformSettings={platformSettings}
      canEdit={canEdit}
      onPersistSettings={persistApprovalSettings}
      embedded
    />
  );

  const roleTabs = (
    <div className="flex flex-wrap gap-2 mb-4">
      {STAFF_ROLES_ORDERED.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => setActiveRole(role)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activeRole === role
              ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
              : 'border-brand-border text-brand-text-muted hover:text-brand-text'
          }`}
        >
          {ROLE_LABELS[staffRoleToPlatformRole(role)]}
        </button>
      ))}
    </div>
  );

  const roleEditor = (
    <StaffRolePermissionsEditor
      staffRole={activeRole}
      platformSettings={platformSettings}
      canEdit={canEdit}
      onUpdateStaffPermissions={onUpdateStaffPermissions}
    />
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        toolbar={
          <WorkbenchToolbar
            eyebrow="Platform"
            subtitle="Approval rules and staff role permissions."
          />
        }
      >
        <div className="space-y-3">
          <DesktopCard title="Approval rules">{approvalSection}</DesktopCard>
          <DesktopCard title="Staff role permissions">
            {!canEdit ? (
              <p className="text-xs text-brand-text-muted mb-3">
                View-only — Manager access or above is required to change role permissions.
              </p>
            ) : null}
            {roleTabs}
            {roleEditor}
          </DesktopCard>
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell>
      <div className="space-y-6">
        <AppFormSection title="Approval rules">
          <div className="pb-6">{approvalSection}</div>
        </AppFormSection>
        <section>
          <h3 className="adm-card-title px-4 sm:px-5 pt-2 pb-3">Staff role permissions</h3>
          {!canEdit ? (
            <p className="text-xs text-brand-text-muted px-4 sm:px-5 mb-3">
              View-only — Manager access or above is required to change role permissions.
            </p>
          ) : null}
          <div className="px-4 sm:px-5">{roleTabs}</div>
          <div className="px-4 sm:px-5 pb-6">{roleEditor}</div>
        </section>
      </div>
    </StaffOpsPageShell>
  );
}

/** @internal Exported for tests */
export function __testGetDefaultStaffRolePermissions(staffRole: StaffRole) {
  return getDefaultStaffRolePermissions(staffRole);
}
