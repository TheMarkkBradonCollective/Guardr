import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
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
  canAccessStaffPermissions,
  canAccessStaffMessages,
  canAccessSupportInbox,
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
  canViewStaffCompensation,
  hasExecutivePaymentControls,
  canSetTrustedStatus,
  canViewAnalytics,
  canViewCityMarkets,
  canViewIncidents,
  canViewManagementRoster,
  canViewStats,
  canViewViolations,
  isStaffMemberVisibleToViewer,
  isStaffRole,
  isFinanceDeskOnly,
  staffSectionForStaffMember,
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
  isStaffOpsMapSection,
  isStaffMessagesSection,
  isStaffMessagesHubSection,
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
import { StaffClientsPanel } from './staff/StaffClientsPanel';
import { StaffIncidentsPanel } from './staff/StaffIncidentsPanel';
import { StaffDisputesPanel } from './staff/StaffDisputesPanel';
import { StaffViolationsPanel } from './staff/StaffViolationsPanel';
import { StaffStatsPanel } from './staff/StaffStatsPanel';
import { StaffMessagesPanel } from './staff/StaffMessagesPanel';
import { StaffSupportPanel } from './staff/StaffSupportPanel';
import { openTicketCount } from '../lib/support';
import {
  buildStaffNavOpenItemIds,
  loadStaffOpsNavViewState,
  markStaffSectionViewed,
  recordStaffSelfHandledItem,
  saveStaffOpsNavViewState,
  STAFF_NOTIFIABLE_SECTIONS,
  syncStaffNavHandledElsewhere,
  type StaffNotifiableSection,
  type StaffOpsNavViewState,
} from '../lib/staffOpsNavNotifications';
import {
  buildStaffOpsInboxNotifications,
  isStaffOpsInboxNotification,
  markStaffInboxNotificationRead,
  staffSectionFromOpsNotification,
} from '../lib/staffOpsInboxNotifications';
import { sortNotificationsNewestFirst } from '../lib/notificationInbox';
import type { UserNotification } from '../types';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../lib/messagesChrome';
import { openGuardPayoutInvoices } from '../lib/guardPayoutInvoiceStorage';
import type { PlatformSettings } from '../lib/platformSettings';
import { clientPaymentGates } from '../lib/platformSettings';
import type { PlatformCity } from '../lib/platformCities';
import { StaffPaymentsPanel } from './staff/StaffPaymentsPanel';
import { PaymentsPage } from './payments/PaymentsPage';
import { StaffAnalyticsInsightsPanel } from './staff/StaffAnalyticsInsightsPanel';
import { StaffAuditLogPanel } from './staff/StaffAuditLogPanel';
import { StaffSettingsPanel } from './staff/StaffSettingsPanel';
import { StaffPermissionsPanel } from './staff/StaffPermissionsPanel';
import type { StaffPermissionsPatch } from './staff/StaffPermissionsPanel';
import { StaffIntegrationsPanel } from './staff/StaffIntegrationsPanel';
import { StaffCitiesPanel } from './staff/StaffCitiesPanel';
import { StaffLocationsPanel } from './staff/StaffLocationsPanel';
import { StaffPlatformFeesPanel } from './staff/StaffPlatformFeesPanel';
import { StaffCompensationPage } from './staff/StaffCompensationPage';
import { StaffLegalCompliancePanel } from './staff/StaffLegalCompliancePanel';
import { AppGuidePage } from './docs/AppGuidePage';
import { AppBlockedAccessScreen } from './ui/app/AppBlockedAccess';
import { STAFF_SECTION_ACCESS_MESSAGES, isStaffNavSectionAccessible } from '../lib/staffNavAccess';
import type { OneRoleCase } from '../lib/oneRolePolicy';
import { DevNotesPage } from './docs/DevNotesPage';
import { BusinessPlanPage } from './docs/BusinessPlanPage';
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
  oneRoleCases?: OneRoleCase[];
  onIgnoreOneRoleCase?: (caseId: string) => void;
  onBlockOneRoleCase?: (caseId: string) => void;
  requests: SecurityRequest[];
  supportTickets?: SupportTicket[];
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
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
  onRequestGuardApplicationRevision?: (guardId: string, reason?: string) => Promise<void>;
  onRequestClientApplicationRevision?: (clientId: string, reason?: string) => Promise<void>;
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
  onApproveClientCredential?: (clientId: string, credentialId: string) => void | Promise<void>;
  onRejectClientCredential?: (clientId: string, credentialId: string, reason?: string) => void | Promise<void>;
  onUpdateClientCredentialRules?: (
    rules: import('../lib/clientCredentialCatalog').ClientCredentialRuleOverride[]
  ) => void | Promise<void>;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('./profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onApproveGuardApplication: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onUpdateBackgroundChecked: (guardId: string, checked: boolean) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onResetAuditFailures?: (guardId: string) => void;
  onMakeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onReleasePayout?: (requestId: string, force?: boolean) => Promise<void>;
  onRefundPayment?: (requestId: string) => Promise<void>;
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
  onMakeOvertimeGuardPayoutAvailable?: (requestId: string) => Promise<void>;
  onCompletePayoutInvoice?: (invoiceId: string) => Promise<void>;
  isDbConnected: boolean;
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  platformCities?: PlatformCity[];
  jobLocations?: import('../types').JobLocation[];
  clientLocations?: import('../types').ClientLocation[];
  onSaveJobLocation?: (location: import('../types').JobLocation) => void | Promise<void>;
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
  onAssignCityManager?: (cityId: string, managerId: string | null) => Promise<void>;
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
    input: {
      email: string;
      personalEmail?: string;
      badgeNumber: string;
      staffRole: StaffRole | null;
      sideRole?: import('../types').StaffSideRole | null;
      firstName: string;
      middleName?: string;
      lastName: string;
      managedCities?: string[];
      assignedManagerIds?: string[];
    }
  ) => Promise<string>;
  onApproveStaffAccount?: (staffId: string) => void | Promise<void>;
  onRejectStaffAccount?: (staffId: string) => void | Promise<void>;
  onUpdateStaffRole: (
    staffId: string,
    staffRole: StaffRole | null,
    options?: { sideRole?: import('../types').StaffSideRole | null }
  ) => Promise<{ badgeNumber: string } | void>;
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
  onDeleteStaffMessage?: (messageId: string) => void | Promise<void>;
  onSendGuardMessage?: (body: string) => void | Promise<void>;
  onDeleteGuardMessage?: (messageId: string) => void | Promise<void>;
  onSendClientMessage?: (body: string) => void | Promise<void>;
  onDeleteClientMessage?: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage?: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage?: (ticketId: string, messageId: string) => void | Promise<void>;
  onRefreshStaffMessages?: () => void | Promise<void>;
  onSendJobChat?: (requestId: string, body: string) => void | Promise<void>;
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
  initialStaffMessagesTab?: 'team' | 'jobs' | null;
  onOpenLegal?: (page: import('../lib/legalContent').LegalPageId) => void;
  onOpenDownload?: () => void;
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
}

