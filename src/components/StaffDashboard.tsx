import React, { useMemo, useState } from 'react';
import {
  Certification,
  Client,
  CreateSupportTicketInput,
  Experience,
  GuardEducation,
  Payment,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  SupportTicketStatus,
} from '../types';
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
  isStaffShiftSection,
  staffSectionToShiftTab,
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
import { StaffSupportPanel } from './staff/StaffSupportPanel';
import { openTicketCount } from '../lib/support';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { StaffAnalyticsPanel } from './staff/StaffAnalyticsPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { findGuardProfileForUser } from '../lib/guardDirectory';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { GuardDashboard } from './GuardDashboard';

type ThemeMode = 'dark' | 'light' | 'grey';

interface StaffDashboardProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  supportTickets?: SupportTicket[];
  payments?: Payment[];
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
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => Promise<void>;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onUpdateGuardProfile: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
  onAddCertification?: (guardId: string, cert: Partial<Certification>) => void | Promise<void>;
  onDeleteCertification?: (guardId: string, certId: string) => void | Promise<void>;
  onAddExperience?: (guardId: string, exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (guardId: string, edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus?: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onAcceptJob: (requestId: string) => void;
  onUpdateJobAudit: (requestId: string, auditPayload: unknown) => void;
  onUpdateStripeAccount?: (guardId: string, accountId: string) => void;
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  supportTickets = [],
  payments = [],
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
  onReleasePayout,
  onRefundPayment,
  isDbConnected,
  currentUser,
  onAddStaffProfile,
  themeMode,
  onChangeTheme,
  onSignOut,
  onUpdateGuardProfile,
  onAddCertification,
  onDeleteCertification,
  onAddExperience,
  onAddEducation,
  onSendSupportMessage,
  onUpdateSupportStatus,
  onCreateSupportTicket,
  onAcceptJob,
  onUpdateJobAudit,
  onUpdateStripeAccount,
  onRecordAuditViolation,
}: StaffDashboardProps) {
  const [section, setSection] = useState<StaffSection>('map');
  const staffGuard = findGuardProfileForUser(currentUser, guards) ?? null;

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
      support: openTicketCount(supportTickets),
    }),
    [stats, requests, incidents, disputes, supportTickets]
  );

  const renderShiftFallback = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <h2 className="font-bold text-lg">Guard profile not linked</h2>
      <p className="text-sm text-brand-text-muted max-w-sm">
        Link your staff account to a guard profile to browse the map and accept shifts. Complete your profile under Account, or sign in with the email on your guard record.
      </p>
      <button type="button" onClick={() => setSection('profile')} className="uber-button-sage h-11 px-6 text-sm">
        Open profile
      </button>
    </div>
  );

  const renderSection = () => {
    if (isStaffShiftSection(section)) {
      if (!staffGuard) return renderShiftFallback();
      return (
        <GuardDashboard
          variant="embedded"
          shiftTab={staffSectionToShiftTab(section)}
          guard={staffGuard}
          requests={requests}
          payments={payments}
          currentUser={currentUser}
          onAddCertification={(cert) => onAddCertification?.(staffGuard.id, cert)}
          onDeleteCertification={(certId) => onDeleteCertification?.(staffGuard.id, certId)}
          onAddExperience={(exp) => onAddExperience?.(staffGuard.id, exp)}
          onAddEducation={(edu) => onAddEducation?.(staffGuard.id, edu)}
          onAcceptJob={onAcceptJob}
          onUpdateJobAudit={onUpdateJobAudit}
          onRecordAuditViolation={onRecordAuditViolation}
          onUpdateStripeAccount={onUpdateStripeAccount}
          onSignOut={onSignOut}
          themeMode={themeMode}
          onChangeTheme={onChangeTheme}
          onUpdateProfile={(payload) => onUpdateGuardProfile(staffGuard.id, payload)}
          supportTickets={supportTickets}
          relatedRequests={requests.filter((r) => r.assignedGuardId === staffGuard.id)}
          onCreateSupportTicket={onCreateSupportTicket}
          onSendSupportMessage={onSendSupportMessage}
        />
      );
    }

    switch (section) {
      case 'overview':
        return <StaffOverview stats={stats} initialFeed={activityFeed} />;
      case 'approvals':
        return (
          <StaffApprovals
            guards={guards}
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
            onRejectClient={onRejectClient}
          />
        );
      case 'reports':
        return <StaffReportsPanel requests={requests} guards={guards} />;
      case 'incidents':
        return <StaffIncidentsPanel incidents={incidents} />;
      case 'support':
        return onSendSupportMessage && onUpdateSupportStatus ? (
          <StaffSupportPanel
            tickets={supportTickets}
            onSendMessage={onSendSupportMessage}
            onUpdateStatus={onUpdateSupportStatus}
          />
        ) : null;
      case 'payments':
        return showFinance ? (
          <StaffPaymentsPanel
            requests={requests}
            guards={guards}
            payments={payments}
            isDirector={currentUser.role === 'director'}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
          />
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
      case 'profile':
        return (
          <UserProfileScreen
            currentUser={currentUser}
            themeMode={themeMode}
            onChangeTheme={onChangeTheme}
            onSignOut={onSignOut}
            guard={staffGuard}
            onSave={(payload) => onUpdateGuardProfile(currentUser.id, payload)}
            onAddCertification={staffGuard && onAddCertification ? (cert) => onAddCertification(currentUser.id, cert) : undefined}
            onDeleteCertification={staffGuard && onDeleteCertification ? (certId) => onDeleteCertification(currentUser.id, certId) : undefined}
            onAddExperience={onAddExperience ? (exp) => onAddExperience(currentUser.id, exp) : undefined}
            onAddEducation={onAddEducation ? (edu) => onAddEducation(currentUser.id, edu) : undefined}
          />
        );
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
      showShiftNav={!!staffGuard}
      fullBleed={isStaffShiftSection(section)}
    >
      {renderSection()}
    </StaffOpsLayout>
  );
}
