/** Page body extracted from StaffDashboard. The dashboard file keeps the shell. */
import type { ReactNode } from 'react';
import { AppGuidePage } from '../../components/docs/AppGuidePage';
import { BusinessPlanPage } from '../../components/docs/BusinessPlanPage';
import { CompanyPackagePage } from '../../components/docs/CompanyPackagePage';
import { DevNotesPage } from '../../components/docs/DevNotesPage';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { UserProfileScreen } from '../../components/profile/UserProfileScreen';
import { UserSettingsScreen } from '../../components/profile/UserSettingsScreen';
import { StaffAnalyticsInsightsPanel } from '../../components/staff/StaffAnalyticsInsightsPanel';
import { StaffApplications } from '../../components/staff/StaffApplications';
import { StaffAuditLogPanel } from '../../components/staff/StaffAuditLogPanel';
import { StaffCitiesPanel } from '../../components/staff/StaffCitiesPanel';
import { StaffClientsPanel } from '../../components/staff/StaffClientsPanel';
import { StaffCompensationPage } from '../../components/staff/StaffCompensationPage';
import { StaffCredentials } from '../../components/staff/StaffCredentials';
import { StaffDisputesPanel } from '../../components/staff/StaffDisputesPanel';
import { StaffGuardsPanel } from '../../components/staff/StaffGuardsPanel';
import { StaffIncidentsPanel } from '../../components/staff/StaffIncidentsPanel';
import { StaffIntegrationsPanel } from '../../components/staff/StaffIntegrationsPanel';
import { StaffJobsPanel } from '../../components/staff/StaffJobsPanel';
import { StaffLegalCompliancePanel } from '../../components/staff/StaffLegalCompliancePanel';
import { StaffLocationsPanel } from '../../components/staff/StaffLocationsPanel';
import { StaffMessagesPanel } from '../../components/staff/StaffMessagesPanel';
import { StaffOpsMapScreen } from '../../components/staff/StaffOpsMapScreen';
import { StaffOverview } from '../../components/staff/StaffOverview';
import { StaffPaymentsPanel } from '../../components/staff/StaffPaymentsPanel';
import { StaffPermissionsPanel } from '../../components/staff/StaffPermissionsPanel';
import { StaffPlatformFeesPanel } from '../../components/staff/StaffPlatformFeesPanel';
import { StaffSettingsPanel } from '../../components/staff/StaffSettingsPanel';
import { StaffStatsPanel } from '../../components/staff/StaffStatsPanel';
import { StaffSupportPanel } from '../../components/staff/StaffSupportPanel';
import { StaffViolationsPanel } from '../../components/staff/StaffViolationsPanel';
import { AppBlockedAccessScreen } from '../../components/ui/app/AppBlockedAccess';
import { canViewStaffCompensation, hasExecutivePaymentControls } from '../../lib/permissions';
import { clientPaymentGates } from '../../lib/platformSettings';
import { STAFF_SECTION_ACCESS_MESSAGES } from '../../lib/staffNavAccess';

