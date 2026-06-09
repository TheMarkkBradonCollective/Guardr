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
} from '../lib/permissions';
import {
  buildDisputes,
  buildIncidents,
  buildOverviewActionQueue,
  buildOverviewLiveShifts,
  buildPlatformActivityFeed,
  computePlatformStats,
  computeWeeklyCompletedJobs,
  isStaffOpsMapSection,
  StaffSection,
} from '../lib/staffOps';
import { StaffOpsLayout } from './staff/StaffOpsLayout';
import { StaffOverview } from './staff/StaffOverview';
import { StaffApprovals } from './staff/StaffApprovals';
import { StaffJobsPanel } from './staff/StaffJobsPanel';
import { StaffGuardsPanel } from './staff/StaffGuardsPanel';
import { StaffTeamPanel } from './staff/StaffTeamPanel';
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffSupportPanel } from './staff/StaffSupportPanel';
import { openTicketCount } from '../lib/support';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { StaffAnalyticsPanel } from './staff/StaffAnalyticsPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { StaffOpsMapScreen } from './staff/StaffOpsMapScreen';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';

type ThemeMode = 'dark' | 'light' | 'grey';

interface StaffDashboardProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  supportTickets?: SupportTicket[];
  payments?: Payment[];
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveClient: (clientId: string) => Promise<void>;
  onRejectClient: (clientId: string) => Promise<void>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuard: (guardId: string) => void;
  onRejectGuard: (guardId: string) => void;
  onUpdateBackgroundChecked: (guardId: string, checked: boolean) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onResetAuditFailures?: (guardId: string) => void;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => Promise<void>;
  onAddGuardProfile: (input: {
    name: string;
    email: string;
    phone?: string;
    badgeNumber?: string;
    hourlyRate?: number;
  }) => Promise<string>;
  onAddClientProfile: (input: {
    name: string;
    email: string;
    companyName?: string;
    phone?: string;
  }) => Promise<string>;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onUpdateGuardProfile: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus?: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  initialSection?: StaffSection;
  /** Controlled section — when set, parent owns navigation state (URL sync). */
  section?: StaffSection;
  onSectionChange?: (section: StaffSection) => void;
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  supportTickets = [],
  payments = [],
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveClient,
  onRejectClient,
  onApproveCert,
  onRejectCert,
  onApproveGuard,
  onRejectGuard,
  onUpdateBackgroundChecked,
  onResetAuditFailures,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  isDbConnected,
  currentUser,
  onAddStaffProfile,
  onAddGuardProfile,
  onAddClientProfile,
  themeMode,
  onChangeTheme,
  onSignOut,
  onUpdateGuardProfile,
  onSendSupportMessage,
  onUpdateSupportStatus,
  initialSection = 'overview',
  section: controlledSection,
  onSectionChange,
}: StaffDashboardProps) {
  const isControlled = controlledSection !== undefined;
  const [internalSection, setInternalSection] = useState<StaffSection>(controlledSection ?? initialSection);
  const section = isControlled ? controlledSection : internalSection;
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const openJob = (jobId: string) => {
    setSelectedJobId(jobId);
    navigateSection('jobs');
  };

  const navigateSection = (next: StaffSection) => {
    if (!isControlled) setInternalSection(next);
    onSectionChange?.(next);
    if (next !== 'guards') setSelectedGuardId(null);
    if (next !== 'team') setSelectedTeamId(null);
    if (next !== 'clients') setSelectedClientId(null);
    if (next !== 'jobs') setSelectedJobId(null);
  };

  const showFinance = canAccessFinancialControls(currentUser);
  const showStaffOnboard = canManageStaffAccounts(currentUser);
  const canSuspend = canSuspendUsers(currentUser);

  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const activityFeed = useMemo(() => buildPlatformActivityFeed(guards, clients, requests), [guards, clients, requests]);
  const incidents = useMemo(() => buildIncidents(requests, guards), [requests, guards]);
  const disputes = useMemo(() => buildDisputes(requests, guards), [requests, guards]);
  const overviewActions = useMemo(
    () => buildOverviewActionQueue(stats, requests, incidents, openTicketCount(supportTickets)),
    [stats, requests, incidents, supportTickets]
  );
  const overviewLiveShifts = useMemo(() => buildOverviewLiveShifts(guards, requests), [guards, requests]);
  const overviewWeeklyTrend = useMemo(() => computeWeeklyCompletedJobs(requests), [requests]);

  const badges = useMemo(
    () => ({
      approvals: stats.pendingApprovals,
      jobs: requests.filter((r) => ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)).length,
      incidents: incidents.filter((i) => i.status !== 'resolved').length,
      disputes: disputes.filter((d) => d.status === 'open').length,
      support: openTicketCount(supportTickets),
    }),
    [stats, requests, incidents, disputes, supportTickets]
  );

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return (
          <StaffOverview
            stats={stats}
            activityFeed={activityFeed}
            actionItems={overviewActions}
            liveShifts={overviewLiveShifts}
            weeklyTrend={overviewWeeklyTrend}
            onNavigate={navigateSection}
            staffName={currentUser.name}
          />
        );
      case 'map':
        return <StaffOpsMapScreen requests={requests} />;
      case 'approvals':
        return (
          <StaffApprovals
            guards={guards}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onViewGuard={(guardId) => {
              setSelectedGuardId(guardId);
              navigateSection('guards');
            }}
          />
        );
      case 'jobs':
        return (
          <StaffJobsPanel
            requests={requests}
            guards={guards}
            onApproveRequest={onApproveRequest}
            onDenyRequest={onDenyRequest}
            initialSelectedId={selectedJobId}
          />
        );
      case 'guards':
        return (
          <StaffGuardsPanel
            guards={guards}
            requests={requests}
            canSuspend={canSuspend}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onResetAuditFailures={onResetAuditFailures}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onApproveGuard={onApproveGuard}
            onRejectGuard={onRejectGuard}
            onUpdateBackgroundChecked={onUpdateBackgroundChecked}
            initialSelectedId={selectedGuardId}
            onOpenJob={openJob}
            onAddGuard={onAddGuardProfile}
          />
        );
      case 'team':
        return (
          <StaffTeamPanel
            guards={guards}
            requests={requests}
            canSuspend={canSuspend}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            initialSelectedId={selectedTeamId}
          />
        );
      case 'clients':
        return (
          <StaffClientsPanel
            clients={clients}
            requests={requests}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            initialSelectedId={selectedClientId}
            onOpenJob={openJob}
            onAddClient={onAddClientProfile}
          />
        );
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
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onDepositCashToStripe={onDepositCashToStripe}
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
            guard={guards.find((g) => g.id === currentUser.id) ?? null}
            onSave={(payload) => onUpdateGuardProfile(currentUser.id, payload)}
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
      onNavigate={navigateSection}
      themeMode={themeMode}
      onChangeTheme={onChangeTheme}
      onSignOut={onSignOut}
      isDbConnected={isDbConnected}
      badges={badges}
      fullBleed={isStaffOpsMapSection(section)}
    >
      {renderSection()}
    </StaffOpsLayout>
  );
}
