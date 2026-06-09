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
  buildPlatformActivityFeed,
  computePlatformStats,
  isStaffOpsMapSection,
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
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => Promise<void>;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onUpdateGuardProfile: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus?: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  initialSection?: StaffSection;
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
  isDbConnected,
  currentUser,
  onAddStaffProfile,
  themeMode,
  onChangeTheme,
  onSignOut,
  onUpdateGuardProfile,
  onSendSupportMessage,
  onUpdateSupportStatus,
  initialSection = 'overview',
}: StaffDashboardProps) {
  const [section, setSection] = useState<StaffSection>(initialSection);
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const navigateSection = (next: StaffSection) => {
    setSection(next);
    if (next !== 'guards') setSelectedGuardId(null);
    if (next !== 'clients') setSelectedClientId(null);
  };

  const showFinance = canAccessFinancialControls(currentUser);
  const showStaffOnboard = canManageStaffAccounts(currentUser);
  const canSuspend = canSuspendUsers(currentUser);

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

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return <StaffOverview stats={stats} initialFeed={activityFeed} />;
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
              setSection('guards');
            }}
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
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onResetAuditFailures={onResetAuditFailures}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onApproveGuard={onApproveGuard}
            onRejectGuard={onRejectGuard}
            onUpdateBackgroundChecked={onUpdateBackgroundChecked}
            initialSelectedId={selectedGuardId}
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
