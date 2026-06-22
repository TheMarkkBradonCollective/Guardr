import React from 'react';
import { SessionUser, StaffRole } from '../../types';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { getAssignableStaffRoles, hasExecutivePaymentControls } from '../../lib/permissions';
import { StaffRolesReference } from './RolePermissionsGuide';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { StaffAddStaffForm } from './StaffAddStaffForm';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  showStaffOnboard: boolean;
  onAddStaffProfile: (
    name: string,
    email: string,
    badgeNumber: string,
    staffRole: StaffRole
  ) => Promise<string>;
}

export function StaffSettingsPanel({ currentUser, showStaffOnboard, onAddStaffProfile }: StaffSettingsPanelProps) {
  const assignableRoles = getAssignableStaffRoles(currentUser.role);

  return (
    <div className="animate-fade-in -mx-4 sm:-mx-5">
      <AppFormSection title="Platform Fees">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
          <div>
            <label className="uber-label block mb-1">Fee per hour</label>
            <input
              type="number"
              defaultValue={PLATFORM_FEE_PER_HOUR}
              readOnly={!hasExecutivePaymentControls(currentUser)}
              className="uber-input w-full"
            />
          </div>
          <div>
            <label className="uber-label block mb-1">Approval rules</label>
            <select className="uber-input w-full" defaultValue="staff-all">
              <option value="staff-all">All jobs require staff review</option>
              <option value="trusted">Trusted clients auto-open</option>
            </select>
          </div>
        </div>
      </AppFormSection>

      <AppFormSection title="Role Permissions">
        <div className="pb-6">
          <StaffRolesReference />
        </div>
      </AppFormSection>

      {showStaffOnboard && assignableRoles.length > 0 && (
        <AppFormSection title="Onboard staff">
          <div className="pb-6">
            <p className="text-sm text-brand-text-muted mb-4">
              You can also manage staff from the Staff section in the sidebar — add accounts and change roles there.
              Owners manage staff below their tier; Directors manage Moderators and Administrators.
            </p>
            <StaffAddStaffForm
              assignableRoles={assignableRoles}
              onAdd={(input) =>
                onAddStaffProfile(input.name, input.email, input.badgeNumber, input.staffRole)
              }
            />
          </div>
        </AppFormSection>
      )}
    </div>
  );
}
