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
  StaffRole,
  SupportTicket,
  SupportTicketStatus,
  JobChatThread,
  JobChatMessage,
  StaffMessage,
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
  hasExecutivePaymentControls,
} from '../lib/permissions';
import type { StaffSelfAuditPhotoPayload } from './staff/StaffSelfAuditPhotoUpload';
import type { StaffCreateJobInput } from './staff/StaffCreateJobForm';
import type { AddCertificationResult } from '../lib/certUniqueness';
import type { CertImageMutationResult } from '../lib/certImagePolicy';
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
  type ApprovalQueueId,
} from '../lib/staffOps';
import { StaffOpsLayout } from './staff/StaffOpsLayout';
import { StaffOverview } from './staff/StaffOverview';
import { StaffApprovals } from './staff/StaffApprovals';
import { StaffJobsPanel } from './staff/StaffJobsPanel';
import { StaffGuardsPanel } from './staff/StaffGuardsPanel';
import type { StaffAddGuardInput } from './staff/StaffAddGuardForm';
import type { StaffAddClientInput } from './staff/StaffAddClientForm';
import { StaffTeamPanel } from './staff/StaffTeamPanel';
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffSupportPanel } from './staff/StaffSupportPanel';
import { StaffMessagesHub } from './staff/StaffMessagesHub';
import { openTicketCount } from '../lib/support';
import { activeJobChatCount } from '../lib/jobChat';
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
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  staffMessages?: StaffMessage[];
  payments?: Payment[];
  guardPayoutInvoices?: GuardPayoutInvoice[];
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveClient: (clientId: string) => Promise<void>;
  onRejectClient: (clientId: string) => Promise<void>;
  onApproveGuardAccount?: (guardId: string) => Promise<void>;
  onApproveAllReadyGuardAccounts?: () => Promise<void>;
  onDeleteGuardAccount?: (guardId: string) => Promise<void>;
  onDeleteClientAccount?: (clientId: string) => Promise<void>;
  onSubmitGuardIdentityVerification?: (
    guardId: string,
    payload: import('./profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveGuardIdentityVerification?: (guardId: string) => Promise<void>;
  onRejectGuardIdentityVerification?: (guardId: string, reason?: string) => Promise<void>;
  onRequestGuardIdResubmit?: (
    guardId: string,
    slots: import('../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => Promise<void>;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('./profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
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
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onDepositCashToStripe?: (requestId: string) => Promise<void>;
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  onAddStaffProfile: (
    name: string,
    email: string,
    badgeNumber: string,
    staffRole: StaffRole
  ) => Promise<string>;
  onUpdateStaffRole: (
    staffId: string,
    staffRole: StaffRole
  ) => Promise<void>;
  onAddGuardProfile: (input: StaffAddGuardInput) => Promise<string>;
  onAddClientProfile: (input: StaffAddClientInput) => Promise<string>;
  onStaffCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
  onStaffAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onUploadSelfAuditPhotos?: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
  onUploadSpotCheck?: (requestId: string, imageUrl: string) => void | Promise<void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  onUpdateGuardProfile: (guardId: string, payload: ProfileSavePayload) => void | Promise<void>;
  onAddCertification?: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (guardId: string, certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (
    guardId: string,
    certId: string,
    imageUrl: string
  ) => Promise<CertImageMutationResult>;
  onAddExperience?: (guardId: string, exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (guardId: string, edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus?: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onSendStaffMessage?: (body: string) => void | Promise<void>;
  onRefreshStaffMessages?: () => void | Promise<void>;
  onSendJobChat?: (requestId: string, body: string) => void | Promise<void>;
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  initialSection?: StaffSection;
  /** Controlled section — when set, parent owns navigation state (URL sync). */
  section?: StaffSection;
  onSectionChange?: (section: StaffSection) => void;
  selectedGuardId?: string | null;
  onSelectedGuardIdChange?: (id: string | null) => void;
  selectedClientId?: string | null;
  onSelectedClientIdChange?: (id: string | null) => void;
  selectedJobId?: string | null;
  onSelectedJobIdChange?: (id: string | null) => void;
  selectedTeamId?: string | null;
  onSelectedTeamIdChange?: (id: string | null) => void;
  staffGuardEdit?: boolean;
  onStaffGuardEditChange?: (editing: boolean) => void;
  selectedSupportTicketId?: string | null;
  onSelectedSupportTicketIdChange?: (id: string | null) => void;
  staffMessageTab?: 'team' | 'jobs';
  onStaffMessageTabChange?: (tab: 'team' | 'jobs') => void;
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (id: string | null) => void;
  staffApprovalQueue?: ApprovalQueueId | null;
  onOpenStaffApprovals?: (queue?: ApprovalQueueId | null) => void;
  onClearStaffApprovalQueue?: () => void;
  onUpdateStaffApprovalQueue?: (queue: ApprovalQueueId | null) => void;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  supportTickets = [],
  jobChatThreads = [],
  jobChatMessages = [],
  staffMessages = [],
  payments = [],
  guardPayoutInvoices = [],
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveClient,
  onRejectClient,
  onApproveGuardAccount,
  onApproveAllReadyGuardAccounts,
  onDeleteGuardAccount,
  onDeleteClientAccount,
  onSubmitGuardIdentityVerification,
  onApproveGuardIdentityVerification,
  onRejectGuardIdentityVerification,
  onRequestGuardIdResubmit,
  onRequestCertImageResubmit,
  onUpdateGuardIdImages,
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
  onMarkPlatformFeePaidCash,
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
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onAddExperience,
  onAddEducation,
  onSendSupportMessage,
  onUpdateSupportStatus,
  onSendStaffMessage,
  onRefreshStaffMessages,
  onSendJobChat,
  initialSection = 'overview',
  section: controlledSection,
  onSectionChange,
  selectedGuardId: controlledGuardId,
  onSelectedGuardIdChange,
  selectedClientId: controlledClientId,
  onSelectedClientIdChange,
  selectedJobId: controlledJobId,
  onSelectedJobIdChange,
  selectedTeamId: controlledTeamId,
  onSelectedTeamIdChange,
  staffGuardEdit: controlledStaffGuardEdit,
  onStaffGuardEditChange,
  selectedSupportTicketId,
  onSelectedSupportTicketIdChange,
  staffMessageTab = 'team',
  onStaffMessageTabChange,
  selectedJobChatRequestId,
  onSelectedJobChatRequestIdChange,
  staffApprovalQueue = null,
  onOpenStaffApprovals,
  onClearStaffApprovalQueue,
  onUpdateStaffApprovalQueue,
  onOpenLegal,
}: StaffDashboardProps) {
  const isControlled = controlledSection !== undefined;
  const [internalSection, setInternalSection] = useState<StaffSection>(controlledSection ?? initialSection);
  const section = isControlled ? controlledSection : internalSection;
  const [internalGuardId, setInternalGuardId] = useState<string | null>(null);
  const [internalClientId, setInternalClientId] = useState<string | null>(null);
  const [internalJobId, setInternalJobId] = useState<string | null>(null);
  const [internalTeamId, setInternalTeamId] = useState<string | null>(null);

  const selectedGuardId = controlledGuardId !== undefined ? controlledGuardId : internalGuardId;
  const selectedClientId = controlledClientId !== undefined ? controlledClientId : internalClientId;
  const selectedJobId = controlledJobId !== undefined ? controlledJobId : internalJobId;
  const selectedTeamId = controlledTeamId !== undefined ? controlledTeamId : internalTeamId;

  const setSelectedGuardId = (id: string | null) => {
    if (controlledGuardId === undefined) setInternalGuardId(id);
    onSelectedGuardIdChange?.(id);
  };
  const setSelectedClientId = (id: string | null) => {
    if (controlledClientId === undefined) setInternalClientId(id);
    onSelectedClientIdChange?.(id);
  };
  const setSelectedJobId = (id: string | null) => {
    if (controlledJobId === undefined) setInternalJobId(id);
    onSelectedJobIdChange?.(id);
  };
  const setSelectedTeamId = (id: string | null) => {
    if (controlledTeamId === undefined) setInternalTeamId(id);
    onSelectedTeamIdChange?.(id);
  };

  const openJob = (jobId: string) => {
    setSelectedJobId(jobId);
    navigateSection('jobs');
  };

  const navigateToApprovals = (queue?: ApprovalQueueId) => {
    onOpenStaffApprovals?.(queue ?? null);
  };

  const navigateSection = (next: StaffSection) => {
    if (next === 'approvals') {
      onOpenStaffApprovals?.(null);
      return;
    }
    onClearStaffApprovalQueue?.();
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
    () => {
      const items = buildOverviewActionQueue(stats, requests, incidents, openTicketCount(supportTickets), guards, clients);
      return showFinance ? items : items.filter((item) => item.section !== 'payments');
    },
    [stats, requests, incidents, supportTickets, guards, clients, showFinance]
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
      messages: activeJobChatCount(jobChatThreads),
      payments: openPayoutInvoices,
    }),
    [stats, requests, incidents, disputes, supportTickets, jobChatThreads, openPayoutInvoices]
  );

  const renderSection = () => {
    switch (section) {
      case 'overview':
        return (
          <StaffOverview
            stats={stats}
            requests={requests}
            guards={guards}
            clients={clients}
            activityFeed={activityFeed}
            actionItems={overviewActions}
            liveJobs={overviewLiveJobs}
            weeklyTrend={overviewWeeklyTrend}
            onNavigate={navigateSection}
            onNavigateApprovals={navigateToApprovals}
            onOpenJob={openJob}
            canUpdateJobs={canStaffJobs}
            staffName={currentUser.name}
            showDirectorFinancials={hasExecutivePaymentControls(currentUser)}
          />
        );
      case 'map':
        return <StaffOpsMapScreen requests={requests} />;
      case 'approvals':
        return (
          <StaffApprovals
            requests={requests}
            guards={guards}
            clients={clients}
            onApproveRequest={onApproveRequest}
            onDenyRequest={onDenyRequest}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onApproveGuardApplication={onApproveGuardApplication}
            onApproveClient={onApproveClient}
            onApproveGuardAccount={onApproveGuardAccount}
            onApproveAllReadyGuardAccounts={onApproveAllReadyGuardAccounts}
            onApproveIdentityVerification={onApproveGuardIdentityVerification}
            onRejectIdentityVerification={onRejectGuardIdentityVerification}
            onRequestIdentityResubmit={onRequestGuardIdResubmit}
            onRequestCertImageResubmit={onRequestCertImageResubmit}
            onUpdateGuardIdImages={onUpdateGuardIdImages}
            canEditJobListing={canEditJobListing}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            staffRole={currentUser.role}
            initialQueue={staffApprovalQueue}
            onQueueChange={(queue) => onUpdateStaffApprovalQueue?.(queue ?? null)}
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
            selectedId={selectedJobId}
            onSelectedIdChange={setSelectedJobId}
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
            onUpdateProfile={canManageGuardAccounts ? onUpdateGuardProfile : undefined}
            onAddCertification={canManageGuardAccounts ? onAddCertification : undefined}
            onDeleteCertification={canManageGuardAccounts ? onDeleteCertification : undefined}
            onAttachCertificationImage={canManageGuardAccounts ? onAttachCertificationImage : undefined}
            onAddExperience={canManageGuardAccounts ? onAddExperience : undefined}
            onAddEducation={canManageGuardAccounts ? onAddEducation : undefined}
            onApproveGuardAccount={canManageGuardAccounts ? onApproveGuardAccount : undefined}
            onDeleteGuard={canManageGuardAccounts ? onDeleteGuardAccount : undefined}
            onSubmitIdentityVerification={canManageGuardAccounts ? onSubmitGuardIdentityVerification : undefined}
            onApproveIdentityVerification={canManageGuardAccounts ? onApproveGuardIdentityVerification : undefined}
            onRejectIdentityVerification={canManageGuardAccounts ? onRejectGuardIdentityVerification : undefined}
            onRequestIdentityResubmit={canManageGuardAccounts ? onRequestGuardIdResubmit : undefined}
            onRequestCertImageResubmit={canManageGuardAccounts ? onRequestCertImageResubmit : undefined}
            onUpdateGuardIdImages={canManageGuardAccounts ? onUpdateGuardIdImages : undefined}
            selectedId={selectedGuardId}
            onSelectedIdChange={setSelectedGuardId}
            staffEdit={controlledStaffGuardEdit}
            onStaffEditChange={onStaffGuardEditChange}
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
            currentUserRole={currentUser.role}
            canManageStaff={canManageStaff}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onAddStaff={
              canManageStaff
                ? (input) =>
                    onAddStaffProfile(input.name, input.email, input.badgeNumber, input.staffRole)
                : undefined
            }
            onUpdateStaffRole={canManageStaff ? onUpdateStaffRole : undefined}
            selectedId={selectedTeamId}
            onSelectedIdChange={setSelectedTeamId}
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
            onDeleteClient={canManageClientAccounts ? onDeleteClientAccount : undefined}
            selectedId={selectedClientId}
            onSelectedIdChange={setSelectedClientId}
            initialSelectedId={selectedClientId}
            onOpenJob={openJob}
            onAddClient={canManageClientAccounts ? onAddClientProfile : undefined}
          />
        );
      case 'incidents':
        return <StaffIncidentsPanel incidents={incidents} onOpenJob={openJob} />;
      case 'support':
        return onSendSupportMessage && onUpdateSupportStatus ? (
          <StaffSupportPanel
            tickets={supportTickets}
            onSendMessage={onSendSupportMessage}
            onUpdateStatus={onUpdateSupportStatus}
            selectedTicketId={selectedSupportTicketId}
            onSelectedTicketIdChange={onSelectedSupportTicketIdChange}
            initialSelectedTicketId={selectedSupportTicketId}
          />
        ) : null;
      case 'messages':
        return onSendStaffMessage && onSendJobChat ? (
          <StaffMessagesHub
            requests={requests}
            guards={guards}
            jobChatThreads={jobChatThreads}
            jobChatMessages={jobChatMessages}
            staffMessages={staffMessages}
            currentUser={currentUser}
            onSendStaffMessage={onSendStaffMessage}
            onRefreshStaffMessages={onRefreshStaffMessages}
            onSendJobChat={onSendJobChat}
            initialTab={staffMessageTab}
            onTabChange={onStaffMessageTabChange}
            selectedJobChatRequestId={selectedJobChatRequestId}
            onSelectedJobChatRequestIdChange={onSelectedJobChatRequestIdChange}
          />
        ) : null;
      case 'payments':
        return showFinance ? (
          <StaffPaymentsPanel
            requests={requests}
            guards={guards}
            payments={payments}
            payoutInvoices={guardPayoutInvoices}
            isDirector={hasExecutivePaymentControls(currentUser)}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onMarkPlatformFeePaidCash={onMarkPlatformFeePaidCash}
            onDepositCashToStripe={onDepositCashToStripe}
            onCompletePayoutInvoice={onCompletePayoutInvoice}
          />
        ) : (
          <div className="app-screen animate-fade-in max-w-lg">
            <h2 className="app-screen-title">Payments</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mt-2">
              Financial controls are limited to Director and Administrator roles. If money is owed on
              jobs, ask your Director to review the Payments section.
            </p>
          </div>
        );
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
            onOpenLegal={onOpenLegal}
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
      onOpenLegal={onOpenLegal}
    >
      {renderSection()}
    </StaffOpsLayout>
  );
}
