import React, { useMemo, useState } from 'react';
import { Client, SecurityGuard, SecurityRequest, SessionUser } from '../types';
import {
  canAccessFinancialControls,
  canManageStaffAccounts,
  canSuspendUsers,
  canToggleStaffRole,
} from '../lib/permissions';
import {
  buildDisputes,
  buildIncidents,
  buildPlatformActivityFeed,
  computePlatformStats,
  StaffSection,
} from '../lib/staffOps';
import { StaffOpsLayout } from './staff/StaffOpsLayout';
import { StaffOverview } from './staff/StaffOverview';
import { StaffApprovals } from './staff/StaffApprovals';
import { StaffLiveJobs } from './staff/StaffLiveJobs';
import { StaffGuardsPanel } from './staff/StaffGuardsPanel';
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffReportsPanel } from './staff/StaffReportsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { StaffAnalyticsPanel } from './staff/StaffAnalyticsPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';

type ThemeMode = 'dark' | 'light' | 'grey';

interface StaffDashboardProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  onUpdateGuardStaffStatus: (guardId: string, isStaff: boolean) => Promise<void>;
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveClient: (clientId: string) => Promise<void>;
  onRejectClient: (clientId: string) => Promise<void>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuard: (guardId: string) => void;
  onRejectGuard: (guardId: string) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onResetAuditFailures?: (guardId: string) => void;
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => Promise<void>;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onUpdateGuardProfile: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  onUpdateGuardStaffStatus,
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveClient,
  onRejectClient,
  onApproveCert,
  onRejectCert,
  onApproveGuard,
  onRejectGuard,
  onResetAuditFailures,
  isDbConnected,
  currentUser,
  onAddStaffProfile,
  themeMode,
  onChangeTheme,
  onSignOut,
  onUpdateGuardProfile,
}: StaffDashboardProps) {
  const [section, setSection] = useState<StaffSection>('overview');

  const showFinance = canAccessFinancialControls(currentUser);
  const showStaffOnboard = canManageStaffAccounts(currentUser);
  const canSuspend = canSuspendUsers(currentUser);
  const canToggleStaff = canToggleStaffRole(currentUser);

  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const activityFeed = useMemo(() => buildPlatformActivityFeed(guards, clients, requests), [guards, clients, requests]);
  const incidents = useMemo(() => buildIncidents(requests, guards), [requests, guards]);
  const disputes = useMemo(() => buildDisputes(requests, guards), [requests, guards]);

  const badges = useMemo(
    () => ({
      approvals: stats.pendingApprovals,
      'live-jobs': requests.filter((r) => ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)).length,
      incidents: incidents.filter((i) => i.status !== 'resolved').length,
      disputes: disputes.filter((d) => d.status === 'open').length,
    }),
    [stats, requests, incidents, disputes]
  );

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return <StaffOverview stats={stats} initialFeed={activityFeed} />;
      case 'approvals':
        return (
          <StaffApprovals
            guards={guards}
            clients={clients}
            onApproveGuard={onApproveGuard}
            onRejectGuard={onRejectGuard}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
          />
        );
      case 'live-jobs':
        return (
          <StaffLiveJobs
            requests={requests}
            guards={guards}
            onApproveRequest={onApproveRequest}
            onDenyRequest={onDenyRequest}
          />
        );
      case 'guards':
        return (
          <StaffGuardsPanel
            guards={guards}
            requests={requests}
            canSuspend={canSuspend}
            canToggleStaff={canToggleStaff}
            onApproveGuard={onApproveGuard}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onUpdateStaffStatus={onUpdateGuardStaffStatus}
            onResetAuditFailures={onResetAuditFailures}
          />
        );
      case 'clients':
        return (
          <StaffClientsPanel
            clients={clients}
            requests={requests}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
          />
        );
      case 'reports':
        return <StaffReportsPanel requests={requests} guards={guards} />;
      case 'incidents':
        return <StaffIncidentsPanel incidents={incidents} />;
      case 'payments':
        return showFinance ? (
          <StaffPaymentsPanel requests={requests} isDirector={currentUser.role === 'director'} />
        ) : null;
      case 'disputes':
        return <StaffDisputesPanel disputes={disputes} />;
      case 'analytics':
        return (
          <StaffAnalyticsPanel
            guards={guards}
            clients={clients}
            requests={requests}
            showFinancials={showFinance}
          />
        );
      case 'settings':
        return showFinance ? (
          <StaffSettingsPanel
            currentUser={currentUser}
            showStaffOnboard={showStaffOnboard}
            onAddStaffProfile={onAddStaffProfile}
          />
        ) : null;
      case 'profile': {
        const staffGuard = guards.find((g) => g.id === currentUser.id) ?? null;
        return (
          <UserProfileScreen
            currentUser={currentUser}
            themeMode={themeMode}
            onChangeTheme={onChangeTheme}
            onSignOut={onSignOut}
            guard={staffGuard}
            onSave={(payload) => onUpdateGuardProfile(currentUser.id, payload)}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <StaffOpsLayout
      currentUser={currentUser}
      activeSection={section}
      onNavigate={setSection}
      themeMode={themeMode}
      onChangeTheme={onChangeTheme}
      onSignOut={onSignOut}
      isDbConnected={isDbConnected}
      badges={badges}
    >
      {renderSection()}
    </StaffOpsLayout>
  );
}
