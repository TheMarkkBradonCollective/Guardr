import React, { useMemo, useState, useEffect } from 'react';
import {
  Certification,
  Client,
  CreateSupportTicketInput,
  Experience,
  GuardEducation,
  GuardPayoutInvoice,
  GuardStandingCrewMember,
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
  canAccessStaffPermissions,
  canEditJobListingDetails,
  canHandleDisputes,
  canManageClients,
  canManageCompanyOperations,
  canManageGuards,
  canApproveGuards,
  canVerifyCredentials,
  canManageStaffAccounts,
  canProposeStaffAccounts,
  canApproveStaffAccounts,
  canReviewJobRequests,
  canSuspendUsers,
  canStaffManageJobs,
  hasExecutivePaymentControls,
  canSetTrustedStatus,
  canViewCityMarkets,
  isStaffRole,
} from '../lib/permissions';
import type { StaffCreateJobInput } from './staff/StaffCreateJobForm';
import type { AddCertificationResult } from '../lib/certUniqueness';
import type { CertImageMutationResult } from '../lib/certImagePolicy';
import {
  buildDisputes,
  buildIncidents,
  buildOverviewActionQueue,
  buildOverviewLiveJobs,
  buildPlatformActivityFeed,
  buildStaffShiftViolations,
  computePlatformStats,
  computeWeeklyCompletedJobs,
  countPendingCredentialReviews,
  getPendingClientAccounts,
  getPendingGuardAccounts,
  isStaffOpsMapSection,
  isStaffMessagesSection,
  StaffSection,
} from '../lib/staffOps';
import { buildIncidentReportViews } from '../lib/incidentReports';
import { StaffOpsLayout } from './staff/StaffOpsLayout';
import type { AccountMenuNotificationProps } from './layouts/AccountMenu';
import { AppPageTransition } from './ui/motion/AppMotion';
import { StaffOverview } from './staff/StaffOverview';
import { StaffApplications } from './staff/StaffApplications';
import { StaffCredentials } from './staff/StaffCredentials';
import { StaffJobsPanel } from './staff/StaffJobsPanel';
import { StaffGuardsPanel } from './staff/StaffGuardsPanel';
import type { StaffAddGuardInput } from './staff/StaffAddGuardForm';
import type { StaffAddClientInput } from './staff/StaffAddClientForm';
import { StaffTeamPanel } from './staff/StaffTeamPanel';
import { StaffGuardCrewsPanel } from './staff/StaffGuardCrewsPanel';
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffViolationsPanel } from './staff/StaffViolationsPanel';
import { StaffStatsPanel } from './staff/StaffStatsPanel';
import { StaffMessagesPanel } from './staff/StaffMessagesPanel';
import { StaffSupportPanel } from './staff/StaffSupportPanel';
import { openTicketCount } from '../lib/support';
import { staffMessagesBadge } from '../lib/messagesInbox';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../lib/messagesChrome';
import { countStaffCrewsNeedingReview } from '../lib/guardTeams';
import { countPendingCrewLeadRequests } from '../lib/guardCrewJoinRequest';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import type { PlatformSettings } from '../lib/platformSettings';
import { clientPaymentGates } from '../lib/platformSettings';
import type { PlatformCity } from '../lib/platformCities';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { StaffAnalyticsPanel } from './staff/StaffAnalyticsPanel';
import { StaffSlaDashboard } from './staff/StaffSlaDashboard';
import { StaffAuditLogPanel } from './staff/StaffAuditLogPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { StaffPermissionsPanel } from './staff/StaffPermissionsPanel';
import type { StaffPermissionsPatch } from './staff/StaffPermissionsPanel';
import { StaffIntegrationsPanel } from './staff/StaffIntegrationsPanel';
import { StaffCitiesPanel } from './staff/StaffCitiesPanel';
import { StaffPaymentSettingsPanel } from './staff/StaffPaymentSettingsPanel';
import { StaffLegalCompliancePanel } from './staff/StaffLegalCompliancePanel';
import { AppGuidePage } from './docs/AppGuidePage';
import { AppBlockedAccessScreen } from './ui/app/AppBlockedAccess';
import { STAFF_SECTION_ACCESS_MESSAGES, isStaffNavSectionAccessible } from '../lib/staffNavAccess';
import { DevNotesPage } from './docs/DevNotesPage';
import { StaffOpsMapScreen } from './staff/StaffOpsMapScreen';
import { ProfileSavePayload, UserProfileScreen } from './profile/UserProfileScreen';
import { UserSettingsScreen } from './profile/UserSettingsScreen';

