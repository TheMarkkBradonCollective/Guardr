import React, { useMemo, useState } from 'react';
import {
  Certification,
  Client,
  CreateSupportTicketInput,
  Experience,
  GuardEducation,
  GuardPayoutInvoice,
  Payment,
  SecurityGuard,
  SecurityRequest,
  SessionUser,
  SupportTicket,
  SupportTicketStatus,
} from '../types';
import {
  canAccessFinancialControls,
  canEditJobListingDetails,
  canManageClients,
  canManageCompanyOperations,
  canManageGuards,
  canManageStaffAccounts,
  canSuspendUsers,
  canStaffManageJobs,
  canUploadJobSelfAuditPhotos,
  canUploadJobSpotCheck,
} from '../lib/permissions';
import type { StaffSelfAuditPhotoPayload } from './staff/StaffSelfAuditPhotoUpload';
import type { StaffCreateJobInput } from './staff/StaffCreateJobForm';
import {
  buildDisputes,
  buildIncidents,
  buildOverviewActionQueue,
  buildOverviewLiveJobs,
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
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
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
  guardPayoutInvoices?: GuardPayoutInvoice[];
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveClient: (clientId: string) => Promise<void>;
  onRejectClient: (clientId: string) => Promise<void>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void | Promise<void>;
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
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (
    name: string,
    email: string,
    badgeNumber: string,
    staffRole: 'Director' | 'Administrator' | 'Moderator'
  ) => Promise<string>;
  onUpdateStaffRole: (
    staffId: string,
    staffRole: 'Director' | 'Administrator' | 'Moderator'
  ) => Promise<void>;
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
  onStaffCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
  onStaffAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onUploadSelfAuditPhotos?: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
  onUploadSpotCheck?: (requestId: string, imageUrl: string) => void | Promise<void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
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
  guardPayoutInvoices = [],
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveClient,
  onRejectClient,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onApproveGuard,
  onRejectGuard,
  onUpdateBackgroundChecked,
  onResetAuditFailures,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkGuardPaidCash,
  onDepositCashToStripe,
  onCompletePayoutInvoice,
  isDbConnected,
  currentUser,
  onAddStaffProfile,
  onUpdateStaffRole,
  onAddGuardProfile,
  onAddClientProfile,
  onStaffCreateJob,
  onStaffAssignGuard,
  onUploadSelfAuditPhotos,
  onUploadSpotCheck,
  onEditJobListing,
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
  const canManageStaff = canManageStaffAccounts(currentUser);
  const canManageGuardAccounts = canManageGuards(currentUser);
  const canManageClientAccounts = canManageClients(currentUser);
  const canManageJobs = canManageCompanyOperations(currentUser);
  const canUploadSelfAuditPhotos = canUploadJobSelfAuditPhotos(currentUser);
  const canUploadSpotCheck = canUploadJobSpotCheck(currentUser);
  const canEditJobListing = canEditJobListingDetails(currentUser);
  const canStaffJobs = canStaffManageJobs(currentUser);
  const canSuspend = canSuspendUsers(currentUser);

  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const activityFeed = useMemo(() => buildPlatformActivityFeed(guards, clients, requests), [guards, clients, requests]);
  const incidents = useMemo(() => buildIncidents(requests, guards), [requests, guards]);
  const disputes = useMemo(() => buildDisputes(requests, guards), [requests, guards]);
  const overviewActions = useMemo(
    () => buildOverviewActionQueue(stats, requests, incidents, openTicketCount(supportTickets)),
    [stats, requests, incidents, supportTickets]
  );
  const overviewLiveJobs = useMemo(() => buildOverviewLiveJobs(guards, requests), [guards, requests]);
  const overviewWeeklyTrend = useMemo(() => computeWeeklyCompletedJobs(requests), [requests]);

  const openPayoutInvoices = useMemo(
    () => openGuardPayoutInvoices(guardPayoutInvoices).length,
    [guardPayoutInvoices]
  );

  const badges = useMemo(
    () => ({
      approvals: stats.pendingApprovals,
      jobs: requests.filter((r) => ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)).length,
      incidents: incidents.filter((i) => i.status !== 'resolved').length,
      disputes: disputes.filter((d) => d.status === 'open').length,
      support: openTicketCount(supportTickets),
      payments: openPayoutInvoices,
    }),
    [stats, requests, incidents, disputes, supportTickets, openPayoutInvoices]
  );

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return (
          <StaffOverview
            stats={stats}
            requests={requests}
            activityFeed={activityFeed}
            actionItems={overviewActions}
            liveJobs={overviewLiveJobs}
            weeklyTrend={overviewWeeklyTrend}
            onNavigate={navigateSection}
            onOpenJob={openJob}
            canUpdateJobs={canStaffJobs}
            staffName={currentUser.name}
          />
        );
      case 'map':
        return <StaffOpsMapScreen requests={requests} />;
      case 'approvals':
        return (
          <StaffApprovals
            requests={requests}
            guards={guards}
            onApproveRequest={onApproveRequest}
            onDenyRequest={onDenyRequest}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onApproveGuardApplication={onApproveGuardApplication}
            canEditJobListing={canEditJobListing}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            staffRole={currentUser.role}
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
            clients={clients}
            canManageJobs={canManageJobs}
            canUploadSelfAuditPhotos={canUploadSelfAuditPhotos}
            canUploadSpotCheck={canUploadSpotCheck}
            canEditJobListing={canEditJobListing}
            onApproveRequest={onApproveRequest}
            onDenyRequest={onDenyRequest}
            onCreateJob={canManageJobs ? onStaffCreateJob : undefined}
            onAssignGuard={canManageJobs ? onStaffAssignGuard : undefined}
            onUploadSelfAuditPhotos={canUploadSelfAuditPhotos ? onUploadSelfAuditPhotos : undefined}
            onUploadSpotCheck={canUploadSpotCheck ? onUploadSpotCheck : undefined}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            onApproveGuardApplication={onApproveGuardApplication}
            initialSelectedId={selectedJobId}
            staffRole={currentUser.role}
          />
        );
      case 'guards':
        return (
          <StaffGuardsPanel
            guards={guards}
            requests={requests}
            canManage={canManageGuardAccounts}
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
            onAddGuard={canManageGuardAccounts ? onAddGuardProfile : undefined}
          />
        );
      case 'team':
        return (
          <StaffTeamPanel
            guards={guards}
            currentUserId={currentUser.id}
            canManageStaff={canManageStaff}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onAddStaff={
              canManageStaff
                ? (input) =>
                    onAddStaffProfile(input.name, input.email, input.badgeNumber, input.staffRole)
                : undefined
            }
            onUpdateStaffRole={canManageStaff ? onUpdateStaffRole : undefined}
            initialSelectedId={selectedTeamId}
          />
        );
      case 'clients':
        return (
          <StaffClientsPanel
            clients={clients}
            requests={requests}
            canManage={canManageClientAccounts}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            initialSelectedId={selectedClientId}
            onOpenJob={openJob}
            onAddClient={canManageClientAccounts ? onAddClientProfile : undefined}
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
            payoutInvoices={guardPayoutInvoices}
            isDirector={currentUser.role === 'director'}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onDepositCashToStripe={onDepositCashToStripe}
            onCompletePayoutInvoice={onCompletePayoutInvoice}
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
            showStaffOnboard={canManageStaff}
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