export interface RenderStaffSectionBindings {
  activityFeed: import("../../lib/staffOps").OpsActivityItem[];
  actorStaffProfile: import("../../types").SecurityGuard;
  canApproveGuardAccounts: boolean;
  canApproveStaff: boolean;
  canEditJobListing: boolean;
  canManageClientAccounts: boolean;
  canManageGuardAccounts: boolean;
  canManageJobs: boolean;
  canReviewJobs: boolean;
  canStaffEditJobListings: boolean;
  canStaffJobs: boolean;
  canSuspend: boolean;
  canTrust: boolean;
  canVerifyGuardCredentials: boolean;
  clientLocations: import("../../types").ClientLocation[];
  clientMessages: import("../../types").ClientMessage[];
  clients: import("../../types").Client[];
  companyPublicDocuments: import("../../lib/companyPlacard").CompanyPublicDocument[];
  controlledPerformanceFactorId: "acceptance" | "completion" | "on-time" | "quality" | "client-rating";
  controlledStaffGuardEdit: boolean;
  controlledStaffGuardTab: "profile" | "performance" | "certs" | "inventory" | "timesheet";
  currentUser: import("../../types").SessionUser;
  disputes: import("../../lib/staffOps").OpsDispute[];
  guardMessages: import("../../types").GuardMessage[];
  guardPayoutInvoices: import("../../types").GuardPayoutInvoice[];
  guards: import("../../types").SecurityGuard[];
  handleStaffOpsItemHandled: (itemId: string) => void;
  incidentDetails: import("../../lib/incidentReports").IncidentReportViewContext[];
  incidents: import("../../lib/staffOps").OpsIncident[];
  initialStaffMessagesTab: "team" | "jobs";
  isDbConnected: boolean;
  jobChatMessages: import("../../types").JobChatMessage[];
  jobChatThreads: import("../../types").JobChatThread[];
  jobLocations: import("../../types").JobLocation[];
  legalAcceptances: import("../../lib/legalAcceptance").LegalAcceptanceRecord[];
  navigateSection: (next: import("../../lib/staffOps").StaffSection, selection?: import("../../components/StaffDashboard").StaffSectionSelection) => void;
  onAddCertification: (guardId: string, cert: Partial<import("../../types").Certification>) => Promise<import("../../lib/certUniqueness").AddCertificationResult>;
  onAddClientProfile: (input: import("../../components/staff/StaffAddClientForm").StaffAddClientInput) => Promise<string>;
  onAddEducation: (guardId: string, edu: Omit<import("../../types").GuardEducation, "id">) => void | Promise<void>;
  onAddExperience: (guardId: string, exp: Omit<import("../../types").Experience, "id">) => void | Promise<void>;
  onAddGuardProfile: (input: import("../../components/staff/StaffAddGuardForm").StaffAddGuardInput) => Promise<string>;
  onApproveCert: (guardId: string, certId: string) => void;
  onApproveClient: (clientId: string) => Promise<void>;
  onApproveClientCredential: (clientId: string, credentialId: string) => void | Promise<void>;
  onApproveGuardAccount: (guardId: string) => Promise<void>;
  onApproveGuardApplication: (requestId: string, guardId: string) => void | Promise<void>;
  onApproveGuardIdentityVerification: (guardId: string) => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onApproveScheduleChange: (requestId: string) => void | Promise<void>;
  onApproveScheduleChangeBilling: (requestId: string) => void | Promise<void>;
  onApproveStaffAccount: (staffId: string) => void | Promise<void>;
  onApproveVehicle: (guardId: string) => void | Promise<void>;
  onAssignCityManager: (cityId: string, managerId: string) => Promise<void>;
  onAttachCertificationImage: (guardId: string, certId: string, imageUrl: string) => Promise<import("../../lib/certImagePolicy").CertImageMutationResult>;
  onBlockOneRoleCase: (caseId: string) => void;
  onCompletePayoutInvoice: (invoiceId: string) => Promise<void>;
  onDeleteCertification: (guardId: string, certId: string) => Promise<import("../../lib/certImagePolicy").CertImageMutationResult>;
  onDeleteClientAccount: (clientId: string) => Promise<void>;
  onDeleteClientMessage: (messageId: string) => void | Promise<void>;
  onDeleteGuardAccount: (guardId: string) => Promise<void>;
  onDeleteGuardMessage: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage: (messageId: string) => void | Promise<void>;
  onDeleteStaffMessage: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage: (ticketId: string, messageId: string) => void | Promise<void>;
  onDeleteSupportTicket: (ticketId: string) => void | Promise<void>;
  onDenyGuardApplication: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onEditJobListing: (requestId: string, updates: Partial<import("../../types").SecurityRequest>) => void | Promise<void>;
  oneRoleCases: import("../../lib/oneRolePolicy").OneRoleCase[];
  onIgnoreOneRoleCase: (caseId: string) => void;
  onMakeGuardPayoutAvailable: (requestId: string) => Promise<void>;
  onMakeOvertimeGuardPayoutAvailable: (requestId: string) => Promise<void>;
  onOpenDownload: () => void;
  onOpenLegal: (page: import("../../lib/legalContent").LegalPageId) => void;
  onPerformanceFactorChange: (factorId: import("../../lib/guardPerformanceFactorDetail").PerformanceFactorId) => void;
  onRefundPayment: (requestId: string) => Promise<void>;
  onRejectCert: (guardId: string, certId: string) => void;
  onRejectClient: (clientId: string) => Promise<void>;
  onRejectClientCredential: (clientId: string, credentialId: string, reason?: string) => void | Promise<void>;
  onRejectGuardIdentityVerification: (guardId: string, reason?: string) => Promise<void>;
  onRejectScheduleChange: (requestId: string) => void | Promise<void>;
  onRejectStaffAccount: (staffId: string) => void | Promise<void>;
  onRejectVehicle: (guardId: string, reason?: string) => void | Promise<void>;
  onReleasePayout: (requestId: string, force?: boolean) => Promise<void>;
  onRequestCertImageResubmit: (guardId: string, certId: string, staffNote?: string) => Promise<void>;
  onRequestCertUpdate: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onRequestClientApplicationRevision: (clientId: string, reason?: string) => Promise<void>;
  onRequestCoiUpdate: (guardId: string, staffNote?: string) => void | Promise<void>;
  onRequestGuardApplicationRevision: (guardId: string, reason?: string) => Promise<void>;
  onRequestGuardIdResubmit: (guardId: string, slots: import("../../lib/staffDocumentReview").IdVerificationSlot[], staffNote?: string) => Promise<void>;
  onResetAuditFailures: (guardId: string) => void;
  onResolveAuditViolation: (requestId: string, violationId: string, action: "uphold" | "dismiss", resolutionNote?: string) => Promise<void>;
  onResolveDispute: (dispute: import("../../lib/staffOps").OpsDispute, action: import("../../lib/staffOps").DisputeResolutionAction) => void | Promise<void>;
  onResolveOvertimeDispute: (requestId: string, action: "uphold" | "waive" | "adjust", options?: { adjustedHours?: number; resolutionNote?: string; }) => Promise<void>;
  onReviewGuardInsurance: (guardId: string, status: "pending" | "verified" | "rejected", rejectionReason?: string) => void | Promise<void>;
  onRevokeGuardIdentityVerification: (guardId: string) => void | Promise<void>;
  onSaveCompanyPublicDocument: (doc: import("../../lib/companyPlacard").CompanyPublicDocument) => Promise<void>;
  onSaveJobLocation: (location: import("../../types").JobLocation) => void | Promise<void>;
  onSectionChange: (section: import("../../lib/staffOps").StaffSection, selection?: import("../../components/StaffDashboard").StaffSectionSelection) => void;
  onSelectedJobChatRequestIdChange: (id: string) => void;
  onSelectedSupportTicketIdChange: (id: string) => void;
  onSendClientMessage: (body: string) => void | Promise<void>;
  onSendGuardMessage: (body: string) => void | Promise<void>;
  onSendJobChat: (requestId: string, body: string) => void | Promise<void>;
  onSendStaffMessage: (body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onSetClientTrusted: (clientId: string, trusted: boolean) => Promise<void>;
  onSetCompanyPlacardPublicEnabled: (enabled: boolean) => Promise<void>;
  onSetGuardTrusted: (guardId: string, trusted: boolean) => Promise<void>;
  onStaffCreateJob: (input: import("../../components/staff/StaffCreateJobForm").StaffCreateJobInput) => Promise<string | void>;
  onStaffGuardEditChange: (editing: boolean) => void;
  onStaffGuardTabChange: (tab: import("../../lib/appNavigation").StaffGuardDetailTab) => void;
  onStartTutorial: () => void;
  onSubmitGuardIdentityVerification: (guardId: string, payload: import("../../components/profile/GuardIdentityVerificationPanel").GuardIdentityVerificationPayload) => Promise<import("../../components/profile/GuardIdentityVerificationPanel").IdentityVerificationSubmitResult>;
  onUpdateBackgroundChecked: (guardId: string, checked: boolean) => void;
  onUpdateCertification: (guardId: string, certId: string, payload: import("../../components/credentials/CertDetailModal").CertUpdatePayload) => Promise<import("../../components/credentials/CertDetailModal").CertUpdateResult>;
  onUpdateClientCredentialRules: (rules: import("../../lib/clientCredentialCatalog").ClientCredentialRuleOverride[]) => void | Promise<void>;
  onUpdateGuardIdImages: (guardId: string, payload: import("../../components/profile/GuardIdentityVerificationPanel").GuardIdentityVerificationPayload) => Promise<import("../../components/profile/GuardIdentityVerificationPanel").IdentityVerificationSubmitResult>;
  onUpdateGuardProfile: (guardId: string, payload: import("../../components/profile/UserProfileScreen").ProfileSavePayload) => void | Promise<void>;
  onUpdateGuardUserStatus: (guardId: string, status: "active" | "suspended" | "blocked") => Promise<void>;
  onUpdatePlatformCity: (cityId: string, patch: { status?: import("../../lib/platformCities").CityMarketStatus; waitlistAudience?: import("../../lib/platformCities").CityWaitlistAudience; recommendOpen?: boolean; }) => Promise<void>;
  onUpdatePlatformSettings: (settings: import("../../lib/platformSettings").PlatformSettings) => void | Promise<void>;
  onUpdatePublicInformation: (patch: Pick<import("../../lib/platformSettings").PlatformSettings, "ownerMessage" | "directorMessage" | "ownerMessageUpdatedAt" | "directorMessageUpdatedAt">) => void | Promise<void>;
  onUpdateStaffIntegrations: (patch: Partial<Pick<import("../../lib/platformSettings").PlatformSettings, "paymentStripeEnabled" | "paymentSquareEnabled" | "smsNotificationsEnabled" | "backgroundCheckProvider" | "insuranceVerificationMode">>) => void | Promise<void>;
  onUpdateStaffPermissions: (patch: import("../../components/staff/StaffPermissionsPanel").StaffPermissionsPatch) => void | Promise<void>;
  onUpdateSupportStatus: (ticketId: string, status: import("../../types").SupportTicketStatus) => void | Promise<void>;
  openJob: (jobId: string) => void;
  openStaffProfile: (staffId: string) => void;
  overviewActions: import("../../lib/staffOps").OverviewActionItem[];
  overviewLiveJobs: import("../../lib/staffOps").OverviewLiveJob[];
  overviewWeeklyTrend: number[];
  payments: import("../../types").Payment[];
  platformCities: import("../../lib/platformCities").PlatformCity[];
  platformSettings: import("../../lib/platformSettings").PlatformSettings;
  renderStaffTeamPanel: (tier: "management" | "operations") => React.JSX.Element;
  requests: import("../../types").SecurityRequest[];
  section: "map" | "messages" | "support" | "profile" | "settings" | "guide" | "preferences" | "payments" | "guards" | "clients" | "team" | "jobs" | "overview" | "applications" | "credentials" | "management" | "incidents" | "team-chat" | "job-chats" | "platform-fees" | "staff-compensation" | "agreements" | "audit-log" | "disputes" | "violations" | "stats" | "analytics" | "permissions" | "integrations" | "cities" | "locations" | "dev-updates" | "business-plan" | "company-package";
  selectedClientId: string;
  selectedCredentialItemId: string;
  selectedGuardId: string;
  selectedJobChatRequestId: string;
  selectedJobId: string;
  selectedSupportTicketId: string;
  setSelectedClientId: (id: string) => void;
  setSelectedCredentialItemId: (id: string) => void;
  setSelectedGuardId: (id: string) => void;
  setSelectedJobId: (id: string) => void;
  setSelectedTeamId: (id: string) => void;
  setStaffMessagesChrome: (value: React.SetStateAction<import("../../lib/messagesChrome").MessagesChrome>) => void;
  shiftViolations: import("../../lib/staffOps").OpsShiftViolation[];
  showAnalytics: boolean;
  showCities: boolean;
  showDisputes: boolean;
  showFinance: boolean;
  showIncidents: boolean;
  showManagement: boolean;
  showMessages: boolean;
  showPayments: boolean;
  showPermissions: boolean;
  showStats: boolean;
  showSupportInbox: boolean;
  showViolations: boolean;
  staffMessages: import("../../types").StaffMessage[];
  stats: import("../../lib/staffOps").PlatformStats;
  supportTickets: import("../../types").SupportTicket[];
  tutorialActive: boolean;
  tutorialAvailable: boolean;
  tutorialCompleted: boolean;
}

export function renderStaffSection(mount: RenderStaffSectionBindings): ReactNode {
  const {
    activityFeed,
    actorStaffProfile,
    canApproveGuardAccounts,
    canApproveStaff,
    canEditJobListing,
    canManageClientAccounts,
    canManageGuardAccounts,
    canManageJobs,
    canReviewJobs,
    canStaffEditJobListings,
    canStaffJobs,
    canSuspend,
    canTrust,
    canVerifyGuardCredentials,
    clientLocations,
    clientMessages,
    clients,
    companyPublicDocuments,
    controlledPerformanceFactorId,
    controlledStaffGuardEdit,
    controlledStaffGuardTab,
    currentUser,
    disputes,
    guardMessages,
    guardPayoutInvoices,
    guards,
    handleStaffOpsItemHandled,
    incidentDetails,
    incidents,
    initialStaffMessagesTab,
    isDbConnected,
    jobChatMessages,
    jobChatThreads,
    jobLocations,
    legalAcceptances,
    navigateSection,
    onAddCertification,
    onAddClientProfile,
    onAddEducation,
    onAddExperience,
    onAddGuardProfile,
    onApproveCert,
    onApproveClient,
    onApproveClientCredential,
    onApproveGuardAccount,
    onApproveGuardApplication,
    onApproveGuardIdentityVerification,
    onApproveRequest,
    onApproveScheduleChange,
    onApproveScheduleChangeBilling,
    onApproveStaffAccount,
    onApproveVehicle,
    onAssignCityManager,
    onAttachCertificationImage,
    onBlockOneRoleCase,
    onCompletePayoutInvoice,
    onDeleteCertification,
    onDeleteClientAccount,
    onDeleteClientMessage,
    onDeleteGuardAccount,
    onDeleteGuardMessage,
    onDeleteJobChatMessage,
    onDeleteStaffMessage,
    onDeleteSupportMessage,
    onDeleteSupportTicket,
    onDenyGuardApplication,
    onDenyRequest,
    onEditJobListing,
    onIgnoreOneRoleCase,
    onMakeGuardPayoutAvailable,
    onMakeOvertimeGuardPayoutAvailable,
    onOpenDownload,
    onOpenLegal,
    onPerformanceFactorChange,
    onRefundPayment,
    onRejectCert,
    onRejectClient,
    onRejectClientCredential,
    onRejectGuardIdentityVerification,
    onRejectScheduleChange,
    onRejectStaffAccount,
    onRejectVehicle,
    onReleasePayout,
    onRequestCertImageResubmit,
    onRequestCertUpdate,
    onRequestClientApplicationRevision,
    onRequestCoiUpdate,
    onRequestGuardApplicationRevision,
    onRequestGuardIdResubmit,
    onResetAuditFailures,
    onResolveAuditViolation,
    onResolveDispute,
    onResolveOvertimeDispute,
    onReviewGuardInsurance,
    onRevokeGuardIdentityVerification,
    onSaveCompanyPublicDocument,
    onSaveJobLocation,
    onSectionChange,
    onSelectedJobChatRequestIdChange,
    onSelectedSupportTicketIdChange,
    onSendClientMessage,
    onSendGuardMessage,
    onSendJobChat,
    onSendStaffMessage,
    onSendSupportMessage,
    onSetClientTrusted,
    onSetCompanyPlacardPublicEnabled,
    onSetGuardTrusted,
    onStaffCreateJob,
    onStaffGuardEditChange,
    onStaffGuardTabChange,
    onStartTutorial,
    onSubmitGuardIdentityVerification,
    onUpdateBackgroundChecked,
    onUpdateCertification,
    onUpdateClientCredentialRules,
    onUpdateGuardIdImages,
    onUpdateGuardProfile,
    onUpdateGuardUserStatus,
    onUpdatePlatformCity,
    onUpdatePlatformSettings,
    onUpdatePublicInformation,
    onUpdateStaffIntegrations,
    onUpdateStaffPermissions,
    onUpdateSupportStatus,
    oneRoleCases,
    openJob,
    openStaffProfile,
    overviewActions,
    overviewLiveJobs,
    overviewWeeklyTrend,
    payments,
    platformCities,
    platformSettings,
    renderStaffTeamPanel,
    requests,
    section,
    selectedClientId,
    selectedCredentialItemId,
    selectedGuardId,
    selectedJobChatRequestId,
    selectedJobId,
    selectedSupportTicketId,
    setSelectedClientId,
    setSelectedCredentialItemId,
    setSelectedGuardId,
    setSelectedJobId,
    setSelectedTeamId,
    setStaffMessagesChrome,
    shiftViolations,
    showAnalytics,
    showCities,
    showDisputes,
    showFinance,
    showIncidents,
    showManagement,
    showMessages,
    showPayments,
    showPermissions,
    showStats,
    showSupportInbox,
    showViolations,
    staffMessages,
    stats,
    supportTickets,
    tutorialActive,
    tutorialAvailable,
    tutorialCompleted,
  } = mount;

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
      case 'company-package':
        return showManagement ? (
          <CompanyPackagePage />
        ) : (
          <AppBlockedAccessScreen
            title={STAFF_SECTION_ACCESS_MESSAGES['company-package']!.title}
            message={STAFF_SECTION_ACCESS_MESSAGES['company-package']!.message}
            placeholders={['Executive summary', 'Counsel intake form', 'Company package PDF']}
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
            onUpdateStaffMarketplaceCap={
              onUpdatePlatformSettings
                ? async (staffMarketplaceCap) =>
                    onUpdatePlatformSettings({ ...platformSettings, staffMarketplaceCap })
                : undefined
            }
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
}