import type { ThemeMode } from '../lib/platform/theme';

export interface StaffSectionSelection {
  guardId?: string | null;
  clientId?: string | null;
  jobId?: string | null;
  teamId?: string | null;
  credentialItemId?: string | null;
}

interface StaffDashboardProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  standingCrewMembers?: GuardStandingCrewMember[];
  crewJoinRequests?: import('../types').GuardCrewJoinRequest[];
  supportTickets?: SupportTicket[];
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  teamChatThreads?: TeamChatThread[];
  teamChatMessages?: TeamChatMessage[];
  staffMessages?: StaffMessage[];
  guardMessages?: import('../types').GuardMessage[];
  clientMessages?: import('../types').ClientMessage[];
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
    status: 'verified' | 'rejected' | 'pending',
    rejectionReason?: string
  ) => void | Promise<void>;
  onApproveVehicle?: (guardId: string) => void | Promise<void>;
  onRejectVehicle?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestCoiUpdate?: (guardId: string, staffNote?: string) => void | Promise<void>;
  onRequestCertUpdate?: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onRevokeGuardIdentityVerification?: (guardId: string) => void | Promise<void>;
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
  onApproveCrewLeadRequest?: (requestId: string) => void | Promise<void>;
  onDeclineCrewLeadRequest?: (requestId: string) => void | Promise<void>;
  onMakeGuardCrewLead?: (guardId: string) => void | Promise<void>;
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
  onResolveAuditViolation?: (
    requestId: string,
    violationId: string,
    action: 'uphold' | 'dismiss',
    resolutionNote?: string
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
  platformCities?: PlatformCity[];
  onUpdatePlatformCity?: (
    cityId: string,
    patch: {
      status?: import('../lib/platformCities').CityMarketStatus;
      waitlistAudience?: import('../lib/platformCities').CityWaitlistAudience;
      recommendOpen?: boolean;
    }
  ) => Promise<void>;
  onUpdateStaffCityAccess?: (
    staffId: string,
    patch: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => Promise<void>;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void | Promise<void>;
  onUpdatePublicInformation?: (
    patch: Pick<
      PlatformSettings,
      'ownerMessage' | 'directorMessage' | 'ownerMessageUpdatedAt' | 'directorMessageUpdatedAt'
    >
  ) => void | Promise<void>;
  onUpdateStaffIntegrations?: (
    patch: Partial<
      Pick<
        PlatformSettings,
        | 'paymentStripeEnabled'
        | 'paymentSquareEnabled'
        | 'smsNotificationsEnabled'
        | 'backgroundCheckProvider'
        | 'insuranceVerificationMode'
      >
    >
  ) => void | Promise<void>;
  onUpdateStaffPermissions?: (patch: StaffPermissionsPatch) => void | Promise<void>;
  onAddStaffProfile: (
    email: string,
    badgeNumber: string,
    staffRole: StaffRole,
    options?: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => Promise<string>;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onUpdateStaffRole: (
    staffId: string,
    staffRole: StaffRole
  ) => Promise<void>;
  onAddGuardProfile: (input: StaffAddGuardInput) => Promise<string>;
  onAddClientProfile: (input: StaffAddClientInput) => Promise<string>;
  onStaffCreateJob?: (input: StaffCreateJobInput) => Promise<string | void>;
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
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onSendClientMessage?: (body: string) => void | Promise<void>;
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
  selectedCredentialItemId?: string | null;
  onSelectedCredentialItemIdChange?: (id: string | null) => void;
  selectedTeamId?: string | null;
  onSelectedTeamIdChange?: (id: string | null) => void;
  staffGuardEdit?: boolean;
  onStaffGuardEditChange?: (editing: boolean) => void;
  staffGuardTab?: import('../lib/appNavigation').StaffGuardDetailTab;
  onStaffGuardTabChange?: (tab: import('../lib/appNavigation').StaffGuardDetailTab) => void;
  performanceFactorId?: import('../lib/guardPerformanceFactorDetail').PerformanceFactorId | null;
  onPerformanceFactorChange?: (
    factorId: import('../lib/guardPerformanceFactorDetail').PerformanceFactorId | null
  ) => void;
  selectedSupportTicketId?: string | null;
  onSelectedSupportTicketIdChange?: (id: string | null) => void;
  selectedJobChatRequestId?: string | null;
  onSelectedJobChatRequestIdChange?: (id: string | null) => void;
  selectedTeamChatRequestId?: string | null;
  onSelectedTeamChatRequestIdChange?: (id: string | null) => void;
  initialStaffMessagesTab?: 'team' | 'jobs' | null;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
  legalAcceptances?: import('../lib/legalAcceptance').LegalAcceptanceRecord[];
  companyPublicDocuments?: import('../lib/companyPlacard').CompanyPublicDocument[];
  onSaveCompanyPublicDocument?: (
    doc: import('../lib/companyPlacard').CompanyPublicDocument
  ) => Promise<void>;
  onSetCompanyPlacardPublicEnabled?: (enabled: boolean) => Promise<void>;
  accountNotifications?: AccountMenuNotificationProps;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  onEnterPracticeMode?: () => void;
}

export function StaffDashboard({
  guards,
  clients,
  requests,
  standingCrewMembers = [],
  crewJoinRequests = [],
  supportTickets = [],
  jobChatThreads = [],
  jobChatMessages = [],
  teamChatThreads = [],
  teamChatMessages = [],
  staffMessages = [],
  guardMessages = [],
  clientMessages = [],
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
  onApproveVehicle,
  onRejectVehicle,
  onRequestCoiUpdate,
  onRequestCertUpdate,
  onRevokeGuardIdentityVerification,
  onUpdateGuardIdImages,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onApproveCrewMember,
  onDenyCrewMember,
  onRemoveCrewMember,
  onApproveCrewLeadRequest,
  onDeclineCrewLeadRequest,
  onMakeGuardCrewLead,
  onUpdateBackgroundChecked,
  onResetAuditFailures,
  onMakeGuardPayoutAvailable,
  onReleasePayout,
  onRefundPayment,
  onMarkClientPaidCash,
  onMarkOvertimePaidCash,
  onResolveOvertimeDispute,
  onResolveAuditViolation,
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
  platformCities = [],
  onUpdatePlatformCity,
  onUpdateStaffCityAccess,
  onUpdatePlatformSettings,
  onUpdatePublicInformation,
  onUpdateStaffIntegrations,
  onUpdateStaffPermissions,
  onAddStaffProfile,
  onApproveStaffAccount,
  onRejectStaffAccount,
  onUpdateStaffRole,
  onAddGuardProfile,
  onAddClientProfile,
  onStaffCreateJob,
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
  onSendGuardMessage,
  onSendClientMessage,
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
  selectedCredentialItemId: controlledCredentialItemId,
  onSelectedCredentialItemIdChange,
  selectedTeamId: controlledTeamId,
  onSelectedTeamIdChange,
  staffGuardEdit: controlledStaffGuardEdit,
  onStaffGuardEditChange,
  staffGuardTab: controlledStaffGuardTab,
  onStaffGuardTabChange,
  performanceFactorId: controlledPerformanceFactorId,
  onPerformanceFactorChange,
  selectedSupportTicketId,
  onSelectedSupportTicketIdChange,
  selectedJobChatRequestId,
  onSelectedJobChatRequestIdChange,
  selectedTeamChatRequestId,
  onSelectedTeamChatRequestIdChange,
  initialStaffMessagesTab = null,
  onOpenLegal,
  legalAcceptances = [],
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
  accountNotifications,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  onEnterPracticeMode,
}: StaffDashboardProps) {
  const isControlled = controlledSection !== undefined;
  const [internalSection, setInternalSection] = useState<StaffSection>(controlledSection ?? initialSection);
  const section = isControlled ? controlledSection : internalSection;
  const [internalGuardId, setInternalGuardId] = useState<string | null>(null);
  const [internalClientId, setInternalClientId] = useState<string | null>(null);
  const [internalJobId, setInternalJobId] = useState<string | null>(null);
  const [internalTeamId, setInternalTeamId] = useState<string | null>(null);
  const [internalCredentialItemId, setInternalCredentialItemId] = useState<string | null>(null);
  const [internalCrewJobId, setInternalCrewJobId] = useState<string | null>(null);
  const [staffMessagesChrome, setStaffMessagesChrome] = useState<MessagesChrome>(EMPTY_MESSAGES_CHROME);

  useEffect(() => {
    if (!isStaffMessagesSection(section)) {
      setStaffMessagesChrome(EMPTY_MESSAGES_CHROME);
    }
  }, [section]);

  const selectedGuardId = controlledGuardId !== undefined ? controlledGuardId : internalGuardId;
  const selectedClientId = controlledClientId !== undefined ? controlledClientId : internalClientId;
  const selectedJobId = controlledJobId !== undefined ? controlledJobId : internalJobId;
  const selectedTeamId = controlledTeamId !== undefined ? controlledTeamId : internalTeamId;
  const selectedCredentialItemId =
    controlledCredentialItemId !== undefined ? controlledCredentialItemId : internalCredentialItemId;

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
  const setSelectedCredentialItemId = (id: string | null) => {
    if (controlledCredentialItemId === undefined) setInternalCredentialItemId(id);
    onSelectedCredentialItemIdChange?.(id);
  };

  const openJob = (jobId: string) => {
    navigateSection('jobs', { jobId });
  };

  const navigateSection = (next: StaffSection, selection: StaffSectionSelection = {}) => {
    if (!isControlled) setInternalSection(next);
    const nextGuardId = next === 'guards' || next === 'applications'
      ? selection.guardId !== undefined ? selection.guardId : selectedGuardId
      : null;
    const nextTeamId = next === 'team'
      ? selection.teamId !== undefined ? selection.teamId : selectedTeamId
      : null;
    const nextClientId = next === 'clients' || next === 'applications'
      ? selection.clientId !== undefined ? selection.clientId : selectedClientId
      : null;
    const nextJobId = next === 'jobs'
      ? selection.jobId !== undefined ? selection.jobId : selectedJobId
      : null;
    const nextCredentialItemId = next === 'credentials'
      ? selection.credentialItemId !== undefined ? selection.credentialItemId : selectedCredentialItemId
      : null;
    const nextCredentialGuardId =
      next === 'credentials' && !nextCredentialItemId && selection.guardId !== undefined
        ? selection.guardId
        : next === 'credentials' && !nextCredentialItemId
          ? selectedGuardId
          : null;

    setSelectedGuardId(nextGuardId ?? null);
    setSelectedTeamId(nextTeamId ?? null);
    setSelectedClientId(nextClientId ?? null);
    setSelectedJobId(nextJobId ?? null);
    setSelectedCredentialItemId(nextCredentialItemId ?? null);
    if (next !== 'crews') setInternalCrewJobId(null);
    onSectionChange?.(next, {
      guardId: next === 'credentials' ? nextCredentialGuardId ?? null : nextGuardId ?? null,
      teamId: nextTeamId ?? null,
      clientId: nextClientId ?? null,
      jobId: nextJobId ?? null,
      credentialItemId: nextCredentialItemId ?? null,
    });
  };

  const showFinance = canAccessFinancialControls(currentUser);
  const showPermissions = canAccessStaffPermissions(currentUser);
  const canManageStaff = canManageStaffAccounts(currentUser);
  const canProposeStaff = canProposeStaffAccounts(currentUser);
  const canApproveStaff = canApproveStaffAccounts(currentUser);
  const requiresDirectorApproval = canProposeStaff && !canApproveStaff;
  const canApproveGuardAccounts = canApproveGuards(currentUser);
  const canVerifyGuardCredentials = canVerifyCredentials(currentUser);
  const canManageGuardAccounts = canManageGuards(currentUser);
  const canManageClientAccounts = canManageClients(currentUser);
  const canTrust = canSetTrustedStatus(currentUser);
  const canReviewJobs = canReviewJobRequests(currentUser);
  const canManageCrews = canManageGuardAccounts || canReviewJobs;
  const showDisputes = canHandleDisputes(currentUser);
  const canManageJobs = canManageCompanyOperations(currentUser);
  const canEditJobListing = canEditJobListingDetails(currentUser);
  const canStaffEditJobListings = isStaffRole(currentUser.role);
  const canStaffJobs = canStaffManageJobs(currentUser);
  const canSuspend = canSuspendUsers(currentUser);
  const showCities = canViewCityMarkets(currentUser);
  const actorStaffProfile = guards.find((g) => g.id === currentUser.id && g.isStaff);

  useEffect(() => {
    const accessFlags = { showFinance, showSettings: true, showPermissions, showDisputes, showCities };
    if (!isStaffNavSectionAccessible(section, accessFlags)) {
      navigateSection('overview');
    }
  }, [section, showFinance, showPermissions, showDisputes, showCities]);

  const stats = useMemo(() => computePlatformStats(guards, clients, requests), [guards, clients, requests]);
  const activityFeed = useMemo(() => buildPlatformActivityFeed(guards, clients, requests), [guards, clients, requests]);
  const incidents = useMemo(() => buildIncidents(requests, guards), [requests, guards]);
  const incidentDetails = useMemo(() => buildIncidentReportViews(requests, guards), [requests, guards]);
  const disputes = useMemo(() => buildDisputes(requests, guards, supportTickets), [requests, guards, supportTickets]);
  const shiftViolations = useMemo(() => buildStaffShiftViolations(requests, guards), [requests, guards]);
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
      applications: stats.pendingAccountApplications,
      credentials: countPendingCredentialReviews(guards),
      guards: getPendingGuardAccounts(guards.filter((g) => !g.isStaff)).length,
      clients: getPendingClientAccounts(clients).length,
      jobs: requests.filter((r) => ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)).length,
      incidents: incidents.filter((i) => i.status !== 'resolved').length,
      violations: shiftViolations.filter((v) => v.needsReview).length,
      disputes: disputes.filter((d) => d.status === 'open').length,
      support: openTicketCount(supportTickets),
      messages: staffMessagesBadge(jobChatThreads, supportTickets),
      payments: openPayoutInvoices,
      crews: countStaffCrewsNeedingReview(requests) + countPendingCrewLeadRequests(crewJoinRequests),
    }),
    [guards, stats, clients, requests, incidents, shiftViolations, disputes, supportTickets, jobChatThreads, openPayoutInvoices, crewJoinRequests]
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
            onOpenJob={openJob}
            canUpdateJobs={canStaffJobs}
            staffName={currentUser.name}
            staffRole={currentUser.role}
          />
        );
      case 'map':
        return (
          <div data-tour="staff-map" className="h-full min-h-0">
            <StaffOpsMapScreen
            requests={requests}
            guards={guards}
            canManageJobs={canManageJobs}
            canEditJobListing={canEditJobListing}
            staffRole={currentUser.role}
            onApproveRequest={canReviewJobs ? onApproveRequest : async () => {}}
            onDenyRequest={canReviewJobs ? onDenyRequest : async () => {}}
            onEditJobListing={canStaffEditJobListings ? onEditJobListing : undefined}
            onApproveGuardApplication={canReviewJobs ? onApproveGuardApplication : undefined}
            onDenyGuardApplication={canReviewJobs ? onDenyGuardApplication : undefined}
          />
          </div>
        );
      case 'applications':
        return (
          <StaffApplications
            guards={guards}
            clients={clients}
            canApproveGuardAccounts={canApproveGuardAccounts}
            canManageGuardAccounts={canManageGuardAccounts}
            canManageClientAccounts={canManageClientAccounts}
            onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            onRejectGuardApplication={onRejectGuardIdentityVerification}
            onOpenGuardProfile={(guardId) => navigateSection('guards', { guardId })}
            onOpenClientProfile={(clientId) => navigateSection('clients', { clientId })}
            onAddGuard={canManageGuardAccounts ? onAddGuardProfile : undefined}
            onAddClient={canManageClientAccounts ? onAddClientProfile : undefined}
            initialGuardId={selectedGuardId}
            initialClientId={selectedClientId}
            onSelectionChange={(selection) => {
              setSelectedGuardId(selection.guardId ?? null);
              setSelectedClientId(selection.clientId ?? null);
              onSectionChange?.('applications', {
                guardId: selection.guardId ?? null,
                clientId: selection.clientId ?? null,
              });
            }}
          />
        );
      case 'credentials':
        return (
          <StaffCredentials
            guards={guards}
            canVerifyCredentials={canVerifyGuardCredentials}
            initialItemId={selectedCredentialItemId}
            initialGuardId={selectedGuardId}
            onApproveCert={onApproveCert}
            onRejectCert={onRejectCert}
            onRequestCertUpdate={onRequestCertUpdate}
            onRequestCertImageResubmit={canVerifyGuardCredentials ? onRequestCertImageResubmit : undefined}
            onApproveIdentityVerification={onApproveGuardIdentityVerification}
            onRejectIdentityVerification={onRejectGuardIdentityVerification}
            onRevokeIdentityVerification={onRevokeGuardIdentityVerification}
            onRequestIdentityResubmit={onRequestGuardIdResubmit}
            onReviewGuardInsurance={onReviewGuardInsurance}
            onRequestCoiUpdate={onRequestCoiUpdate}
            onUpdateCertification={onUpdateCertification}
            onOpenGuardProfile={(guardId) => navigateSection('guards', { guardId })}
            onAddCredentialForGuard={
              canManageGuardAccounts
                ? (guardId) => {
                    onStaffGuardEditChange?.(true);
                    navigateSection('guards', { guardId });
                  }
                : undefined
            }
            onEditGuardProfile={
              canManageGuardAccounts
                ? (guardId) => {
                    onStaffGuardEditChange?.(true);
                    navigateSection('guards', { guardId });
                  }
                : undefined
            }
            onAddCertification={canManageGuardAccounts ? onAddCertification : undefined}
            onItemIdChange={setSelectedCredentialItemId}
          />
        );
      case 'jobs':
        return (
          <div data-tour="staff-jobs" className="h-full min-h-0">
            <StaffJobsPanel
            requests={requests}
            guards={guards}
            clients={clients}
            canManageJobs={canManageJobs}
            canEditJobListing={canEditJobListing}
            onApproveRequest={canReviewJobs ? onApproveRequest : undefined}
            onDenyRequest={canReviewJobs ? onDenyRequest : undefined}
            onCreateJob={canManageJobs ? onStaffCreateJob : undefined}
            onEditJobListing={canStaffEditJobListings ? onEditJobListing : undefined}
            onApproveGuardApplication={canReviewJobs ? onApproveGuardApplication : undefined}
            onDenyGuardApplication={canReviewJobs ? onDenyGuardApplication : undefined}
            selectedId={selectedJobId}
            onSelectedIdChange={setSelectedJobId}
            initialSelectedId={selectedJobId}
            staffRole={currentUser.role}
            feeConfig={platformSettings.feeConfig}
          />
          </div>
        );
      case 'guards':
        return (
          <StaffGuardsPanel
            guards={guards}
            requests={requests}
            standingCrewMembers={standingCrewMembers}
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
            onRejectGuardApplication={
              canManageGuardAccounts ? onRejectGuardIdentityVerification : undefined
            }
            onSetGuardTrusted={canTrust ? onSetGuardTrusted : undefined}
            onMakeCrewLead={canManageGuardAccounts ? onMakeGuardCrewLead : undefined}
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
            staffGuardTab={controlledStaffGuardTab}
            onStaffGuardTabChange={onStaffGuardTabChange}
            performanceFactorId={controlledPerformanceFactorId}
            onPerformanceFactorChange={onPerformanceFactorChange}
            initialSelectedId={selectedGuardId}
            onOpenJob={openJob}
            onOpenGuardApplication={(guardId) => navigateSection('applications', { guardId })}
            onOpenGuardCredential={(guardId, credentialItemId) =>
              navigateSection('credentials', { guardId, credentialItemId })
            }
            onAddGuard={canManageGuardAccounts ? onAddGuardProfile : undefined}
          />
        );
      case 'team':
        return (
          <StaffTeamPanel
            guards={guards}
            platformCities={platformCities}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
            actorManagedCities={actorStaffProfile?.managedCities}
            canManageStaff={canManageStaff}
            canProposeStaff={canProposeStaff}
            requiresDirectorApproval={requiresDirectorApproval}
            onUpdateUserStatus={onUpdateGuardUserStatus}
            onAddStaff={
              canProposeStaff
                ? (input) =>
                    onAddStaffProfile(input.email, input.badgeNumber, input.staffRole, {
                      managedCities: input.managedCities,
                      assignedManagerIds: input.assignedManagerIds,
                    })
                : undefined
            }
            onUpdateStaffRole={canManageStaff ? onUpdateStaffRole : undefined}
            onUpdateStaffCityAccess={onUpdateStaffCityAccess}
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
            standingCrewMembers={standingCrewMembers}
            crewJoinRequests={crewJoinRequests}
            canManage={canManageCrews}
            selectedJobId={internalCrewJobId}
            onSelectedJobIdChange={setInternalCrewJobId}
            onOpenJob={openJob}
            onOpenMessages={() => navigateSection('messages')}
            onApproveCrewMember={canReviewJobs ? onApproveCrewMember : undefined}
            onDenyCrewMember={canReviewJobs ? onDenyCrewMember : undefined}
            onRemoveCrewMember={canReviewJobs ? onRemoveCrewMember : undefined}
            onApproveCrewLeadRequest={canManageCrews ? onApproveCrewLeadRequest : undefined}
            onDeclineCrewLeadRequest={canManageCrews ? onDeclineCrewLeadRequest : undefined}
            onCreateCrew={canManageGuardAccounts ? onMakeGuardCrewLead : undefined}
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
      case 'team-chat':
      case 'job-chats':
        return onSendStaffMessage && onSendJobChat && onSendTeamChatMessage ? (
          <div data-tour="staff-messages" className="app-messages-hub h-full min-h-0">
            <StaffMessagesPanel
              requests={requests}
              guards={guards}
              threads={jobChatThreads}
              messages={jobChatMessages}
              teamChatThreads={teamChatThreads}
              teamChatMessages={teamChatMessages}
              staffMessages={staffMessages}
              guardMessages={guardMessages}
              clientMessages={clientMessages}
              supportTickets={supportTickets}
              currentUser={currentUser}
              onSendJobChat={onSendJobChat}
              onSendTeamChatMessage={onSendTeamChatMessage}
              onSendStaffMessage={onSendStaffMessage}
              onSendGuardMessage={onSendGuardMessage}
              onSendClientMessage={onSendClientMessage}
              onSendSupportMessage={onSendSupportMessage}
              onUpdateSupportStatus={onUpdateSupportStatus}
              onDeleteSupportTicket={onDeleteSupportTicket}
              selectedJobChatRequestId={selectedJobChatRequestId}
              onSelectedJobChatRequestIdChange={onSelectedJobChatRequestIdChange}
              selectedTeamChatRequestId={selectedTeamChatRequestId}
              onSelectedTeamChatRequestIdChange={onSelectedTeamChatRequestIdChange}
              initialJobChatRequestId={selectedJobChatRequestId}
              initialTeamChatRequestId={selectedTeamChatRequestId}
              initialStaffMessagesTab={initialStaffMessagesTab}
              onMessagesChromeChange={setStaffMessagesChrome}
            />
          </div>
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.messages!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.messages!.message}
            placeholders={['Job chats', 'Team chat']}
          />
        );
      case 'support':
        return onSendSupportMessage && onUpdateSupportStatus ? (
          <div data-tour="staff-support" className="app-messages-hub h-full min-h-0">
            <StaffSupportPanel
              tickets={supportTickets}
              currentUser={currentUser}
              onSendMessage={onSendSupportMessage}
              onUpdateStatus={onUpdateSupportStatus}
              selectedTicketId={selectedSupportTicketId}
              onSelectedTicketIdChange={onSelectedSupportTicketIdChange}
              initialSelectedTicketId={selectedSupportTicketId}
            />
          </div>
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.messages!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.messages!.message}
            placeholders={['Support inbox', 'Reports']}
          />
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
            paymentGates={clientPaymentGates(platformSettings)}
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
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.payments!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.payments!.message}
            placeholders={['Pending payouts', 'Client payments', 'Guard payouts', 'Platform fees']}
          />
        );
      case 'violations':
        return (
          <StaffViolationsPanel
            violations={shiftViolations}
            onResolveAuditViolation={showDisputes ? onResolveAuditViolation : undefined}
            onOpenJob={openJob}
          />
        );
      case 'stats':
        return (
          <StaffStatsPanel
            guards={guards}
            requests={requests}
            standingCrewMembers={standingCrewMembers}
            crewJoinRequests={crewJoinRequests}
            onOpenGuard={(guardId) => {
              onStaffGuardTabChange?.('performance');
              navigateSection('guards', { guardId });
            }}
            onOpenViolations={() => navigateSection('violations')}
          />
        );
      case 'disputes':
        return showDisputes ? (
          <StaffDisputesPanel
            disputes={disputes}
            onResolveDispute={onResolveDispute}
            onResolveOvertimeDispute={onResolveOvertimeDispute}
            onResolveAuditViolation={onResolveAuditViolation}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.disputes!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.disputes!.message}
            placeholders={['Open disputes', 'Resolved disputes']}
          />
        );
      case 'analytics':
        return (
          <div className="space-y-8">
            <StaffSlaDashboard requests={requests} guards={guards} clients={clients} />
            <StaffAnalyticsPanel
              guards={guards}
              clients={clients}
              requests={requests}
              showFinancials={showFinance}
            />
          </div>
        );
      case 'guide':
        return (
          <AppGuidePage
            audience="staff"
            staffRole={currentUser.role}
            tutorialAvailable={tutorialAvailable}
            tutorialCompleted={tutorialCompleted}
            tutorialActive={tutorialActive}
            onStartTutorial={onStartTutorial}
            onEnterPracticeMode={onEnterPracticeMode}
          />
        );
      case 'dev-updates':
        return showFinance ? (
          <DevNotesPage />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['dev-updates']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['dev-updates']!.message}
            placeholders={['Release notes', 'Build history']}
          />
        );
      case 'payment-settings':
        return showFinance ? (
          <StaffPaymentSettingsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={onUpdatePlatformSettings}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['payment-settings']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['payment-settings']!.message}
            placeholders={['Platform fees', 'Crew pay rules']}
          />
        );
      case 'agreements':
        return showFinance ? (
          <StaffLegalCompliancePanel
            guards={guards}
            clients={clients}
            legalAcceptances={legalAcceptances}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.agreements!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.agreements!.message}
            placeholders={['Guard agreements', 'Client agreements']}
          />
        );
      case 'audit-log':
        return showFinance ? (
          <StaffAuditLogPanel />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['audit-log']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['audit-log']!.message}
            placeholders={['Recent activity', 'Compliance events']}
          />
        );
      case 'cities':
        return showCities && onUpdatePlatformCity ? (
          <StaffCitiesPanel
            currentUser={currentUser}
            cities={platformCities}
            actorManagedCities={actorStaffProfile?.managedCities}
            staffRoster={guards.filter((guard) => guard.isStaff)}
            onUpdateCity={onUpdatePlatformCity}
            onUpdateStaffCityAccess={onUpdateStaffCityAccess}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.cities!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.cities!.message}
            placeholders={['Open cities', 'Wait list', 'Recommendations']}
          />
        );
      case 'permissions':
        return showPermissions ? (
          <StaffPermissionsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdateStaffPermissions={onUpdateStaffPermissions}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.permissions!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.permissions!.message}
            placeholders={['Approval rules', 'Staff role permissions']}
          />
        );
      case 'settings':
        return (
          <StaffSettingsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePublicInformation={onUpdatePublicInformation}
            companyPublicDocuments={companyPublicDocuments}
            onSaveCompanyPublicDocument={onSaveCompanyPublicDocument}
            onSetCompanyPlacardPublicEnabled={onSetCompanyPlacardPublicEnabled}
          />
        );
      case 'integrations':
        return (
          <StaffIntegrationsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdateStaffIntegrations={onUpdateStaffIntegrations}
          />
        );
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
            isDbConnected={isDbConnected}
            onOpenLegal={onOpenLegal}
          />
        );
      default:
        return null;
    }
  };

  const messagesChromeActive = isStaffMessagesSection(section);

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
      accountNotifications={accountNotifications}
      headerExtension={messagesChromeActive ? staffMessagesChrome.extension : undefined}
      headerOverride={messagesChromeActive ? staffMessagesChrome.override : undefined}
      canCreateJob={canManageJobs}
      canAddClient={canManageClientAccounts}
      canAddGuard={canManageGuardAccounts}
      canAddStaff={canProposeStaff}
      canAddCredential={canManageGuardAccounts}
      canCreateCrew={canManageGuardAccounts}
    >
      <AppPageTransition motionKey={section} className="h-full min-h-0">
        {renderSection()}
      </AppPageTransition>
    </StaffOpsLayout>
  );
}
