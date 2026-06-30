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
  TeamChatThread,
  TeamChatMessage,
} from '../types';
import {
  canAccessFinancialControls,
  canAccessStaffSettings,
  canEditJobListingDetails,
  canHandleDisputes,
  canManageClients,
  canManageCompanyOperations,
  canManageGuards,
  canApproveGuards,
  canActivateGuardAccounts,
  canVerifyCredentials,
  canManageStaffAccounts,
  canReviewJobRequests,
  canSuspendUsers,
  canStaffManageJobs,
  canUploadJobSelfAuditPhotos,
  canUploadJobSpotCheck,
  hasExecutivePaymentControls,
  canSetTrustedStatus,
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
  isStaffMessagesSection,
  StaffSection,
  type ApprovalQueueId,
} from '../lib/staffOps';
import { buildIncidentReportViews } from '../lib/incidentReports';
import { StaffOpsLayout } from './staff/StaffOpsLayout';
import { AppPageTransition } from './ui/motion/AppMotion';
import { StaffOverview } from './staff/StaffOverview';
import { StaffApprovals } from './staff/StaffApprovals';
import { StaffJobsPanel } from './staff/StaffJobsPanel';
import { StaffGuardsPanel } from './staff/StaffGuardsPanel';
import type { StaffAddGuardInput } from './staff/StaffAddGuardForm';
import type { StaffAddClientInput } from './staff/StaffAddClientForm';
import { StaffTeamPanel } from './staff/StaffTeamPanel';
import { StaffGuardCrewsPanel } from './staff/StaffGuardCrewsPanel';
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffMessagesPanel } from './staff/StaffMessagesPanel';
import { openTicketCount } from '../lib/support';
import { staffMessagesBadge } from '../lib/messagesInbox';
import { countStaffCrewsNeedingReview } from '../lib/guardTeams';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import type { PlatformSettings } from '../lib/platformSettings';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { StaffAnalyticsPanel } from './staff/StaffAnalyticsPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { AppGuidePage } from './docs/AppGuidePage';
import { DevNotesPage } from './docs/DevNotesPage';
import { StaffOpsMapScreen } from './staff/StaffOpsMapScreen';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { UserSettingsScreen } from './profile/UserSettingsScreen';

type ThemeMode = 'dark' | 'light' | 'grey';

export interface StaffSectionSelection {
  guardId?: string | null;
  clientId?: string | null;
  jobId?: string | null;
  teamId?: string | null;
}

