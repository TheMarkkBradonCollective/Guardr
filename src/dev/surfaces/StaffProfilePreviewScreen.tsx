import React, { useState } from 'react';
import { StaffTeamDetailPanel } from '../../components/staff/StaffTeamDetailPanel';
import { StaffStaffApplicationReviewPanel } from '../../components/staff/StaffStaffApplicationReviewPanel';
import { StaffListFilterTabs } from '../../components/staff/StaffListFilterTabs';
import { PREVIEW_PENDING_STAFF_MEMBER, PREVIEW_STAFF_MEMBER } from '../previewStaffFixtures';

/**
 * Renders the live staff-team and applications detail panels against fixture
 * data so mobile / tablet / desktop profile layouts can be compared.
 */
export function StaffProfilePreviewScreen() {
  const [page, setPage] = useState<'staff' | 'application'>('staff');

  return (
    <div className="staff-detail-pane sfp-staff-profile-preview">
      <div className="staff-guard-detail-tabs">
        <StaffListFilterTabs
          aria-label="Preview page"
          activeId={page}
          onChange={(id) => setPage(id as 'staff' | 'application')}
          tabs={[
            { id: 'staff', label: 'Staff profile' },
            { id: 'application', label: 'Application' },
          ]}
        />
      </div>
      {page === 'staff' ? (
        <StaffTeamDetailPanel
          member={PREVIEW_STAFF_MEMBER}
          currentUserId="preview-director"
          currentUserRole="director"
          canManageStaff
          canApproveStaffAccounts
          onUpdateUserStatus={() => undefined}
          onApproveStaffAccount={() => undefined}
          onRejectStaffAccount={() => undefined}
          onUpdateStaffProfile={() => undefined}
          onBack={() => undefined}
        />
      ) : (
        <StaffStaffApplicationReviewPanel
          member={PREVIEW_PENDING_STAFF_MEMBER}
          canReview
          onApproveStaffAccount={() => undefined}
          onRejectStaffAccount={() => undefined}
          onOpenStaffProfile={() => undefined}
        />
      )}
    </div>
  );
}