export function StaffDashboard({
  guards,
  clients,
  oneRoleCases = [],
  onIgnoreOneRoleCase,
  onBlockOneRoleCase,
  requests,
  supportTickets = [],
  jobChatThreads = [],
  jobChatMessages = [],
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
  onRequestGuardApplicationRevision,
  onRequestClientApplicationRevision,
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
  onApproveClientCredential,
  onRejectClientCredential,
  onUpdateClientCredentialRules,
  onUpdateGuardIdImages,
  onApproveCert,
  onRejectCert,
  onApproveGuardApplication,
  onDenyGuardApplication,
  onUpdateBackgroundChecked,
  onResetAuditFailures,
  onMakeGuardPayoutAvailable,
  onReleasePayout,
  onRefundPayment,
  onResolveOvertimeDispute,
  onResolveAuditViolation,
  onMakeOvertimeGuardPayoutAvailable,
  onCompletePayoutInvoice,
  isDbConnected,
  currentUser,
  platformSettings,
  platformCities = [],
  jobLocations = [],
  clientLocations = [],
  onSaveJobLocation,
  onUpdatePlatformCity,
  onUpdateStaffCityAccess,
  onAssignCityManager,
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
  onDeleteStaffMessage,
  onSendGuardMessage,
  onDeleteGuardMessage,
  onSendClientMessage,
  onDeleteClientMessage,
  onDeleteJobChatMessage,
  onDeleteSupportMessage,
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
  initialStaffMessagesTab = null,
  onOpenLegal,
  onOpenDownload,
  legalAcceptances = [],
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
  accountNotifications,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
}: StaffDashboardProps) {
  const isControlled = controlledSection !== undefined;
  const [internalSection, setInternalSection] = useState<StaffSection>(controlledSection ?? initialSection);
  const section = isControlled ? controlledSection : internalSection;
  const [internalGuardId, setInternalGuardId] = useState<string | null>(null);
  const [internalClientId, setInternalClientId] = useState<string | null>(null);
  const [internalJobId, setInternalJobId] = useState<string | null>(null);
  const [internalTeamId, setInternalTeamId] = useState<string | null>(null);
  const [internalCredentialItemId, setInternalCredentialItemId] = useState<string | null>(null);
  const [staffMessagesChrome, setStaffMessagesChrome] = useState<MessagesChrome>(EMPTY_MESSAGES_CHROME);

  useEffect(() => {
    if (!isStaffMessagesHubSection(section)) {
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

  const openStaffProfile = (staffId: string) => {
    const member = guards.find((guard) => guard.id === staffId);
    if (!member || !isStaffMemberVisibleToViewer(currentUser, member)) return;
    navigateSection(staffSectionForStaffMember(member, currentUser), { teamId: staffId });
  };

  const renderStaffTeamPanel = (tier: 'operations' | 'management') => (
    <StaffTeamPanel
      tier={tier}
      guards={guards}
      platformCities={platformCities}
      platformSettings={platformSettings}
      currentUserId={currentUser.id}
      currentUserRole={currentUser.role}
      actorManagedCities={actorStaffProfile?.managedCities}
      canManageStaff={canManageStaff}
      canProposeStaff={canProposeStaff}
      canApproveStaffAccounts={canApproveStaff}
      requiresDirectorApproval={requiresDirectorApproval}
      onUpdateUserStatus={onUpdateGuardUserStatus}
      onAddStaff={
        canProposeStaff
          ? (input) => onAddStaffProfile(input)
          : undefined
      }
      onApproveStaffAccount={canApproveStaff ? onApproveStaffAccount : undefined}
      onRejectStaffAccount={canApproveStaff ? onRejectStaffAccount : undefined}
      onUpdateStaffRole={canManageStaff ? onUpdateStaffRole : undefined}
      onUpdateStaffCityAccess={onUpdateStaffCityAccess}
      onUpdateStaffProfile={onUpdateGuardProfile}
      selectedId={selectedTeamId}
      onSelectedIdChange={setSelectedTeamId}
      initialSelectedId={selectedTeamId}
    />
  );

  const navigateSection = (next: StaffSection, selection: StaffSectionSelection = {}) => {
    if (!isControlled) setInternalSection(next);
    const nextGuardId = next === 'guards' || next === 'applications'
      ? selection.guardId !== undefined ? selection.guardId : selectedGuardId
      : null;
    const nextTeamId = next === 'team' || next === 'management'
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
    onSectionChange?.(next, {
      guardId: next === 'credentials' ? nextCredentialGuardId ?? null : nextGuardId ?? null,
      teamId: nextTeamId ?? null,
      clientId: nextClientId ?? null,
      jobId: nextJobId ?? null,
      credentialItemId: nextCredentialItemId ?? null,
    });
  };

  const showFinance = canAccessFinancialControls(currentUser);
  const showPayments = showFinance;
  const showPermissions = canAccessStaffPermissions(currentUser);
  const financeDeskOnly = isFinanceDeskOnly(currentUser);
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
  const showDisputes = canHandleDisputes(currentUser);
  const canManageJobs = canManageCompanyOperations(currentUser);
  const canEditJobListing = canEditJobListingDetails(currentUser);
  const canStaffEditJobListings = isStaffRole(currentUser.role);
  const canStaffJobs = canStaffManageJobs(currentUser);
  const canSuspend = canSuspendUsers(currentUser);
  const showCities = canViewCityMarkets(currentUser);
  const showManagement = canViewManagementRoster(currentUser);
  const showAnalytics = canViewAnalytics(currentUser);
  const showStats = canViewStats(currentUser);
  const showIncidents = canViewIncidents(currentUser);
  const showViolations = canViewViolations(currentUser);
  const showMessages = canAccessStaffMessages(currentUser);
  const showSupportInbox = canAccessSupportInbox(currentUser);
  const actorStaffProfile = guards.find((g) => g.id === currentUser.id && g.isStaff);

  useEffect(() => {
    if (!selectedTeamId) return;
    const member = guards.find((guard) => guard.id === selectedTeamId);
    if (!member || isStaffMemberVisibleToViewer(currentUser, member)) return;
    setSelectedTeamId(null);
    if (section === 'management') {
      navigateSection('overview');
    }
  }, [selectedTeamId, guards, currentUser, section]);

  useEffect(() => {
    const accessFlags = {
      showFinance,
      showPayments,
      showSettings: true,
      showPermissions,
      showDisputes,
      showCities,
      showManagement,
      financeDeskOnly,
    };
    if (section === 'payments' && !showFinance) {
      navigateSection('staff-compensation');
      return;
    }
    if (!isStaffNavSectionAccessible(section, accessFlags)) {
      navigateSection('overview');
    }
  }, [section, showFinance, showPayments, showPermissions, showDisputes, showCities, showManagement, financeDeskOnly]);

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
    () => openGuardPayoutInvoices(guardPayoutInvoices),
    [guardPayoutInvoices]
  );

  const [navViewState, setNavViewState] = useState<StaffOpsNavViewState>(() =>
    loadStaffOpsNavViewState(currentUser.id)
  );
  const navViewStateRef = useRef(navViewState);
  navViewStateRef.current = navViewState;

  const staffNavOpenItems = useMemo(
    () =>
      buildStaffNavOpenItemIds({
        guards,
        clients,
        requests,
        disputes,
        supportTickets,
        jobChatThreads,
        guardPayoutInvoices,
      }),
    [guards, clients, requests, disputes, supportTickets, jobChatThreads, guardPayoutInvoices]
  );

  const syncedNavViewState = useMemo(() => {
    let next = navViewState;
    for (const notifiableSection of Object.keys(staffNavOpenItems) as StaffNotifiableSection[]) {
      next = syncStaffNavHandledElsewhere(
        next,
        notifiableSection,
        staffNavOpenItems[notifiableSection] ?? [],
        section
      );
    }
    return next;
  }, [navViewState, staffNavOpenItems, section]);

  useEffect(() => {
    if (syncedNavViewState !== navViewState) {
      setNavViewState(syncedNavViewState);
      saveStaffOpsNavViewState(currentUser.id, syncedNavViewState);
    }
  }, [syncedNavViewState, navViewState, currentUser.id]);

  const [inboxReadTick, setInboxReadTick] = useState(0);

  const staffOpsInboxNotifications = useMemo(() => {
    void inboxReadTick;
    return buildStaffOpsInboxNotifications({
      staffId: currentUser.id,
      guards,
      clients,
      violations: shiftViolations,
      disputes,
      incidents,
      openItemsBySection: staffNavOpenItems,
      viewState: syncedNavViewState,
    });
  }, [
    inboxReadTick,
    currentUser.id,
    guards,
    clients,
    shiftViolations,
    disputes,
    incidents,
    staffNavOpenItems,
    syncedNavViewState,
  ]);

  const mergedAccountNotifications = useMemo<AccountMenuNotificationProps | undefined>(() => {
    if (!accountNotifications?.onNotificationClick || !accountNotifications.onMarkAllNotificationsRead) {
      return accountNotifications;
    }
    const persisted = accountNotifications.notifications ?? [];
    const merged = sortNotificationsNewestFirst([...staffOpsInboxNotifications, ...persisted]);
    const seen = new Set<string>();
    const notifications = merged.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    return { ...accountNotifications, notifications };
  }, [accountNotifications, staffOpsInboxNotifications]);

  const handleMergedNotificationClick = useCallback(
    async (notification: UserNotification) => {
      if (isStaffOpsInboxNotification(notification)) {
        markStaffInboxNotificationRead(currentUser.id, notification.id);
        setInboxReadTick((t) => t + 1);
        const target = staffSectionFromOpsNotification(notification);
        if (target) navigateSection(target);
        return;
      }
      await accountNotifications?.onNotificationClick?.(notification);
    },
    [accountNotifications, currentUser.id, navigateSection]
  );

  const handleMergedMarkAllRead = useCallback(async () => {
    for (const n of staffOpsInboxNotifications) {
      if (!n.readAt) markStaffInboxNotificationRead(currentUser.id, n.id);
    }
    setInboxReadTick((t) => t + 1);
    await accountNotifications?.onMarkAllNotificationsRead?.();
  }, [accountNotifications, currentUser.id, staffOpsInboxNotifications]);

  const staffAccountNotifications = mergedAccountNotifications
    ? {
        ...mergedAccountNotifications,
        onNotificationClick: handleMergedNotificationClick,
        onMarkAllNotificationsRead: handleMergedMarkAllRead,
      }
    : undefined;

  const handleStaffOpsItemHandled = useCallback((itemId: string) => {
    setNavViewState((prev) => {
      const next = recordStaffSelfHandledItem(prev, itemId);
      saveStaffOpsNavViewState(currentUser.id, next);
      return next;
    });
  }, [currentUser.id]);

  useEffect(() => {
    if (!STAFF_NOTIFIABLE_SECTIONS.includes(section as StaffNotifiableSection)) return;
    const notifiable = section as StaffNotifiableSection;
    const openIds = staffNavOpenItems[notifiable] ?? [];
    const sortedOpen = [...openIds].sort();
    const prev = navViewStateRef.current.sections[notifiable];
    const sameSnapshot =
      prev &&
      prev.openItemIds.length === sortedOpen.length &&
      prev.openItemIds.every((id, i) => id === sortedOpen[i]);
    if (sameSnapshot) return;
    const next = markStaffSectionViewed(navViewStateRef.current, notifiable, openIds);
    navViewStateRef.current = next;
    setNavViewState(next);
    saveStaffOpsNavViewState(currentUser.id, next);
  }, [section, staffNavOpenItems, currentUser.id]);

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
            onApproveScheduleChange={canReviewJobs ? onApproveScheduleChange : undefined}
            onRejectScheduleChange={canReviewJobs ? onRejectScheduleChange : undefined}
            onApproveScheduleChangeBilling={
              canReviewJobs ? onApproveScheduleChangeBilling : undefined
            }
          />
          </div>
        );
      case 'applications':
        return (
          <StaffApplications
            currentUser={currentUser}
            guards={guards}
            clients={clients}
            oneRoleCases={oneRoleCases}
            onIgnoreOneRoleCase={onIgnoreOneRoleCase}
            onBlockOneRoleCase={onBlockOneRoleCase}
            canApproveGuardAccounts={canApproveGuardAccounts}
            canManageGuardAccounts={canManageGuardAccounts}
            canManageClientAccounts={canManageClientAccounts}
            canApproveStaffAccounts={canApproveStaff}
            onApproveGuardAccount={canApproveGuardAccounts ? onApproveGuardAccount : undefined}
            onApproveClient={onApproveClient}
            onRejectClient={onRejectClient}
            onRejectGuardApplication={onRejectGuardIdentityVerification}
            onRequestGuardApplicationRevision={
              canApproveGuardAccounts || canManageGuardAccounts
                ? onRequestGuardApplicationRevision
                : undefined
            }
            onRequestClientApplicationRevision={
              canManageClientAccounts ? onRequestClientApplicationRevision : undefined
            }
            onApproveStaffAccount={canApproveStaff ? onApproveStaffAccount : undefined}
            onRejectStaffAccount={canApproveStaff ? onRejectStaffAccount : undefined}
            onOpenGuardProfile={(guardId) => navigateSection('guards', { guardId })}
            onOpenClientProfile={(clientId) => navigateSection('clients', { clientId })}
            onOpenStaffProfile={openStaffProfile}
            onAddGuard={canManageGuardAccounts ? onAddGuardProfile : undefined}
            onAddClient={canManageClientAccounts ? onAddClientProfile : undefined}
            initialGuardId={selectedGuardId}
            initialClientId={selectedClientId}
            onSelectionChange={(selection) => {
              setSelectedGuardId(selection.guardId ?? null);
              setSelectedClientId(selection.clientId ?? null);
              if (selection.staffId) setSelectedTeamId(selection.staffId);
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
            clients={clients}
            clientCredentialRules={platformSettings.clientCredentialRules}
            canVerifyCredentials={canVerifyGuardCredentials}
            currentUser={currentUser}
            currentUserRole={currentUser.role}
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
            onOpenGuardProfile={(guardId) => navigateSection('guards', { guardId })}
            onOpenStaffProfile={openStaffProfile}
            onOpenClientProfile={(clientId) => navigateSection('clients', { clientId })}
            onItemIdChange={setSelectedCredentialItemId}
            onUpdateGuardIdImages={canManageGuardAccounts ? onUpdateGuardIdImages : undefined}
            onAddCertification={canManageGuardAccounts ? onAddCertification : undefined}
            onApproveClientCredential={canVerifyGuardCredentials ? onApproveClientCredential : undefined}
            onRejectClientCredential={canVerifyGuardCredentials ? onRejectClientCredential : undefined}
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
            onApproveScheduleChange={canReviewJobs ? onApproveScheduleChange : undefined}
            onRejectScheduleChange={canReviewJobs ? onRejectScheduleChange : undefined}
            onApproveScheduleChangeBilling={
              canReviewJobs ? onApproveScheduleChangeBilling : undefined
            }
            selectedId={selectedJobId}
            onSelectedIdChange={setSelectedJobId}
            initialSelectedId={selectedJobId}
            staffRole={currentUser.role}
            feeConfig={platformSettings.feeConfig}
            feeSchedules={platformSettings.clientFeeSchedules}
          />
          </div>
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
            onDeleteGuard={canManageGuardAccounts ? onDeleteGuardAccount : undefined}
            onApproveIdentityVerification={canVerifyGuardCredentials ? onApproveGuardIdentityVerification : undefined}
            onRejectIdentityVerification={canVerifyGuardCredentials ? onRejectGuardIdentityVerification : undefined}
            onRequestIdentityResubmit={canVerifyGuardCredentials ? onRequestGuardIdResubmit : undefined}
            onRequestCertImageResubmit={canVerifyGuardCredentials ? onRequestCertImageResubmit : undefined}
            onReviewGuardInsurance={canVerifyGuardCredentials ? onReviewGuardInsurance : undefined}
            onApproveVehicle={canManageGuardAccounts ? onApproveVehicle : undefined}
            onRejectVehicle={canManageGuardAccounts ? onRejectVehicle : undefined}
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
        return renderStaffTeamPanel('operations');
      case 'management':
        return showManagement ? (
          renderStaffTeamPanel('management')
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.management!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.management!.message}
            placeholders={['Managers', 'Directors', 'Founders']}
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
        return showIncidents ? (
          <StaffIncidentsPanel incidents={incidents} incidentDetails={incidentDetails} onOpenJob={openJob} />
        ) : (
          <AppBlockedAccessScreen
            title="Incidents"
            message="Incident review is limited to staff with the Review incident reports permission."
            placeholders={['Open incidents', 'Resolved incidents']}
          />
        );
      case 'messages':
      case 'team-chat':
      case 'job-chats':
        return showMessages && onSendStaffMessage && onSendJobChat ? (
          <div data-tour="staff-messages" className="app-messages-hub h-full min-h-0">
            <StaffMessagesPanel
              requests={requests}
              guards={guards}
              threads={jobChatThreads}
              messages={jobChatMessages}
              staffMessages={staffMessages}
              guardMessages={guardMessages}
              clientMessages={clientMessages}
              supportTickets={supportTickets}
              currentUser={currentUser}
              onSendJobChat={onSendJobChat}
              onSendStaffMessage={onSendStaffMessage}
              onDeleteStaffMessage={onDeleteStaffMessage}
              onSendGuardMessage={onSendGuardMessage}
              onDeleteGuardMessage={onDeleteGuardMessage}
              onSendClientMessage={onSendClientMessage}
              onDeleteClientMessage={onDeleteClientMessage}
              onDeleteJobChatMessage={onDeleteJobChatMessage}
              onSendSupportMessage={onSendSupportMessage}
              onUpdateSupportStatus={onUpdateSupportStatus}
              selectedJobChatRequestId={selectedJobChatRequestId}
              onSelectedJobChatRequestIdChange={onSelectedJobChatRequestIdChange}
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
        return showSupportInbox && onSendSupportMessage && onUpdateSupportStatus ? (
          <div data-tour="staff-support" className="app-messages-hub h-full min-h-0">
            <StaffSupportPanel
              tickets={supportTickets}
              currentUser={currentUser}
              onSendMessage={onSendSupportMessage}
              onUpdateStatus={onUpdateSupportStatus}
              onDeleteSupportTicket={onDeleteSupportTicket}
              onDeleteSupportMessage={onDeleteSupportMessage}
              selectedTicketId={selectedSupportTicketId}
              onSelectedTicketIdChange={onSelectedSupportTicketIdChange}
              initialSelectedTicketId={selectedSupportTicketId}
              onMessagesChromeChange={setStaffMessagesChrome}
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
        return showPayments ? (
          <PaymentsPage role="staff">
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
              onMakeOvertimeGuardPayoutAvailable={onMakeOvertimeGuardPayoutAvailable}
              onCompletePayoutInvoice={onCompletePayoutInvoice}
            />
          </PaymentsPage>
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.payments!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.payments!.message}
            placeholders={['Guard payouts', 'Client invoices']}
          />
        );
      case 'platform-fees':
        return showFinance ? (
          <StaffPlatformFeesPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={onUpdatePlatformSettings}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['platform-fees']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['platform-fees']!.message}
            placeholders={['Personal fees', 'Business fees']}
          />
        );
      case 'staff-compensation':
        return canViewStaffCompensation(currentUser) ? (
          <StaffCompensationPage
            currentUser={currentUser}
            guards={guards}
            requests={requests}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={onUpdatePlatformSettings}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['staff-compensation']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['staff-compensation']!.message}
            placeholders={['Revenue-share', 'Staff payouts']}
          />
        );
      case 'violations':
        return showViolations ? (
          <StaffViolationsPanel
            violations={shiftViolations}
            onResolveAuditViolation={showDisputes ? onResolveAuditViolation : undefined}
            onOpenJob={openJob}
            onItemHandled={handleStaffOpsItemHandled}
          />
        ) : (
          <AppBlockedAccessScreen
            title="Violations"
            message="Shift violations are limited to staff with the View shift violations permission."
            placeholders={['Open violations', 'Resolved violations']}
          />
        );
      case 'stats':
        return showStats ? (
          <StaffStatsPanel
            guards={guards}
            requests={requests}
            onOpenGuard={(guardId) => {
              onStaffGuardTabChange?.('performance');
              navigateSection('guards', { guardId });
            }}
            onOpenViolations={() => navigateSection('violations')}
          />
        ) : (
          <AppBlockedAccessScreen
            title="Stats"
            message="Performance stats are limited to staff with the View performance stats permission."
            placeholders={['Guard performance', 'Job volume']}
          />
        );
      case 'disputes':
        return showDisputes ? (
          <StaffDisputesPanel
            disputes={disputes}
            onResolveDispute={onResolveDispute}
            onResolveOvertimeDispute={onResolveOvertimeDispute}
            onItemHandled={handleStaffOpsItemHandled}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.disputes!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.disputes!.message}
            placeholders={['Open disputes', 'Resolved disputes']}
          />
        );
      case 'analytics':
        return showAnalytics ? (
          <StaffAnalyticsInsightsPanel
            guards={guards}
            clients={clients}
            requests={requests}
            showFinancials={showFinance}
          />
        ) : (
          <AppBlockedAccessScreen
            title="Analytics"
            message="Analytics are limited to staff with the View analytics permission."
            placeholders={['SLA dashboard', 'Platform analytics']}
          />
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
      case 'business-plan':
        return showManagement ? (
          <BusinessPlanPage />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['business-plan']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['business-plan']!.message}
            placeholders={['Executive summary', 'Financial projections']}
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
            marketplaceGuards={guards.filter((guard) => !guard.isStaff)}
            clients={clients}
            staffMarketplaceCap={platformSettings.staffMarketplaceCap}
            onUpdateCity={onUpdatePlatformCity}
            onAssignCityManager={onAssignCityManager}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.cities!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.cities!.message}
            placeholders={['Open cities', 'Wait list', 'Recommendations']}
          />
        );
      case 'locations':
        return onSaveJobLocation ? (
          <StaffLocationsPanel
            currentUser={currentUser}
            locations={jobLocations}
            jobs={requests}
            clients={clients}
            clientLocations={clientLocations}
            onSave={onSaveJobLocation}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.locations!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.locations!.message}
            placeholders={['Active locations', 'Rejected sites', 'Archived places']}
          />
        );
      case 'permissions':
        return showPermissions ? (
          <StaffPermissionsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdateStaffPermissions={onUpdateStaffPermissions}
            onUpdateClientCredentialRules={onUpdateClientCredentialRules}
          />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES.permissions!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES.permissions!.message}
            placeholders={['Staff role permissions', 'Role capabilities']}
          />
        );
      case 'settings':
        return (
          <div data-tour="staff-settings">
          <StaffSettingsPanel
            currentUser={currentUser}
            platformSettings={platformSettings}
            onUpdatePublicInformation={onUpdatePublicInformation}
            companyPublicDocuments={companyPublicDocuments}
            onSaveCompanyPublicDocument={onSaveCompanyPublicDocument}
            onSetCompanyPlacardPublicEnabled={onSetCompanyPlacardPublicEnabled}
          />
          </div>
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
            platformSettings={platformSettings}
            onSave={(payload) => onUpdateGuardProfile(currentUser.id, payload)}
            onSubmitIdentityVerification={
              onSubmitGuardIdentityVerification
                ? (payload) => onSubmitGuardIdentityVerification(currentUser.id, payload)
                : undefined
            }
          />
        );
      case 'preferences':
        return (
          <UserSettingsScreen
            currentUser={currentUser}
            isDbConnected={isDbConnected}
            onOpenLegal={onOpenLegal}
            onOpenDownload={onOpenDownload}
          />
        );
      default:
        return null;
    }
  };

  const messagesChromeActive = isStaffMessagesHubSection(section);

  return (
    <StaffOpsLayout
      currentUser={currentUser}
      activeSection={section}
      onNavigate={navigateSection}
      themeMode={themeMode}
      onChangeTheme={onChangeTheme}
      onSignOut={onSignOut}
      isDbConnected={isDbConnected}
      fullBleed={isStaffOpsMapSection(section)}
      onOpenLegal={onOpenLegal}
      onOpenDownload={onOpenDownload}
      accountNotifications={staffAccountNotifications}
      headerExtension={messagesChromeActive ? staffMessagesChrome.extension : undefined}
      headerOverride={messagesChromeActive ? staffMessagesChrome.override : undefined}
    >
      <AppPageTransition motionKey={section} className="min-h-0">
        {renderSection()}
      </AppPageTransition>
    </StaffOpsLayout>
  );
}