interface StaffDashboardProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  supportTickets?: SupportTicket[];
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  staffMessages?: StaffMessage[];
  guardMessages?: import('../types').GuardMessage[];
  payments?: Payment[];
  guardPayoutInvoices?: GuardPayoutInvoice[];
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChangeBilling?: (requestId: string) => void | Promise<void>;
  onApproveClient: (clientId: string) => Promise<void>;
  onRejectClient: (clientId: string) => Promise<void>;
  onApproveGuardAccount?: (guardId: string) => Promise<void>;
  onActivateGuardAccount?: (
    guardId: string,
    options?: import('../lib/guardMissingCredentials').ActivateGuardAccountOptions
  ) => Promise<void>;
  onSetGuardTrusted?: (guardId: string, trusted: boolean) => Promise<void>;
  onSetClientTrusted?: (clientId: string, trusted: boolean) => Promise<void>;
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
  onReviewGuardInsurance?: (
    guardId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('./profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onApproveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onRemoveCrewMember?: (requestId: string, guardId: string) => void | Promise<void>;
  onUpdateBackgroundChecked: (guardId: string, checked: boolean) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onResetAuditFailures?: (guardId: string) => void;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
  onMarkClientPaidCash?: (requestId: string) => Promise<void>;
  onMarkOvertimePaidCash?: (requestId: string) => Promise<void>;
  onResolveOvertimeDispute?: (
    requestId: string,
    action: 'waive' | 'uphold' | 'adjust',
    options?: { adjustedHours?: number; resolutionNote?: string }
  ) => Promise<void>;
  onApproveOvertimeCashPayment?: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onMarkOvertimeGuardPaidCash?: (requestId: string) => Promise<void>;
  onApproveClientCashPayment?: (requestId: string) => Promise<void>;
  onRejectClientCashPayment?: (requestId: string) => Promise<void>;
  onMarkGuardPaidCash?: (requestId: string) => Promise<void>;
  onMarkPlatformFeePaidCash?: (requestId: string) => Promise<void>;
  onMarkCashDepositManually?: (requestId: string) => Promise<void>;
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
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
  onUpdateCertification?: (
    guardId: string,
    certId: string,
    payload: import('./credentials/CertDetailModal').CertUpdatePayload
  ) => Promise<import('./credentials/CertDetailModal').CertUpdateResult>;
  onAddExperience?: (guardId: string, exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (guardId: string, edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  onUpdateSupportStatus?: (ticketId: string, status: SupportTicketStatus) => void | Promise<void>;
  onDeleteSupportTicket?: (ticketId: string) => void | Promise<void>;
  onResolveDispute?: (
    dispute: import('../lib/staffOps').OpsDispute,
    action: import('../lib/staffOps').DisputeResolutionAction
  ) => void | Promise<void>;
  onSendStaffMessage?: (body: string) => void | Promise<void>;
  onRefreshStaffMessages?: () => void | Promise<void>;
  onSendJobChat?: (requestId: string, body: string) => void | Promise<void>;
  onSendTeamChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onCreateSupportTicket?: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  initialSection?: StaffSection;
  /** Controlled section — when set, parent owns navigation state (URL sync). */
  section?: StaffSection;
  onSectionChange?: (section: StaffSection, selection?: StaffSectionSelection) => void;
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
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (id: string | null) => void;
  staffApprovalQueue?: ApprovalQueueId | null;
  onOpenStaffApprovals?: (queue?: ApprovalQueueId | null) => void;
  onClearStaffApprovalQueue?: () => void;
  onUpdateStaffApprovalQueue?: (queue: ApprovalQueueId | null) => void;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
  legalAcceptances?: import('../lib/legalAcceptance').LegalAcceptanceRecord[];
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  supportTickets = [],
  jobChatThreads = [],
  jobChatMessages = [],
  teamChatThreads = [],
  teamChatMessages = [],
  staffMessages = [],
  guardMessages = [],
  payments = [],
  guardPayoutInvoices = [],
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApproveScheduleChangeBilling,
  onApproveClient,
  onRejectClient,
  onApproveGuardAccount,
  onActivateGuardAccount,
  onSetGuardTrusted,
  onSetClientTrusted,
  onDeleteGuardAccount,
  onDeleteClientAccount,
  onSubmitGuardIdentityVerification,
  onApproveGuardIdentityVerification,
  onRejectGuardIdentityVerification,
  onRequestGuardIdResubmit,
  onRequestCertImageResubmit,
  onReviewGuardInsurance,
  onUpdateGuardIdImages,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onApproveCrewMember,
  onDenyCrewMember,
  onRemoveCrewMember,
  onUpdateBackgroundChecked,
  onResetAuditFailures,
  onMakeGuardPayoutAvailable,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkOvertimePaidCash,
  onResolveOvertimeDispute,
  onApproveOvertimeCashPayment,
  onMakeOvertimeGuardPayoutAvailable,
  onMarkOvertimeGuardPaidCash,
  onApproveClientCashPayment,
  onRejectClientCashPayment,
  onMarkGuardPaidCash,
  onMarkPlatformFeePaidCash,
  onMarkCashDepositManually,
  onCompletePayoutInvoice,
  isDbConnected,
  currentUser,
  platformSettings,
  onUpdatePlatformSettings,
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
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onSendSupportMessage,
  onUpdateSupportStatus,
  onDeleteSupportTicket,
  onResolveDispute,
  onSendStaffMessage,
  onRefreshStaffMessages,
  onSendJobChat,
  onSendTeamChatMessage,
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
  selectedJobChatRequestId,
  onSelectedJobChatRequestIdChange,
  staffApprovalQueue = null,
  onOpenStaffApprovals,
  onClearStaffApprovalQueue,
  onUpdateStaffApprovalQueue,
  onOpenLegal,
  legalAcceptances = [],
}: StaffDashboardProps) {
  const isControlled = controlledSection !== undefined;
  const [internalSection, setInternalSection] = useState<StaffSection>(controlledSection ?? initialSection);
  const section = isControlled ? controlledSection : internalSection;
  const [internalGuardId, setInternalGuardId] = useState<string | null>(null);
  const [internalClientId, setInternalClientId] = useState<string | null>(null);
  const [internalJobId, setInternalJobId] = useState<string | null>(null);
  const [internalTeamId, setInternalTeamId] = useState<string | null>(null);
  const [internalCrewJobId, setInternalCrewJobId] = useState<string | null>(null);

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
    navigateSection('jobs', { jobId });
  };

  const navigateToApprovals = (queue?: ApprovalQueueId) => {
    onOpenStaffApprovals?.(queue ?? null);
  };

  const navigateSection = (next: StaffSection, selection: StaffSectionSelection = {}) => {
    if (next === 'approvals') {
      onOpenStaffApprovals?.(null);
      return;
    }
    onClearStaffApprovalQueue?.();
    if (!isControlled) setInternalSection(next);
    const nextGuardId = next === 'guards'
      ? selection.guardId !== undefined ? selection.guardId : selectedGuardId
      : null;
    const nextTeamId = next === 'team'
      ? selection.teamId !== undefined ? selection.teamId : selectedTeamId
      : null;
    const nextClientId = next === 'clients'
      ? selection.clientId !== undefined ? selection.clientId : selectedClientId
      : null;
    const nextJobId = next === 'jobs'
      ? selection.jobId !== undefined ? selection.jobId : selectedJobId
      : null;

    setSelectedGuardId(nextGuardId ?? null);
    setSelectedTeamId(nextTeamId ?? null);
    setSelectedClientId(nextClientId ?? null);
    setSelectedJobId(nextJobId ?? null);
    if (next !== 'crews') setInternalCrewJobId(null);
    onSectionChange?.(next, {
      guardId: nextGuardId ?? null,
      teamId: nextTeamId ?? null,
      clientId: nextClientId ?? null,
      jobId: nextJobId ?? null,
    });
  };

  const showFinance = canAccessFinancialControls(currentUser);
  const showSettings = canAccessStaffSettings(currentUser);
  const canManageStaff = canManageStaffAccounts(currentUser);
  const canApproveGuardAccounts = canApproveGuards(currentUser);
  const canActivateApprovedGuards = canActivateGuardAccounts(currentUser);
  const canVerifyGuardCredentials = canVerifyCredentials(currentUser);
  const canManageGuardAccounts = canManageGuards(currentUser);
  const canManageClientAccounts = canManageClients(currentUser);
  const canTrust = canSetTrustedStatus(currentUser);
  const canReviewJobs = canReviewJobRequests(currentUser);
  const canResolveDisputes = canHandleDisputes(currentUser);
  const canManageJobs = canManageCompanyOperations(currentUser);
  const canUploadSelfAuditPhotos = canUploadJobSelfAuditPhotos(currentUser);
  const canUploadSpotCheck = canUploadJobSpotCheck(currentUser);
  const canEditJobListing = canEditJobListingDetails(currentUser);
  const canStaffJobs = canStaffManageJobs(currentUser);
  const canSuspend = canSuspendUsers(currentUser);

  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const activityFeed = useMemo(() => buildPlatformActivityFeed(guards, clients, requests), [guards, clients, requests]);
  const incidents = useMemo(() => buildIncidents(requests, guards), [requests, guards]);
  const incidentDetails = useMemo(() => buildIncidentReportViews(requests, guards), [requests, guards]);
  const disputes = useMemo(() => buildDisputes(requests, guards, supportTickets), [requests, guards, supportTickets]);
  const overviewActions = useMemo(
    () => buildOverviewActionQueue(stats, requests, incidents, openTicketCount(supportTickets), guards, clients),
    [stats, requests, incidents, supportTickets, guards, clients]
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
      messages: staffMessagesBadge(jobChatThreads, supportTickets),
      payments: openPayoutInvoices,
      crews: countStaffCrewsNeedingReview(requests),
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
            staffRole={currentUser.role}
          />
        );
      case 'map':
        return (
          <StaffOpsMapScreen
            requests={requests}
            guards={guards}
            canManageJobs={canManageJobs}
            canUploadSelfAuditPhotos={canUploadSelfAuditPhotos}
            canUploadSpotCheck={canUploadSpotCheck}
            canEditJobListing={canEditJobListing}
            staffRole={currentUser.role}
            onApproveRequest={canReviewJobs ? onApproveRequest : async () => {}}
            onDenyRequest={canReviewJobs ? onDenyRequest : async () => {}}
            onAssignGuard={canManageJobs ? onStaffAssignGuard : undefined}
            onUploadSelfAuditPhotos={canUploadSelfAuditPhotos ? onUploadSelfAuditPhotos : undefined}
            onUploadSpotCheck={canUploadSpotCheck ? onUploadSpotCheck : undefined}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            onApproveGuardApplication={canReviewJobs ? onApproveGuardApplication : undefined}
            onDenyGuardApplication={canReviewJobs ? onDenyGuardApplication : undefined}
          />
        );
      case 'approvals':
        return (
          <StaffApprovals
            requests={requests}
            guards={guards}
            clients={clients}
            onApproveRequest={canReviewJobs ? onApproveRequest : async () => {}}
            onDenyRequest={canReviewJobs ? onDenyRequest : async () => {}}
            onApproveScheduleChange={canReviewJobs ? onApproveScheduleChange : undefined}
            onRejectScheduleChange={canReviewJobs ? onRejectScheduleChange : undefined}
            onApproveScheduleChangeBilling={canReviewJobs ? onApproveScheduleChangeBilling : undefined}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onApproveGuardApplication={canReviewJobs ? onApproveGuardApplication : async () => {}}
            onDenyGuardApplication={canReviewJobs ? onDenyGuardApplication : undefined}
            onApproveClient={canManageClientAccounts ? onApproveClient : undefined}
            onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
            onActivateGuardAccount={canActivateApprovedGuards ? onActivateGuardAccount : undefined}
            canActivateGuardAccounts={canActivateApprovedGuards}
            onApproveIdentityVerification={canVerifyGuardCredentials ? onApproveGuardIdentityVerification : undefined}
            onRejectIdentityVerification={canVerifyGuardCredentials ? onRejectGuardIdentityVerification : undefined}
            onRequestIdentityResubmit={canVerifyGuardCredentials ? onRequestGuardIdResubmit : undefined}
            onRequestCertImageResubmit={canVerifyGuardCredentials ? onRequestCertImageResubmit : undefined}
            onReviewGuardInsurance={canVerifyGuardCredentials ? onReviewGuardInsurance : undefined}
            onUpdateGuardIdImages={canManageGuardAccounts ? onUpdateGuardIdImages : undefined}
            onAddCertification={canManageGuardAccounts ? onAddCertification : undefined}
            onDeleteCertification={canManageGuardAccounts ? onDeleteCertification : undefined}
            onAttachCertificationImage={canManageGuardAccounts ? onAttachCertificationImage : undefined}
            onUpdateCertification={canManageGuardAccounts ? onUpdateCertification : undefined}
            canApproveGuardAccounts={canApproveGuardAccounts}
            canVerifyGuardCredentials={canVerifyGuardCredentials}
            canManageGuardAccounts={canManageGuardAccounts}
            canManageClientAccounts={canManageClientAccounts}
            canReviewJobRequests={canReviewJobs}
            canEditJobListing={canEditJobListing}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            staffRole={currentUser.role}
            initialQueue={staffApprovalQueue}
            onQueueChange={(queue) => onUpdateStaffApprovalQueue?.(queue ?? null)}
            onViewGuard={(guardId) => navigateSection('guards', { guardId })}
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
            onApproveRequest={canReviewJobs ? onApproveRequest : undefined}
            onDenyRequest={canReviewJobs ? onDenyRequest : undefined}
            onCreateJob={canManageJobs ? onStaffCreateJob : undefined}
            onAssignGuard={canManageJobs ? onStaffAssignGuard : undefined}
            onUploadSelfAuditPhotos={canUploadSelfAuditPhotos ? onUploadSelfAuditPhotos : undefined}
            onUploadSpotCheck={canUploadSpotCheck ? onUploadSpotCheck : undefined}
            onEditJobListing={canEditJobListing ? onEditJobListing : undefined}
            onApproveGuardApplication={canReviewJobs ? onApproveGuardApplication : undefined}
            onDenyGuardApplication={canReviewJobs ? onDenyGuardApplication : undefined}
            selectedId={selectedJobId}
            onSelectedIdChange={setSelectedJobId}
            initialSelectedId={selectedJobId}
            staffRole={currentUser.role}
            feeConfig={platformSettings.feeConfig}
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
            onUpdateBackgroundChecked={onUpdateBackgroundChecked}
            onUpdateProfile={canManageGuardAccounts ? onUpdateGuardProfile : undefined}
            onAddCertification={canManageGuardAccounts ? onAddCertification : undefined}
            onDeleteCertification={canManageGuardAccounts ? onDeleteCertification : undefined}
            onAttachCertificationImage={canManageGuardAccounts ? onAttachCertificationImage : undefined}
            onUpdateCertification={canManageGuardAccounts ? onUpdateCertification : undefined}
            onAddExperience={canManageGuardAccounts ? onAddExperience : undefined}
            onAddEducation={canManageGuardAccounts ? onAddEducation : undefined}
            onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
            onActivateGuardAccount={canActivateApprovedGuards ? onActivateGuardAccount : undefined}
            onSetGuardTrusted={canTrust ? onSetGuardTrusted : undefined}
            onDeleteGuard={canManageGuardAccounts ? onDeleteGuardAccount : undefined}
            onSubmitIdentityVerification={canManageGuardAccounts ? onSubmitGuardIdentityVerification : undefined}
            onApproveIdentityVerification={canVerifyGuardCredentials ? onApproveGuardIdentityVerification : undefined}
            onRejectIdentityVerification={canVerifyGuardCredentials ? onRejectGuardIdentityVerification : undefined}
            onRequestIdentityResubmit={canVerifyGuardCredentials ? onRequestGuardIdResubmit : undefined}
            onRequestCertImageResubmit={canVerifyGuardCredentials ? onRequestCertImageResubmit : undefined}
            onReviewGuardInsurance={canVerifyGuardCredentials ? onReviewGuardInsurance : undefined}
            onUpdateGuardIdImages={canManageGuardAccounts ? onUpdateGuardIdImages : undefined}
            canVerifyCredentials={canVerifyGuardCredentials}
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
      case 'crews':
        return (
          <StaffGuardCrewsPanel
            requests={requests}
            guards={guards}
            canManage={canReviewJobs}
            selectedJobId={internalCrewJobId}
            onSelectedJobIdChange={setInternalCrewJobId}
            onOpenJob={openJob}
            onOpenMessages={() => navigateSection('messages')}
            onApproveCrewMember={canReviewJobs ? onApproveCrewMember : undefined}
            onDenyCrewMember={canReviewJobs ? onDenyCrewMember : undefined}
            onRemoveCrewMember={canReviewJobs ? onRemoveCrewMember : undefined}
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
            onSetClientTrusted={canTrust ? onSetClientTrusted : undefined}
            selectedId={selectedClientId}
            onSelectedIdChange={setSelectedClientId}
            initialSelectedId={selectedClientId}
            onOpenJob={openJob}
            onAddClient={canManageClientAccounts ? onAddClientProfile : undefined}
          />
        );
      case 'incidents':
        return <StaffIncidentsPanel incidents={incidents} incidentDetails={incidentDetails} onOpenJob={openJob} />;
      case 'messages':
      case 'support':
      case 'team-chat':
      case 'job-chats':
        return onSendStaffMessage && onSendJobChat && onSendTeamChatMessage && onSendSupportMessage && onUpdateSupportStatus ? (
          <div className="app-messages-hub h-full min-h-0">
            <StaffMessagesPanel
              requests={requests}
              guards={guards}
              threads={jobChatThreads}
              messages={jobChatMessages}
              teamChatThreads={teamChatThreads}
              teamChatMessages={teamChatMessages}
              staffMessages={staffMessages}
              guardMessages={guardMessages}
              supportTickets={supportTickets}
              currentUser={currentUser}
              onSendJobChat={onSendJobChat}
              onSendTeamChatMessage={onSendTeamChatMessage}
              onSendStaffMessage={onSendStaffMessage}
              onSendSupportMessage={onSendSupportMessage}
              onUpdateSupportStatus={onUpdateSupportStatus}
              onDeleteSupportTicket={onDeleteSupportTicket}
              selectedJobChatRequestId={selectedJobChatRequestId}
              onSelectedJobChatRequestIdChange={onSelectedJobChatRequestIdChange}
              selectedSupportTicketId={selectedSupportTicketId}
              onSelectedSupportTicketIdChange={onSelectedSupportTicketIdChange}
              initialJobChatRequestId={selectedJobChatRequestId}
              initialSupportTicketId={selectedSupportTicketId}
            />
          </div>
        ) : (
          <div className="app-screen animate-fade-in max-w-lg">
            <h2 className="app-screen-title">Settings</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mt-2">
              Platform settings are limited to Director and Founder roles. Ask your Director to update fees,
              payment gates, or system-wide controls.
            </p>
          </div>
        );
      case 'payments':
        return showFinance ? (
          <StaffPaymentsPanel
            requests={requests}
            guards={guards}
            payments={payments}
            payoutInvoices={guardPayoutInvoices}
            isDirector={hasExecutivePaymentControls(currentUser)}
            canManagePayments={showFinance}
            paymentGates={{
              allowCash: platformSettings.paymentCashEnabled,
              allowStripe: platformSettings.paymentStripeEnabled,
            }}
            onMakeGuardPayoutAvailable={onMakeGuardPayoutAvailable}
            onReleasePayout={onReleasePayout}
            onRefundPayment={onRefundPayment}
            onMarkClientPaidCash={onMarkClientPaidCash}
            onMarkOvertimePaidCash={onMarkOvertimePaidCash}
            onApproveOvertimeCashPayment={onApproveOvertimeCashPayment}
            onMakeOvertimeGuardPayoutAvailable={onMakeOvertimeGuardPayoutAvailable}
            onMarkOvertimeGuardPaidCash={onMarkOvertimeGuardPaidCash}
            onApproveClientCashPayment={onApproveClientCashPayment}
            onRejectClientCashPayment={onRejectClientCashPayment}
            onMarkGuardPaidCash={onMarkGuardPaidCash}
            onMarkPlatformFeePaidCash={onMarkPlatformFeePaidCash}
            onMarkCashDepositManually={onMarkCashDepositManually}
            onCompletePayoutInvoice={onCompletePayoutInvoice}
          />
        ) : (
          <div className="app-screen animate-fade-in max-w-lg">
            <h2 className="app-screen-title">Payments</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mt-2">
              Financial controls are limited to Director and Founder roles. If money is owed on
              jobs, ask your Director to review the Payments section.
            </p>
          </div>
        );
      case 'disputes':
        return canResolveDisputes ? (
          <StaffDisputesPanel
            disputes={disputes}
            onResolveDispute={onResolveDispute}
            onResolveOvertimeDispute={onResolveOvertimeDispute}
          />
        ) : (
          <div className="app-screen animate-fade-in max-w-lg">
            <h2 className="app-screen-title">Disputes</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mt-2">
              Dispute resolution is limited to Administrator roles and above. Escalate open disputes
              to your Administrator or Director.
            </p>
          </div>
        );
      case 'analytics':
        return (
          <StaffAnalyticsPanel
            guards={guards}
            clients={clients}
            requests={requests}
            showFinancials={showFinance}
          />
        );
      case 'guide':
        return <AppGuidePage audience="staff" staffRole={currentUser.role} />;
      case 'dev-updates':
        return showFinance ? (
          <DevNotesPage />
        ) : (
          <div className="app-screen animate-fade-in max-w-lg">
            <h2 className="app-screen-title">Dev notes</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed mt-2">
              Dev notes are available to Director and Founder accounts.
            </p>
          </div>
        );
      case 'settings':
        return showSettings ? (
          <StaffSettingsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={onUpdatePlatformSettings}
            showStaffOnboard={canManageStaff}
            onAddStaffProfile={onAddStaffProfile}
            guards={guards}
            clients={clients}
            legalAcceptances={legalAcceptances}
          />
        ) : null;
      case 'profile':
        return (
          <UserProfileScreen
            currentUser={currentUser}
            guard={guards.find((g) => g.id === currentUser.id) ?? null}
            onSave={(payload) => onUpdateGuardProfile(currentUser.id, payload)}
          />
        );
      case 'preferences':
        return (
          <UserSettingsScreen
            currentUser={currentUser}
            themeMode={themeMode}
            onChangeTheme={onChangeTheme}
            isDbConnected={isDbConnected}
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
      hideHeader={isStaffMessagesSection(section)}
    >
      <AppPageTransition motionKey={section} className="h-full min-h-0">
        {renderSection()}
      </AppPageTransition>
    </StaffOpsLayout>
  );
}
