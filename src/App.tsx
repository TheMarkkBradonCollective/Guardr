/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import {
  SecurityGuard,
  SecurityRequest,
  JobGuardSlot,
  Certification,
  Client,
  SessionUser,
  Payment,
  PaymentStatus,
  Experience,
  GuardEducation,
  GuardPayoutInvoice,
  SupportTicket,
  CreateSupportTicketInput,
  SupportTicketStatus,
  StaffRole,
  StaffSideRole,
  JobChatThread,
  JobChatMessage,
  StaffMessage,
  GuardMessage,
  ClientMessage,
  GuardInsurancePolicy,
  GuardWeaponGearId,
  GuardEquipmentGearId,
  JobType,
  ClientLocation,
  JobLocation,
  AssignmentMode,
  DifferentialPayRates,
  UserNotification,
  ClientType,
} from './types';
import { canManageCompanyOperations, canRecordCashPayments, canAccessFinancialControls, canManagePlatformSettings, canManageStaffPermissions, canManageStaffPlatformContent, hasExecutivePaymentControls, isStaffRole, isExecutiveOpsRole, isFounder, canAssignStaffRole, canAssignStaffSideRole, canModerateStaffMember, canDeleteResolvedSupportChat, canReviewJobRequests, canManageGuards, canApproveGuards, canVerifyCredentials, canManageClients, canHandleDisputes, canSuspendUsers, canSetTrustedStatus, canProposeStaffAccounts, canApproveStaffAccounts, setStaffRolePermissionOverrides, resolvePlatformRole, staffSectionForStaffMember, isStaffMemberVisibleToViewer } from './lib/permissions';
import { canClientConfirmSelfAudit } from './lib/selfAuditPhotos';
import {
  createIncidentReportDetail,
  incidentChatSummary,
  IncidentReportFormInput,
} from './lib/incidentReports';
import {
  createClientViolationReport,
  clientViolationCategoryLabel,
} from './lib/clientViolations';
import type { ClientViolationReportInput } from './components/client/ClientViolationReportSheet';
import type { StaffCreateJobInput } from './components/staff/StaffCreateJobForm';
import type { StaffPermissionsPatch } from './components/staff/StaffPermissionsPanel';
import { formatCityLabel, normalizeGuardServiceAreas, resolveJobCity } from './lib/californiaCities';
import {
  canDirectorMarkClientPaidCash,
  canDirectorMarkOvertimePaidCash,
  canDirectorPayOvertimeGuardCash,
  canMakeOvertimeGuardPayoutAvailable,
  canStaffApproveOvertimeCashPayment,
  overtimeGuardEarnings,
  canDirectorPayGuardCash,
  canDirectorMarkCashDepositManually,
  canDirectorMarkPlatformFeePaidCash,
  canMakeGuardPayoutAvailable,
  canStaffManuallyReleaseGuardPayout,
  canStaffApproveClientCashPayment,
  getManualCashDepositDue,
  getPlatformFeeAmount,
  getRequiredStripeDeposit,
  guardPayoutAmount,
  isCashClientPayment,
  parsePaymentMethod,
} from './lib/cashPayments';
import { hasJobCoordinates, isJobLocationCoordsMissing, jobMapCoordsApprovalBlocker, resolveJobMapCoordinates } from './lib/jobLocation';
import { ChangePasswordPrompt } from './components/auth/ChangePasswordPrompt';
import {
  provisionedPasswordFields,
  setStoredPassword,
  shouldPromptPasswordChange,
  STAFF_PROVISIONED_DEFAULT_PASSWORD,
} from './lib/accountPasswords';
import { AccountPendingScreen } from './components/account/AccountPendingScreen';
import { StaffAccountPendingScreen } from './components/staff/StaffAccountPendingScreen';
import { GuardDashboard } from './components/GuardDashboard';
import { StaffDashboard, type StaffSectionSelection } from './components/StaffDashboard';
import { HomePage } from './components/HomePage';
import { AppHomeScreen } from './components/AppHomeScreen';
import { AppGuidePage } from './components/docs/AppGuidePage';
import { AuthPage } from './components/AuthPage';
import { AuthRoleChoicePage } from './components/auth/AuthRoleChoicePage';
import {
  clientDisplayName,
  clientWorkspaceLabel,
  normalizeClientType,
} from './lib/clientType';
import { resolveAllowedClientView } from './lib/clientCapabilities';
import { parseAuthorizedContacts } from './lib/clientAuthorizedContacts';
import {
  clientJobCredentialBlocker,
  parseClientCredentials,
  replaceClientCredential,
  upsertClientCredential,
} from './lib/clientCredentials';
import type { ClientCredential } from './types';
import { LoadingScreen } from './components/LoadingScreen';
import { ClientAppLayout } from './components/layouts/ClientAppLayout';
import { ClientCapabilitiesProvider } from './components/client/ClientCapabilitiesContext';
import { AccountMenu, type AccountMenuNotificationProps } from './components/layouts/AccountMenu';
import { ClientDashboard } from './components/ClientDashboard';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from './lib/messagesChrome';
import { InstallPrompt } from './components/InstallPrompt';
import { supabase, isSupabaseConnected } from './lib/supabase';
import { useSupabaseRealtimeSync } from './lib/useSupabaseRealtime';
import { useMessageRealtimeSync } from './lib/messageRealtime';
import { useUserNotificationsRealtime } from './lib/useUserNotificationsRealtime';
import { useRequestLiveLocationRealtime } from './lib/useRequestLiveLocationRealtime';
import { beginLocalMutation, shouldSkipRealtimeSync } from './lib/dbMutationGuard';
import {
  getGuardMissingGraceCredentialLabels,
} from './lib/guardMissingCredentials';
import {
  getPendingGuardAccountReviews,
  guardAccountApprovalBlockers,
  guardAccountActivationBlockers,
  resolveGuardRestoreUserStatus,
} from './lib/guardAccountActivation';
import {
  guardAutoActivated,
  guardAutoActivationRowPatch,
  withAutoGuardActivation,
} from './lib/guardAutoActivation';
import {
  processGuardCredentialGraceBatch,
  syncGuardCredentialGraceState,
} from './lib/guardCredentialGrace';
import {
  processGuardCredentialExpiryBatch,
  syncGuardCredentialExpiryState,
} from './lib/guardCredentialExpiryEnforcement';
import { useSystemBackButtonBootstrap } from './lib/useSystemBackButton';
import {
  consumeOverlayPopState,
  registerSystemBackHandler,
} from './lib/systemBackButton';
import { closeTopmostDialog } from './components/ui/motion/AppMotion';
import { dismissAppConfirm } from './components/ui/AppConfirm';
import {
  AddCertificationResult,
  normalizeCertNumber,
  validateCertNumberAvailable,
} from './lib/certUniqueness';
import { validateCertDeletion, validateCertImageAttachment, guardCertificationCanEdit, certImageIsLocked, validateCertSubmission, certDatabaseErrorMessage, staffCanVerifyCertification, staffVerifyCertificationBlocker } from './lib/certImagePolicy';
import {
  STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE,
  STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE,
  staffCanEditCertification,
  staffCanEditGuardCoi,
  staffCanEditGuardGovernmentId,
} from './lib/staffCredentialRules';
import { insertCertificationRow, updateCertificationRow } from './lib/certDatabaseWrite';
import {
  CERTIFICATION_METADATA_COLUMNS,
  certNeedsImageHydration,
  collectCertIdsNeedingImageHydration,
  fetchCertificationImagesByCertIds,
  mergeCertificationImagesByCertId,
} from './lib/certificationLoad';
import { resolveCredentialFeedContext } from './lib/staffApprovalsFeed';
import type { CertUpdatePayload } from './components/credentials/CertDetailModal';
import type { CertImageMutationResult } from './lib/certImagePolicy';
import { credentialRequiresExpiry, resolveCertCatalogId } from './lib/certCatalog';
import {
  buildCertImageResubmitReason,
  buildCertUpdateRequestReason,
  buildIdResubmitReason,
  GUARD_APPLICATION_REJECT_DEFAULT_REASON,
  type IdVerificationSlot,
} from './lib/staffDocumentReview';
import {
  certRevisionDbPatch,
  certHasPendingUpdate,
  certUpdateSubmissionAllowed,
  pendingUpdateFromPayload,
  prependCertRevision,
  snapshotCertRevision,
  parseCertificationPendingUpdate,
  parseCertificationRevisionHistory,
} from './lib/certRevisionHistory';
import {
  prependCoiRevision,
  snapshotCoiRevision,
} from './lib/coiRevisionHistory';
import {
  prependGovIdRevision,
  parseGovIdRevisionHistory,
  snapshotGovIdRevision,
} from './lib/govIdRevisionHistory';
import {
  getGuardIdVerificationStatus,
  staffApproveIdVerificationBlocker,
  staffCanApproveIdVerification,
  staffCanRequestIdResubmit,
  guardIdVerificationCanEdit,
  GOV_ID_SUBMITTED_LOCKED_MESSAGE,
} from './lib/guardIdentityVerification';
import { parseInventoryEquipmentJson, parseInventoryUniformsJson } from './lib/guardInventory';
import { guardApplicationCredentialVerificationBlocker } from './lib/guardApplicationIntake';
import { computeDurationHours, formatShiftRange } from './lib/dates';
import { normalizeJobStatus } from './lib/jobStatus';
import { computeGuardPay, computeJobBilling, feeConfigFromJobSnapshot, LEGACY_PLATFORM_FEE_PER_HOUR, rebillJobFromSnapshot, resolvePlatformFeePerHour } from './lib/payments';
import {
  acceptGuardPriceOffer,
  appendGuardPriceOffer,
  applyAgreedOfferToJobBilling,
  createPriceOffer,
  getAgreedPriceOffer,
  getGuardNegotiation,
  isOpenContractPricing,
} from './lib/agreementPricing';
import { getGuardPayoutHistory, getGuardVisibleJobs, toGuardJobView } from './lib/guardJobView';
import { getGuardStripePayoutEligibleJobs } from './lib/guardPayoutInvoice';
import {
  createGuardPayoutInvoiceRecord,
  loadGuardPayoutInvoicesFromStorage,
  maybeCompletePayoutInvoice,
  saveGuardPayoutInvoicesToStorage,
} from './lib/guardPayoutInvoiceStorage';
import { guardHasApplied } from './lib/jobApplications';
import { listingDetailDbColumns, buildJobListingDbPayload, hasOperationalListingChange, mergeJobListingUpdates } from './lib/jobListing';
import { normalizeJobOperationalDetails, operationalDetailsDbValue } from './lib/jobOperationalDetails';
import { checkJobRequirements, guardCanApplyToJob } from './lib/guardJobs';
import {
  acceptReplacementOffer,
  createReplacementRequest,
  findReplacementCandidates,
  startReplacementOffers,
} from './lib/emergencyReplacement';
import { jobsNeedingNoShowReplacement } from './lib/noShowDetection';
import { guardScheduleConflictError } from './lib/guardSchedule';
import {
  isAwaitingClientGuardApproval,
  removeGuardFromApplicants,
  shouldSkipClientGuardApproval,
  shouldSkipStaffGuardReview,
} from './lib/guardAssignment';
import { isGuardTrusted } from './lib/guardTrust';
import {
  attachSlotsToRequests,
  hasIndependentSlotsPendingClient,
  isMultiGuardJob,
  slotFromDbRow,
} from './lib/guardTeams';
import {
  clientApproveTeamSlot,
  clientDenyTeamSlot,
  ensureSlotIds,
  proposeIndependentGuardToClient,
  staffApproveIndependentSlot,
  applyTrustedRevocationToJobs,
  jobAffectedByTrustedRevocation,
} from './lib/guardTeamFlow';
import {
  markAllNotificationsRead,
  markNotificationClicked,
  upsertNotification,
} from './lib/notificationInbox';
import { resolveNotificationDestination, remapNotificationUrlForUser } from './lib/notificationRouting';
import { registerInboxPersistHandler } from './lib/inboxPersistBridge';
import {
  appendInboxNotification,
  loadUserNotifications,
  persistUserNotifications,
} from './lib/userNotificationStore';
import {
  persistJobGuardSlots,
  persistJobSlotMeta,
  teamJobReadyForAcceptance,
} from './lib/guardTeamDb';
import {
  guardWorkBlockedMessage,
  isDisallowedCombinedGuardCertificate,
  sanitizeGuardCombinedCertificates,
} from './lib/guardQualification';
import { findGuardProfileForUser, getBrowsableGuards, guardHasWorkedWithClient } from './lib/guardDirectory';
import { isInactiveGuardSession } from './lib/guardActivationSync';
import { isClientAccountPending } from './lib/accountStatus';
import { holdJobPayment, releasePayout, refundPayment, createTipCheckoutSession } from './lib/stripeApi';
import { ThemeMode, applyThemeToDocument, hasPerUserThemePreference, loadTheme, normalizeThemeMode, saveTheme } from './lib/platform/theme';
import { isAppExperience } from './lib/platform/appExperience';
import { ProfileSavePayload, UserProfileScreen } from './components/profile/UserProfileScreen';
import { UserSettingsScreen } from './components/profile/UserSettingsScreen';
import { personNameFromPayload, resolvePersonNameParts } from './lib/personName';
import {
  getClientAccountStatus,
  getGuardUserStatus,
  isGuardAccountApproved,
  isGuardAccountPending,
} from './lib/accountStatus';
import { isGuardAccountActive } from './lib/guardAccountActivation';
import { updateGuardAccountRow } from './lib/guardDatabaseWrite';
import {
  assertClientApplicationContactEditable,
  assertGuardApplicationIntakeEditable,
  guardApplicationIntakeChanges,
  clientApplicationContactChanges,
} from './lib/applicationIntakeLock';
import { removeStoredPassword } from './lib/accountPasswords';
import { writeAuditLog } from './lib/auditLog';
import { signOutAuth } from './lib/auth/authService';
import { getTourForRole, migrateLegacyTourCompletion } from './lib/onboardingTours';
import { TutorialExperience } from './components/onboarding/OnboardingTour';
import {
  advanceTutorialStep,
  declineTutorial,
  endTutorial,
  isTutorialActive,
  loadTutorialState,
  restartTutorial,
  retreatTutorialStep,
  shouldOfferTutorialPrompt,
  startTutorialSession,
  type TutorialPersistedState,
} from './lib/tutorialSession';
import { isTutorialDemoId, mergeTutorialRequests } from './lib/tutorialDemoData';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useStaffActivityTimeTracker } from './hooks/useStaffActivityTimeTracker';
import { emitStaffTravelAction, trackStaffWorkActionForUser } from './lib/staffWorkActivity';
import { scanAllGuardsCompliance } from './lib/complianceAlerts';
import { SupportComposePage } from './components/support/SupportComposePage';
import { SupportReportPage } from './components/support/SupportReportPage';
import {
  appendMessage,
  removeSupportTicketMessage,
  ACTIVATION_SUPPORT_SUBJECT,
  buildActivationSupportTicketForGuard,
  buildMissingActivationSupportTickets,
  buildNewTicket,
  findActivationSupportChat,
  guardNeedsActivationSupportChat,
  listGuardsNeedingActivationSupport,
  resolveActivationSupportTicketsForGuard,
  isDeletableResolvedSupportChat,
  loadSupportTicketsFromStorage,
  saveSupportTicketsToStorage,
} from './lib/support';
import {
  approvedJobGuardIds,
  buildJobChatMessage,
  buildJobChatThread,
  guardParticipatesInJobChat,
  loadJobChatMessagesFromStorage,
  loadJobChatThreadsFromStorage,
  saveJobChatMessagesToStorage,
  saveJobChatThreadsToStorage,
  threadForRequest,
  removeJobChatMessage,
} from './lib/jobChat';
import { clientMessagesBadge, clientSupportBadge } from './lib/messagesInbox';
import {
  buildGuardMessage,
  canPostToGuardChat,
  canReadGuardChat,
  loadGuardMessagesFromStorage,
  appendGuardMessage,
  saveGuardMessagesToStorage,
  sortedGuardMessages,
  removeGuardMessage,
} from './lib/guardMessenger';
import { fetchGuardMessagesFromApi, postGuardMessageToApi, deleteGuardMessageFromApi } from './lib/guardMessagesApi';
import {
  buildClientMessage,
  canPostToClientChat,
  canReadClientChat,
  loadClientMessagesFromStorage,
  appendClientMessage,
  saveClientMessagesToStorage,
  sortedClientMessages,
  removeClientMessage,
} from './lib/clientMessenger';
import { fetchClientMessagesFromApi, postClientMessageToApi, deleteClientMessageFromApi } from './lib/clientMessagesApi';
import {
  buildStaffMessage,
  loadStaffMessagesFromStorage,
  appendStaffMessage,
  saveStaffMessagesToStorage,
  sortedStaffMessages,
  removeStaffMessage,
} from './lib/staffMessenger';
import { fetchStaffMessagesFromApi, postStaffMessageToApi, deleteStaffMessageFromApi } from './lib/staffMessagesApi';
import { canDeleteChatMessage } from './lib/chatPermissions';
import { mapStaffRowToSecurityGuard } from './lib/staffAccounts';
import { withAutoStaffActivation, staffAutoActivationRowPatch } from './lib/staffAutoActivation';
import { staffNeedsCredentialCompletion } from './lib/staffAccountActivation';
import { isManagementStaffMember } from './lib/permissions';
import { getConnectAccountStatus } from './lib/stripeApi';
import { isAutoGeneratedStaffBio } from './lib/staffProfile';
import {
  assertStaffPersonalEmailAvailable,
  assertStaffPersonalEmailDistinctFromWork,
  normalizeOptionalStaffEmail,
} from './lib/staffEmail';
import {
  nextFinanceDeskBadgeNumberForChange,
  nextStaffBadgeNumberForRoleChange,
  validateFinanceDeskBadgeNumber,
  validateStaffBadgeNumber,
} from './lib/staffBadgeNumber';
import {
  generateGuardIndependentContractorNumber,
  normalizeGuardIndependentContractorNumber,
} from './lib/guardContractorNumber';
import {
  listenForPushNavigation,
  listenForPushSubscriptionChange,
  syncPushSubscriptionWithServer,
} from './lib/push';
import { reportPushEvent } from './lib/pushApi';
import {
  clientInvoiceFromRow,
  createApprovedJobInvoice,
  invoiceReadyNotificationBody,
  invoiceReadyNotificationUrl,
  loadClientInvoicesFromStorage,
  persistClientInvoiceToDb,
  saveClientInvoicesToStorage,
  syncInvoicePaymentStatus,
  unpaidClientInvoices,
  upsertClientInvoice,
} from './lib/clientInvoiceStorage';
import type { ClientInvoice } from './lib/clientInvoicing';
import { evaluateCheckInEscalation, checkInEscalationDedupKey } from './lib/checkInEscalation';
import { notifyOpenJobToGuards } from './lib/openJobNotifications';
import { jobUsesFirstToAccept } from './lib/assignmentMode';
import { appendPostOrdersAck, jobRequiresPostOrdersAck } from './lib/postOrdersAck';
import { appendBriefingAck, guardAcknowledgedBriefing, jobHasBriefingContent } from './lib/briefingAck';
import {
  createClientCheckpointFlag,
  createNotReadyBriefingViolation,
  flagReasonLabel,
  markCheckpointVerified,
  mergeShiftAuditViolations,
  processAutoUpholdDisputes,
  resolveAuditViolation,
  submitGuardDispute,
} from './lib/shiftAuditViolations';
import {
  canGuardStartEnRoute,
  evaluatePreShiftBriefingReminder,
  preShiftBriefingReminderCopy,
  preShiftBriefingReminderDedupKey,
} from './lib/preShiftBriefing';
import { resolveGuardPayForJob } from './lib/differentialPay';
import { approveClientLocation, rejectClientLocation } from './lib/clientLocations';
import {
  ensureSharedJobLocation,
  ensureSharedLocationFromClientLocation,
  jobLocationRowToRecord,
  jobLocationToDbRow,
} from './lib/jobLocations';
import { isJobType, normalizeJobTypePreferences } from './lib/guardJobPreferences';
import { normalizeJobTypeOnboarding } from './lib/guardJobTypeOnboarding';
import { normalizeListedEquipmentGear } from './lib/guardEquipmentGear';
import {
  notifyAccountUpdate,
  notifyAssignedGuards,
  notifyGuardAppliedToJob,
  notifyJobStatusUpdate,
  notifyPayoutReady,
  notifyStaffAttention,
} from './lib/operationalPush';
import {
  notifyDisputeResolution,
  notifySupportTicketCreated,
  notifySupportTicketStatus,
} from './lib/supportNotifications';
import { playWalkieChirpSound } from './lib/walkieChirpSound';
import {
  normalizeGuardTabForAccount,
  clearPersistedAppRoute,
  defaultRouteForRole,
  buildAppPath,
  isAuthOnlyRoute,
  parseAppRoute,
  persistAppRoute,
  readAppRouteFromPopState,
  readAppRouteFromWindow,
  readAuthChoiceFromUrl,
  readAuthChoiceFromWindow,
  readAuthSignupPickFromUrl,
  readAuthSignupPickFromWindow,
  readLegalPageFromUrl,
  readLegalPageFromWindow,
  readGuideFromUrl,
  readGuideFromWindow,
  resolveAppRouteForUser,
  stripEphemeralQueryParams,
  syncAppRoute,
  syncAuthChoiceRoute,
  navigateHistoryBack,
  syncGuidePage,
  syncLegalPage,
  type AppRole,
  type AppRoute,
  type ClientJobsTab,
  type StaffGuardDetailTab,
  type AuthViewMode,
  type AuthViewRole,
  type AuthSignupPick,
} from './lib/appNavigation';
import type { LegalPageId } from './lib/legalContent';
import { CURRENT_LEGAL_VERSIONS, requiredLegalDocumentsForRole } from './lib/legalContent';
import { LegalPage } from './components/legal/LegalPage';
import { AppDownloadScreen } from './components/app/AppDownloadScreen';
import { LegalAcceptanceModal } from './components/legal/LegalAcceptanceModal';
import {
  indexLegalAcceptances,
  legalAcceptanceFromRow,
  legalAcceptanceToDbRow,
  legalAcceptanceKey,
  resolveLegalAcceptanceUserId,
  resolveLegalAcceptanceUserIds,
  type LegalAcceptanceRecord,
  type LegalUserRole,
} from './lib/legalAcceptance';
import { buildJobServiceAgreement, parseJobServiceAgreement } from './lib/jobServiceAgreement';
import {
  captureCertApplicationSnapshot,
  captureCoiApplicationSnapshot,
  captureGovIdApplicationSnapshot,
  parseApplicationSubmissionSnapshot,
  sealApplicationSubmissionSnapshot,
  unsealApplicationSubmissionSnapshot,
} from './lib/applicationSubmissionSnapshot';
import {
  insurancePolicyFromRow,
  insurancePolicyToDbRow,
  isUserSubmittedPendingInsurance,
  resolveInsuranceStatus,
  guardCoiCanGuardEdit,
  COI_SUBMITTED_LOCKED_MESSAGE,
} from './lib/guardInsurance';
import {
  vehicleInsurancePolicyFromRow,
  vehicleInsurancePolicyToDbRow,
} from './lib/guardVehicleInsurance';
import {
  vehicleProfileFromRow,
  vehicleProfileToDbRow,
  staffApproveVehicleBlocker,
} from './lib/guardVehicle';
import {
  computeAutoPayoutScheduledAt,
  isAutoPayoutDue,
  shouldScheduleAutoStripePayout,
} from './lib/autoPayout';
import { showAppToast } from './components/ui/AppToast';
import { showAppConfirm } from './components/ui/AppConfirm';

function appToast(message: string, tone: 'success' | 'error' | 'info' = 'error') {
  showAppToast(message, { tone });
}
import type { PerformanceFactorId } from './lib/guardPerformanceFactorDetail';
import type { GuardTab, GuardSupportMode } from './components/GuardDashboard';
import type { ClientView } from './components/ClientDashboard';
import { resolveStaffRouteSection, isStaffMessagesSection, type StaffSection } from './lib/staffOps';
import {
  buildLocationLabel,
  canClientEditJobListing,
  canClientEditRequest,
  canClientRequestCashPayment,
  canClientReschedulePaidSchedule,
  canStaffReschedulePaidSchedule,
  canEditJobTitleAndLocation,
  canStaffEditJobTitleAndLocation,
  canStaffEditJobMapCoordinates,
  isJobPaid,
  jobEditBlockedReason,
  sanitizeJobListingUpdates,
  validateShiftSchedule,
} from './lib/jobEditRules';
import {
  clearScheduleChangePending,
  computeScheduleChangeExtraAmount,
  guardsToNotifyForScheduleChange,
  hasScheduleDateChange,
  jobHasAssignedOrOnDutyGuards,
  pendingScheduleChangeFromJob,
  resolveScheduleChangeAfterApproval,
  resolveScheduleChangeFromUpdate,
  scheduleChangePendingDbColumns,
  scheduleChangeRequiresStaffApproval,
} from './lib/jobScheduleChange';
import {
  clientPaymentGates,
  feeConfigForClientJob,
  loadPlatformSettingsFromStorage,
  normalizePlatformSettings,
  platformAllowsStripe,
  platformAllowsCash,
  platformSettingsFromDbRow,
  platformSettingsToDbRow,
  savePlatformSettingsToStorage,
  type PlatformSettings,
} from './lib/platformSettings';
import {
  buildDefaultPlatformCities,
  mergeMissingPlatformCities,
  platformCityFromRow,
  platformCityToDbRow,
  setPlatformCitiesCache,
  staffCanManageCity,
  type CityMarketStatus,
  type CityWaitlistAudience,
  type PlatformCity,
} from './lib/platformCities';
import type { CityCredentialResourceLinks } from './lib/cityCredentialLinks';
import {
  companyPublicDocumentFromRow,
  companyPublicDocumentToDbRow,
  getCompanyPlacardPublicItems,
  type CompanyPublicDocument,
} from './lib/companyPlacard';
import {
  canEditJobListingDetails,
  canAssignStaffCityAccess,
  canEditStaffProfile,
  canManageCityMarkets,
  canRecommendCityMarket,
} from './lib/permissions';
import {
  normalizeStaffManagedCitiesForRole,
  validateStaffCityAssignment,
} from './lib/staffCityAccess';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
} from './lib/shiftWindow';
import { activeShiftBreak } from './lib/shiftBreaks';
import {
  detectLateClockOutOvertime,
  computeEarlyClockOutRefund,
  applyOvertimePaidBilling,
  computeOvertimeAmount,
  validateDisputeClaimedClockOut,
  type OvertimeDisputeInput,
} from './lib/shiftBilling';

function appRoleForUser(user: SessionUser): AppRole | null {
  if (user.role === 'client') return 'client';
  if (user.role === 'guard') return 'guard';
  if (isStaffRole(user.role)) return 'staff';
  return null;
}

function routeMatchesUser(route: AppRoute, user: SessionUser): boolean {
  const role = appRoleForUser(user);
  return !!role && route.role === role;
}

export default function App() {
  // ── Session ────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    try { const s = localStorage.getItem('guardr_current_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isAuthView, setIsAuthView]       = useState(() => {
    if (readAuthChoiceFromWindow()) return false;
    return !!readAppRouteFromWindow()?.authView;
  });
  const [initialAuthRole, setInitialAuthRole] = useState<AuthViewRole>(
    () => readAppRouteFromWindow()?.authRole ?? 'client'
  );
  const [initialAuthMode, setInitialAuthMode] = useState<'sign-in' | 'sign-up'>(
    () => readAuthChoiceFromWindow() ?? readAppRouteFromWindow()?.authView ?? 'sign-in'
  );
  const [authChoiceMode, setAuthChoiceMode] = useState<'sign-in' | 'sign-up' | null>(
    () => readAuthChoiceFromWindow()
  );
  const [authSignupPick, setAuthSignupPick] = useState<AuthSignupPick | null>(
    () => readAuthSignupPickFromWindow()
  );
  const [initialClientType, setInitialClientType] = useState<ClientType>(
    () => readAppRouteFromWindow()?.authClientType ?? 'business'
  );
  const [legalPage, setLegalPageState] = useState<LegalPageId | null>(() => readLegalPageFromWindow());
  const [downloadPageOpen, setDownloadPageOpen] = useState(false);
  const [publicGuideOpen, setPublicGuideOpen] = useState(
    () => !isAppExperience() && readGuideFromWindow()
  );
  const [legalReturnAuth, setLegalReturnAuth] = useState(false);
  const [legalAcceptanceKeys, setLegalAcceptanceKeys] = useState<Set<string>>(() => new Set());
  const [legalAcceptanceRecords, setLegalAcceptanceRecords] = useState<LegalAcceptanceRecord[]>([]);
  const [companyPublicDocuments, setCompanyPublicDocuments] = useState<CompanyPublicDocument[]>([]);
  const [tutorialState, setTutorialState] = useState<TutorialPersistedState | null>(null);

  // ── Theme ──────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadTheme());
  const changeThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode, currentUser?.id);
    applyThemeToDocument(mode);
    if (currentUser) {
      setGuards((prev) =>
        prev.map((guard) =>
          guard.id === currentUser.id ? { ...guard, themePreference: mode } : guard
        )
      );
      setClients((prev) =>
        prev.map((client) =>
          client.id === currentUser.id ? { ...client, themePreference: mode } : client
        )
      );
    }
    if (isDbConnected && currentUser) {
      const table =
        currentUser.role === 'client'
          ? 'clients'
          : isStaffRole(currentUser.role)
            ? 'staff'
            : 'guards';
      try {
        await supabase.from(table).update({ theme_preference: mode }).eq('id', currentUser.id);
      } catch {
        /* theme_preference column may not exist yet */
      }
    }
  };

  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!isAuthView) {
      document.documentElement.classList.remove('auth-page-open');
    }
  }, [isAuthView]);

  useEffect(() => {
    if (!currentUser) return;
    const local = loadTheme(currentUser.id);
    setThemeMode(local);
    applyThemeToDocument(local);
  }, [currentUser?.id]);

  // ── DB state ───────────────────────────────────────────────
  const [guards,   setGuards]   = useState<SecurityGuard[]>([]);
  const guardsRef = useRef(guards);
  guardsRef.current = guards;
  const staffActivityTarget = useMemo(() => {
    if (!currentUser || !isStaffRole(currentUser.role)) return null;
    const staffMember = guards.find((guard) => guard.id === currentUser.id && guard.isStaff);
    if (!staffMember) return null;
    return { staffId: currentUser.id, staffName: staffMember.name };
  }, [currentUser, guards]);
  useStaffActivityTimeTracker(staffActivityTarget);
  const certImageHydrationRef = useRef(new Set<string>());
  const activationSupportBackfillRunningRef = useRef(false);
  const activationSupportCreationInFlightRef = useRef(new Set<string>());
  const [clients,  setClients]  = useState<Client[]>([]);
  const [requests, setRequests] = useState<SecurityRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadSupportTicketsFromStorage());
  const [jobChatThreads, setJobChatThreads] = useState<JobChatThread[]>(() => loadJobChatThreadsFromStorage());
  const [jobChatMessages, setJobChatMessages] = useState<JobChatMessage[]>(() => loadJobChatMessagesFromStorage());
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>(() => loadStaffMessagesFromStorage());
  const [guardMessages, setGuardMessages] = useState<GuardMessage[]>(() => loadGuardMessagesFromStorage());
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>(() => loadClientMessagesFromStorage());
  const missedCheckinNotifiedRef = useRef<Set<string>>(new Set());
  const preShiftBriefingNotifiedRef = useRef<Set<string>>(new Set());
  const [guardPayoutInvoices, setGuardPayoutInvoices] = useState<GuardPayoutInvoice[]>(() =>
    loadGuardPayoutInvoicesFromStorage()
  );
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() =>
    loadPlatformSettingsFromStorage()
  );
  useEffect(() => {
    setStaffRolePermissionOverrides(platformSettings.staffRolePermissions);
  }, [platformSettings.staffRolePermissions]);
  const [platformCities, setPlatformCities] = useState<PlatformCity[]>(() => {
    const defaults = buildDefaultPlatformCities();
    setPlatformCitiesCache(defaults);
    return defaults;
  });
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [clientLocations, setClientLocations] = useState<ClientLocation[]>([]);
  const [jobLocations, setJobLocations] = useState<JobLocation[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [passwordChangePromptOpen, setPasswordChangePromptOpen] = useState(false);

  const initialRoute = readAppRouteFromWindow();
  const [clientView, setClientViewState] = useState<ClientView>(
    () => (initialRoute?.role === 'client' ? initialRoute.clientView : undefined) ?? 'home'
  );
  const [guardTab, setGuardTabState] = useState<GuardTab>(
    () => (initialRoute?.role === 'guard' ? initialRoute.guardTab : undefined) ?? 'map'
  );
  const [staffSection, setStaffSectionState] = useState<StaffSection>(() => {
    if (initialRoute?.role !== 'staff') return 'overview';
    return resolveStaffRouteSection(
      initialRoute.staffSection,
      initialRoute.staffApprovalQueue,
      initialRoute.staffMessageTab
    );
  });
  const [staffGuardId, setStaffGuardIdState] = useState<string | null>(
    () => initialRoute?.staffGuardId ?? null
  );
  const [staffClientId, setStaffClientIdState] = useState<string | null>(
    () => initialRoute?.staffClientId ?? null
  );
  const [staffJobId, setStaffJobIdState] = useState<string | null>(
    () => initialRoute?.staffJobId ?? null
  );
  const [staffCredentialItemId, setStaffCredentialItemIdState] = useState<string | null>(
    () => initialRoute?.staffCredentialItemId ?? null
  );
  const [staffTeamId, setStaffTeamIdState] = useState<string | null>(
    () => initialRoute?.staffTeamId ?? null
  );
  const [staffEdit, setStaffEditState] = useState(
    () => initialRoute?.staffEdit ?? false
  );
  const [staffGuardTab, setStaffGuardTabState] = useState<StaffGuardDetailTab>(
    () => initialRoute?.staffGuardTab ?? 'profile'
  );
  const [performanceFactorId, setPerformanceFactorIdState] = useState<PerformanceFactorId | null>(
    () => initialRoute?.performanceFactorId ?? null
  );
  const [clientGuardId, setClientGuardIdState] = useState<string | null>(
    () => initialRoute?.clientGuardId ?? null
  );
  const [clientDirectGuardId, setClientDirectGuardIdState] = useState<string | null>(
    () => initialRoute?.clientDirectGuardId ?? null
  );
  const [clientRequestsSelectedId, setClientRequestsSelectedIdState] = useState<string | null>(() => {
    if (initialRoute?.role === 'client' && initialRoute.clientView === 'requests') {
      if (initialRoute.clientJobId) return initialRoute.clientJobId;
      if (initialRoute.jobChatRequestId && !initialRoute.openJobChat) {
        return initialRoute.jobChatRequestId;
      }
    }
    return null;
  });
  const [clientRequestsJobTab, setClientRequestsJobTabState] = useState<ClientJobsTab>(
    () =>
      initialRoute?.role === 'client' && initialRoute.clientJobsTab
        ? initialRoute.clientJobsTab
        : 'open'
  );
  const [guardSelectedJobId, setGuardSelectedJobIdState] = useState<string | null>(
    () =>
      initialRoute?.role === 'guard' ? initialRoute.guardJobId ?? null : null
  );
  const [guardBrowseTab, setGuardBrowseTabState] = useState<
    import('./lib/guardJobsBrowse').GuardJobsBrowseTab
  >(() =>
    initialRoute?.role === 'guard' && initialRoute.guardJobsTab
      ? initialRoute.guardJobsTab
      : 'available'
  );
  const [clientInvoiceRequestId, setClientInvoiceRequestIdState] = useState<string | null>(
    () =>
      initialRoute?.role === 'client' && initialRoute.clientView === 'invoices'
        ? initialRoute.clientInvoiceRequestId ?? null
        : null
  );
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>(() =>
    loadClientInvoicesFromStorage()
  );
  const [clientMessagesDetailOpen, setClientMessagesDetailOpen] = useState(false);
  const [clientMessagesChrome, setClientMessagesChrome] = useState<MessagesChrome>(EMPTY_MESSAGES_CHROME);
  const [clientTeamDetailOpen, setClientTeamDetailOpen] = useState(false);

  useEffect(() => {
    if (clientView !== 'messages') {
      setClientMessagesChrome(EMPTY_MESSAGES_CHROME);
    }
  }, [clientView]);

  useEffect(() => {
    if (clientView !== 'guards') setClientTeamDetailOpen(false);
  }, [clientView]);
  const [jobChatRequestId, setJobChatRequestIdState] = useState<string | null>(
    () => initialRoute?.jobChatRequestId ?? null
  );
  const [staffMessagesTab, setStaffMessagesTabState] = useState<'team' | 'jobs' | null>(
    () => initialRoute?.staffMessageTab ?? null
  );
  const [supportTicketId, setSupportTicketIdState] = useState<string | null>(
    () => initialRoute?.supportTicketId ?? null
  );
  const [supportSection, setSupportSectionState] = useState<'support' | 'reports'>(
    () => initialRoute?.supportSection ?? 'support'
  );
  const [supportMode, setSupportModeState] = useState<GuardSupportMode | null>(
    () => initialRoute?.supportMode ?? null
  );
  const [openJobChat, setOpenJobChatState] = useState(
    () => initialRoute?.openJobChat ?? false
  );

  const buildAppRoute = (overrides: Partial<AppRoute> = {}): AppRoute => {
    const role = currentUser ? appRoleForUser(currentUser) ?? 'client' : 'client';
    const base: AppRoute = {
      role,
      staffSection,
      guardTab,
      clientView,
      staffGuardId: staffGuardId ?? undefined,
      staffClientId: staffClientId ?? undefined,
      staffJobId: staffJobId ?? undefined,
      staffCredentialItemId: staffCredentialItemId ?? undefined,
      staffTeamId: staffTeamId ?? undefined,
      staffEdit: staffEdit || undefined,
      staffGuardTab: staffGuardTab !== 'profile' ? staffGuardTab : undefined,
      performanceFactorId: performanceFactorId ?? undefined,
      clientGuardId: clientGuardId ?? undefined,
      clientDirectGuardId: clientDirectGuardId ?? undefined,
      jobChatRequestId: jobChatRequestId ?? undefined,
      staffMessageTab: staffMessagesTab ?? undefined,
      supportTicketId: supportTicketId ?? undefined,
      supportSection: supportSection ?? undefined,
      supportMode: supportMode ?? undefined,
      openJobChat: openJobChat || undefined,
      clientInvoiceRequestId: clientInvoiceRequestId ?? undefined,
      clientJobsTab: clientView === 'requests' ? clientRequestsJobTab : undefined,
      clientJobId:
        clientView === 'requests' ? clientRequestsSelectedId ?? undefined : undefined,
      guardJobsTab:
        guardTab === 'myJobs' || guardTab === 'map' ? guardBrowseTab : undefined,
      guardJobId:
        guardTab === 'myJobs' || guardTab === 'map'
          ? guardSelectedJobId ?? undefined
          : undefined,
      authView: !currentUser && isAuthView ? initialAuthMode : undefined,
      authRole: !currentUser && isAuthView ? initialAuthRole : undefined,
    };
    return { ...base, ...overrides };
  };

  const applyAppRoute = (route: AppRoute) => {
    if (route.clientView) {
      const currentClientType =
        currentUser?.role === 'client'
          ? clients.find((c) => c.id === currentUser.id)?.clientType
          : undefined;
      setClientViewState(resolveAllowedClientView(route.clientView, currentClientType) as ClientView);
    }
    if (route.guardTab) {
      const tab = route.guardTab === 'guardChat' ? 'messages' : route.guardTab;
      const user = currentUserRef.current;
      const guard =
        user?.role === 'guard' ? findGuardProfileForUser(user, guardsRef.current) : undefined;
      setGuardTabState(normalizeGuardTabForAccount(tab, guard));
    }
    if (route.staffSection || route.staffApprovalQueue) {
      const section = resolveStaffRouteSection(
        route.staffSection,
        route.staffApprovalQueue,
        route.staffMessageTab
      );
      setStaffSectionState(section);
    }
    setStaffGuardIdState(route.staffGuardId ?? null);
    setStaffClientIdState(route.staffClientId ?? null);
    setStaffJobIdState(route.staffJobId ?? null);
    setStaffCredentialItemIdState(route.staffCredentialItemId ?? null);
    setStaffTeamIdState(route.staffTeamId ?? null);
    setStaffEditState(route.staffEdit ?? false);
    setStaffGuardTabState(route.staffGuardTab ?? 'profile');
    setPerformanceFactorIdState(route.performanceFactorId ?? null);
    setClientGuardIdState(route.clientGuardId ?? null);
    setClientDirectGuardIdState(route.clientDirectGuardId ?? null);
    setJobChatRequestIdState(route.jobChatRequestId ?? null);
    setStaffMessagesTabState(route.staffMessageTab ?? null);
    setSupportTicketIdState(route.supportTicketId ?? null);
    setSupportSectionState(route.supportSection ?? 'support');
    setSupportModeState(route.supportMode ?? null);
    setOpenJobChatState(route.openJobChat ?? false);
    if (route.clientInvoiceRequestId && route.clientView === 'invoices') {
      setClientInvoiceRequestIdState(route.clientInvoiceRequestId);
    } else if (route.clientView !== 'invoices') {
      setClientInvoiceRequestIdState(null);
    }
    if (route.clientJobsTab) {
      setClientRequestsJobTabState(route.clientJobsTab);
    }
    if (route.guardJobsTab) {
      setGuardBrowseTabState(route.guardJobsTab);
    }
    if (route.role === 'guard') {
      setGuardSelectedJobIdState(route.guardJobId ?? null);
    } else if (route.guardTab && route.guardTab !== 'myJobs' && route.guardTab !== 'map') {
      setGuardSelectedJobIdState(null);
    }
    if (route.clientView === 'requests') {
      const selected =
        route.clientJobId ??
        (route.jobChatRequestId && !route.openJobChat ? route.jobChatRequestId : null) ??
        null;
      setClientRequestsSelectedIdState(selected);
    } else if (route.clientView) {
      setClientRequestsSelectedIdState(null);
    }
    if (route.authView) {
      setIsAuthView(true);
      setInitialAuthMode(route.authView);
      if (route.authRole) setInitialAuthRole(route.authRole);
    } else if (!currentUser) {
      setIsAuthView(false);
    }
  };

  const setClientView = (view: ClientView) => {
    const currentClientType =
      currentUser?.role === 'client'
        ? clients.find((c) => c.id === currentUser.id)?.clientType
        : undefined;
    const resolvedView = resolveAllowedClientView(view, currentClientType) as ClientView;
    setClientViewState(resolvedView);
    const nextGuardId = resolvedView === 'guards' ? clientGuardId ?? undefined : undefined;
    const nextDirectId = resolvedView === 'direct-request' ? clientDirectGuardId ?? undefined : undefined;
    const keepsJobChatId = resolvedView === 'messages' || resolvedView === 'map';
    const nextJobChatId = keepsJobChatId ? jobChatRequestId ?? undefined : undefined;
    const inSupportFlow =
      resolvedView === 'support' ||
      resolvedView === 'support-compose' ||
      resolvedView === 'support-report';
    const inMessagesFlow = resolvedView === 'messages' || inSupportFlow;
    const nextSupportId =
      resolvedView === 'messages' || resolvedView === 'support' ? supportTicketId ?? undefined : undefined;
    setClientGuardIdState(nextGuardId ?? null);
    setClientDirectGuardIdState(nextDirectId ?? null);
    if (resolvedView !== 'requests') {
      setClientRequestsSelectedIdState(null);
    }
    if (resolvedView !== 'invoices') {
      setClientInvoiceRequestIdState(null);
    }
    const nextInvoiceRequestId =
      resolvedView === 'invoices' ? clientInvoiceRequestId ?? undefined : undefined;
    if (!keepsJobChatId) {
      setJobChatRequestIdState(null);
      setOpenJobChatState(false);
    } else if (resolvedView !== 'messages') {
      setOpenJobChatState(false);
    }
    if (!inMessagesFlow) {
      setSupportTicketIdState(null);
    }
    if (!inMessagesFlow) {
      setSupportSectionState('support');
    }
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: resolvedView,
        clientGuardId: nextGuardId,
        clientDirectGuardId: nextDirectId,
        jobChatRequestId: nextJobChatId,
        openJobChat: resolvedView === 'messages' && openJobChat ? true : undefined,
        clientInvoiceRequestId: nextInvoiceRequestId,
        clientJobsTab: resolvedView === 'requests' ? clientRequestsJobTab : undefined,
        clientJobId:
          resolvedView === 'requests' ? clientRequestsSelectedId ?? undefined : undefined,
        supportTicketId: nextSupportId,
        supportSection:
          resolvedView === 'messages' || resolvedView === 'support' ? supportSection : undefined,
        supportMode: undefined,
      })
    );
  };

  const openClientSupportCompose = () => {
    setClientViewState('support-compose');
    setSupportTicketIdState(null);
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: 'support-compose',
        supportTicketId: undefined,
        supportSection: undefined,
        supportMode: undefined,
      })
    );
  };

  const openClientSupportReport = () => {
    setClientViewState('support-report');
    setSupportTicketIdState(null);
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: 'support-report',
        supportTicketId: undefined,
        supportSection: undefined,
        supportMode: undefined,
      })
    );
  };

  const closeClientSupportForm = (_section: 'support' | 'reports' = 'support') => {
    setClientViewState('support');
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: 'support',
        supportTicketId: undefined,
        supportSection: undefined,
        supportMode: undefined,
      })
    );
  };

  const setClientGuardId = (guardId: string | null) => {
    setClientGuardIdState(guardId);
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: 'guards',
        clientGuardId: guardId ?? undefined,
      })
    );
  };

  const setClientDirectGuardId = (guardId: string | null) => {
    setClientDirectGuardIdState(guardId);
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: guardId ? 'direct-request' : 'guards',
        clientDirectGuardId: guardId ?? undefined,
        clientGuardId: guardId ? undefined : clientGuardId ?? undefined,
      })
    );
  };

  const setGuardTab = (tab: GuardTab) => {
    const guard =
      currentUser?.role === 'guard' ? findGuardProfileForUser(currentUser, guards) : undefined;
    const normalizedTab = normalizeGuardTabForAccount(tab, guard);
    setGuardTabState(normalizedTab);
    const keepsMessages = normalizedTab === 'messages';
    const keepsSupport = normalizedTab === 'support';
    const keepsMyJobs = normalizedTab === 'myJobs';
    const keepsMap = normalizedTab === 'map';
    const keepsJobBrowse = keepsMyJobs || keepsMap;
    const keepsJobChat = keepsMyJobs || keepsMessages;
    const keepOpenChat = keepsJobChat && openJobChat ? true : undefined;
    if (!keepsJobChat) {
      setJobChatRequestIdState(null);
      setOpenJobChatState(false);
    }
    if (!keepsJobBrowse) {
      setGuardSelectedJobIdState(null);
    }
    if (!keepsMessages && !keepsSupport) {
      setSupportTicketIdState(null);
      setSupportModeState(null);
      setSupportSectionState('support');
    }
    const keepsPerformance = normalizedTab === 'performance';
    if (!keepsPerformance) {
      setPerformanceFactorIdState(null);
    }
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: normalizedTab,
        jobChatRequestId: keepsJobChat ? jobChatRequestId ?? undefined : undefined,
        openJobChat: keepOpenChat,
        guardJobsTab: keepsJobBrowse ? guardBrowseTab : undefined,
        guardJobId: keepsJobBrowse ? guardSelectedJobId ?? undefined : undefined,
        supportTicketId: keepsMessages || keepsSupport ? supportTicketId ?? undefined : undefined,
        supportSection: keepsMessages || keepsSupport ? supportSection : undefined,
        supportMode: keepsSupport ? supportMode ?? undefined : keepsMessages ? supportMode ?? undefined : undefined,
        performanceFactorId: keepsPerformance ? performanceFactorId ?? undefined : undefined,
      })
    );
  };

  const setGuardSelectedJobId = (jobId: string | null) => {
    setGuardSelectedJobIdState(jobId);
    const targetTab = guardTab === 'map' ? 'map' : 'myJobs';
    if (jobId && guardTab !== 'map' && guardTab !== 'myJobs') {
      setGuardTabState('myJobs');
    }
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: targetTab,
        guardJobId: jobId ?? undefined,
        guardJobsTab: guardBrowseTab,
      })
    );
  };

  const setGuardBrowseTab = (tab: import('./lib/guardJobsBrowse').GuardJobsBrowseTab) => {
    setGuardBrowseTabState(tab);
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: guardTab === 'map' ? 'map' : 'myJobs',
        guardJobsTab: tab,
        guardJobId: guardSelectedJobId ?? undefined,
      })
    );
  };

  const setPerformanceFactorId = (factorId: PerformanceFactorId | null) => {
    setPerformanceFactorIdState(factorId);
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: 'performance',
        performanceFactorId: factorId ?? undefined,
      })
    );
  };

  const setStaffGuardTab = (tab: StaffGuardDetailTab) => {
    setStaffGuardTabState(tab);
    if (tab !== 'performance') {
      setPerformanceFactorIdState(null);
    }
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'guards',
        staffGuardId: staffGuardId ?? undefined,
        staffGuardTab: tab !== 'profile' ? tab : undefined,
        staffEdit: staffEdit || undefined,
        performanceFactorId:
          tab === 'performance' ? performanceFactorId ?? undefined : undefined,
      })
    );
  };

  const setStaffPerformanceFactorId = (factorId: PerformanceFactorId | null) => {
    setPerformanceFactorIdState(factorId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'guards',
        staffGuardId: staffGuardId ?? undefined,
        staffGuardTab: 'performance',
        staffEdit: staffEdit || undefined,
        performanceFactorId: factorId ?? undefined,
      })
    );
  };

  const openGuardSupportCompose = () => {
    setGuardTabState('support');
    setSupportTicketIdState(null);
    setSupportModeState('compose');
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: 'support',
        supportMode: 'compose',
        supportTicketId: undefined,
        supportSection: undefined,
      })
    );
  };

  const openGuardSupportReport = () => {
    setGuardTabState('support');
    setSupportTicketIdState(null);
    setSupportModeState('report');
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: 'support',
        supportMode: 'report',
        supportTicketId: undefined,
        supportSection: undefined,
      })
    );
  };

  const ensureActivationSupportTicket = async (guard: SecurityGuard): Promise<string | null> => {
    if (!currentUser) return null;
    const existing = findActivationSupportChat(supportTickets, { id: guard.id, email: guard.email });
    if (existing) return existing.id;
    if (activationSupportCreationInFlightRef.current.has(guard.id)) return null;

    activationSupportCreationInFlightRef.current.add(guard.id);
    try {
      if (isDbConnected) {
        const { data } = await supabase
          .from('support_tickets')
          .select('id')
          .eq('user_id', guard.id)
          .eq('subject', ACTIVATION_SUPPORT_SUBJECT)
          .neq('status', 'resolved')
          .limit(1)
          .maybeSingle();
        if (data?.id) return String(data.id);
      }

      const ticket = buildActivationSupportTicketForGuard(guard);
      let resolvedId: string | null = null;
      beginLocalMutation();
      setSupportTickets((prev) => {
        const already = findActivationSupportChat(prev, { id: guard.id, email: guard.email });
        if (already) {
          resolvedId = already.id;
          return prev;
        }
        resolvedId = ticket.id;
        const next = [ticket, ...prev];
        saveSupportTicketsToStorage(next);
        return next;
      });
      if (!resolvedId || resolvedId !== ticket.id) return resolvedId;

      await persistSupportTicketToDb(ticket);
      notifySupportTicketCreated(currentUser, ticket);
      void reportPushEvent(currentUser, {
        type: 'support_message',
        recipientUserId: guard.id,
        ticketId: ticket.id,
        title: 'Activation support',
        body: 'Guardr staff opened a support chat to help you complete activation.',
      });
      return ticket.id;
    } finally {
      activationSupportCreationInFlightRef.current.delete(guard.id);
    }
  };

  const syncActivationSupportClosures = async (activeGuards: SecurityGuard[]) => {
    if (activeGuards.length === 0) return;
    let nextTickets = supportTickets;
    const closed: SupportTicket[] = [];
    for (const guard of activeGuards) {
      if (!isGuardAccountActive(guard)) continue;
      const result = resolveActivationSupportTicketsForGuard(nextTickets, guard);
      if (result.resolved.length === 0) continue;
      nextTickets = result.tickets;
      closed.push(...result.resolved);
    }
    if (closed.length === 0) return;

    beginLocalMutation();
    setSupportTickets(nextTickets);
    saveSupportTicketsToStorage(nextTickets);
    if (isDbConnected) {
      for (const ticket of closed) {
        await persistSupportTicketToDb(ticket);
      }
    }
  };

  const backfillActivationSupportTickets = async (guardsToBackfill: SecurityGuard[]) => {
    if (guardsToBackfill.length === 0) return;
    const newTickets = buildMissingActivationSupportTickets(guardsToBackfill, supportTickets);
    if (newTickets.length === 0) return;

    beginLocalMutation();
    setSupportTickets((prev) => {
      const next = [...newTickets, ...prev];
      saveSupportTicketsToStorage(next);
      return next;
    });

    for (const ticket of newTickets) {
      await persistSupportTicketToDb(ticket);
      if (currentUser) notifySupportTicketCreated(currentUser, ticket);
      if (currentUser) {
        void reportPushEvent(currentUser, {
          type: 'support_message',
          recipientUserId: ticket.userId,
          ticketId: ticket.id,
          title: 'Activation support',
          body: 'Guardr staff opened a support chat to help you complete activation.',
        });
      }
    }
  };

  const openGuardActivationSupport = () => {
    if (!activeGuard?.id) return;
    void (async () => {
      const ticketId =
        findActivationSupportChat(supportTickets, { id: activeGuard.id, email: activeGuard.email })?.id ??
        (await ensureActivationSupportTicket(activeGuard));
      if (!ticketId) return;
      setGuardTabState('support');
      setSupportTicketIdState(ticketId);
      setSupportModeState(null);
      syncAppRoute(
        buildAppRoute({
          role: 'guard',
          guardTab: 'support',
          supportTicketId: ticketId,
          supportMode: undefined,
          supportSection: 'support',
        })
      );
    })();
  };

  const closeGuardSupportForm = (section: 'support' | 'reports' = 'support') => {
    setSupportSectionState(section);
    setSupportModeState(null);
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: 'support',
        supportMode: undefined,
        supportTicketId: undefined,
        supportSection: section,
      })
    );
  };

  const setJobChatRequestId = (requestId: string | null, options?: { openChat?: boolean }) => {
    setJobChatRequestIdState(requestId);
    if (options?.openChat !== undefined) setOpenJobChatState(options.openChat);
    const role = currentUser ? appRoleForUser(currentUser) : null;
    if (role === 'staff') {
      setStaffSectionState('messages');
      syncAppRoute(
        buildAppRoute({
          role: 'staff',
          staffSection: 'messages',
          jobChatRequestId: requestId ?? undefined,
        })
      );
      return;
    }
    if (role === 'guard') {
      const openChat = options?.openChat ?? (requestId ? openJobChat : false);
      const targetTab = openChat ? 'messages' : guardTab;
      if (openChat) setGuardTabState('messages');
      syncAppRoute(
        buildAppRoute({
          role: 'guard',
          guardTab: targetTab,
          jobChatRequestId: requestId ?? undefined,
          openJobChat: openChat,
        })
      );
      return;
    }
    if (role === 'client') {
      const openChat = options?.openChat ?? false;
      if (openChat) setClientViewState('messages');
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: openChat ? 'messages' : clientView,
          jobChatRequestId: requestId ?? undefined,
          openJobChat: openChat,
          clientJobId:
            !openChat && clientView === 'requests'
              ? clientRequestsSelectedId ?? undefined
              : undefined,
        })
      );
    }
  };


  const setSupportTicketId = (ticketId: string | null) => {
    setSupportTicketIdState(ticketId);
    setSupportModeState(null);
    const role = currentUser ? appRoleForUser(currentUser) : null;
    if (role === 'staff') {
      setStaffSectionState('support');
      syncAppRoute(
        buildAppRoute({
          role: 'staff',
          staffSection: 'support',
          supportTicketId: ticketId ?? undefined,
          supportMode: undefined,
        })
      );
      return;
    }
    if (role === 'guard') {
      setGuardTabState('support');
      syncAppRoute(
        buildAppRoute({
          role: 'guard',
          guardTab: 'support',
          supportTicketId: ticketId ?? undefined,
          supportMode: undefined,
        })
      );
      return;
    }
    if (role === 'client') {
      setClientViewState('support');
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'support',
          supportTicketId: ticketId ?? undefined,
          supportMode: undefined,
        })
      );
    }
  };

  const setStaffSection = (section: StaffSection, selection: StaffSectionSelection = {}) => {
    const normalizedSection =
      section === 'team-chat' || section === 'job-chats' ? 'messages' : section;
    if (currentUser && isStaffRole(currentUser.role)) {
      emitStaffTravelAction({ section: normalizedSection });
    }
    setStaffSectionState(normalizedSection);
    const nextJobId = normalizedSection === 'jobs'
      ? selection.jobId !== undefined ? selection.jobId ?? undefined : staffJobId ?? undefined
      : undefined;
    const nextCredentialItemId = normalizedSection === 'credentials'
      ? selection.credentialItemId !== undefined
        ? selection.credentialItemId ?? undefined
        : staffCredentialItemId ?? undefined
      : undefined;
    const nextGuardId = normalizedSection === 'guards' || normalizedSection === 'applications'
      ? selection.guardId !== undefined ? selection.guardId ?? undefined : staffGuardId ?? undefined
      : normalizedSection === 'credentials' && !nextCredentialItemId
        ? selection.guardId !== undefined
          ? selection.guardId ?? undefined
          : staffGuardId ?? undefined
        : undefined;
    const nextClientId = normalizedSection === 'clients' || normalizedSection === 'applications'
      ? selection.clientId !== undefined ? selection.clientId ?? undefined : staffClientId ?? undefined
      : undefined;
    const nextTeamId = normalizedSection === 'team' || normalizedSection === 'management'
      ? selection.teamId !== undefined ? selection.teamId ?? undefined : staffTeamId ?? undefined
      : undefined;
    const keepsMessages = normalizedSection === 'messages';
    const keepsSupport = normalizedSection === 'support';
    const nextJobChatId = keepsMessages ? jobChatRequestId ?? undefined : undefined;
    const nextSupportId = keepsSupport ? supportTicketId ?? undefined : undefined;
    const nextEdit = section === 'guards' && nextGuardId ? staffEdit || undefined : undefined;
    setStaffGuardIdState(nextGuardId ?? null);
    setStaffClientIdState(nextClientId ?? null);
    setStaffJobIdState(nextJobId ?? null);
    setStaffCredentialItemIdState(nextCredentialItemId ?? null);
    setStaffTeamIdState(nextTeamId ?? null);
    if (!keepsMessages) setJobChatRequestIdState(null);
    if (!keepsSupport) setSupportTicketIdState(null);
    if (normalizedSection !== 'guards') setStaffEditState(false);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: normalizedSection,
        staffGuardId: nextGuardId,
        staffClientId: nextClientId,
        staffJobId: nextJobId,
        staffCredentialItemId: nextCredentialItemId,
        staffTeamId: nextTeamId,
        staffEdit: nextEdit,
        jobChatRequestId: nextJobChatId,
        supportTicketId: nextSupportId,
      })
    );
  };

  const setStaffGuardId = (guardId: string | null) => {
    if (currentUser && isStaffRole(currentUser.role) && guardId) {
      emitStaffTravelAction({ section: 'guards', label: `guard:${guardId}` });
    }
    setStaffGuardIdState(guardId);
    if (!guardId) {
      setStaffEditState(false);
      setStaffGuardTabState('profile');
      setPerformanceFactorIdState(null);
    }
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'guards',
        staffGuardId: guardId ?? undefined,
        staffEdit: guardId && staffEdit ? true : undefined,
        staffGuardTab: guardId && staffGuardTab !== 'profile' ? staffGuardTab : undefined,
        performanceFactorId:
          guardId && staffGuardTab === 'performance' ? performanceFactorId ?? undefined : undefined,
      })
    );
  };

  const setStaffClientId = (clientId: string | null) => {
    if (currentUser && isStaffRole(currentUser.role) && clientId) {
      emitStaffTravelAction({ section: 'clients', label: `client:${clientId}` });
    }
    setStaffClientIdState(clientId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'clients',
        staffClientId: clientId ?? undefined,
      })
    );
  };

  const setStaffJobId = (jobId: string | null) => {
    if (currentUser && isStaffRole(currentUser.role) && jobId) {
      emitStaffTravelAction({ section: 'jobs', label: `job:${jobId}` });
    }
    setStaffJobIdState(jobId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'jobs',
        staffJobId: jobId ?? undefined,
      })
    );
  };

  const setStaffCredentialItemId = (itemId: string | null) => {
    if (currentUser && isStaffRole(currentUser.role) && itemId) {
      emitStaffTravelAction({ section: 'credentials', label: `credential:${itemId}` });
    }
    setStaffCredentialItemIdState(itemId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'credentials',
        staffCredentialItemId: itemId ?? undefined,
        staffGuardId: !itemId ? staffGuardId ?? undefined : undefined,
      })
    );
  };

  const setStaffTeamId = (teamId: string | null) => {
    const member = teamId ? guards.find((guard) => guard.id === teamId) : undefined;
    if (member && currentUser && !isStaffMemberVisibleToViewer(currentUser, member)) {
      setStaffTeamIdState(null);
      syncAppRoute(
        buildAppRoute({
          role: 'staff',
          staffSection: staffSection === 'management' ? 'overview' : staffSection,
          staffTeamId: undefined,
        })
      );
      return;
    }
    const section = member
      ? staffSectionForStaffMember(member, currentUser ?? undefined)
      : staffSection === 'management'
        ? 'management'
        : 'team';
    if (currentUser && isStaffRole(currentUser.role) && teamId) {
      emitStaffTravelAction({ section, label: `team:${teamId}` });
    }
    setStaffTeamIdState(teamId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: section,
        staffTeamId: teamId ?? undefined,
      })
    );
  };

  const setStaffEdit = (editing: boolean) => {
    setStaffEditState(editing);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'guards',
        staffGuardId: staffGuardId ?? undefined,
        staffEdit: editing || undefined,
      })
    );
  };

  const setAuthViewRole = (role: AuthViewRole) => {
    setInitialAuthRole(role);
    syncAppRoute(
      {
        role: 'client',
        authView: initialAuthMode,
        authRole: role,
        authClientType: role === 'client' ? initialClientType : undefined,
      },
      true
    );
  };

  const setAuthViewMode = (mode: AuthViewMode) => {
    setInitialAuthMode(mode);
    syncAppRoute(
      {
        role: 'client',
        authView: mode,
        authRole: initialAuthRole,
        authClientType: initialAuthRole === 'client' ? initialClientType : undefined,
      },
      true
    );
  };

  const openAuthView = (role: AuthViewRole, mode: AuthViewMode, clientKind?: ClientType) => {
    const kind = role === 'client' && mode === 'sign-up' ? normalizeClientType(clientKind) : undefined;
    setAuthChoiceMode(null);
    setAuthSignupPick(null);
    setInitialAuthRole(role);
    setInitialAuthMode(mode);
    if (kind) setInitialClientType(kind);
    setIsAuthView(true);
    syncAppRoute({
      role: 'client',
      authView: mode,
      authRole: role,
      authClientType: kind,
    });
  };

  const openAuthChoice = (mode: 'sign-in' | 'sign-up', signupPick: AuthSignupPick = 'path') => {
    setAuthChoiceMode(mode);
    setAuthSignupPick(mode === 'sign-up' ? signupPick : null);
    setIsAuthView(false);
    setInitialAuthMode(mode);
    if (typeof window !== 'undefined') {
      syncAuthChoiceRoute(mode, false, mode === 'sign-up' ? signupPick : undefined);
    }
  };

  const closeAuthChoice = () => {
    navigateHistoryBack(() => {
      setAuthChoiceMode(null);
      setAuthSignupPick(null);
      if (typeof window !== 'undefined') {
        window.history.replaceState({ home: true }, '', '/');
      }
    });
  };

  const navigateToAuth = (role?: AuthViewRole, mode?: AuthViewMode) => {
    if (!role && (mode === 'sign-up' || mode === 'sign-in')) {
      openAuthChoice(mode);
      return;
    }
    if (role === 'client' && mode === 'sign-up') {
      openAuthChoice('sign-up', 'client');
      return;
    }
    openAuthView(role ?? 'client', mode ?? 'sign-in');
  };

  const closeAuthView = () => {
    setIsAuthView(false);
    setAuthChoiceMode(null);
    setAuthSignupPick(null);
    document.documentElement.classList.remove('auth-page-open');
    if (typeof window !== 'undefined') {
      window.history.replaceState({ home: true }, '', '/');
    }
  };

  const backToAuthRoleChoice = () => {
    navigateHistoryBack(() => {
      const fallbackPick: AuthSignupPick =
        initialAuthMode === 'sign-up' && initialAuthRole === 'client'
          ? 'client'
          : initialAuthMode === 'sign-up'
            ? 'work'
            : 'path';
      if (initialAuthMode === 'sign-up') {
        syncAuthChoiceRoute('sign-up', true, fallbackPick);
        setAuthSignupPick(fallbackPick);
      } else {
        syncAuthChoiceRoute(initialAuthMode, true);
        setAuthSignupPick(null);
      }
      setAuthChoiceMode(initialAuthMode);
      setIsAuthView(false);
    });
  };

  const openLegalPage = (page: LegalPageId) => {
    setLegalReturnAuth(isAuthView);
    setLegalPageState(page);
    setDownloadPageOpen(false);
    setPublicGuideOpen(false);
    setIsAuthView(false);
    syncLegalPage(page);
  };

  const openDownloadPage = () => {
    setDownloadPageOpen(true);
    setLegalPageState(null);
    setPublicGuideOpen(false);
  };

  const closeDownloadPage = () => {
    setDownloadPageOpen(false);
  };

  const openPublicGuide = () => {
    setPublicGuideOpen(true);
    setLegalPageState(null);
    setIsAuthView(false);
    syncGuidePage(true);
  };

  const closePublicGuide = () => {
    setPublicGuideOpen(false);
    syncGuidePage(false, true);
  };

  const closeLegalPage = () => {
    setLegalPageState(null);
    if (legalReturnAuth) {
      setLegalReturnAuth(false);
      setIsAuthView(true);
      syncLegalPage(null, true);
      syncAppRoute(
        { role: 'client', authView: initialAuthMode, authRole: initialAuthRole },
        true
      );
      return;
    }
    if (currentUser) {
      const role = appRoleForUser(currentUser);
      if (role) {
        const route = readAppRouteFromWindow();
        if (route && routeMatchesUser(route, currentUser)) {
          applyAppRoute(route);
          syncAppRoute(route, true);
        } else {
          const fallback = defaultRouteForUser(currentUser);
          applyAppRoute(fallback);
          syncAppRoute(fallback, true);
        }
        return;
      }
    }
    setIsAuthView(false);
    syncLegalPage(null, true);
  };

  const applyAppRouteRef = useRef(applyAppRoute);
  applyAppRouteRef.current = applyAppRoute;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const loadAppDataRef = useRef<() => void>(() => {});
  const loggedInUserIdRef = useRef<string | null>(currentUser?.id ?? null);

  const defaultRouteForUser = (user: SessionUser): AppRoute => {
    const role = appRoleForUser(user);
    if (!role) return { role: 'client', clientView: 'home' };
    if (role === 'guard') {
      return defaultRouteForRole(role, findGuardProfileForUser(user, guardsRef.current));
    }
    return defaultRouteForRole(role);
  };

  const navigateFromLocation = (
    url: string,
    options: { source: 'boot' | 'deeplink' | 'popstate'; event?: PopStateEvent }
  ) => {
    const legal =
      options.source === 'popstate'
        ? ((options.event?.state?.legalPage as LegalPageId | undefined) ??
          readLegalPageFromUrl(url))
        : readLegalPageFromUrl(url);

    if (legal) {
      setLegalPageState(legal);
      setPublicGuideOpen(false);
      setIsAuthView(false);
      return;
    }
    setLegalPageState(null);

    const guide =
      options.source === 'popstate'
        ? ((options.event?.state?.publicGuide as boolean | undefined) ??
          readGuideFromUrl(url))
        : readGuideFromUrl(url);

    if (guide) {
      if (isAppExperience()) {
        setPublicGuideOpen(false);
        syncGuidePage(false, true);
      } else {
        setPublicGuideOpen(true);
        setIsAuthView(false);
        return;
      }
    } else {
      setPublicGuideOpen(false);
    }

    const user = currentUserRef.current;
    const strippedUrl = stripEphemeralQueryParams(url);
    const authChoiceFromState =
      options.source === 'popstate'
        ? (options.event?.state?.authChoice as 'sign-in' | 'sign-up' | undefined)
        : (typeof window !== 'undefined'
            ? (window.history.state as { authChoice?: 'sign-in' | 'sign-up' } | null)?.authChoice
            : undefined);
    const authChoice = authChoiceFromState ?? readAuthChoiceFromUrl(strippedUrl);
    const signupPickFromState =
      options.source === 'popstate'
        ? (options.event?.state?.authSignupPick as AuthSignupPick | undefined)
        : (typeof window !== 'undefined'
            ? (window.history.state as { authSignupPick?: AuthSignupPick } | null)?.authSignupPick
            : undefined);
    const signupPick = signupPickFromState ?? readAuthSignupPickFromUrl(strippedUrl);

    if (authChoice && !user) {
      setAuthChoiceMode(authChoice);
      setAuthSignupPick(authChoice === 'sign-up' ? signupPick ?? 'path' : null);
      setIsAuthView(false);
      setInitialAuthMode(authChoice);
      if (options.source !== 'popstate') {
        syncAuthChoiceRoute(authChoice, true, authChoice === 'sign-up' ? signupPick ?? 'path' : undefined);
      }
      return;
    }

    if (!user) {
      setAuthChoiceMode(null);
      setAuthSignupPick(null);
    }

    const routeFromUrl = parseAppRoute(strippedUrl);
    const userRole = user ? appRoleForUser(user) : null;
    const route =
      options.source === 'popstate'
        ? readAppRouteFromPopState(options.event)
        : routeFromUrl ??
          (user
            ? resolveAppRouteForUser(strippedUrl, {
                allowPersistedFallback: true,
                userId: user.id,
                userRole,
              })
            : null);

    if (route?.authView) {
      if (!user) {
        setAuthChoiceMode(null);
        setIsAuthView(true);
        setInitialAuthRole(route.authRole ?? 'client');
        setInitialAuthMode(route.authView);
        if (route.authClientType) setInitialClientType(route.authClientType);
        if (options.source !== 'popstate') {
          syncAppRoute(route, true);
        }
        return;
      }
      const role = appRoleForUser(user);
      if (role) {
        const fallback = defaultRouteForUser(user);
        applyAppRouteRef.current(fallback);
        if (options.source !== 'popstate') {
          syncAppRoute(fallback, true);
        }
      }
      return;
    }

    if (!route) {
      if (!user) {
        setIsAuthView(false);
        return;
      }
      const role = appRoleForUser(user);
      if (!role) return;
      const fallback = defaultRouteForUser(user);
      applyAppRouteRef.current(fallback);
      if (options.source !== 'popstate') {
        syncAppRoute(fallback, true);
      }
      return;
    }

    if (user && !routeMatchesUser(route, user)) {
      if (options.source === 'deeplink') {
        const remapped = remapNotificationUrlForUser(strippedUrl, user);
        if (remapped && remapped !== strippedUrl) {
          navigateFromLocation(remapped, { source: 'deeplink' });
          return;
        }
        const fallback = defaultRouteForUser(user);
        applyAppRouteRef.current(fallback);
        syncAppRoute(fallback, true);
        return;
      }
      if (options.source === 'popstate') {
        const role = appRoleForUser(user);
        if (role) {
          const fallback = defaultRouteForUser(user);
          applyAppRouteRef.current(fallback);
          window.history.replaceState({ appRoute: fallback }, '', buildAppPath(fallback));
        }
      }
      return;
    }

    applyAppRouteRef.current(route);
    persistAppRoute(route, user?.id ?? null);
    if (options.source !== 'popstate') {
      syncAppRoute(route, true);
    }
  };

  useSystemBackButtonBootstrap(!!currentUser);

  useEffect(() => {
    return registerSystemBackHandler(() => {
      if (closeTopmostDialog()) return true;
      if (dismissAppConfirm()) return true;
      return false;
    });
  }, []);

  useLayoutEffect(() => {
    const url = window.location.pathname + window.location.search;
    const user = currentUserRef.current;
    const userRole = user ? appRoleForUser(user) : null;
    const route =
      parseAppRoute(stripEphemeralQueryParams(url)) ??
      (user
        ? resolveAppRouteForUser(url, {
            allowPersistedFallback: true,
            userId: user.id,
            userRole,
          })
        : null);

    if (!route || route.authView) return;
    if (user && !routeMatchesUser(route, user)) return;

    applyAppRouteRef.current(route);
    persistAppRoute(route, user?.id ?? null);
    syncAppRoute(route, true);
  }, []);

  useEffect(() => {
    navigateFromLocation(window.location.pathname + window.location.search, { source: 'boot' });

    const onPopState = (event: PopStateEvent) => {
      if (consumeOverlayPopState()) return;
      navigateFromLocation(window.location.pathname + window.location.search, {
        source: 'popstate',
        event,
      });
    };
    window.addEventListener('popstate', onPopState);

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      loadAppDataRef.current();
      navigateFromLocation(window.location.pathname + window.location.search, { source: 'boot' });
    };
    window.addEventListener('pageshow', onPageShow);

    const unsubscribe = listenForPushNavigation((url) => {
      loadAppDataRef.current();
      navigateFromLocation(url, { source: 'deeplink' });
    });
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      loggedInUserIdRef.current = null;
      return;
    }
    const role = appRoleForUser(currentUser);
    if (!role) return;

    loggedInUserIdRef.current = currentUser.id;

    const url = stripEphemeralQueryParams(window.location.pathname + window.location.search);
    const route =
      parseAppRoute(url) ??
      resolveAppRouteForUser(url, {
        allowPersistedFallback: true,
        userId: currentUser.id,
        userRole: role,
      });

    if (route && isAuthOnlyRoute(route)) {
      const fallback = defaultRouteForUser(currentUser);
      applyAppRouteRef.current(fallback);
      syncAppRoute(fallback, true);
      return;
    }

    if (route && routeMatchesUser(route, currentUser)) {
      applyAppRouteRef.current(route);
      persistAppRoute(route, currentUser.id);
      syncAppRoute(route, true);
      return;
    }

    if (!route) {
      const fallback = defaultRouteForUser(currentUser);
      applyAppRouteRef.current(fallback);
      syncAppRoute(fallback, true);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenForPushSubscriptionChange(() => {
      void syncPushSubscriptionWithServer(currentUser).catch((err) => {
        console.warn('Push subscription sync failed:', err);
      });
    });
    void syncPushSubscriptionWithServer(currentUser).catch(() => {
      /* not enabled or not configured */
    });
    return unsubscribe;
  }, [currentUser?.id, currentUser?.email, currentUser?.role]);

  useEffect(() => {
    if (!currentUser) {
      setUserNotifications([]);
      return;
    }
    void loadUserNotifications(currentUser.id, isDbConnected).then(setUserNotifications);
  }, [currentUser?.id, isDbConnected]);

  useEffect(() => {
    if (!currentUser) {
      registerInboxPersistHandler(null);
      return;
    }
    const userId = currentUser.id;
    const user = currentUser;
    registerInboxPersistHandler((input) => {
      if (input.userId !== userId) return;
      void (async () => {
        const url =
          input.url ??
          resolveNotificationDestination(
            {
              type: input.type,
              url: undefined,
              requestId: input.requestId,
              guardId: input.guardId,
              ticketId: input.ticketId,
            },
            user
          ) ??
          undefined;
        const notification = await appendInboxNotification({ ...input, url }, isDbConnected);
        setUserNotifications((prev) => upsertNotification(prev, notification));
      })();
    });
    return () => registerInboxPersistHandler(null);
  }, [currentUser?.id, currentUser?.role, isDbConnected]);


  // ── Active guard identity ──────────────────────────────────
  const [activeGuardId, setActiveGuardId] = useState<string>(() =>
    currentUser?.role === 'guard' ? currentUser.id : ''
  );
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'guard') {
      const matched = findGuardProfileForUser(currentUser, guards);
      setActiveGuardId(matched?.id ?? currentUser.id);
      return;
    }
  }, [currentUser, guards]);

  useOfflineSync(
    currentUser?.role === 'guard' ? activeGuardId : undefined,
    (result) => {
      if (result.synced > 0) {
        showAppToast(`Synced ${result.synced} offline record${result.synced === 1 ? '' : 's'}.`, { tone: 'success' });
        loadAppDataRef.current();
      }
    }
  );

  // Keep session id aligned when the guard row id differs (e.g. after DB reset / staff provisioned account).
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'guard' || loading) return;
    const matched = findGuardProfileForUser(currentUser, guards);
    if (!matched || matched.id === currentUser.id) return;
    const next: SessionUser = {
      ...currentUser,
      id: matched.id,
      name: matched.name,
      badgeNumber: matched.badgeNumber,
      avatar: matched.avatar,
      hourlyRate: matched.hourlyRateRequirement,
    };
    localStorage.setItem('guardr_current_user', JSON.stringify(next));
    setCurrentUser(next);
    setActiveGuardId(matched.id);
  }, [currentUser, guards, loading]);

  // Keep staff session role + Finance side role aligned with the staff roster row.
  useEffect(() => {
    if (!currentUser || !isStaffRole(currentUser.role) || loading) return;
    const member = guards.find((g) => g.id === currentUser.id && g.isStaff);
    if (!member) return;
    const nextSide = member.sideRole ?? null;
    const nextStaffRole = member.staffRole;
    const nextRole = resolvePlatformRole({
      isStaff: true,
      staffRole: nextStaffRole,
      sideRole: nextSide,
    });
    if (
      currentUser.role === nextRole &&
      (currentUser.sideRole ?? null) === nextSide &&
      (currentUser.staffRole ?? undefined) === nextStaffRole
    ) {
      return;
    }
    const next: SessionUser = {
      ...currentUser,
      role: nextRole,
      staffRole: nextStaffRole,
      sideRole: nextSide,
      badgeNumber: member.badgeNumber || currentUser.badgeNumber,
      name: member.name || currentUser.name,
      avatar: member.avatar || currentUser.avatar,
    };
    localStorage.setItem('guardr_current_user', JSON.stringify(next));
    setCurrentUser(next);
  }, [currentUser, guards, loading]);

  useEffect(() => {
    if (!currentUser || hasPerUserThemePreference(currentUser.id)) return;
    const profile =
      currentUser.role === 'client'
        ? clients.find((c) => c.id === currentUser.id)
        : findGuardProfileForUser(currentUser, guards);
    if (profile?.themePreference) {
      setThemeMode(profile.themePreference);
      saveTheme(profile.themePreference, currentUser.id);
      applyThemeToDocument(profile.themePreference);
    }
  }, [currentUser, guards, clients]);

  // ── Load from Supabase on mount ────────────────────────────
  useEffect(() => {
    const LOAD_TIMEOUT_MS = 30_000;

    (async () => {
      try {
        setLoading(true);
        await Promise.race([
          loadFromSupabase(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase load timed out')), LOAD_TIMEOUT_MS)
          ),
        ]);
      } catch (e) {
        console.error('Supabase init error:', e);
        setGuards([]);
        setClients([]);
        setRequests([]);
        setIsDbConnected(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const parseJsonStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const loadFromSupabase = async () => {
    certImageHydrationRef.current.clear();
    try {
      const { data: dbGuards, error: guardsErr } = await supabase.from('guards').select('*');
      const { data: dbStaffRows, error: staffErr } = await supabase.from('staff').select('*');
      const staffTableAvailable = !staffErr;
      const { data: dbClients, error: clientsErr } = await supabase.from('clients').select('*');
      const { data: dbCerts, error: certsErr } = await supabase
        .from('certifications')
        .select(CERTIFICATION_METADATA_COLUMNS);
      const { data: dbExps, error: expsErr } = await supabase.from('experience').select('*');
      const { data: dbEducation, error: eduErr } = await supabase.from('education').select('*');
      const { data: dbRequests, error: requestsErr } = await supabase.from('security_requests').select('*');
      const { data: dbPayments, error: paymentsErr } = await supabase.from('payments').select('*');
      const { data: dbSupportTickets, error: supportTicketsErr } = await supabase.from('support_tickets').select('*');
      const { data: dbSupportMessages, error: supportMessagesErr } = await supabase.from('support_messages').select('*');
      const { data: dbJobChatThreads, error: jobChatThreadsErr } = await supabase.from('job_chat_threads').select('*');
      const { data: dbJobChatMessages, error: jobChatMessagesErr } = await supabase.from('job_chat_messages').select('*');
      const { data: dbStaffMessages, error: staffMessagesErr } = await supabase.from('staff_messages').select('*');
      const { data: dbGuardMessages, error: guardMessagesErr } = await supabase.from('guard_messages').select('*');
      const { data: dbClientMessages, error: clientMessagesErr } = await supabase.from('client_messages').select('*');
      const { data: dbPayoutInvoices, error: payoutInvoicesErr } = await supabase
        .from('guard_payout_invoices')
        .select('*');
      const { data: dbClientInvoices, error: clientInvoicesErr } = await supabase
        .from('client_invoices')
        .select('*');
      const { data: dbPlatformSettings, error: platformSettingsErr } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      const { data: dbPlatformCities, error: platformCitiesErr } = await supabase
        .from('platform_cities')
        .select('*')
        .order('sort_order', { ascending: true });
      const { data: dbInsurance, error: insuranceErr } = await supabase
        .from('guard_insurance_policies')
        .select('*');
      const { data: dbVehicleInsurance, error: vehicleInsuranceErr } = await supabase
        .from('guard_vehicle_insurance_policies')
        .select('*');
      const { data: dbVehicleProfiles, error: vehicleProfilesErr } = await supabase
        .from('guard_vehicle_profiles')
        .select('*');
      const { data: dbLegalAcceptances, error: legalAcceptancesErr } = await supabase
        .from('user_legal_acceptances')
        .select('*');
      const { data: dbCompanyPublicDocuments, error: companyPublicDocumentsErr } = await supabase
        .from('company_public_documents')
        .select('*');

      if (insuranceErr && insuranceErr.code !== '42P01') {
        console.warn('Guard insurance load (run migration if missing):', insuranceErr);
      }
      if (vehicleInsuranceErr && vehicleInsuranceErr.code !== '42P01') {
        console.warn('Guard vehicle insurance load (run migration if missing):', vehicleInsuranceErr);
      }
      if (vehicleProfilesErr && vehicleProfilesErr.code !== '42P01') {
        console.warn('Guard vehicle profiles load (run migration if missing):', vehicleProfilesErr);
      }
      if (legalAcceptancesErr && legalAcceptancesErr.code !== '42P01') {
        console.warn('Legal acceptances load (run migration if missing):', legalAcceptancesErr);
      }
      if (companyPublicDocumentsErr && companyPublicDocumentsErr.code !== '42P01') {
        console.warn('Company public documents load (run migration if missing):', companyPublicDocumentsErr);
      }

      const insuranceByGuardId = new Map(
        (dbInsurance ?? []).map((row: Record<string, unknown>) => [
          String(row.guard_id),
          insurancePolicyFromRow(row),
        ])
      );
      const vehicleInsuranceByGuardId = new Map(
        (dbVehicleInsurance ?? []).map((row: Record<string, unknown>) => [
          String(row.guard_id),
          vehicleInsurancePolicyFromRow(row),
        ])
      );
      const vehicleProfileByGuardId = new Map(
        (dbVehicleProfiles ?? []).map((row: Record<string, unknown>) => [
          String(row.guard_id),
          vehicleProfileFromRow(row),
        ])
      );

      if (dbLegalAcceptances) {
        const records = dbLegalAcceptances.map((row: Record<string, unknown>) =>
          legalAcceptanceFromRow(row)
        );
        setLegalAcceptanceRecords(records);
        setLegalAcceptanceKeys(indexLegalAcceptances(records));
      }

      if (dbCompanyPublicDocuments) {
        setCompanyPublicDocuments(
          dbCompanyPublicDocuments.map((row: Record<string, unknown>) =>
            companyPublicDocumentFromRow(row)
          )
        );
      }

      if (eduErr) console.warn('Education table load (run migration if missing):', eduErr);
      if (supportTicketsErr || supportMessagesErr) {
        console.warn('Support tables load (run migration if missing):', supportTicketsErr ?? supportMessagesErr);
      }
      if (jobChatThreadsErr || jobChatMessagesErr) {
        console.warn('Job chat tables load (run migration if missing):', jobChatThreadsErr ?? jobChatMessagesErr);
      }
      if (staffMessagesErr) {
        console.warn('Staff messages load (run migration if missing):', staffMessagesErr);
      }
      if (guardMessagesErr) {
        console.warn('Guard messages load (run migration if missing):', guardMessagesErr);
      }
      if (clientMessagesErr) {
        console.warn('Client messages load (run migration if missing):', clientMessagesErr);
      }
      if (payoutInvoicesErr) {
        console.warn('Guard payout invoices load (run migration if missing):', payoutInvoicesErr);
      }
      if (clientInvoicesErr && clientInvoicesErr.code !== '42P01') {
        console.warn('Client invoices load (run migration if missing):', clientInvoicesErr);
      }
      if (platformSettingsErr && platformSettingsErr.code !== '42P01') {
        console.warn('Platform settings load (run migration if missing):', platformSettingsErr);
      }
      if (platformCitiesErr && platformCitiesErr.code !== '42P01') {
        console.warn('Platform cities load (run migration if missing):', platformCitiesErr);
      }
      if (guardsErr && clientsErr) {
        console.error('Supabase load errors:', { guardsErr, clientsErr });
        setGuards([]);
        setClients([]);
        setRequests([]);
        setIsDbConnected(false);
        return;
      }
      if (guardsErr) console.warn('Guards table load:', guardsErr);
      if (clientsErr) console.warn('Clients table load:', clientsErr);
      if (certsErr) {
        console.warn('Certifications table load:', certsErr);
        appToast(
          'Some credential records could not load. Sign out and back in, or contact Guardr support if guard card uploads still fail.',
          'error'
        );
      }
      if (expsErr) console.warn('Experience table load:', expsErr);
      if (requestsErr) console.warn('Security requests table load:', requestsErr);
      if (paymentsErr) console.warn('Payments table load:', paymentsErr);

      if (staffErr && staffErr.code !== '42P01') {
        console.warn('Staff table load (run migration if missing):', staffErr);
      }

      const mapGuardRow = (g: any): SecurityGuard => {
        const nameParts = resolvePersonNameParts({
          firstName: g.first_name,
          middleName: g.middle_name,
          lastName: g.last_name,
          name: g.name,
        });
        return {
        id: g.id, name: nameParts.name, firstName: nameParts.firstName, middleName: nameParts.middleName, lastName: nameParts.lastName, email: g.email, badgeNumber: normalizeGuardIndependentContractorNumber(g.badge_number),
        avatar: g.avatar, phone: g.phone, bio: g.bio,
        headline: g.headline || undefined,
        summary: g.summary || undefined,
        about: g.about || undefined,
        skills: parseJsonStringArray(g.skills),
        languages: parseJsonStringArray(g.languages),
        serviceAreas: normalizeGuardServiceAreas(parseJsonStringArray(g.service_areas)),
        specialties: parseJsonStringArray(g.specialties),
        yearsExperience: g.years_experience ?? undefined,
        availabilityNotes: g.availability_notes || undefined,
        armedPreference:
          g.armed_preference === 'armed' || g.armed_preference === 'unarmed' || g.armed_preference === 'both'
            ? g.armed_preference
            : undefined,
        guardCardStatus:
          g.guard_card_status === 'active' ||
          g.guard_card_status === 'in_progress' ||
          g.guard_card_status === 'none'
            ? g.guard_card_status
            : undefined,
        hasReliableTransportation:
          typeof g.has_reliable_transportation === 'boolean' ? g.has_reliable_transportation : undefined,
        isArmed: g.is_armed,
        listedWeaponGear: parseJsonStringArray(g.listed_weapon_gear).filter((value): value is GuardWeaponGearId =>
          ['flashlight', 'oc-spray', 'baton', 'handcuffs', 'taser', 'firearm'].includes(value)
        ),
        listedEquipmentGear: parseJsonStringArray(g.listed_equipment_gear).filter(
          (value): value is GuardEquipmentGearId => value === 'body-cam' || value === 'walkie-talkie'
        ),
        inventoryEquipment: parseInventoryEquipmentJson(g.inventory_equipment),
        inventoryUniforms: parseInventoryUniformsJson(g.inventory_uniforms),
        jobTypePreferences: parseJsonStringArray(g.job_type_preferences).filter((value): value is JobType =>
          isJobType(value)
        ),
        jobTypeOnboarding: normalizeJobTypeOnboarding(
          typeof g.job_type_onboarding === 'object' && g.job_type_onboarding !== null
            ? (g.job_type_onboarding as Record<string, string>)
            : undefined
        ),
        backgroundChecked: g.background_checked, verified: g.verified,
        rating: Number(g.rating), jobsCompleted: g.jobs_completed,
        hourlyRateRequirement: g.hourly_rate_requirement,
        isStaff: false,
        userStatus: getGuardUserStatus({ userStatus: g.user_status, isStaff: false }),
        failedAudits: g.failed_audits ?? 0,
        stripeConnectAccountId: g.stripe_connect_account_id || undefined,
        themePreference: normalizeThemeMode(g.theme_preference) ?? undefined,
        password: g.password ?? undefined,
        passwordHash: g.password_hash ?? undefined,
        mustChangePassword: g.must_change_password ?? false,
        idVerificationStatus: g.id_verification_status ?? 'not_submitted',
        idState: g.id_state ?? undefined,
        idNumber: g.id_number ?? undefined,
        idExpiryDate: g.id_expiry_date ?? undefined,
        idFrontUrl: g.id_front_url ?? undefined,
        idBackUrl: g.id_back_url ?? undefined,
        idSelfieUrl: g.id_selfie_url ?? undefined,
        idVerificationSubmittedAt: g.id_verification_submitted_at ?? undefined,
        idVerificationReviewedAt: g.id_verification_reviewed_at ?? undefined,
        idVerificationRejectionReason: g.id_verification_rejection_reason ?? undefined,
        idUpdateRequestedAt: g.id_update_requested_at ?? undefined,
        idUpdateRequestNote: g.id_update_request_note ?? undefined,
        applicationRevisionRequestedAt: g.application_revision_requested_at ?? undefined,
        applicationRevisionNote: g.application_revision_note ?? undefined,
        applicationSubmissionSnapshot: parseApplicationSubmissionSnapshot(
          g.application_submission_snapshot
        ),
        idSubmittedBy: g.id_submitted_by === 'staff' || g.id_submitted_by === 'guard' ? g.id_submitted_by : undefined,
        idDocumentType:
          g.id_document_type === 'drivers_license' || g.id_document_type === 'state_id'
            ? g.id_document_type
            : undefined,
        idLicenseClass: g.id_license_class ?? undefined,
        idRevisionHistory: parseGovIdRevisionHistory(g.id_revision_history),
        credentialGraceDeadline: g.credential_grace_deadline ?? undefined,
        credentialGraceMissing: Array.isArray(g.credential_grace_missing)
          ? (g.credential_grace_missing as string[])
          : undefined,
        credentialGraceHours:
          typeof g.credential_grace_hours === 'number' ? g.credential_grace_hours : undefined,
        credentialExpiryRestricted: g.credential_expiry_restricted === true,
        trusted: g.trusted === true,
        insurancePolicy: insuranceByGuardId.get(g.id),
        vehicleInsurancePolicy: vehicleInsuranceByGuardId.get(g.id),
        vehicleProfile: vehicleProfileByGuardId.get(g.id),
        certifications: (dbCerts ?? []).filter((c: any) => c.guard_id === g.id).map((c: any) => ({
          id: c.id, name: c.name, issuer: c.issuer, number: c.number,
          status: (['verified', 'pending', 'rejected'].includes(c.status) ? c.status : 'pending') as Certification['status'],
          issueDate: c.issue_date, expiryDate: c.expiry_date ?? undefined,
          state: c.state ?? undefined,
          catalogId: c.catalog_id?.trim() || undefined,
          category: c.category ?? undefined,
          imageUrl: c.image_url ?? undefined,
          rejectionReason: c.rejection_reason ?? undefined,
          submittedByRole:
            c.submitted_by_role === 'staff' || c.submitted_by_role === 'guard'
              ? c.submitted_by_role
              : undefined,
          updateRequestedAt: c.update_requested_at ?? undefined,
          updateRequestNote: c.update_request_note ?? undefined,
          pendingUpdate: parseCertificationPendingUpdate(c.pending_update),
          revisionHistory: parseCertificationRevisionHistory(c.revision_history),
        })),
        experience: (dbExps ?? []).filter((e: any) => e.guard_id === g.id).map((e: any) => ({
          id: e.id, title: e.title, company: e.company, period: e.period, description: e.description,
        })),
        education: (dbEducation ?? []).filter((e: any) => e.guard_id === g.id).map((e: any) => ({
          id: e.id, school: e.school, degree: e.degree, field: e.field,
          period: e.period, description: e.description ?? '',
        })),
      };
      };

      const staffFromTable = staffTableAvailable
        ? (dbStaffRows ?? []).map((row: any) => mapStaffRowToSecurityGuard(row))
        : [];
      const fieldGuardRows = (dbGuards ?? []).filter(
        (g: any) => !g.migrated_to_staff_at && !g.is_staff
      );

      const sanitizedGuards = [...fieldGuardRows.map(mapGuardRow), ...staffFromTable].map(
        sanitizeGuardCombinedCertificates
      );
      const loadedGuards = sanitizedGuards.map((g) =>
        withAutoGuardActivation(syncGuardCredentialExpiryState(syncGuardCredentialGraceState(g)))
      );
      const disallowedCombinedCertIds = (dbCerts ?? [])
        .filter((c: any) =>
          isDisallowedCombinedGuardCertificate({
            catalogId: c.catalog_id?.trim() || undefined,
            name: c.name ?? '',
          })
        )
        .map((c: any) => String(c.id));
      setGuards(loadedGuards);
      // Persist auto-activation heal when credentials are already complete but user_status
      // was left on approved (e.g. last verify happened while suspended).
      for (let i = 0; i < loadedGuards.length; i++) {
        const before = sanitizedGuards[i];
        const after = loadedGuards[i];
        if (before.isStaff || !guardAutoActivated(before, after)) continue;
        void supabase
          .from('guards')
          .update({
            user_status: 'active',
            verified: true,
            credential_grace_deadline: null,
            credential_grace_missing: null,
            credential_grace_hours: null,
          })
          .eq('id', after.id);
      }
      if (disallowedCombinedCertIds.length > 0) {
        void supabase.from('certifications').delete().in('id', disallowedCombinedCertIds);
      }

      setClients((dbClients ?? []).map((c: any) => {
        const nameParts = resolvePersonNameParts({
          firstName: c.first_name,
          middleName: c.middle_name,
          lastName: c.last_name,
          name: c.name,
        });
        return {
        id: c.id, name: nameParts.name, firstName: nameParts.firstName, middleName: nameParts.middleName, lastName: nameParts.lastName, email: c.email,
        companyName: c.company_name, phone: c.phone, avatar: c.avatar,
        clientType: normalizeClientType(c.client_type),
        totalRequests: c.total_requests || 0,
        approved: c.account_status === 'active' || (c.approved ?? false),
        accountStatus: c.account_status || (c.approved === false ? 'suspended' : 'active'),
        applicationRevisionRequestedAt: c.application_revision_requested_at ?? undefined,
        applicationRevisionNote: c.application_revision_note ?? undefined,
        rating: c.rating != null ? Number(c.rating) : undefined,
        themePreference: normalizeThemeMode(c.theme_preference) ?? undefined,
        password: c.password ?? undefined,
        passwordHash: c.password_hash ?? undefined,
        mustChangePassword: c.must_change_password ?? false,
        businessType: c.business_type ?? undefined,
        industries: Array.isArray(c.industries) ? c.industries : undefined,
        businessLicense: c.business_license ?? undefined,
        website: c.website ?? undefined,
        serviceDescription: c.service_description ?? undefined,
        serviceTypes: Array.isArray(c.service_types) ? c.service_types : undefined,
        estimatedGuardsNeeded: c.estimated_guards_needed ?? undefined,
        armedPreference: c.armed_preference ?? undefined,
        serviceFrequencies: Array.isArray(c.service_frequencies) ? c.service_frequencies : undefined,
        estimatedStartDate: c.estimated_start_date ?? undefined,
        budgetRange: c.budget_range ?? undefined,
        serviceCity: c.service_city ?? undefined,
        serviceState: c.service_state ?? undefined,
        propertyTypes: Array.isArray(c.property_types) ? c.property_types : undefined,
        referredBy: c.referred_by ?? undefined,
        referredById: c.referred_by_id ?? undefined,
        howHeardAboutUs: c.how_heard_about_us ?? undefined,
        hasPriorSecurityService: c.has_prior_security_service ?? undefined,
        priorSecurityProvider: c.prior_security_provider ?? undefined,
        specialRequirements: c.special_requirements ?? undefined,
        trusted: c.trusted === true,
        favoriteGuardIds: Array.isArray(c.favorite_guard_ids) ? (c.favorite_guard_ids as string[]) : [],
        defaultAssignmentMode:
          c.default_assignment_mode === 'first-to-accept' ? 'first-to-accept' : 'client-approve',
        authorizedContacts: parseAuthorizedContacts(c.authorized_contacts),
        credentials: parseClientCredentials(c.credentials),
      };
      }));

      const { data: dbLocations, error: locationsErr } = await supabase.from('client_locations').select('*');
      if (locationsErr && locationsErr.code !== '42P01') {
        console.warn('Client locations load:', locationsErr);
      }
      setClientLocations(
        (dbLocations ?? []).map((row: any) => ({
          id: row.id,
          clientId: row.client_id,
          name: row.name,
          address: row.address,
          state: row.state ?? undefined,
          latitude: row.latitude != null ? Number(row.latitude) : undefined,
          longitude: row.longitude != null ? Number(row.longitude) : undefined,
          riskLevel: row.risk_level === 'high' || row.risk_level === 'low' ? row.risk_level : 'medium',
          status: row.status === 'rejected' ? 'rejected' : 'active',
          listed: row.listed === false || row.listed === 'false' ? false : true,
          siteInstructions: row.site_instructions ?? undefined,
          sharedLocationId: row.shared_location_id ?? undefined,
          createdAt: row.created_at ?? undefined,
          reviewedAt: row.reviewed_at ?? undefined,
          reviewedBy: row.reviewed_by ?? undefined,
        }))
      );

      const { data: dbJobLocations, error: jobLocationsErr } = await supabase
        .from('job_locations')
        .select('*');
      if (jobLocationsErr && jobLocationsErr.code !== '42P01') {
        console.warn('Job locations load (run migration if missing):', jobLocationsErr);
      }
      if (!jobLocationsErr) {
        setJobLocations((dbJobLocations ?? []).map((row: any) => jobLocationRowToRecord(row)));
      }

      setIsDbConnected(true);

      const { data: dbSlots, error: slotsErr } = await supabase.from('job_guard_slots').select('*');
      if (slotsErr && slotsErr.code !== '42P01') {
        console.warn('Job guard slots load (run migration if missing):', slotsErr);
      }
      const loadedRequests = attachSlotsToRequests(
        (dbRequests ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          clientId: r.client_id,
          clientName: r.client_name,
          clientLogo: r.client_logo,
          clientRating: r.client_rating != null ? Number(r.client_rating) : undefined,
          siteName: r.site_name || undefined,
          address: r.address || undefined,
          state: r.state || undefined,
          latitude: r.latitude != null ? Number(r.latitude) : undefined,
          longitude: r.longitude != null ? Number(r.longitude) : undefined,
          contactName: r.contact_name || undefined,
          contactPhone: r.contact_phone || undefined,
          parkingInstructions: r.parking_instructions || undefined,
          accessInstructions: r.access_instructions || undefined,
          location: r.location,
          type: r.type,
          armedRequired: r.armed_required,
          guardsNeeded: r.guards_needed ?? 1,
          uniformRequirements: r.uniform_requirements || undefined,
          equipmentRequirements: r.equipment_requirements || undefined,
          siteInstructions: r.site_instructions || undefined,
          operationalDetails: normalizeJobOperationalDetails(r.operational_details),
          startDate: r.start_date,
          endDate: r.end_date,
          scheduleType: r.schedule_type === 'recurring' ? 'recurring' : 'one-time',
          recurringEndDate: r.recurring_end_date ?? undefined,
          recurringDays: Array.isArray(r.recurring_days) ? r.recurring_days : undefined,
          assignmentMode:
            r.assignment_mode === 'first-to-accept' ? 'first-to-accept' : 'client-approve',
          minYearsExperience: r.min_years_experience ?? undefined,
          clientLocationId: r.client_location_id ?? undefined,
          jobLocationId: r.job_location_id ?? undefined,
          locationRiskLevel:
            r.location_risk_level === 'high' || r.location_risk_level === 'low'
              ? r.location_risk_level
              : r.location_risk_level === 'medium'
                ? 'medium'
                : undefined,
          tierPayRates: r.tier_pay_rates ?? undefined,
          postOrdersAcknowledgments: Array.isArray(r.post_orders_acknowledgments)
            ? r.post_orders_acknowledgments
            : [],
          briefingAcknowledgments: Array.isArray(r.briefing_acknowledgments)
            ? r.briefing_acknowledgments
            : [],
          shiftAuditViolations: Array.isArray(r.shift_audit_violations)
            ? r.shift_audit_violations
            : [],
          durationHours: r.duration_hours,
          hourlyRate: r.hourly_rate,
          scheduledDurationHours: r.scheduled_duration_hours != null ? Number(r.scheduled_duration_hours) : undefined,
          scheduledEstimatedPayout: r.scheduled_estimated_payout != null ? Number(r.scheduled_estimated_payout) : undefined,
          overtimeHours: r.overtime_hours != null ? Number(r.overtime_hours) : undefined,
          overtimeAmount: r.overtime_amount != null ? Number(r.overtime_amount) : undefined,
          overtimeStatus: r.overtime_status ?? undefined,
          overtimeGuardApprovedAt: r.overtime_guard_approved_at || undefined,
          overtimeClientApprovedAt: r.overtime_client_approved_at || undefined,
          overtimeDisputeReason: r.overtime_dispute_reason || undefined,
          overtimeDisputedAt: r.overtime_disputed_at || undefined,
          overtimeDisputeClaimedClockOutAt: r.overtime_dispute_claimed_clock_out_at || undefined,
          overtimeDisputeResolvedAt: r.overtime_dispute_resolved_at || undefined,
          overtimeDisputeResolution: r.overtime_dispute_resolution || undefined,
          overtimeOriginalHours: r.overtime_original_hours != null ? Number(r.overtime_original_hours) : undefined,
          overtimeOriginalAmount: r.overtime_original_amount != null ? Number(r.overtime_original_amount) : undefined,
          overtimePaymentStatus: r.overtime_payment_status ?? undefined,
          overtimeClientPaymentMethod: parsePaymentMethod(r.overtime_client_payment_method),
          overtimeClientCashPaymentRequested: !!r.overtime_client_cash_payment_requested,
          overtimeClientCashPaymentRequestedAt: r.overtime_client_cash_payment_requested_at || undefined,
          overtimeGuardPayoutAvailable: !!r.overtime_guard_payout_available,
          overtimeGuardPayoutAvailableAt: r.overtime_guard_payout_available_at || undefined,
          overtimeGuardPayoutMethod: parsePaymentMethod(r.overtime_guard_payout_method),
          earlyClockOutActualHours: r.early_clock_out_actual_hours != null ? Number(r.early_clock_out_actual_hours) : undefined,
          earlyClockOutRefundAmount: r.early_clock_out_refund_amount != null ? Number(r.early_clock_out_refund_amount) : undefined,
          earlyClockOutRefundStatus: r.early_clock_out_refund_status ?? undefined,
          guardPay: r.guard_pay ?? computeGuardPay(r.hourly_rate, r.platform_fee_per_hour ?? LEGACY_PLATFORM_FEE_PER_HOUR),
          platformFeePerHour: r.platform_fee_per_hour ?? LEGACY_PLATFORM_FEE_PER_HOUR,
          pricingMode: r.pricing_mode === 'open_contract' ? 'open_contract' : 'standard',
          agreementFeeConfig: r.agreement_fee_config ?? undefined,
          openingPriceOffer: r.opening_price_offer ?? undefined,
          priceNegotiations: Array.isArray(r.price_negotiations) ? r.price_negotiations : [],
          estimatedPayout: r.estimated_payout,
          status: normalizeJobStatus(r.status),
          assignedGuardId: r.assigned_guard_id,
          openedAt: r.opened_at ?? undefined,
          pendingStartDate: r.pending_start_date ?? undefined,
          pendingEndDate: r.pending_end_date ?? undefined,
          pendingDurationHours:
            r.pending_duration_hours != null ? Number(r.pending_duration_hours) : undefined,
          pendingEstimatedPayout:
            r.pending_estimated_payout != null ? Number(r.pending_estimated_payout) : undefined,
          scheduleChangeStatus:
            r.schedule_change_status === 'pending_staff'
              ? 'pending_staff'
              : r.schedule_change_status === 'pending_client'
                ? 'pending_client'
                : r.schedule_change_status === 'awaiting_payment'
                  ? 'awaiting_payment'
                  : r.schedule_change_status === 'pending_staff_billing'
                    ? 'pending_staff_billing'
                    : 'none',
          scheduleChangeRequestedAt: r.schedule_change_requested_at ?? undefined,
          scheduleChangeRequestedBy:
            r.schedule_change_requested_by === 'staff'
              ? 'staff'
              : r.schedule_change_requested_by === 'client'
                ? 'client'
                : undefined,
          scheduleChangeExtraAmount:
            r.schedule_change_extra_amount != null
              ? Number(r.schedule_change_extra_amount)
              : undefined,
          pendingGuardId: r.pending_guard_id ?? undefined,
          staffApprovedGuardAt: r.staff_approved_guard_at || undefined,
          requestType: r.request_type === 'direct' ? 'direct' : 'marketplace',
          targetGuardId: r.target_guard_id ?? r.preferred_guard_id ?? undefined,
          requiredCertifications: r.required_certifications || [],
          minGuardQualification: r.min_guard_qualification === 'active' ? 'active' : 'pending',
          applicants: r.applicants || [],
          ratingGiven: r.rating_given ?? undefined,
          reviewText: r.review_text ?? undefined,
          tipAmount: r.tip_amount != null ? Number(r.tip_amount) : undefined,
          tipPaymentStatus: r.tip_payment_status ?? undefined,
          tipStripeSessionId: r.tip_stripe_session_id ?? undefined,
          tipStripePaymentIntentId: r.tip_stripe_payment_intent_id ?? undefined,
          tipPaidAt: r.tip_paid_at ?? undefined,
          stripePaymentIntentId: r.stripe_payment_intent_id || undefined,
          paymentStatus: r.payment_status || 'unpaid',
          clientPaymentMethod: parsePaymentMethod(r.client_payment_method),
          guardPayoutMethod: parsePaymentMethod(r.guard_payout_method),
          cashDepositedToStripe: !!r.cash_deposited_to_stripe,
          cashDepositedAmount: r.cash_deposited_amount != null ? Number(r.cash_deposited_amount) : undefined,
          cashDepositedAt: r.cash_deposited_at || undefined,
          cashDepositedManually: !!r.cash_deposited_manually,
          platformFeePaidCash: !!r.platform_fee_paid_cash,
          guardCashPayoutRequested: !!r.guard_cash_payout_requested,
          guardCashPayoutRequestedAt: r.guard_cash_payout_requested_at || undefined,
          guardPayoutAvailable: !!r.guard_payout_available,
          guardPayoutAvailableAt: r.guard_payout_available_at || undefined,
          clientCashPaymentRequested: !!r.client_cash_payment_requested,
          clientCashPaymentRequestedAt: r.client_cash_payment_requested_at || undefined,
          checkInAudit: r.check_in_audit ?? undefined,
          spotChecks: Array.isArray(r.spot_checks) ? r.spot_checks : [],
          midShiftAudits: Array.isArray(r.mid_shift_audits) ? r.mid_shift_audits : [],
          enRouteAt: r.en_route_at ?? undefined,
          arrivedAt: r.arrived_at ?? undefined,
          guardLiveLocation: r.guard_live_location ?? undefined,
          replacementRequest: r.replacement_request ?? undefined,
          noShow: !!r.no_show,
          clientViolationReports: Array.isArray(r.client_violation_reports)
            ? r.client_violation_reports
            : [],
          breakMinutes: r.break_minutes != null ? Number(r.break_minutes) : 0,
          breakPaid: r.break_paid !== false,
          shiftBreaks: Array.isArray(r.shift_breaks) ? r.shift_breaks : [],
          checkOutAudit: r.check_out_audit ?? undefined,
          serviceAgreement: parseJobServiceAgreement(r.service_agreement),
          autoPayoutScheduledAt: r.auto_payout_scheduled_at ?? undefined,
        })),
        (dbSlots ?? []).map(slotFromDbRow)
      );
      setRequests(loadedRequests);

      if (!clientInvoicesErr && dbClientInvoices) {
        const loadedInvoices = dbClientInvoices.map((row: Record<string, unknown>) =>
          clientInvoiceFromRow(row)
        );
        const syncedInvoices = syncInvoicePaymentStatus(loadedInvoices, loadedRequests);
        setClientInvoices(syncedInvoices);
        saveClientInvoicesToStorage(syncedInvoices);
      } else {
        const localInvoices = syncInvoicePaymentStatus(loadClientInvoicesFromStorage(), loadedRequests);
        setClientInvoices(localInvoices);
        saveClientInvoicesToStorage(localInvoices);
      }

      setPayments((dbPayments ?? []).map((p: any) => ({
        id: p.id,
        jobId: p.job_id,
        amount: Number(p.amount),
        stripeSessionId: p.stripe_session_id || undefined,
        stripePaymentIntentId: p.stripe_payment_intent_id || undefined,
        stripeTransferId: p.stripe_transfer_id || undefined,
        paymentMethod: parsePaymentMethod(p.payment_method),
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })));

      if (!payoutInvoicesErr && dbPayoutInvoices) {
        setGuardPayoutInvoices(
          dbPayoutInvoices.map((row: any) => ({
            id: row.id,
            guardId: row.guard_id,
            guardName: row.guard_name,
            guardEmail: row.guard_email,
            method: row.method === 'cash' ? 'cash' : 'stripe',
            jobIds: row.job_ids || [],
            lines: Array.isArray(row.lines) ? row.lines : [],
            total: Number(row.total),
            status: row.status,
            createdAt: row.created_at,
            resolvedAt: row.resolved_at ?? undefined,
          }))
        );
      }

      if (!supportTicketsErr && !supportMessagesErr && dbSupportTickets != null) {
        const mappedTickets = dbSupportTickets.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name,
          userEmail: t.user_email,
          userRole: t.user_role,
          kind: t.kind,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          relatedRequestId: t.related_request_id ?? undefined,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          messages: (dbSupportMessages ?? [])
            .filter((m: any) => m.ticket_id === t.id)
            .map((m: any) => ({
              id: m.id,
              ticketId: m.ticket_id,
              senderId: m.sender_id,
              senderName: m.sender_name,
              senderRole: m.sender_role,
              body: m.body,
              createdAt: m.created_at,
            }))
            .sort((a: { createdAt: string }, b: { createdAt: string }) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
        }));
        setSupportTickets(mappedTickets);
        saveSupportTicketsToStorage(mappedTickets);
      }

      if (!jobChatThreadsErr && dbJobChatThreads != null) {
        const mappedThreads = dbJobChatThreads.map((t: any) => ({
          id: t.id,
          requestId: t.request_id,
          clientId: t.client_id,
          guardId: t.guard_id,
          status: t.status,
          createdAt: t.created_at,
          archivedAt: t.archived_at ?? undefined,
        }));
        setJobChatThreads(mappedThreads);
        saveJobChatThreadsToStorage(mappedThreads);
      }

      if (!jobChatMessagesErr && dbJobChatMessages != null) {
        const mappedMessages = dbJobChatMessages.map((m: any) => ({
          id: m.id,
          threadId: m.thread_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          body: m.body,
          createdAt: m.created_at,
        }));
        setJobChatMessages(mappedMessages);
        saveJobChatMessagesToStorage(mappedMessages);
      }


      if (!staffMessagesErr && dbStaffMessages != null) {
        const mappedStaffMessages = dbStaffMessages.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          body: m.body,
          createdAt: m.created_at,
        }));
        const nextStaffMessages = sortedStaffMessages(mappedStaffMessages);
        setStaffMessages(nextStaffMessages);
        saveStaffMessagesToStorage(nextStaffMessages);
      }

      if (!guardMessagesErr && dbGuardMessages != null) {
        const mappedGuardMessages = dbGuardMessages.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          body: m.body,
          createdAt: m.created_at,
        }));
        const nextGuardMessages = sortedGuardMessages(mappedGuardMessages);
        setGuardMessages(nextGuardMessages);
        saveGuardMessagesToStorage(nextGuardMessages);
      }

      if (!clientMessagesErr && dbClientMessages != null) {
        const mappedClientMessages = dbClientMessages.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          body: m.body,
          createdAt: m.created_at,
        }));
        const nextClientMessages = sortedClientMessages(mappedClientMessages);
        setClientMessages(nextClientMessages);
        saveClientMessagesToStorage(nextClientMessages);
      }

      if (!platformSettingsErr && dbPlatformSettings) {
        const loaded = platformSettingsFromDbRow(dbPlatformSettings);
        setPlatformSettings(loaded);
        savePlatformSettingsToStorage(loaded);
      }

      if (!platformCitiesErr) {
        let loadedCities = (dbPlatformCities ?? []).map((row: Record<string, unknown>) =>
          platformCityFromRow(row)
        );
        if (loadedCities.length === 0) {
          loadedCities = buildDefaultPlatformCities();
          try {
            await supabase
              .from('platform_cities')
              .upsert(loadedCities.map((city) => platformCityToDbRow(city)));
          } catch (seedErr) {
            console.warn('Platform cities seed:', seedErr);
          }
        } else {
          const merged = mergeMissingPlatformCities(loadedCities);
          const missing = merged.filter((city) => !loadedCities.some((row) => row.id === city.id));
          if (missing.length > 0) {
            loadedCities = merged;
            try {
              await supabase
                .from('platform_cities')
                .upsert(missing.map((city) => platformCityToDbRow(city)));
            } catch (seedErr) {
              console.warn('Platform cities sync:', seedErr);
            }
          }
        }
        setPlatformCities(loadedCities);
        setPlatformCitiesCache(loadedCities);
      }


      setIsDbConnected(true);
    } catch (err) {
      console.error('Supabase load error:', err);
      setGuards([]);
      setClients([]);
      setRequests([]);
      setIsDbConnected(false);
    }
  };

  const mapDbStaffMessageRow = (m: {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    body: string;
    created_at: string;
  }): StaffMessage => ({
    id: m.id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role as StaffMessage['senderRole'],
    body: m.body,
    createdAt: m.created_at,
  });

  const mapDbGuardMessageRow = (m: {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    body: string;
    created_at: string;
  }): GuardMessage => ({
    id: m.id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role as GuardMessage['senderRole'],
    body: m.body,
    createdAt: m.created_at,
  });

  const mapDbClientMessageRow = (m: {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    body: string;
    created_at: string;
  }): ClientMessage => ({
    id: m.id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    senderRole: m.sender_role as ClientMessage['senderRole'],
    body: m.body,
    createdAt: m.created_at,
  });

  const refreshGuardMessages = useCallback(async () => {
    if (!currentUser || !canReadGuardChat(currentUser)) return;

    const applyRemote = (remote: GuardMessage[]) => {
      const next = sortedGuardMessages(remote);
      setGuardMessages((prev) => {
        if (
          next.length === prev.length &&
          next.every((message, index) => message.id === prev[index]?.id)
        ) {
          return prev;
        }
        saveGuardMessagesToStorage(next);
        return next;
      });
    };

    if (isDbConnected) {
      try {
        const { data, error } = await supabase
          .from('guard_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          applyRemote(data.map((row: any) => mapDbGuardMessageRow(row)));
          return;
        }
        if (error) console.warn('Guard messages client refresh:', error.message);
      } catch (err) {
        console.warn('Guard messages client refresh:', err);
      }
    }

    try {
      const remote = await fetchGuardMessagesFromApi(currentUser);
      applyRemote(remote);
    } catch (err) {
      console.warn('Guard messages API refresh:', err);
    }
  }, [currentUser, isDbConnected]);

  const refreshGuardMessagesRef = useRef(refreshGuardMessages);
  refreshGuardMessagesRef.current = refreshGuardMessages;

  const refreshClientMessages = useCallback(async () => {
    if (!currentUser || !canReadClientChat(currentUser)) return;

    const applyRemote = (remote: ClientMessage[]) => {
      const next = sortedClientMessages(remote);
      setClientMessages((prev) => {
        if (
          next.length === prev.length &&
          next.every((message, index) => message.id === prev[index]?.id)
        ) {
          return prev;
        }
        saveClientMessagesToStorage(next);
        return next;
      });
    };

    if (isDbConnected) {
      try {
        const { data, error } = await supabase
          .from('client_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          applyRemote(data.map((row: any) => mapDbClientMessageRow(row)));
          return;
        }
        if (error) console.warn('Client messages client refresh:', error.message);
      } catch (err) {
        console.warn('Client messages client refresh:', err);
      }
    }

    try {
      const remote = await fetchClientMessagesFromApi(currentUser);
      applyRemote(remote);
    } catch (err) {
      console.warn('Client messages API refresh:', err);
    }
  }, [currentUser, isDbConnected]);

  const refreshClientMessagesRef = useRef(refreshClientMessages);
  refreshClientMessagesRef.current = refreshClientMessages;

  const refreshStaffMessages = useCallback(async () => {
    if (!currentUser || !isStaffRole(currentUser.role)) return;

    const applyRemote = (remote: StaffMessage[]) => {
      const next = sortedStaffMessages(remote);
      setStaffMessages((prev) => {
        if (
          next.length === prev.length &&
          next.every((message, index) => message.id === prev[index]?.id)
        ) {
          return prev;
        }
        saveStaffMessagesToStorage(next);
        return next;
      });
    };

    if (isDbConnected) {
      try {
        const { data, error } = await supabase
          .from('staff_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) {
          applyRemote(data.map((row: any) => mapDbStaffMessageRow(row)));
          return;
        }
        if (error) console.warn('Staff messages client refresh:', error.message);
      } catch (err) {
        console.warn('Staff messages client refresh:', err);
      }
    }

    try {
      const remote = await fetchStaffMessagesFromApi(currentUser);
      applyRemote(remote);
    } catch (err) {
      console.warn('Staff messages API refresh:', err);
    }
  }, [currentUser, isDbConnected]);

  const refreshStaffMessagesRef = useRef(refreshStaffMessages);
  refreshStaffMessagesRef.current = refreshStaffMessages;

  // Drop stale session if user no longer exists in DB
  useEffect(() => {
    if (!currentUser || loading) return;
    const emailLower = currentUser.email.toLowerCase();
    const exists =
      currentUser.role === 'client'
        ? clients.some((c) => c.email.toLowerCase() === emailLower)
        : guards.some((g) => g.email.toLowerCase() === emailLower);
    if (!exists) {
      localStorage.removeItem('guardr_current_user');
      setCurrentUser(null);
    }
  }, [currentUser, guards, clients, loading]);

  // Live sync — any DB change propagates to all open sessions without a manual refresh
  const loadRef = useRef(loadFromSupabase);
  loadRef.current = loadFromSupabase;
  loadAppDataRef.current = () => {
    void loadRef.current();
  };

  useSupabaseRealtimeSync(() => {
    if (shouldSkipRealtimeSync()) return;
    if (isInactiveGuardSession(currentUserRef.current, guardsRef.current)) return;
    void loadRef.current();
  }, isDbConnected);

  const hydrateGuardCertificationImages = useCallback(async (certIds: string[]) => {
    if (!isDbConnected || certIds.length === 0) return;
    const pending = certIds.filter((id) => !certImageHydrationRef.current.has(id));
    if (pending.length === 0) return;

    const { imagesByCertId, error } = await fetchCertificationImagesByCertIds(supabase, pending);
    if (error) {
      console.warn('Certification image hydrate:', error);
      return;
    }

    pending.forEach((id) => certImageHydrationRef.current.add(id));
    if (imagesByCertId.size === 0) return;
    setGuards((prev) => mergeCertificationImagesByCertId(prev, imagesByCertId));
  }, [isDbConnected]);

  useEffect(() => {
    if (!currentUser || !isDbConnected) return;

    const targetGuardIds: string[] = [];
    if (currentUser.role === 'guard') {
      const guard = findGuardProfileForUser(currentUser, guardsRef.current);
      if (guard?.id) targetGuardIds.push(guard.id);
    } else if (isStaffRole(currentUser.role)) {
      if (staffGuardId) targetGuardIds.push(staffGuardId);
      if (staffCredentialItemId) {
        const context = resolveCredentialFeedContext(guardsRef.current, staffCredentialItemId);
        if (context && context.kind !== 'client-credential' && context.guard.id) {
          targetGuardIds.push(context.guard.id);
        }
      }
      for (const guard of guardsRef.current) {
        if (guard.certifications.some((cert) => cert.status === 'pending' && certNeedsImageHydration(cert))) {
          targetGuardIds.push(guard.id);
        }
      }
    }

    const certIds = collectCertIdsNeedingImageHydration(
      guardsRef.current,
      [...new Set(targetGuardIds)]
    );
    if (certIds.length === 0) return;
    void hydrateGuardCertificationImages(certIds);
  }, [
    currentUser?.id,
    currentUser?.role,
    guards,
    isDbConnected,
    staffGuardId,
    staffCredentialItemId,
    hydrateGuardCertificationImages,
  ]);

  useUserNotificationsRealtime(
    currentUser?.id,
    (updater) => setUserNotifications(updater),
    isDbConnected && !!currentUser
  );

  useRequestLiveLocationRealtime((requestId, location) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, guardLiveLocation: location } : r))
    );
  }, isDbConnected);

  useEffect(() => {
    const tick = () => {
      setGuards((prev) => {
        const afterGrace = processGuardCredentialGraceBatch(prev);
        const expiryPatches = processGuardCredentialExpiryBatch(afterGrace);
        const next = expiryPatches.map((patch) => patch.guard);
        let changed = false;
        for (let i = 0; i < prev.length; i++) {
          const before = prev[i];
          const after = next[i];
          if (before === after) continue;
          changed = true;
          const patch = expiryPatches[i];
          if (isDbConnected) {
            beginLocalMutation();
            void supabase
              .from('guards')
              .update({
                user_status: after.userStatus,
                credential_grace_deadline: after.credentialGraceDeadline ?? null,
                credential_grace_missing: after.credentialGraceMissing ?? null,
                credential_grace_hours: after.credentialGraceHours ?? null,
                id_update_requested_at: after.idUpdateRequestedAt ?? null,
                id_update_request_note: after.idUpdateRequestNote ?? null,
                credential_expiry_restricted: after.credentialExpiryRestricted ?? false,
              })
              .eq('id', after.id);
            for (const certUpdate of patch.certUpdates) {
              void updateCertificationRow(supabase, certUpdate.certId, {
                update_requested_at: certUpdate.cert.updateRequestedAt ?? null,
                update_request_note: certUpdate.cert.updateRequestNote ?? null,
                revision_history: certUpdate.cert.revisionHistory ?? [],
              });
            }
            if (
              patch.insurancePolicy &&
              patch.insurancePolicy !== before.insurancePolicy
            ) {
              void supabase
                .from('guard_insurance_policies')
                .update(insurancePolicyToDbRow(patch.insurancePolicy))
                .eq('guard_id', after.id);
            }
            if (
              patch.vehicleInsurancePolicy &&
              patch.vehicleInsurancePolicy !== before.vehicleInsurancePolicy
            ) {
              void supabase
                .from('guard_vehicle_insurance_policies')
                .update(vehicleInsurancePolicyToDbRow(patch.vehicleInsurancePolicy))
                .eq('guard_id', after.id);
            }
          }
          const actor = currentUserRef.current;
          if (actor && patch.notifications.length > 0) {
            for (const notification of patch.notifications) {
              notifyAccountUpdate(actor, after.id, notification.title, notification.body);
            }
          }
        }
        return changed ? next : prev;
      });
    };

    tick();
    const intervalId = window.setInterval(tick, 60_000);
    return () => window.clearInterval(intervalId);
  }, [isDbConnected]);

  useMessageRealtimeSync(
    {
      onJobChatMessage: (message) => {
        if (shouldSkipRealtimeSync()) return;
        const fromSelf = message.senderId === currentUser?.id;
        let isNew = false;
        setJobChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          isNew = true;
          const next = [...prev, message];
          saveJobChatMessagesToStorage(next);
          return next;
        });
        if (isNew && !fromSelf) void playWalkieChirpSound();
      },
      onStaffMessage: (message) => {
        const fromSelf = message.senderId === currentUser?.id;
        let isNew = false;
        setStaffMessages((prev) => {
          const next = appendStaffMessage(prev, message);
          if (next === prev) return prev;
          isNew = true;
          saveStaffMessagesToStorage(next);
          return next;
        });
        if (isNew && !fromSelf) void playWalkieChirpSound();
      },
      onGuardMessage: (message) => {
        const fromSelf = message.senderId === currentUser?.id;
        let isNew = false;
        setGuardMessages((prev) => {
          const next = appendGuardMessage(prev, message);
          if (next === prev) return prev;
          isNew = true;
          saveGuardMessagesToStorage(next);
          return next;
        });
        if (isNew && !fromSelf) void playWalkieChirpSound();
      },
      onClientMessage: (message) => {
        const fromSelf = message.senderId === currentUser?.id;
        let isNew = false;
        setClientMessages((prev) => {
          const next = appendClientMessage(prev, message);
          if (next === prev) return prev;
          isNew = true;
          saveClientMessagesToStorage(next);
          return next;
        });
        if (isNew && !fromSelf) void playWalkieChirpSound();
      },
      onSupportMessage: (message) => {
        if (shouldSkipRealtimeSync()) return;
        const fromSelf = message.senderId === currentUser?.id;
        let played = false;
        setSupportTickets((prev) => {
          let changed = false;
          const next = prev.map((ticket) => {
            if (ticket.id !== message.ticketId) return ticket;
            if (ticket.messages.some((m) => m.id === message.id)) return ticket;
            changed = true;
            return {
              ...ticket,
              updatedAt: message.createdAt,
              messages: [...ticket.messages, message].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              ),
            };
          });
          if (changed) {
            saveSupportTicketsToStorage(next);
            played = !fromSelf;
          }
          return changed ? next : prev;
        });
        if (played) void playWalkieChirpSound();
      },
      onMessageDeleted: (table, id) => {
        if (shouldSkipRealtimeSync()) return;
        switch (table) {
          case 'guard_messages':
            void refreshGuardMessagesRef.current();
            break;
          case 'staff_messages':
            void refreshStaffMessagesRef.current();
            break;
          case 'client_messages':
            void refreshClientMessagesRef.current();
            break;
          case 'job_chat_messages':
            setJobChatMessages((prev) => {
              const next = prev.filter((m) => m.id !== id);
              if (next.length === prev.length) return prev;
              saveJobChatMessagesToStorage(next);
              return next;
            });
            break;
          case 'support_messages':
            setSupportTickets((prev) => {
              let changed = false;
              const next = prev.map((ticket) => {
                const filtered = ticket.messages.filter((m) => m.id !== id);
                if (filtered.length === ticket.messages.length) return ticket;
                changed = true;
                return { ...ticket, messages: filtered };
              });
              if (changed) saveSupportTicketsToStorage(next);
              return changed ? next : prev;
            });
            break;
          default:
            break;
        }
      },
    },
    isDbConnected
  );

  const isInMessagingView = useMemo(() => {
    if (!currentUser) return false;
    const role = appRoleForUser(currentUser);
    if (role === 'client') {
      return (
        clientView === 'messages' ||
        clientView === 'support' ||
        clientView === 'support-compose' ||
        clientView === 'support-report'
      );
    }
    if (role === 'guard') {
      return (
        guardTab === 'messages' ||
        guardTab === 'guardChat' ||
        guardTab === 'support'
      );
    }
    if (role === 'staff') {
      return isStaffMessagesSection(staffSection) || staffSection === 'support';
    }
    return false;
  }, [currentUser, clientView, guardTab, staffSection, openJobChat]);

  const clientPaymentGatesMemo = useMemo(
    () => clientPaymentGates(platformSettings),
    [platformSettings]
  );

  const companyPlacardPublicDocuments = useMemo(
    () =>
      getCompanyPlacardPublicItems(
        companyPublicDocuments,
        platformSettings.companyPlacardPublicEnabled !== false
      ),
    [companyPublicDocuments, platformSettings.companyPlacardPublicEnabled]
  );

  useEffect(() => {
    if (!isDbConnected || !isInMessagingView) return;
    const interval = setInterval(() => {
      if (isStaffMessagesSection(staffSection) && currentUser && isStaffRole(currentUser.role)) {
        void refreshStaffMessagesRef.current();
        return;
      }
      if ((guardTab === 'messages' || guardTab === 'guardChat') && currentUser?.role === 'guard') {
        void refreshGuardMessagesRef.current();
        return;
      }
      if (clientView === 'messages' && currentUser?.role === 'client') {
        void refreshClientMessagesRef.current();
        return;
      }
      if (!shouldSkipRealtimeSync()) {
        void loadRef.current();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isDbConnected, isInMessagingView, staffSection, guardTab, currentUser]);

  useEffect(() => {
    if (!isDbConnected || !currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();
      for (const req of requests) {
        const snapshot = evaluateCheckInEscalation(req, now);
        if (!snapshot || snapshot.tier === 'none' || snapshot.tier === 'due') continue;

        const dedupKey = checkInEscalationDedupKey(req.id, snapshot.dueBucket, snapshot.tier);
        if (missedCheckinNotifiedRef.current.has(dedupKey)) continue;

        missedCheckinNotifiedRef.current.add(dedupKey);
        const guard = guards.find((g) => g.id === req.assignedGuardId);
        void reportPushEvent(currentUser, {
          type: 'missed_checkin',
          checkinEscalationTier: snapshot.tier,
          checkinDueBucket: snapshot.dueBucket,
          guardId: guard?.id,
          guardName: guard?.name,
          requestId: req.id,
          location: req.location,
          priority: snapshot.tier === 'escalate' ? 'high' : 'normal',
        });
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [isDbConnected, currentUser?.id, requests, guards]);

  useEffect(() => {
    if (!isDbConnected || !currentUser || currentUser.role !== 'guard') return;

    const tick = () => {
      const now = Date.now();
      for (const req of requests) {
        if (req.assignedGuardId !== currentUser.id) continue;
        const tier = evaluatePreShiftBriefingReminder(req, now);
        if (!tier) continue;

        const dedupKey = preShiftBriefingReminderDedupKey(req.id, currentUser.id, tier);
        if (preShiftBriefingNotifiedRef.current.has(dedupKey)) continue;
        preShiftBriefingNotifiedRef.current.add(dedupKey);

        const copy = preShiftBriefingReminderCopy(tier, req.title);
        void reportPushEvent(currentUser, {
          type: 'pre_shift_briefing',
          recipientUserId: currentUser.id,
          requestId: req.id,
          guardId: currentUser.id,
          title: copy.title,
          body: copy.body,
          priority: copy.priority,
          url: `/guard/map?jc=${encodeURIComponent(req.id)}`,
        });
      }
    };

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [isDbConnected, currentUser?.id, currentUser?.role, requests]);

  // Fallback when realtime reconnects after sleep / background tab
  useEffect(() => {
    if (!isDbConnected) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || shouldSkipRealtimeSync()) return;
      if (isInactiveGuardSession(currentUserRef.current, guardsRef.current)) return;
      void loadRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isDbConnected]);

  // ── Derived ────────────────────────────────────────────────
  // Only real guards (not clients/auditors/staff-only accounts)
  const verifiedGuards = guards.filter(g => !g.id.startsWith('client-') && !g.id.startsWith('auditor-'));

  useEffect(() => {
    if (!currentUser) {
      setTutorialState(null);
      return;
    }
    const tour = getTourForRole(currentUser.role);
    if (tour) migrateLegacyTourCompletion(currentUser.id, tour.id);
    setTutorialState(loadTutorialState(currentUser.id));
  }, [currentUser?.id, currentUser?.role]);

  const tutorialDemoRequests = tutorialState?.session?.demoData.requests ?? [];
  const displayRequests = useMemo(
    () =>
      tutorialDemoRequests.length > 0
        ? mergeTutorialRequests(requests, tutorialDemoRequests)
        : requests,
    [requests, tutorialDemoRequests]
  );

  const sessionGuard =
    currentUser?.role === 'guard' ? findGuardProfileForUser(currentUser, verifiedGuards) : undefined;
  const activeGuard =
    sessionGuard ??
    (activeGuardId ? verifiedGuards.find((g) => g.id === activeGuardId) : undefined) ??
    ({} as SecurityGuard);
  const resolvedGuardTab: GuardTab = normalizeGuardTabForAccount(guardTab, sessionGuard);
  const activationSupportChat = sessionGuard
    ? findActivationSupportChat(supportTickets, { id: sessionGuard.id, email: sessionGuard.email })
    : null;

  useEffect(() => {
    if (loading || !currentUser || activationSupportBackfillRunningRef.current) return;

    if (isStaffRole(currentUser.role)) {
      if (!isExecutiveOpsRole(currentUser.role)) return;
      const missing = listGuardsNeedingActivationSupport(verifiedGuards, supportTickets);
      if (missing.length === 0) return;
      activationSupportBackfillRunningRef.current = true;
      void backfillActivationSupportTickets(missing).finally(() => {
        activationSupportBackfillRunningRef.current = false;
      });
      return;
    }

    if (currentUser.role !== 'guard') return;
    const guard = findGuardProfileForUser(currentUser, verifiedGuards);
    if (!guard || !guardNeedsActivationSupportChat(guard, supportTickets)) return;
    void ensureActivationSupportTicket(guard);
  }, [loading, currentUser?.id, currentUser?.role, verifiedGuards, supportTickets]);

  useEffect(() => {
    if (loading) return;
    const activeGuards = verifiedGuards.filter((g) => !g.isStaff && isGuardAccountActive(g));
    if (activeGuards.length === 0) return;
    void syncActivationSupportClosures(activeGuards);
  }, [loading, verifiedGuards, supportTickets]);

  useEffect(() => {
    if (loading || currentUser?.role !== 'guard') return;
    const guard = findGuardProfileForUser(currentUser, verifiedGuards);
    if (!guard?.id) return;
    const normalizedTab = normalizeGuardTabForAccount(guardTab, guard);
    if (normalizedTab === guardTab) return;
    setGuardTabState(normalizedTab);
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: normalizedTab,
        jobChatRequestId: jobChatRequestId ?? undefined,
        openJobChat: openJobChat || undefined,
        supportTicketId: supportTicketId ?? undefined,
        supportSection: supportSection,
        supportMode: supportMode ?? undefined,
      }),
      true
    );
  }, [
    loading,
    currentUser,
    verifiedGuards,
    guardTab,
    jobChatRequestId,
    openJobChat,
    supportTicketId,
    supportSection,
    supportMode,
  ]);

  // ── Auth ───────────────────────────────────────────────────
  const handleSignIn = (user: SessionUser, options?: { passwordChangeRecommended?: boolean }) => {
    localStorage.setItem('guardr_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setPasswordChangePromptOpen(!!options?.passwordChangeRecommended);
    setIsAuthView(false);
    void writeAuditLog(user, 'sign_in', 'session', user.id);
  };

  const handleDismissPasswordChange = () => {
    setPasswordChangePromptOpen(false);
  };

  useEffect(() => {
    return registerSystemBackHandler(() => {
      if (passwordChangePromptOpen) {
        handleDismissPasswordChange();
        return true;
      }

      if (currentUser && tutorialState && isTutorialActive(tutorialState)) {
        if (tutorialState.session && tutorialState.session.stepIndex > 0) {
          setTutorialState(retreatTutorialStep(currentUser.id, tutorialState));
        } else {
          setTutorialState(endTutorial(currentUser.id));
        }
        return true;
      }

      const tour = currentUser ? getTourForRole(currentUser.role) : null;
      if (currentUser && tutorialState && tour && shouldOfferTutorialPrompt(tutorialState, tour)) {
        setTutorialState(declineTutorial(currentUser.id));
        return true;
      }

      if (clientMessagesDetailOpen) {
        setClientMessagesDetailOpen(false);
        return true;
      }

      if (clientTeamDetailOpen) {
        setClientTeamDetailOpen(false);
        return true;
      }

      if (!currentUser && isAuthView) {
        backToAuthRoleChoice();
        return true;
      }

      if (!currentUser && authChoiceMode) {
        closeAuthChoice();
        return true;
      }

      return false;
    });
  }, [
    passwordChangePromptOpen,
    currentUser,
    tutorialState,
    clientMessagesDetailOpen,
    clientTeamDetailOpen,
    isAuthView,
    authChoiceMode,
    initialAuthMode,
    authSignupPick,
  ]);

  const handleChangeAccountPassword = async (newPassword: string) => {
    if (!currentUser) return;
    if (newPassword === STAFF_PROVISIONED_DEFAULT_PASSWORD) {
      throw new Error('Choose a password different from the default staff-assigned password.');
    }

    const emailLower = currentUser.email.toLowerCase();
    const isClient = currentUser.role === 'client';

    if (isClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.email.toLowerCase() === emailLower
            ? { ...c, password: newPassword, mustChangePassword: false }
            : c
        )
      );
      if (isDbConnected) {
        await supabase
          .from('clients')
          .update({ password: newPassword, must_change_password: false })
          .eq('id', currentUser.id);
      }
      setStoredPassword(emailLower, { password: newPassword, mustChangePassword: false, role: 'client' });
    } else {
      setGuards((prev) =>
        prev.map((g) =>
          g.email.toLowerCase() === emailLower
            ? { ...g, password: newPassword, mustChangePassword: false }
            : g
        )
      );
      if (isDbConnected) {
        const table = isStaffRole(currentUser.role) ? 'staff' : 'guards';
        await supabase
          .from(table)
          .update({ password: newPassword, must_change_password: false })
          .eq('id', currentUser.id);
      }
      setStoredPassword(emailLower, { password: newPassword, mustChangePassword: false, role: 'guard' });
    }

    setPasswordChangePromptOpen(false);
  };

  const handleSignOut = () => {
    if (currentUser) void writeAuditLog(currentUser, 'sign_out', 'session', currentUser.id);
    void signOutAuth();
    localStorage.removeItem('guardr_current_user');
    clearPersistedAppRoute();
    setCurrentUser(null);
    setIsAuthView(false);
    setLegalPageState(null);
    setLegalReturnAuth(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({ home: true }, '', '/');
    }
  };

  const recordLegalAcceptances = async (
    role: LegalUserRole,
    userId: string,
    documentIds: LegalPageId[]
  ) => {
    const uniqueIds = [...new Set(documentIds)];
    const rows = uniqueIds.map((documentId) =>
      legalAcceptanceToDbRow({
        userId,
        userRole: role,
        documentId,
        documentVersion: CURRENT_LEGAL_VERSIONS[documentId],
      })
    );
    if (isDbConnected && rows.length > 0) {
      const { error } = await supabase.from('user_legal_acceptances').upsert(rows, {
        onConflict: 'user_id,document_id,document_version',
        ignoreDuplicates: true,
      });
      if (error) console.warn('Legal acceptance save:', error);
    }
    setLegalAcceptanceKeys((prev) => {
      const next = new Set(prev);
      for (const documentId of uniqueIds) {
        next.add(legalAcceptanceKey(userId, documentId, CURRENT_LEGAL_VERSIONS[documentId]));
      }
      return next;
    });
    setLegalAcceptanceRecords((prev) => {
      const acceptedAt = new Date().toISOString();
      const next = [...prev];
      for (const documentId of uniqueIds) {
        const existingIndex = next.findIndex(
          (record) => record.userId === userId && record.documentId === documentId
        );
        const record: LegalAcceptanceRecord = {
          id: existingIndex >= 0 ? next[existingIndex].id : `legal-${userId}-${documentId}`,
          userId,
          userRole: role,
          documentId,
          documentVersion: CURRENT_LEGAL_VERSIONS[documentId],
          acceptedAt,
        };
        if (existingIndex >= 0) next[existingIndex] = record;
        else next.push(record);
      }
      return next;
    });
  };

  const handleSaveGuardInsurance = async (
    policy: Partial<GuardInsurancePolicy> & { guardId: string }
  ) => {
    const targetGuard = guards.find((g) => g.id === policy.guardId);
    const existing = targetGuard?.insurancePolicy;
    const staffActor = Boolean(
      currentUser && currentUser.id !== policy.guardId && isStaffRole(currentUser.role)
    );
    if (staffActor) {
      const hasExistingSubmission =
        Boolean(existing) &&
        existing!.status !== 'not_submitted' &&
        Boolean(existing!.documentUrl?.trim() || existing!.carrier?.trim() || existing!.policyNumber?.trim());
      if (!hasExistingSubmission) {
        throw new Error(STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE);
      }
      if (targetGuard && !staffCanEditGuardCoi(targetGuard)) {
        throw new Error(STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE);
      }
    } else if (targetGuard && !guardCoiCanGuardEdit(targetGuard)) {
      throw new Error(COI_SUBMITTED_LOCKED_MESSAGE);
    }
    const staffBypass = staffActor;

    const documentChanged = Boolean(
      policy.documentUrl?.trim() &&
        policy.documentUrl.trim() !== (existing?.documentUrl ?? '').trim()
    );
    let revisionHistory = existing?.revisionHistory;
    if (
      existing &&
      documentChanged &&
      resolveInsuranceStatus(existing) === 'verified'
    ) {
      revisionHistory = prependCoiRevision(
        revisionHistory,
        snapshotCoiRevision({ ...existing, status: 'verified' }, 'superseded')
      );
    }
    const clearUpdateRequest = !staffBypass && Boolean(existing?.updateRequestedAt);
    const nextPolicy: GuardInsurancePolicy = {
      id: existing?.id ?? policy.id ?? `ins-${policy.guardId}`,
      guardId: policy.guardId,
      carrier: policy.carrier ?? '',
      policyNumber: policy.policyNumber ?? '',
      generalLiabilityLimit: policy.generalLiabilityLimit,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate,
      documentUrl: policy.documentUrl,
      status: policy.status ?? 'pending',
      rejectionReason: policy.rejectionReason,
      submittedAt: policy.submittedAt ?? new Date().toISOString(),
      reviewedAt: policy.reviewedAt,
      reviewedBy: policy.reviewedBy,
      updateRequestedAt: clearUpdateRequest
        ? undefined
        : policy.updateRequestedAt ?? existing?.updateRequestedAt,
      updateRequestNote: clearUpdateRequest
        ? undefined
        : policy.updateRequestNote ?? existing?.updateRequestNote,
      revisionHistory,
    };
    const snapshot =
      !staffBypass && targetGuard
        ? captureCoiApplicationSnapshot({ ...targetGuard, insurancePolicy: nextPolicy }, nextPolicy)
        : null;
    if (isDbConnected) {
      const { error } = await supabase
        .from('guard_insurance_policies')
        .upsert(insurancePolicyToDbRow(nextPolicy), { onConflict: 'guard_id' });
      if (error) throw error;
      if (snapshot) {
        await supabase
          .from('guards')
          .update({ application_submission_snapshot: snapshot })
          .eq('id', policy.guardId);
      }
    }
    setGuards((prev) =>
      prev.map((g) =>
        g.id === policy.guardId
          ? {
              ...g,
              insurancePolicy: nextPolicy,
              ...(snapshot ? { applicationSubmissionSnapshot: snapshot } : {}),
            }
          : g
      )
    );
    const guard = guards.find((g) => g.id === policy.guardId);
    if (currentUser && guard && isUserSubmittedPendingInsurance({ ...guard, insurancePolicy: nextPolicy })) {
      void reportPushEvent(currentUser, {
        type: 'credential_pending',
        guardId: policy.guardId,
        guardName: guard.name,
        body: `${guard.name} uploaded Certificate of Insurance for review`,
      });
    }
  };

  const handleRequestCoiUpdate = async (guardId: string, staffNote?: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const before = guards.find((g) => g.id === guardId);
    const policy = before?.insurancePolicy;
    if (!before || !policy) throw new Error('Insurance policy not found.');
    if (resolveInsuranceStatus(policy) !== 'verified' && resolveInsuranceStatus(policy) !== 'pending') {
      throw new Error('Only submitted or verified COI can receive an update request.');
    }
    if (!policy.documentUrl?.trim() && resolveInsuranceStatus(policy) === 'pending') {
      throw new Error('COI has no document on file yet.');
    }
    if (policy.updateRequestedAt) {
      throw new Error('An update has already been requested for this COI.');
    }

    const updateRequestNote = buildCertUpdateRequestReason('Certificate of Insurance', staffNote);
    const requestedAt = new Date().toISOString();
    const nextPolicy: GuardInsurancePolicy = {
      ...policy,
      updateRequestedAt: requestedAt,
      updateRequestNote,
    };

    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, insurancePolicy: nextPolicy } : g))
    );
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from('guard_insurance_policies')
        .update({
          update_requested_at: requestedAt,
          update_request_note: updateRequestNote,
          updated_at: new Date().toISOString(),
        })
        .eq('guard_id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId && before ? { ...before } : g)));
        throw new Error(error.message);
      }
    }
    if (currentUser) {
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Credential update requested',
        updateRequestNote
      );
    }
    appToast('Update request sent — verified copy stays on file.', 'success');
  };

  const handleReviewGuardInsurance = async (
    guardId: string,
    status: 'verified' | 'rejected' | 'pending',
    rejectionReason?: string
  ) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard?.insurancePolicy) return;
    if (status === 'verified') {
      const coiBlocker = guardApplicationCredentialVerificationBlocker(
        guard,
        'Certificate of Insurance'
      );
      if (coiBlocker) {
        appToast(coiBlocker, 'error');
        return;
      }
    }
    const reviewedAt = status === 'pending' ? undefined : new Date().toISOString();
    const nextPolicy: GuardInsurancePolicy = {
      ...guard.insurancePolicy,
      status:
        status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending',
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      reviewedAt,
      reviewedBy: status === 'pending' ? undefined : currentUser?.id,
      updateRequestedAt: status === 'verified' ? undefined : guard.insurancePolicy.updateRequestedAt,
      updateRequestNote: status === 'verified' ? undefined : guard.insurancePolicy.updateRequestNote,
    };
    const resolved = { ...nextPolicy, status: resolveInsuranceStatus(nextPolicy) };
    const nextGuard = withAutoGuardActivation(
      syncGuardCredentialExpiryState(
        syncGuardCredentialGraceState({
          ...guard,
          insurancePolicy: resolved,
        })
      )
    );
    if (isDbConnected) {
      await supabase
        .from('guard_insurance_policies')
        .update({
          status: resolved.status,
          rejection_reason: resolved.rejectionReason ?? null,
          reviewed_at: reviewedAt ?? null,
          reviewed_by: status === 'pending' ? null : currentUser?.id ?? null,
          update_requested_at: resolved.updateRequestedAt ?? null,
          update_request_note: resolved.updateRequestNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('guard_id', guardId);
      if (
        nextGuard.userStatus !== guard.userStatus ||
        nextGuard.credentialExpiryRestricted !== guard.credentialExpiryRestricted ||
        nextGuard.verified !== guard.verified ||
        guardAutoActivationRowPatch(guard, nextGuard)
      ) {
        await supabase
          .from('guards')
          .update({
            user_status: nextGuard.userStatus,
            verified: nextGuard.verified,
            credential_expiry_restricted: nextGuard.credentialExpiryRestricted ?? false,
            ...(guardAutoActivationRowPatch(guard, nextGuard) ?? {}),
          })
          .eq('id', guardId);
      }
    }
    setGuards((prev) => prev.map((g) => (g.id === guardId ? nextGuard : g)));
    if (status === 'verified') {
      appToast('Insurance verified.', 'success');
    } else if (status === 'rejected') {
      appToast('Insurance rejected.', 'success');
    } else {
      appToast('Insurance moved back to pending review.', 'success');
    }
    if (currentUser && status !== 'pending') {
      notifyAccountUpdate(
        currentUser,
        guardId,
        status === 'verified' ? 'Insurance verified' : 'Insurance needs resubmit',
        status === 'verified'
          ? 'Your Certificate of Insurance was verified by Guardr staff.'
          : rejectionReason ?? 'Your Certificate of Insurance needs a clearer upload.'
      );
    }
    if (currentUser && guardAutoActivated(guard, nextGuard)) {
      void writeAuditLog(currentUser, 'guard_activated', 'guard', guardId, {
        email: nextGuard.email,
        automatic: true,
      });
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Account activated',
        'Your credentials are verified. You can now browse and accept jobs on Guardr.'
      );
    }
  };

  const handleSaveGuardVehicleInsurance = async (
    policy: Partial<import('./types').GuardVehicleInsurancePolicy> & { guardId: string }
  ) => {
    const existing = guards.find((g) => g.id === policy.guardId)?.vehicleInsurancePolicy;
    const nextPolicy = {
      id: existing?.id ?? policy.id ?? `vins-${policy.guardId}`,
      guardId: policy.guardId,
      carrier: policy.carrier ?? '',
      policyNumber: policy.policyNumber ?? '',
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate,
      documentUrl: policy.documentUrl,
      status: policy.status ?? 'pending',
      rejectionReason: policy.rejectionReason,
      submittedAt: policy.submittedAt ?? new Date().toISOString(),
      reviewedAt: policy.reviewedAt,
      reviewedBy: policy.reviewedBy,
      updateRequestedAt: policy.updateRequestedAt ?? existing?.updateRequestedAt,
      updateRequestNote: policy.updateRequestNote ?? existing?.updateRequestNote,
    } as import('./types').GuardVehicleInsurancePolicy;
    if (isDbConnected) {
      const { error } = await supabase
        .from('guard_vehicle_insurance_policies')
        .upsert(vehicleInsurancePolicyToDbRow(nextPolicy), { onConflict: 'guard_id' });
      if (error) throw error;
    }
    setGuards((prev) =>
      prev.map((g) => (g.id === policy.guardId ? { ...g, vehicleInsurancePolicy: nextPolicy } : g))
    );
    const guard = guards.find((g) => g.id === policy.guardId);
    if (currentUser && guard && nextPolicy.status === 'pending') {
      void reportPushEvent(currentUser, {
        type: 'credential_pending',
        guardId: policy.guardId,
        guardName: guard.name,
        body: `${guard.name} uploaded vehicle insurance for review`,
      });
    }
  };

  const handleReviewGuardVehicleInsurance = async (
    guardId: string,
    status: 'verified' | 'rejected'
  ) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard?.vehicleInsurancePolicy) return;
    const reviewedAt = new Date().toISOString();
    const nextPolicy = {
      ...guard.vehicleInsurancePolicy,
      status,
      reviewedAt,
      reviewedBy: currentUser.id,
      rejectionReason: status === 'rejected' ? 'Vehicle insurance needs a clearer upload.' : undefined,
    };
    if (isDbConnected) {
      await supabase
        .from('guard_vehicle_insurance_policies')
        .update({
          status,
          reviewed_at: reviewedAt,
          reviewed_by: currentUser.id,
          rejection_reason: nextPolicy.rejectionReason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('guard_id', guardId);
    }
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, vehicleInsurancePolicy: nextPolicy } : g))
    );
    appToast(status === 'verified' ? 'Vehicle insurance verified.' : 'Vehicle insurance rejected.', 'success');
  };

  const persistGuardVehicleProfile = async (
    guardId: string,
    profile: Partial<import('./types').GuardVehicleProfile> & { guardId: string }
  ) => {
    const existing = guards.find((g) => g.id === guardId)?.vehicleProfile;
    const nextProfile = {
      id: existing?.id ?? profile.id ?? `vehicle-${guardId}`,
      guardId,
      make: profile.make ?? existing?.make ?? '',
      model: profile.model ?? existing?.model ?? '',
      year: profile.year ?? existing?.year,
      color: profile.color ?? existing?.color,
      plateNumber: profile.plateNumber ?? existing?.plateNumber ?? '',
      plateState: profile.plateState ?? existing?.plateState ?? '',
      frontPhotoUrl: profile.frontPhotoUrl ?? existing?.frontPhotoUrl,
      leftSidePhotoUrl: profile.leftSidePhotoUrl ?? existing?.leftSidePhotoUrl,
      rightSidePhotoUrl: profile.rightSidePhotoUrl ?? existing?.rightSidePhotoUrl,
      backPhotoUrl: profile.backPhotoUrl ?? existing?.backPhotoUrl,
      vehicleInsurancePolicyId:
        profile.vehicleInsurancePolicyId ?? existing?.vehicleInsurancePolicyId ?? guards.find((g) => g.id === guardId)?.vehicleInsurancePolicy?.id,
      status: profile.status ?? existing?.status ?? 'draft',
      rejectionReason: profile.rejectionReason ?? existing?.rejectionReason,
      submittedAt: profile.submittedAt ?? existing?.submittedAt,
      reviewedAt: profile.reviewedAt ?? existing?.reviewedAt,
      reviewedBy: profile.reviewedBy ?? existing?.reviewedBy,
    } as import('./types').GuardVehicleProfile;
    if (isDbConnected) {
      const { error } = await supabase
        .from('guard_vehicle_profiles')
        .upsert(vehicleProfileToDbRow(nextProfile), { onConflict: 'guard_id' });
      if (error) throw error;
    }
    setGuards((prev) => prev.map((g) => (g.id === guardId ? { ...g, vehicleProfile: nextProfile } : g)));
    return nextProfile;
  };

  const handleSaveGuardVehicle = async (
    profile: Partial<import('./types').GuardVehicleProfile> & { guardId: string }
  ) => {
    await persistGuardVehicleProfile(profile.guardId, { ...profile, status: 'draft' });
  };

  const handleSubmitGuardVehicle = async (
    profile: Partial<import('./types').GuardVehicleProfile> & { guardId: string }
  ) => {
    const submittedAt = new Date().toISOString();
    await persistGuardVehicleProfile(profile.guardId, {
      ...profile,
      status: 'pending',
      submittedAt,
      rejectionReason: undefined,
    });
    const guard = guards.find((g) => g.id === profile.guardId);
    if (currentUser && guard) {
      void reportPushEvent(currentUser, {
        type: 'credential_pending',
        guardId: profile.guardId,
        guardName: guard.name,
        body: `${guard.name} submitted a vehicle for approval`,
      });
    }
  };

  const handleReviewGuardVehicle = async (
    guardId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard?.vehicleProfile) return;
    if (status === 'verified') {
      const blocker = staffApproveVehicleBlocker(guard);
      if (blocker) {
        appToast(blocker, 'error');
        return;
      }
    }
    const reviewedAt = new Date().toISOString();
    await persistGuardVehicleProfile(guardId, {
      ...guard.vehicleProfile,
      status,
      reviewedAt,
      reviewedBy: currentUser.id,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    });
    appToast(status === 'verified' ? 'Vehicle approved.' : 'Vehicle rejected.', 'success');
  };

  /**
   * Sign up handler — routes to the correct table based on role:
   *   guard   → guards table
   *   client  → clients table
   *   staff   → staff table (platform operators only)
   */
  const handleSignUp = async (
    profile: SecurityGuard | Client,
    role: 'guard' | 'client' | 'staff',
    password: string
  ): Promise<void> => {
    if (!isDbConnected) {
      throw new Error('Database is not connected. Cannot create accounts until Supabase is linked.');
    }

    const emailLower = assertEmailAvailable(profile.email);

    if (role === 'staff') {
      const staffProfile = profile as SecurityGuard;
      if (!staffProfile.isStaff || !staffProfile.staffRole) {
        throw new Error('Staff sign-up requires a staff application profile.');
      }
    } else if (role === 'guard') {
      const guardProfile = profile as SecurityGuard;
      if (guardProfile.isStaff) {
        throw new Error('Staff accounts must use the staff sign-up path.');
      }
    } else if (role === 'client') {
      const maybeGuard = profile as SecurityGuard;
      if (maybeGuard.isStaff) {
        throw new Error('Staff accounts must use the staff sign-up path.');
      }
    }

    if (role === 'client') {
      const client = profile as Client;
      const accountStatus = client.accountStatus ?? 'pending';
      const { error: insertError } = await supabase.from('clients').insert({
          id: client.id,
          name: client.name,
          first_name: client.firstName,
          middle_name: client.middleName ?? null,
          last_name: client.lastName,
          email: emailLower,
          company_name: client.companyName,
          phone: client.phone,
          avatar: client.avatar,
          total_requests: 0,
          approved: accountStatus === 'active',
          account_status: accountStatus,
          password,
          must_change_password: false,
        });
      if (insertError) {
        console.error('Client DB insert error:', insertError);
        throw new Error('Could not create customer. This email may already be registered.');
      }

      // Intake fields — written in a separate update so a missing migration
      // column never breaks the core sign-up flow
      const intakePayload: Record<string, unknown> = {
        client_type: client.clientType ?? 'business',
        business_type: client.businessType ?? null,
        industries: client.industries ?? null,
        business_license: client.businessLicense ?? null,
        website: client.website ?? null,
        service_description: client.serviceDescription ?? null,
        service_types: client.serviceTypes ?? null,
        estimated_guards_needed: client.estimatedGuardsNeeded ?? null,
        armed_preference: client.armedPreference ?? null,
        service_frequencies: client.serviceFrequencies ?? null,
        estimated_start_date: client.estimatedStartDate ?? null,
        budget_range: client.budgetRange ?? null,
        service_city: client.serviceCity ?? null,
        service_state: client.serviceState ?? null,
        property_types: client.propertyTypes ?? null,
        referred_by: client.referredBy ?? null,
        referred_by_id: client.referredById ?? null,
        how_heard_about_us: client.howHeardAboutUs ?? null,
        has_prior_security_service: client.hasPriorSecurityService ?? null,
        prior_security_provider: client.priorSecurityProvider ?? null,
        special_requirements: client.specialRequirements ?? null,
      };
      // Only bother if there is at least one non-null intake value
      const hasIntakeData = Object.values(intakePayload).some((v) => v !== null);
      if (hasIntakeData) {
        try {
          await supabase.from('clients').update(intakePayload).eq('id', client.id);
        } catch (intakeErr) {
          // Non-fatal — intake columns may not exist yet if the migration hasn't been applied
          console.warn('Client intake fields not saved (migration may be pending):', intakeErr);
        }
      }

      setStoredPassword(client.email, { password, mustChangePassword: false, role: 'client' });
      await recordLegalAcceptances('client', client.id, requiredLegalDocumentsForRole('client'));
      await loadFromSupabase();
      if (accountStatus !== 'active') {
        void reportPushEvent(
          { id: client.id, email: emailLower, role: 'client', name: client.name },
          {
            type: 'client_pending_approval',
            body: `New client sign-up: ${clientDisplayName(client)}`,
          }
        );
      }
      return;
    }

    const guard = profile as SecurityGuard;
    const userStatus = guard.userStatus || 'pending';

    if (role === 'staff' || (guard.isStaff && guard.staffRole)) {
      const staffRole = guard.staffRole ?? 'Support';
      try {
        await supabase.from('staff').insert({
          id: guard.id,
          name: guard.name,
          first_name: guard.firstName,
          middle_name: guard.middleName ?? null,
          last_name: guard.lastName,
          email: emailLower,
          badge_number: guard.badgeNumber,
          avatar: guard.avatar,
          phone: guard.phone,
          bio: guard.bio,
          summary: guard.summary ?? guard.bio,
          staff_role: staffRole,
          user_status: userStatus,
          password,
          must_change_password: false,
          personal_email: guard.personalEmail ?? null,
          years_experience: guard.yearsExperience ?? null,
          availability_notes: guard.availabilityNotes ?? null,
          referred_by: guard.referredBy ?? null,
          managed_cities: guard.managedCities ?? [],
          id_verification_status: 'not_submitted',
        });
        if (userStatus === 'active') {
          setStoredPassword(guard.email, { password, mustChangePassword: false, role: 'guard' });
        }
        await recordLegalAcceptances('staff', guard.id, requiredLegalDocumentsForRole('staff'));
        await loadFromSupabase();
      } catch (e) {
        console.error('Staff DB insert error:', e);
        throw new Error('Could not create staff account. This email may already be registered.');
      }
      return;
    }

    try {
      await supabase.from('guards').insert({
        id: guard.id,
        name: guard.name,
        first_name: guard.firstName,
        middle_name: guard.middleName ?? null,
        last_name: guard.lastName,
        email: emailLower,
        badge_number: guard.badgeNumber,
        avatar: guard.avatar,
        phone: guard.phone,
        bio: guard.bio,
        is_armed: guard.isArmed,
        background_checked: guard.backgroundChecked,
        verified: guard.verified,
        rating: guard.rating,
        jobs_completed: guard.jobsCompleted,
        hourly_rate_requirement: guard.hourlyRateRequirement,
        is_staff: false,
        user_status: userStatus,
        password,
        must_change_password: false,
      });
      if (guard.certifications.length > 0) {
        const seenNumbers = new Set<string>();
        for (const cert of guard.certifications) {
          const key = normalizeCertNumber(cert.number);
          if (!key) continue;
          if (seenNumbers.has(key)) {
            throw new Error('Duplicate certificate numbers are not allowed on one profile.');
          }
          seenNumbers.add(key);
          const available = validateCertNumberAvailable(guards, {
            number: cert.number,
            guardId: guard.id,
          });
          if (available.ok === false) throw new Error(available.error);
        }
        await supabase.from('certifications').insert(
          guard.certifications.map((cert) => ({
            id: cert.id,
            guard_id: guard.id,
            name: cert.name,
            issuer: cert.issuer,
            number: cert.number,
            status: cert.status,
            issue_date: cert.issueDate,
            expiry_date: cert.expiryDate,
            state: cert.state ?? null,
          }))
        );
      }
      setStoredPassword(guard.email, { password, mustChangePassword: false, role: 'guard' });

      const intakePayload: Record<string, unknown> = {
        summary: guard.summary ?? '',
        years_experience: guard.yearsExperience ?? null,
        specialties: guard.specialties ?? [],
        service_areas: normalizeGuardServiceAreas(guard.serviceAreas ?? []),
        availability_notes: guard.availabilityNotes ?? '',
        armed_preference: guard.armedPreference ?? null,
        guard_card_status: guard.guardCardStatus ?? null,
        has_reliable_transportation: guard.hasReliableTransportation ?? null,
      };
      const hasIntakeData = Object.values(intakePayload).some(
        (value) => value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
      );
      if (hasIntakeData) {
        try {
          await supabase.from('guards').update(intakePayload).eq('id', guard.id);
        } catch (intakeErr) {
          console.warn('Guard application intake fields not saved (migration may be pending):', intakeErr);
        }
      }

      await recordLegalAcceptances('guard', guard.id, requiredLegalDocumentsForRole('guard'));
      await loadFromSupabase();
      if (userStatus === 'pending') {
        void reportPushEvent(
          { id: guard.id, email: emailLower, role: 'guard', name: guard.name },
          {
            type: 'guard_pending_approval',
            guardId: guard.id,
            guardName: guard.name,
            body: `New guard sign-up: ${guard.name}`,
          }
        );
      }
    } catch (e) {
      console.error('Guard DB insert error:', e);
      if (e instanceof Error && e.message.includes('certificate')) throw e;
      throw new Error('Could not create guard account. This email may already be registered.');
    }
  };

  const handleAddExperience = async (guardId: string, exp: Omit<Experience, 'id'>) => {
    const row: Experience = { id: `exp-${Date.now()}`, ...exp };
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, experience: [...g.experience, row] } : g))
    );
    if (isDbConnected) {
      try {
        await supabase.from('experience').insert({
          id: row.id,
          guard_id: guardId,
          title: row.title,
          company: row.company,
          period: row.period,
          description: row.description,
        });
      } catch (e) {
        console.error('Experience insert error:', e);
      }
    }
  };

  const handleAddEducation = async (guardId: string, edu: Omit<GuardEducation, 'id'>) => {
    const row: GuardEducation = { id: `edu-${Date.now()}`, ...edu };
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, education: [...(g.education ?? []), row] } : g))
    );
    if (isDbConnected) {
      try {
        await supabase.from('education').insert({
          id: row.id,
          guard_id: guardId,
          school: row.school,
          degree: row.degree,
          field: row.field,
          period: row.period,
          description: row.description ?? '',
        });
      } catch (e) {
        console.error('Education insert error:', e);
      }
    }
  };

  // ── Certification CRUD ─────────────────────────────────────
  const handleAddCertification = async (
    guardId: string,
    newCert: Partial<Certification>,
    submittedByRole: 'guard' | 'staff' = 'guard'
  ): Promise<AddCertificationResult> => {
    const staffSubmission = submittedByRole === 'staff' || newCert.submittedByRole === 'staff';

    if (staffSubmission) {
      return { ok: false, error: STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE };
    }

    if (
      isDisallowedCombinedGuardCertificate({
        catalogId: newCert.catalogId,
        name: newCert.name ?? '',
      })
    ) {
      return {
        ok: false,
        error:
          'Legacy combined Continued Education rollup certificates are not accepted. Upload all 9 courses in the 32-hour BSIS CE package individually.',
      };
    }

    const available = validateCertNumberAvailable(guards, {
      number: newCert.number ?? '',
      guardId,
    });
    if (!available.ok) return available;

    const proof = validateCertSubmission(newCert.imageUrl);
    if (!proof.ok) return proof;

    const certWithId: Certification = {
      id: `cert-${Date.now()}`,
      name: newCert.name || 'BSIS Guard Card',
      issuer: newCert.issuer || 'BSIS',
      number: newCert.number!.trim(),
      status: staffSubmission ? 'verified' : 'pending',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate,
      state: newCert.state?.toUpperCase(),
      catalogId: newCert.catalogId,
      category: newCert.category,
      imageUrl: newCert.imageUrl,
      submittedByRole: newCert.submittedByRole ?? submittedByRole,
    };
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        const withCert = syncGuardCredentialGraceState({
          ...g,
          certifications: [...g.certifications, certWithId],
        });
        const snapshot =
          submittedByRole === 'guard' ? captureCertApplicationSnapshot(withCert, certWithId) : null;
        return snapshot
          ? { ...withCert, applicationSubmissionSnapshot: snapshot }
          : withCert;
      })
    );
    if (isDbConnected) {
      beginLocalMutation(submittedByRole === 'guard' ? 30 * 60 * 1000 : 3500);
      try {
        const insertResult = await insertCertificationRow(supabase, {
          id: certWithId.id, guard_id: guardId, name: certWithId.name,
          issuer: certWithId.issuer, number: certWithId.number, status: certWithId.status,
          issue_date: certWithId.issueDate, expiry_date: certWithId.expiryDate ?? null,
          state: certWithId.state ?? null,
          catalog_id: certWithId.catalogId ?? null,
          category: certWithId.category ?? null,
          image_url: certWithId.imageUrl ?? null,
          submitted_by_role: certWithId.submittedByRole ?? null,
        });
        if (!insertResult.ok) {
          setGuards(prev =>
            prev.map(g =>
              g.id === guardId
                ? { ...g, certifications: g.certifications.filter((c) => c.id !== certWithId.id) }
                : g
            )
          );
          return insertResult;
        }
        const guardAfter = guards.find((g) => g.id === guardId);
        if (guardAfter && submittedByRole === 'guard') {
          const withCert = {
            ...guardAfter,
            certifications: [...guardAfter.certifications, certWithId],
          };
          const snapshot = captureCertApplicationSnapshot(withCert, certWithId);
          if (snapshot) {
            await supabase
              .from('guards')
              .update({ application_submission_snapshot: snapshot })
              .eq('id', guardId);
          }
        }
      } catch (e) {
        setGuards(prev =>
          prev.map(g =>
            g.id === guardId
              ? { ...g, certifications: g.certifications.filter((c) => c.id !== certWithId.id) }
              : g
          )
        );
        console.error('Cert insert error:', e);
        return { ok: false, error: certDatabaseErrorMessage(e instanceof Error ? { message: e.message } : {}) };
      }
    }
    if (submittedByRole === 'guard' && currentUser) {
      const guard = guards.find((g) => g.id === guardId);
      void reportPushEvent(currentUser, {
        type: 'credential_pending',
        guardId,
        guardName: guard?.name,
        body: `${guard?.name ?? 'A guard'} uploaded ${certWithId.name} for review`,
      });
    }
    return { ok: true };
  };

  const handleDeleteCertification = async (
    guardId: string,
    certId: string
  ): Promise<CertImageMutationResult> => {
    const guard = guards.find((g) => g.id === guardId);
    const cert = guard?.certifications.find((c) => c.id === certId);
    if (cert) {
      const allowed = validateCertDeletion(cert);
      if (!allowed.ok) return allowed;
    }

    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, certifications: g.certifications.filter(c => c.id !== certId) } : g));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase.from('certifications').delete().eq('id', certId);
      if (error) {
        setGuards(prev =>
          prev.map(g =>
            g.id === guardId
              ? { ...g, certifications: [...g.certifications, cert!].sort((a, b) => a.id.localeCompare(b.id)) }
              : g
          )
        );
        console.error('Cert delete error:', error);
        return { ok: false, error: 'Could not remove credential. Please try again.' };
      }
    }
    return { ok: true };
  };

  const handleAttachCertificationImage = async (
    guardId: string,
    certId: string,
    imageUrl: string
  ): Promise<CertImageMutationResult> => {
    const guard = guards.find((g) => g.id === guardId);
    const cert = guard?.certifications.find((c) => c.id === certId);
    if (!cert) {
      return { ok: false, error: 'Credential not found.' };
    }

    const valid = validateCertImageAttachment(cert, imageUrl);
    if (!valid.ok) return valid;

    const requeueForReview = cert.status === 'rejected';
    const nextCert: Certification = {
      ...cert,
      imageUrl,
      status: requeueForReview ? ('pending' as const) : cert.status,
      rejectionReason: requeueForReview ? undefined : cert.rejectionReason,
    };

    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        const withCert: SecurityGuard = {
          ...g,
          certifications: g.certifications.map((c) => (c.id === certId ? nextCert : c)),
        };
        const snapshot = captureCertApplicationSnapshot(withCert, nextCert);
        return snapshot
          ? { ...withCert, applicationSubmissionSnapshot: snapshot }
          : withCert;
      })
    );

    if (isDbConnected) {
      beginLocalMutation();
      try {
        const updateResult = await updateCertificationRow(supabase, certId, {
            image_url: imageUrl,
            ...(requeueForReview ? { status: 'pending', rejection_reason: null } : {}),
          });
        if (!updateResult.ok) {
          setGuards((prev) =>
            prev.map((g) =>
              g.id === guardId
                ? {
                    ...g,
                    certifications: g.certifications.map((c) =>
                      c.id === certId ? { ...c, imageUrl: cert.imageUrl } : c
                    ),
                  }
                : g
            )
          );
          return updateResult;
        }
        if (guard) {
          const withCert = {
            ...guard,
            certifications: guard.certifications.map((c) => (c.id === certId ? nextCert : c)),
          };
          const snapshot = captureCertApplicationSnapshot(withCert, nextCert);
          if (snapshot) {
            await supabase
              .from('guards')
              .update({ application_submission_snapshot: snapshot })
              .eq('id', guardId);
          }
        }
      } catch (e) {
        setGuards((prev) =>
          prev.map((g) =>
            g.id === guardId
              ? {
                  ...g,
                  certifications: g.certifications.map((c) =>
                    c.id === certId ? { ...c, imageUrl: cert.imageUrl } : c
                  ),
                }
              : g
          )
        );
        console.error('Cert image update error:', e);
        return { ok: false, error: 'Could not save photo. Please try again.' };
      }
    }

    return { ok: true };
  };

  const handleUpdateCertification = async (
    guardId: string,
    certId: string,
    payload: CertUpdatePayload,
    submittedByRole: 'guard' | 'staff' = 'guard'
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const guard = guards.find((g) => g.id === guardId);
    const cert = guard?.certifications.find((c) => c.id === certId);
    if (!cert) return { ok: false, error: 'Credential not found.' };

    const issuer = payload.issuer?.trim() || '';
    const number = payload.number?.trim() || '';
    const state = payload.state?.trim().toUpperCase() || undefined;
    const expiryDate = payload.expiryDate?.trim() || undefined;
    const imageUrl = payload.imageUrl?.trim() || undefined;

    if (!issuer || !number) {
      return { ok: false, error: 'Enter issuer and number.' };
    }

    const catalogId = resolveCertCatalogId(cert);
    const permitRequiresExpiry = credentialRequiresExpiry(catalogId ?? cert);
    if (permitRequiresExpiry && !expiryDate) {
      return { ok: false, error: 'Enter the permit expiration date.' };
    }
    const nextExpiryDate = permitRequiresExpiry ? expiryDate : cert.expiryDate;

    const nextImageUrl = imageUrl ?? cert.imageUrl;
    const proof = validateCertSubmission(nextImageUrl);
    if (!proof.ok) return proof;

    if (submittedByRole === 'guard' && !guardCertificationCanEdit(cert)) {
      return { ok: false, error: 'This credential cannot be edited while under review.' };
    }

    if (submittedByRole === 'staff') {
      if (!guard || !staffCanEditCertification(guard, cert)) {
        return { ok: false, error: STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE };
      }
    }

    if (
      submittedByRole === 'guard' &&
      imageUrl &&
      imageUrl !== (cert.imageUrl ?? '').trim() &&
      certImageIsLocked(cert) &&
      !certUpdateSubmissionAllowed(cert)
    ) {
      return { ok: false, error: 'This credential photo cannot be changed after upload.' };
    }

    if (number !== cert.number.trim()) {
      const available = validateCertNumberAvailable(guards, { number, guardId });
      if (!available.ok) return available;
    }

    const dataChanged =
      issuer !== cert.issuer.trim() ||
      number !== cert.number.trim() ||
      (state ?? '') !== (cert.state ?? '').trim().toUpperCase() ||
      (nextExpiryDate ?? '') !== (cert.expiryDate ?? '').trim() ||
      (imageUrl ?? '') !== (cert.imageUrl ?? '').trim();

    if (!dataChanged) return { ok: true };

    if (cert.status === 'verified' && certUpdateSubmissionAllowed(cert)) {
      const pendingUpdate = pendingUpdateFromPayload({
        issuer,
        number,
        state,
        expiryDate: nextExpiryDate,
        imageUrl: nextImageUrl,
      });
      const previous = { ...cert };
      const nextCert: Certification = {
        ...cert,
        pendingUpdate,
        updateRequestedAt: undefined,
        updateRequestNote: cert.updateRequestNote,
        revisionHistory: prependCertRevision(
          cert.revisionHistory,
          snapshotCertRevision(
            {
              issuer: pendingUpdate.issuer,
              number: pendingUpdate.number,
              state: pendingUpdate.state,
              expiryDate: pendingUpdate.expiryDate,
              imageUrl: pendingUpdate.imageUrl,
              status: 'pending',
            },
            'update_submitted'
          )
        ),
      };

      setGuards((prev) =>
        prev.map((g) =>
          g.id === guardId
            ? {
                ...g,
                certifications: g.certifications.map((c) => (c.id === certId ? nextCert : c)),
              }
            : g
        )
      );

      if (isDbConnected) {
        beginLocalMutation();
        try {
          const updateResult = await updateCertificationRow(supabase, certId, {
            pending_update: pendingUpdate,
            update_requested_at: null,
            update_request_note: nextCert.updateRequestNote ?? null,
            revision_history: nextCert.revisionHistory ?? [],
          });
          if (!updateResult.ok) {
            setGuards((prev) =>
              prev.map((g) =>
                g.id === guardId
                  ? {
                      ...g,
                      certifications: g.certifications.map((c) => (c.id === certId ? previous : c)),
                    }
                  : g
              )
            );
            return updateResult;
          }
        } catch (e) {
          setGuards((prev) =>
            prev.map((g) =>
              g.id === guardId
                ? {
                    ...g,
                    certifications: g.certifications.map((c) => (c.id === certId ? previous : c)),
                  }
                : g
            )
          );
          console.error('Cert update error:', e);
          return { ok: false, error: 'Could not save credential update. Please try again.' };
        }
      }

      return { ok: true };
    }

    let nextStatus = cert.status;
    if (cert.status === 'verified') {
      nextStatus = 'verified';
    } else if (submittedByRole === 'staff' || cert.status === 'rejected') {
      nextStatus = 'pending';
    }

    const previous = { ...cert };
    const nextSubmittedByRole =
      submittedByRole === 'staff' && nextStatus === 'pending'
        ? ('staff' as const)
        : cert.submittedByRole;

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              certifications: g.certifications.map((c) =>
                c.id === certId
                  ? {
                      ...c,
                      issuer,
                      number,
                      state,
                      expiryDate: nextExpiryDate,
                      imageUrl: nextImageUrl,
                      status: nextStatus,
                      rejectionReason:
                        nextStatus === 'pending' && cert.status !== 'verified'
                          ? undefined
                          : c.rejectionReason,
                      submittedByRole: nextSubmittedByRole,
                    }
                  : c
              ),
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      try {
        const updateResult = await updateCertificationRow(supabase, certId, {
            issuer,
            number,
            expiry_date: nextExpiryDate ?? null,
            state: state ?? null,
            image_url: nextImageUrl ?? null,
            status: nextStatus,
            rejection_reason:
              nextStatus === 'pending' && cert.status !== 'verified' ? null : cert.rejectionReason ?? null,
            submitted_by_role: nextSubmittedByRole ?? null,
          });
        if (!updateResult.ok) {
          setGuards((prev) =>
            prev.map((g) =>
              g.id === guardId
                ? {
                    ...g,
                    certifications: g.certifications.map((c) => (c.id === certId ? previous : c)),
                  }
                : g
            )
          );
          return updateResult;
        }
      } catch (e) {
        setGuards((prev) =>
          prev.map((g) =>
            g.id === guardId
              ? {
                  ...g,
                  certifications: g.certifications.map((c) => (c.id === certId ? previous : c)),
                }
              : g
          )
        );
        console.error('Cert update error:', e);
        return { ok: false, error: 'Could not save credential. Please try again.' };
      }
    }

    return { ok: true };
  };

  const handleApproveCert = async (guardId: string, certId: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const before = guards.find((g) => g.id === guardId);
    const cert = before?.certifications.find((c) => c.id === certId);
    if (!cert || !before) throw new Error('Credential not found.');
    const verifyBlocker = staffVerifyCertificationBlocker(cert, before);
    if (verifyBlocker) throw new Error(verifyBlocker);
    if (!staffCanVerifyCertification(cert, before)) {
      throw new Error('This credential cannot be verified yet.');
    }

    const approvingPendingUpdate = certHasPendingUpdate(cert) && cert.pendingUpdate;
    const nextCert: Certification = approvingPendingUpdate
      ? {
          ...cert,
          issuer: cert.pendingUpdate!.issuer,
          number: cert.pendingUpdate!.number,
          state: cert.pendingUpdate!.state,
          expiryDate: cert.pendingUpdate!.expiryDate,
          imageUrl: cert.pendingUpdate!.imageUrl,
          status: 'verified',
          rejectionReason: undefined,
          pendingUpdate: undefined,
          updateRequestedAt: undefined,
          updateRequestNote: undefined,
          revisionHistory: prependCertRevision(
            cert.revisionHistory,
            snapshotCertRevision(cert, 'superseded')
          ),
        }
      : {
          ...cert,
          status: 'verified',
          rejectionReason: undefined,
        };

    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return withAutoGuardActivation(
          syncGuardCredentialExpiryState(
            syncGuardCredentialGraceState({
              ...g,
              certifications: g.certifications.map((c) => (c.id === certId ? nextCert : c)),
            })
          )
        );
      })
    );
    if (isDbConnected) {
      beginLocalMutation();
      const verifyResult = await updateCertificationRow(supabase, certId, {
        status: 'verified',
        issuer: nextCert.issuer,
        number: nextCert.number,
        state: nextCert.state ?? null,
        expiry_date: nextCert.expiryDate ?? null,
        image_url: nextCert.imageUrl ?? null,
        rejection_reason: null,
        ...certRevisionDbPatch(nextCert),
      });
      if (verifyResult.ok === false) {
        setGuards((prev) =>
          prev.map((g) => (g.id === guardId && before ? { ...before } : g))
        );
        throw new Error(verifyResult.error);
      }
      const after = before
        ? withAutoGuardActivation(
            syncGuardCredentialExpiryState(
              syncGuardCredentialGraceState({
                ...before,
                certifications: before.certifications.map((c) => (c.id === certId ? nextCert : c)),
              })
            )
          )
        : null;
      if (after) {
        const guardPatch: Record<string, unknown> = {};
        const activationPatch = before ? guardAutoActivationRowPatch(before, after) : null;
        if (activationPatch) {
          Object.assign(guardPatch, activationPatch);
        }
        if (
          after.credentialGraceDeadline !== before?.credentialGraceDeadline ||
          JSON.stringify(after.credentialGraceMissing ?? []) !==
            JSON.stringify(before?.credentialGraceMissing ?? [])
        ) {
          guardPatch.credential_grace_deadline = after.credentialGraceDeadline ?? null;
          guardPatch.credential_grace_missing = after.credentialGraceMissing ?? null;
          guardPatch.credential_grace_hours = after.credentialGraceHours ?? null;
        }
        if (
          after.userStatus !== before?.userStatus ||
          after.credentialExpiryRestricted !== before?.credentialExpiryRestricted
        ) {
          guardPatch.user_status = after.userStatus;
          guardPatch.credential_expiry_restricted = after.credentialExpiryRestricted ?? false;
        }
        if (Object.keys(guardPatch).length > 0) {
          const guardResult = await updateGuardAccountRow(
            supabase,
            guardId,
            guardPatch,
            'activate'
          );
          if (guardResult.ok === false) {
            setGuards((prev) =>
              prev.map((g) => (g.id === guardId && before ? { ...before } : g))
            );
            throw new Error(guardResult.error);
          }
        }
      }
    }
    if (currentUser && cert) {
      void writeAuditLog(currentUser, 'cert_verified', 'certification', certId, {
        guardId,
        certName: cert.name,
      });
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Credential verified',
        `Your ${cert.name} was verified by Guardr staff.`
      );
      const after = before
        ? withAutoGuardActivation(
            syncGuardCredentialExpiryState(
              syncGuardCredentialGraceState({
                ...before,
                certifications: before.certifications.map((c) => (c.id === certId ? nextCert : c)),
              })
            )
          )
        : null;
      if (before && after && guardAutoActivated(before, after)) {
        void writeAuditLog(currentUser, 'guard_activated', 'guard', guardId, {
          email: after.email,
          automatic: true,
        });
        notifyAccountUpdate(
          currentUser,
          guardId,
          'Account activated',
          'Your credentials are verified. You can now browse and accept jobs on Guardr.'
        );
      }
    }
  };

  const handleRejectCert = async (guardId: string, certId: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const before = guards.find((g) => g.id === guardId);
    const cert = before?.certifications.find((c) => c.id === certId);
    if (!cert) throw new Error('Credential not found.');

    if (certHasPendingUpdate(cert) && cert.pendingUpdate) {
      const rejectionReason = buildCertImageResubmitReason(cert.name);
      const rejectedUpdate = {
        ...cert.pendingUpdate,
        status: 'rejected' as const,
        rejectionReason,
      };
      const nextCert: Certification = {
        ...cert,
        pendingUpdate: undefined,
        updateRequestedAt: new Date().toISOString(),
        updateRequestNote: rejectionReason,
        revisionHistory: prependCertRevision(
          prependCertRevision(
            cert.revisionHistory,
            snapshotCertRevision(
              {
                issuer: rejectedUpdate.issuer,
                number: rejectedUpdate.number,
                state: rejectedUpdate.state,
                expiryDate: rejectedUpdate.expiryDate,
                imageUrl: rejectedUpdate.imageUrl,
                status: 'rejected',
                rejectionReason,
              },
              'rejected',
              { note: rejectionReason }
            )
          ),
          snapshotCertRevision(cert, 'update_requested', { note: rejectionReason })
        ),
      };

      setGuards((prev) =>
        prev.map((g) =>
          g.id === guardId
            ? {
                ...g,
                certifications: g.certifications.map((c) => (c.id === certId ? nextCert : c)),
              }
            : g
        )
      );
      if (isDbConnected) {
        beginLocalMutation();
        const result = await updateCertificationRow(supabase, certId, {
          pending_update: null,
          update_requested_at: nextCert.updateRequestedAt ?? null,
          update_request_note: rejectionReason,
          revision_history: nextCert.revisionHistory ?? [],
        });
        if (result.ok === false) {
          setGuards((prev) =>
            prev.map((g) => (g.id === guardId && before ? { ...before } : g))
          );
          throw new Error(result.error);
        }
      }
      if (currentUser) {
        notifyAccountUpdate(
          currentUser,
          guardId,
          'Credential update needs revision',
          `Your updated ${cert.name} was not approved. Your previous verified copy stays on file — please upload another update.`
        );
      }
      return;
    }

    const rejectionReason = buildCertImageResubmitReason(cert.name);
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              certifications: g.certifications.map((c) =>
                c.id === certId
                  ? { ...c, status: 'rejected' as const, rejectionReason }
                  : c
              ),
            }
          : g
      )
    );
    if (isDbConnected) {
      beginLocalMutation();
      const result = await updateCertificationRow(supabase, certId, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      });
      if (result.ok === false) {
        setGuards((prev) =>
          prev.map((g) => (g.id === guardId && before ? { ...before } : g))
        );
        throw new Error(result.error);
      }
    }
    if (currentUser && cert) {
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Credential needs resubmit',
        `Your ${cert.name} needs a clearer upload. Open your activation credentials to fix it.`
      );
    }
  };

  const handleRequestCertUpdate = async (guardId: string, certId: string, staffNote?: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const before = guards.find((g) => g.id === guardId);
    const cert = before?.certifications.find((c) => c.id === certId);
    if (!cert || !before) throw new Error('Credential not found.');
    if (cert.status !== 'verified') throw new Error('Only verified credentials can receive an update request.');
    if (cert.pendingUpdate?.status === 'pending') {
      throw new Error('This credential already has an update awaiting review.');
    }

    const updateRequestNote = buildCertUpdateRequestReason(cert.name, staffNote);
    const requestedAt = new Date().toISOString();
    const nextCert: Certification = {
      ...cert,
      updateRequestedAt: requestedAt,
      updateRequestNote,
      revisionHistory: prependCertRevision(
        cert.revisionHistory,
        snapshotCertRevision(cert, 'update_requested', { note: updateRequestNote, recordedAt: requestedAt })
      ),
    };

    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return {
          ...g,
          certifications: g.certifications.map((c) => (c.id === certId ? nextCert : c)),
        };
      })
    );
    if (isDbConnected) {
      beginLocalMutation();
      const result = await updateCertificationRow(supabase, certId, {
        update_requested_at: requestedAt,
        update_request_note: updateRequestNote,
        revision_history: nextCert.revisionHistory ?? [],
      });
      if (result.ok === false) {
        setGuards((prev) => prev.map((g) => (g.id === guardId && before ? { ...before } : g)));
        throw new Error(result.error);
      }
    }
    if (currentUser) {
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Credential update requested',
        updateRequestNote
      );
    }
    appToast('Update request sent — verified copy stays on file.', 'success');
  };

  const handleRevokeGuardIdentityVerification = async (guardId: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify government ID.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    if (getGuardIdVerificationStatus(guard) !== 'verified') {
      throw new Error('Government ID is not verified.');
    }

    const previous = { ...guard };
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              idVerificationStatus: 'pending' as const,
              idVerificationReviewedAt: undefined,
              idVerificationRejectionReason: undefined,
            }
          : g
      )
    );
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from(guard.isStaff ? 'staff' : 'guards')
        .update({
          id_verification_status: 'pending',
          id_verification_reviewed_at: null,
          id_verification_rejection_reason: null,
        })
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('ID verification revoke error:', error);
        throw new Error('Could not unverify government ID. Please try again.');
      }
    }
    appToast('Government ID moved back to pending review.', 'success');
  };

  // ── Guard approval ─────────────────────────────────────────
  const handleUpdateBackgroundChecked = async (guardId: string, status: boolean) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, backgroundChecked: status } : g));
    if (isDbConnected) await supabase.from('guards').update({ background_checked: status }).eq('id', guardId);
  };

  const syncSessionUser = (patch: Partial<SessionUser>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('guardr_current_user', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateGuardProfile = async (guardId: string, payload: ProfileSavePayload) => {
    const previous = guards.find((g) => g.id === guardId);
    if (!previous) {
      throw new Error('Guard profile not found.');
    }

    const staffBypass = Boolean(
      currentUser &&
        currentUser.id !== guardId &&
        previous.isStaff &&
        canModerateStaffMember(currentUser.role, currentUser.id, previous)
    );
    if (previous.isStaff && currentUser) {
      if (!canEditStaffProfile(currentUser.role, currentUser.id, previous)) {
        throw new Error('You do not have permission to edit this profile.');
      }
    }
    let staffPersonalEmail = previous.personalEmail ?? '';
    if (previous.isStaff && payload.personalEmail !== undefined) {
      staffPersonalEmail = payload.personalEmail.trim()
        ? assertStaffPersonalEmailAvailable(
            payload.personalEmail,
            [
              ...guards.map((g) => ({ id: g.id, email: g.email })),
              ...clients.map((c) => ({ id: c.id, email: c.email })),
            ],
            guardId
          )
        : '';
      assertStaffPersonalEmailDistinctFromWork(previous.email, staffPersonalEmail);
    }
    const intakePatch = {
      name: payload.name,
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      phone: payload.phone,
      bio: payload.bio ?? payload.summary,
      summary: payload.summary,
      serviceAreas: payload.serviceAreas,
      specialties: payload.specialties,
      yearsExperience: payload.yearsExperience,
      availabilityNotes: payload.availabilityNotes,
      hourlyRateRequirement: payload.hourlyRateRequirement,
      listedWeaponGear: payload.listedWeaponGear,
      isArmed: payload.listedWeaponGear?.includes('firearm'),
    };
    assertGuardApplicationIntakeEditable(previous, intakePatch, { staffBypass });
    const intakeChanged = guardApplicationIntakeChanges(previous, intakePatch).length > 0;
    const clearRevision =
      !staffBypass && intakeChanged && Boolean(previous.applicationRevisionRequestedAt);

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              name: payload.name,
              firstName: payload.firstName,
              middleName: payload.middleName,
              lastName: payload.lastName,
              phone: payload.phone,
              personalEmail: previous.isStaff ? staffPersonalEmail : g.personalEmail,
              bio: payload.bio ?? payload.summary ?? g.bio,
              headline: payload.headline ?? g.headline,
              summary: payload.summary ?? g.summary,
              about: payload.about ?? g.about,
              specialties: payload.specialties ?? g.specialties,
              skills: payload.skills ?? g.skills,
              languages: payload.languages ?? g.languages,
              serviceAreas: normalizeGuardServiceAreas(payload.serviceAreas ?? g.serviceAreas),
              yearsExperience: payload.yearsExperience ?? g.yearsExperience,
              availabilityNotes: payload.availabilityNotes ?? g.availabilityNotes,
              hourlyRateRequirement: payload.hourlyRateRequirement ?? g.hourlyRateRequirement,
              listedWeaponGear: payload.listedWeaponGear ?? g.listedWeaponGear,
              listedEquipmentGear: payload.listedEquipmentGear ?? g.listedEquipmentGear,
              inventoryEquipment: payload.inventoryEquipment ?? g.inventoryEquipment,
              inventoryUniforms: payload.inventoryUniforms ?? g.inventoryUniforms,
              isArmed: payload.listedWeaponGear?.includes('firearm') ?? g.isArmed,
              avatar: payload.avatar !== undefined ? payload.avatar : g.avatar,
              badgeNumber: payload.badgeNumber !== undefined
                ? (previous.isStaff
                    ? payload.badgeNumber
                    : normalizeGuardIndependentContractorNumber(payload.badgeNumber))
                : g.badgeNumber,
              ...(clearRevision
                ? { applicationRevisionRequestedAt: undefined, applicationRevisionNote: undefined }
                : {}),
            }
          : g
      )
    );
    if (isDbConnected) {
      beginLocalMutation();
      const profileUpdate: Record<string, unknown> = {
          name: payload.name,
          first_name: payload.firstName,
          middle_name: payload.middleName ?? null,
          last_name: payload.lastName,
          phone: payload.phone,
          bio: payload.bio ?? payload.summary ?? '',
      };
      if (payload.avatar !== undefined) profileUpdate.avatar = payload.avatar;
      if (payload.badgeNumber !== undefined) {
        profileUpdate.badge_number = previous.isStaff
          ? payload.badgeNumber
          : normalizeGuardIndependentContractorNumber(payload.badgeNumber);
      }
      if (clearRevision) {
        profileUpdate.application_revision_requested_at = null;
        profileUpdate.application_revision_note = null;
      }

      const table = previous.isStaff ? 'staff' : 'guards';
      if (previous.isStaff) {
        Object.assign(profileUpdate, {
          headline: payload.headline ?? '',
          summary: payload.summary ?? '',
          about: payload.about ?? '',
          specialties: payload.specialties ?? [],
          personal_email: staffPersonalEmail || null,
        });
      } else if (!previous.isStaff) {
        Object.assign(profileUpdate, {
          headline: payload.headline ?? '',
          summary: payload.summary ?? '',
          about: payload.about ?? '',
          skills: payload.skills ?? [],
          languages: payload.languages ?? [],
          service_areas: normalizeGuardServiceAreas(payload.serviceAreas ?? []),
          specialties: payload.specialties ?? [],
          years_experience: payload.yearsExperience ?? null,
          availability_notes: payload.availabilityNotes ?? '',
          hourly_rate_requirement: payload.hourlyRateRequirement ?? null,
          listed_weapon_gear: payload.listedWeaponGear ?? [],
          listed_equipment_gear: payload.listedEquipmentGear ?? [],
          inventory_equipment: payload.inventoryEquipment ?? [],
          inventory_uniforms: payload.inventoryUniforms ?? [],
          job_type_preferences: payload.jobTypePreferences ?? [],
          is_armed: payload.listedWeaponGear?.includes('firearm') ?? previous.isArmed,
        });
      }

      const { error } = await supabase.from(table).update(profileUpdate).eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('Guard profile update error:', error);
        const message =
          error.code === 'PGRST204' || error.message?.includes('column')
            ? 'Profile could not be saved. Run the latest database migrations, then try again.'
            : error.message || 'Could not save profile. Please try again.';
        throw new Error(message);
      }
    }
    if (currentUser?.id === guardId) {
      syncSessionUser({
        name: payload.name,
        hourlyRate: payload.hourlyRateRequirement ?? currentUser.hourlyRate,
        avatar: payload.avatar !== undefined ? payload.avatar : currentUser.avatar,
      });
    }
  };

  const handleUpdateClientProfile = async (clientId: string, payload: ProfileSavePayload) => {
    const previous = clients.find((c) => c.id === clientId);
    if (!previous) {
      throw new Error('Client profile not found.');
    }

    const staffBypass = Boolean(
      currentUser && currentUser.id !== clientId && isStaffRole(currentUser.role)
    );
    const contactPatch = {
      name: payload.name,
      firstName: payload.firstName,
      middleName: payload.middleName,
      lastName: payload.lastName,
      phone: payload.phone,
      companyName: payload.companyName,
    };
    assertClientApplicationContactEditable(previous, contactPatch, { staffBypass });
    const contactChanged = clientApplicationContactChanges(previous, contactPatch).length > 0;
    const clearRevision =
      !staffBypass && contactChanged && Boolean(previous.applicationRevisionRequestedAt);

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              name: payload.name,
              firstName: payload.firstName,
              middleName: payload.middleName,
              lastName: payload.lastName,
              phone: payload.phone,
              companyName: payload.companyName ?? c.companyName,
              avatar: payload.avatar !== undefined ? payload.avatar : c.avatar,
              authorizedContacts: payload.authorizedContacts ?? c.authorizedContacts,
              ...(clearRevision
                ? { applicationRevisionRequestedAt: undefined, applicationRevisionNote: undefined }
                : {}),
            }
          : c
      )
    );
    if (isDbConnected) {
      const clientUpdate: Record<string, unknown> = {
        name: payload.name,
        first_name: payload.firstName,
        middle_name: payload.middleName ?? null,
        last_name: payload.lastName,
        phone: payload.phone,
        company_name: payload.companyName ?? '',
      };
      if (payload.avatar !== undefined) clientUpdate.avatar = payload.avatar;
      if (payload.authorizedContacts) {
        clientUpdate.authorized_contacts = payload.authorizedContacts;
      }
      if (clearRevision) {
        clientUpdate.application_revision_requested_at = null;
        clientUpdate.application_revision_note = null;
      }
      beginLocalMutation();
      let { error } = await supabase.from('clients').update(clientUpdate).eq('id', clientId);
      if (error && 'authorized_contacts' in clientUpdate && /authorized_contacts/i.test(error.message ?? '')) {
        delete clientUpdate.authorized_contacts;
        ({ error } = await supabase.from('clients').update(clientUpdate).eq('id', clientId));
      }
      if (error) {
        setClients((prev) => prev.map((c) => (c.id === clientId ? previous : c)));
        console.error('Client profile update error:', error);
        throw new Error(
          error.message?.includes('locked')
            ? error.message
            : 'Could not save profile. Please try again.'
        );
      }
    }
    if (currentUser?.id === clientId) {
      syncSessionUser({
        name: payload.name,
        clientName: payload.companyName ?? currentUser.clientName,
        avatar: payload.avatar !== undefined ? payload.avatar : currentUser.avatar,
      });
    }
  };

  const persistClientCredentials = async (
    clientId: string,
    previous: Client,
    nextCredentials: ClientCredential[]
  ) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, credentials: nextCredentials } : c))
    );
    if (!isDbConnected) return;
    beginLocalMutation();
    let { error } = await supabase
      .from('clients')
      .update({ credentials: nextCredentials })
      .eq('id', clientId);
    if (error && /credentials/i.test(error.message ?? '')) {
      ({ error } = await supabase.from('clients').update({ credentials: nextCredentials }).eq('id', clientId));
    }
    if (error) {
      setClients((prev) => prev.map((c) => (c.id === clientId ? previous : c)));
      throw new Error(
        error.message?.includes('column')
          ? 'Database is missing client credentials. Run the latest migrations, then try again.'
          : 'Could not save client credential. Please try again.'
      );
    }
  };

  const handleSubmitClientCredential = async (clientId: string, credential: ClientCredential) => {
    const previous = clients.find((c) => c.id === clientId);
    if (!previous) throw new Error('Client profile not found.');
    const nextCredentials = upsertClientCredential(previous.credentials ?? [], credential);
    await persistClientCredentials(clientId, previous, nextCredentials);
    appToast('Credential submitted for verification.', 'success');
  };

  const handleApproveClientCredential = async (clientId: string, credentialId: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const previous = clients.find((c) => c.id === clientId);
    if (!previous) throw new Error('Client not found.');
    const nextCredentials = replaceClientCredential(previous.credentials ?? [], credentialId, {
      status: 'verified',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.name,
      rejectionReason: undefined,
    });
    await persistClientCredentials(clientId, previous, nextCredentials);
    appToast('Client credential verified.', 'success');
  };

  const handleRejectClientCredential = async (clientId: string, credentialId: string, reason?: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify credentials.', 'error');
      return;
    }
    const previous = clients.find((c) => c.id === clientId);
    if (!previous) throw new Error('Client not found.');
    const nextCredentials = replaceClientCredential(previous.credentials ?? [], credentialId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser.name,
      rejectionReason: reason?.trim() || 'Please resubmit a clearer document.',
    });
    await persistClientCredentials(clientId, previous, nextCredentials);
    appToast('Client credential sent back for resubmit.', 'success');
  };

  // ── Staff controls ─────────────────────────────────────────
  const handleUpdateGuardUserStatus = async (guardId: string, requestedStatus: 'active' | 'suspended' | 'blocked') => {
    const target = guards.find((g) => g.id === guardId);
    if (!target) return;
    if (!currentUser) return;
    if (requestedStatus !== 'active' && !canSuspendUsers(currentUser)) {
      appToast('You do not have permission to suspend or block accounts.', 'error');
      return;
    }
    if (target.isStaff && currentUser) {
      if (guardId === currentUser.id) {
        appToast('You cannot change your own account status.', 'error');
        return;
      }
      if (!canModerateStaffMember(currentUser.role, currentUser.id, target)) {
        appToast('You cannot moderate staff at the same role level or above your own.', 'error');
        return;
      }
    }
    let nextStatus: SecurityGuard['userStatus'] = requestedStatus;
    if (!target.isStaff && requestedStatus === 'active') {
      const currentStatus = getGuardUserStatus(target);
      const isRestore = currentStatus === 'suspended' || currentStatus === 'blocked';
      if (isRestore) {
        nextStatus = resolveGuardRestoreUserStatus(target);
      } else if (isGuardAccountPending(target)) {
        appToast('Approve this guard profile before activating their account.', 'error');
        return;
      } else if (isGuardAccountApproved(target)) {
        const blockers = guardAccountActivationBlockers(target);
        if (blockers.length > 0) {
          appToast(`Cannot activate account yet:\n• ${blockers.join('\n• ')}`, 'error');
          return;
        }
        // Heal stuck approved accounts when credentials are already fully verified
        // (auto-activation can be missed if the last verify happened while suspended).
        nextStatus = 'active';
      }
    }
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, userStatus: nextStatus } : g));
    if (isDbConnected) {
      const table = target.isStaff ? 'staff' : 'guards';
      await supabase.from(table).update({ user_status: nextStatus }).eq('id', guardId);
    }
    if (currentUser && !target.isStaff) {
      const statusCopy =
        nextStatus === 'suspended'
          ? 'Your guard account was suspended. Contact Guardr support if you have questions.'
          : nextStatus === 'blocked'
            ? 'Your guard account was blocked. Contact Guardr support if you have questions.'
            : nextStatus === 'approved'
              ? 'Your guard account access was restored. Finish any remaining credentials for activation.'
              : 'Your guard account status was updated by staff.';
      notifyAccountUpdate(currentUser, guardId, 'Account status updated', statusCopy);
    }
  };

  const assertEmailAvailable = (email: string) => {
    const emailLower = email.trim().toLowerCase();
    if (guards.some((g) => g.email.toLowerCase() === emailLower)) {
      throw new Error('This email is already registered to a guard or staff account.');
    }
    if (clients.some((c) => c.email.toLowerCase() === emailLower)) {
      throw new Error('This email is already registered to a customer.');
    }
    return emailLower;
  };

  const handleAddGuardProfile = async (input: {
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    badgeNumber?: string;
    hourlyRate?: number;
  }): Promise<string> => {
    const emailLower = assertEmailAvailable(input.email);
    const { password, mustChangePassword } = provisionedPasswordFields();
    const normalized = input.firstName
      ? personNameFromPayload({
          firstName: input.firstName,
          middleName: input.middleName,
          lastName: input.lastName ?? '',
        })
      : personNameFromPayload(resolvePersonNameParts({ name: input.name ?? '' }));
    const newGuard: SecurityGuard = {
      id: `guard-${Date.now()}`,
      name: normalized.name,
      firstName: normalized.firstName,
      middleName: normalized.middleName,
      lastName: normalized.lastName,
      email: input.email.trim(),
      badgeNumber: normalizeGuardIndependentContractorNumber(input.badgeNumber) ||
        generateGuardIndependentContractorNumber(),
      avatar: '',
      phone: input.phone?.trim() || '',
      bio: 'Licensed security professional.',
      isArmed: false,
      backgroundChecked: false,
      verified: false,
      rating: 0,
      jobsCompleted: 0,
      certifications: [],
      experience: [],
      hourlyRateRequirement: input.hourlyRate ?? 35,
      userStatus: 'pending',
      isStaff: false,
      password,
      mustChangePassword,
    };
    setGuards((prev) => [...prev, newGuard]);
    if (isDbConnected) {
      try {
        await supabase.from('guards').insert({
          id: newGuard.id,
          name: newGuard.name,
          first_name: newGuard.firstName,
          middle_name: newGuard.middleName ?? null,
          last_name: newGuard.lastName,
          email: emailLower,
          badge_number: newGuard.badgeNumber,
          avatar: newGuard.avatar,
          phone: newGuard.phone,
          bio: newGuard.bio,
          is_armed: false,
          background_checked: false,
          verified: false,
          rating: 0,
          jobs_completed: 0,
          hourly_rate_requirement: newGuard.hourlyRateRequirement,
          is_staff: false,
          user_status: 'pending',
          password,
          must_change_password: mustChangePassword,
        });
      } catch (e) {
        setGuards((prev) => prev.filter((g) => g.id !== newGuard.id));
        console.error('Guard insert error:', e);
        throw new Error('Could not save guard to the database.');
      }
    }
    setStoredPassword(emailLower, { password, mustChangePassword, role: 'guard' });
    if (newGuard.userStatus === 'pending') {
      void reportPushEvent(
        { id: newGuard.id, email: emailLower, role: 'guard', name: newGuard.name },
        {
          type: 'guard_pending_approval',
          guardId: newGuard.id,
          guardName: newGuard.name,
          body: `New guard account: ${newGuard.name}`,
        }
      );
    }
    return newGuard.id;
  };

  const handleAddClientProfile = async (input: {
    name?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email: string;
    companyName?: string;
    phone?: string;
    clientType?: ClientType;
  }): Promise<string> => {
    const emailLower = assertEmailAvailable(input.email);
    const { password, mustChangePassword } = provisionedPasswordFields();
    const normalized = input.firstName
      ? personNameFromPayload({
          firstName: input.firstName,
          middleName: input.middleName,
          lastName: input.lastName ?? '',
        })
      : personNameFromPayload(resolvePersonNameParts({ name: input.name ?? '' }));
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: normalized.name,
      firstName: normalized.firstName,
      middleName: normalized.middleName,
      lastName: normalized.lastName,
      email: input.email.trim(),
      companyName: input.companyName?.trim() || (input.clientType === 'personal' ? '' : normalized.name),
      clientType: input.clientType ?? 'business',
      phone: input.phone?.trim() || '',
      avatar: '',
      totalRequests: 0,
      approved: false,
      accountStatus: 'pending',
      password,
      mustChangePassword,
    };
    setClients((prev) => [...prev, newClient]);
    if (isDbConnected) {
      const { error: insertError } = await supabase.from('clients').insert({
          id: newClient.id,
          name: newClient.name,
          first_name: newClient.firstName,
          middle_name: newClient.middleName ?? null,
          last_name: newClient.lastName,
          email: emailLower,
          company_name: newClient.companyName,
          phone: newClient.phone,
          avatar: newClient.avatar,
          total_requests: 0,
          approved: false,
          account_status: 'pending',
          password,
          must_change_password: mustChangePassword,
        });
      if (insertError) {
        setClients((prev) => prev.filter((c) => c.id !== newClient.id));
        console.error('Client insert error:', insertError);
        throw new Error('Could not save client to the database.');
      }
      try {
        await supabase
          .from('clients')
          .update({ client_type: newClient.clientType ?? 'business' })
          .eq('id', newClient.id);
      } catch {
        /* client_type column may not exist yet */
      }
    }
    setStoredPassword(emailLower, { password, mustChangePassword, role: 'client' });
    return newClient.id;
  };

  const handleAddStaffProfile = async (input: {
    email: string;
    personalEmail?: string;
    badgeNumber: string;
    staffRole: StaffRole | null;
    sideRole?: StaffSideRole | null;
    firstName: string;
    middleName?: string;
    lastName: string;
    managedCities?: string[];
    assignedManagerIds?: string[];
  }): Promise<string> => {
    const {
      email,
      personalEmail,
      badgeNumber,
      staffRole,
      sideRole = null,
      firstName,
      middleName,
      lastName,
      managedCities = [],
      assignedManagerIds = [],
    } = input;
    const nextSideRole = sideRole === 'Finance' ? ('Finance' as const) : null;
    if (!staffRole && nextSideRole !== 'Finance') {
      throw new Error('A ladder role is required unless Finance side role is set.');
    }
    const normalizedManagedCities = normalizeStaffManagedCitiesForRole(
      staffRole ?? undefined,
      managedCities,
      platformCities
    );
    validateStaffCityAssignment(staffRole ?? undefined, normalizedManagedCities, { platformCities });
    if (!currentUser || !canProposeStaffAccounts(currentUser)) {
      throw new Error('You do not have permission to add staff.');
    }
    if (staffRole && !canAssignStaffRole(currentUser.role, staffRole)) {
      throw new Error('You cannot assign that staff role.');
    }
    if (nextSideRole === 'Finance' && !canAssignStaffSideRole(currentUser.role)) {
      throw new Error('Only Directors and Founders can assign the Finance side role.');
    }
    const badgeError = !staffRole
      ? validateFinanceDeskBadgeNumber(badgeNumber)
      : validateStaffBadgeNumber(badgeNumber, staffRole);
    if (badgeError) {
      throw new Error(badgeError);
    }
    const normalizedName = personNameFromPayload({ firstName, middleName, lastName });
    const emailLower = assertEmailAvailable(email);
    const personalEmailLower = personalEmail?.trim()
      ? assertStaffPersonalEmailAvailable(
          personalEmail,
          [
            ...guards.map((g) => ({ id: g.id, email: g.email })),
            ...clients.map((c) => ({ id: c.id, email: c.email })),
          ]
        )
      : '';
    if (personalEmailLower) {
      assertStaffPersonalEmailDistinctFromWork(emailLower, personalEmailLower);
    }
    const { password, mustChangePassword } = provisionedPasswordFields();
    const staffBadge = badgeNumber.trim().toUpperCase();
    const requiresApproval = !canApproveStaffAccounts(currentUser);
    const userStatus = requiresApproval ? ('pending' as const) : ('active' as const);
    const bio = !staffRole
      ? 'Finance — Payment desk.'
      : nextSideRole
        ? `${staffRole} — Platform operations (Finance side role).`
        : `${staffRole} — Platform operations.`;
    const newStaff: SecurityGuard = {
      id: `staff-${Date.now()}`,
      name: normalizedName.name,
      firstName: normalizedName.firstName,
      middleName: normalizedName.middleName,
      lastName: normalizedName.lastName,
      email: email.trim(),
      personalEmail: personalEmailLower || undefined,
      badgeNumber: staffBadge,
      avatar: '',
      phone: '',
      bio,
      isArmed: false,
      backgroundChecked: true,
      verified: true,
      rating: 5.0,
      jobsCompleted: 0,
      certifications: [],
      experience: [],
      hourlyRateRequirement: 0,
      isStaff: true,
      staffRole: staffRole ?? undefined,
      sideRole: nextSideRole,
      managedCities: normalizedManagedCities,
      assignedManagerIds: staffRole ? assignedManagerIds : [],
      userStatus,
      password,
      mustChangePassword,
    };
    setGuards((prev) => [...prev, newStaff]);
    if (isDbConnected) {
      try {
        await supabase.from('staff').insert({
          id: newStaff.id,
          name: newStaff.name,
          first_name: newStaff.firstName,
          middle_name: null,
          last_name: newStaff.lastName || null,
          email: emailLower,
          personal_email: personalEmailLower || null,
          badge_number: newStaff.badgeNumber,
          avatar: newStaff.avatar,
          phone: newStaff.phone,
          bio: newStaff.bio,
          staff_role: staffRole,
          side_role: nextSideRole,
          user_status: userStatus,
          managed_cities: normalizedManagedCities,
          assigned_manager_ids: staffRole ? assignedManagerIds : [],
          password,
          must_change_password: mustChangePassword,
        });
      } catch (e) {
        setGuards((prev) => prev.filter((g) => g.id !== newStaff.id));
        console.error('Staff insert error:', e);
        throw new Error('Could not save staff account to the database.');
      }
    }
    if (!requiresApproval) {
      setStoredPassword(emailLower, { password, mustChangePassword, role: 'guard' });
    }
    return newStaff.id;
  };

  const handleApproveStaffAccount = async (staffId: string) => {
    if (!currentUser || !canApproveStaffAccounts(currentUser)) {
      appToast('Only Directors and above can approve staff accounts.', 'error');
      return;
    }
    const member = guards.find((g) => g.id === staffId && g.isStaff);
    if (!member) throw new Error('Staff account not found.');
    if (member.userStatus !== 'pending') {
      throw new Error('This staff account is not awaiting approval.');
    }

    const approvedBase: SecurityGuard = { ...member, userStatus: 'approved' };
    const approved = withAutoStaffActivation(approvedBase);
    setGuards((prev) => prev.map((g) => (g.id === staffId ? approved : g)));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from('staff')
        .update({
          user_status: approved.userStatus,
          ...(staffAutoActivationRowPatch(approvedBase, approved) ?? {}),
        })
        .eq('id', staffId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === staffId ? member : g)));
        throw new Error(error.message || 'Could not approve staff account.');
      }
    }
    if (member.email && member.password) {
      setStoredPassword(member.email.trim().toLowerCase(), {
        password: member.password,
        mustChangePassword: member.mustChangePassword ?? false,
        role: 'guard',
      });
    }
    void writeAuditLog(currentUser, 'staff_approved', 'staff', staffId, {
      email: member.email,
      badgeNumber: member.badgeNumber,
      staffRole: member.staffRole,
    });
    appToast(
      approved.userStatus === 'active'
        ? `${member.badgeNumber} approved and activated.`
        : `${member.badgeNumber} approved. They can finish ID and Stripe setup to unlock ops access.`,
      'success',
    );
  };

  const handleRejectStaffAccount = async (staffId: string) => {
    if (!currentUser || !canApproveStaffAccounts(currentUser)) {
      appToast('Only Directors and above can reject staff accounts.', 'error');
      return;
    }
    const member = guards.find((g) => g.id === staffId && g.isStaff);
    if (!member) throw new Error('Staff account not found.');
    if (member.userStatus !== 'pending') {
      throw new Error('This staff account is not awaiting approval.');
    }

    setGuards((prev) => prev.filter((g) => g.id !== staffId));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase.from('staff').delete().eq('id', staffId);
      if (error) {
        setGuards((prev) => [...prev, member]);
        throw new Error(error.message || 'Could not reject staff account.');
      }
    }
    void writeAuditLog(currentUser, 'staff_rejected', 'staff', staffId, {
      email: member.email,
      badgeNumber: member.badgeNumber,
      staffRole: member.staffRole,
    });
    appToast(`${member.badgeNumber} rejected.`, 'info');
  };

  const handleUpdateStaffRole = async (
    staffId: string,
    staffRole: StaffRole | null,
    options?: { sideRole?: StaffSideRole | null }
  ): Promise<{ badgeNumber: string } | void> => {
    if (staffId === currentUser?.id) {
      throw new Error('You cannot change your own role.');
    }
    const member = guards.find((g) => g.id === staffId);
    if (!member?.isStaff) {
      throw new Error('This account is not a staff profile.');
    }
    if (!currentUser || !canModerateStaffMember(currentUser.role, currentUser.id, member)) {
      throw new Error('You cannot moderate staff at the same role level or above your own.');
    }
    const nextSideRole =
      options?.sideRole !== undefined
        ? options.sideRole === 'Finance'
          ? ('Finance' as const)
          : null
        : member.sideRole === 'Finance'
          ? ('Finance' as const)
          : null;
    if (!staffRole && nextSideRole !== 'Finance') {
      throw new Error('A ladder role is required unless Finance side role is set.');
    }
    if (staffRole && !canAssignStaffRole(currentUser.role, staffRole)) {
      throw new Error('You cannot assign that staff role.');
    }
    if (
      options?.sideRole !== undefined &&
      options.sideRole !== (member.sideRole ?? null) &&
      !canAssignStaffSideRole(currentUser.role)
    ) {
      throw new Error('Only Directors and Founders can change the Finance side role.');
    }
    const roleChanged = staffRole !== (member.staffRole ?? null);
    const sideChanged = nextSideRole !== (member.sideRole ?? null);
    const becomingFinanceDesk = !staffRole && nextSideRole === 'Finance';
    const wasFinanceDesk = !member.staffRole && member.sideRole === 'Finance';
    const nextBadge =
      becomingFinanceDesk && (!wasFinanceDesk || roleChanged)
        ? nextFinanceDeskBadgeNumberForChange(guards, staffId)
        : staffRole && roleChanged
          ? nextStaffBadgeNumberForRoleChange(staffRole, guards, staffId)
          : member.badgeNumber;
    const bio =
      member.bio?.trim() && !isAutoGeneratedStaffBio(member.bio)
        ? member.bio
        : becomingFinanceDesk
          ? 'Finance — Payment desk.'
          : nextSideRole
            ? `${staffRole} — Platform operations (Finance side role).`
            : `${staffRole} — Platform operations.`;
    const nextManagedCities = normalizeStaffManagedCitiesForRole(
      staffRole ?? undefined,
      member.managedCities,
      platformCities
    );
    validateStaffCityAssignment(staffRole ?? undefined, nextManagedCities, {
      staffId,
      platformCities,
    });
    const citiesToClearManager =
      member.staffRole === 'Manager' && staffRole !== 'Manager'
        ? platformCities.filter((city) => city.cityManagerId === staffId)
        : [];
    setGuards((prev) =>
      prev.map((g) =>
        g.id === staffId
          ? {
              ...g,
              staffRole: staffRole ?? undefined,
              sideRole: nextSideRole,
              badgeNumber: nextBadge,
              managedCities: nextManagedCities,
              assignedManagerIds: staffRole ? g.assignedManagerIds : [],
              ...(g.bio?.trim() && !isAutoGeneratedStaffBio(g.bio) ? {} : { bio }),
            }
          : g
      )
    );
    if (citiesToClearManager.length > 0) {
      setPlatformCities((prev) => {
        const next = prev.map((city) =>
          city.cityManagerId === staffId ? { ...city, cityManagerId: null } : city
        );
        setPlatformCitiesCache(next);
        return next;
      });
    }
    if (isDbConnected) {
      try {
        const update: Record<string, unknown> = {
          staff_role: staffRole,
          side_role: nextSideRole,
          badge_number: nextBadge,
          managed_cities: nextManagedCities,
        };
        if (!staffRole) {
          update.assigned_manager_ids = [];
        }
        if (!member.bio?.trim() || isAutoGeneratedStaffBio(member.bio)) {
          update.bio = bio;
        }
        await supabase.from('staff').update(update).eq('id', staffId);
        for (const city of citiesToClearManager) {
          await supabase
            .from('platform_cities')
            .update({ city_manager_id: null })
            .eq('id', city.id);
        }
      } catch (e) {
        console.error('Staff role update error:', e);
        throw new Error('Could not update staff role in the database.');
      }
    }
    if ((roleChanged || sideChanged) && nextBadge !== member.badgeNumber) {
      void writeAuditLog(currentUser, 'staff_role_updated', 'staff', staffId, {
        email: member.email,
        previousRole: member.staffRole ?? null,
        staffRole,
        previousSideRole: member.sideRole ?? null,
        sideRole: nextSideRole,
        previousBadgeNumber: member.badgeNumber,
        badgeNumber: nextBadge,
      });
      return { badgeNumber: nextBadge };
    }
    if (roleChanged || sideChanged) {
      void writeAuditLog(currentUser, 'staff_role_updated', 'staff', staffId, {
        email: member.email,
        previousRole: member.staffRole ?? null,
        staffRole,
        previousSideRole: member.sideRole ?? null,
        sideRole: nextSideRole,
        badgeNumber: nextBadge,
      });
    }
  };

  const handleUpdatePlatformCity = async (
    cityId: string,
    patch: {
      status?: CityMarketStatus;
      waitlistAudience?: CityWaitlistAudience;
      recommendOpen?: boolean;
      credentialResourceLinks?: CityCredentialResourceLinks;
    }
  ) => {
    if (!currentUser) throw new Error('Sign in required.');
    const city = platformCities.find((entry) => entry.id === cityId);
    if (!city) throw new Error('City not found.');
    const actor = guards.find((g) => g.id === currentUser.id && g.isStaff);
    const isStatusChange = patch.status !== undefined || patch.waitlistAudience !== undefined;
    const isRecommendChange = patch.recommendOpen !== undefined;
    const isCredentialLinksChange = patch.credentialResourceLinks !== undefined;
    if (isStatusChange && !canManageCityMarkets(currentUser)) {
      throw new Error('Only Directors and Founders can change Service Areas status.');
    }
    if (isRecommendChange && !canRecommendCityMarket(currentUser)) {
      throw new Error('Only Managers can recommend cities.');
    }
    if (isCredentialLinksChange && !canManageCityMarkets(currentUser)) {
      throw new Error('Only Directors and Founders can edit marketplace credential links.');
    }
    if (!staffCanManageCity(currentUser.role, actor?.managedCities, city.name)) {
      throw new Error('You are not assigned to manage this city.');
    }

    const updated: PlatformCity = {
      ...city,
      status: patch.status ?? city.status,
      waitlistAudience: patch.waitlistAudience ?? city.waitlistAudience,
      recommendOpen: patch.recommendOpen ?? city.recommendOpen,
      credentialResourceLinks:
        patch.credentialResourceLinks !== undefined
          ? patch.credentialResourceLinks
          : city.credentialResourceLinks,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
    };

    setPlatformCities((prev) => {
      const next = prev.map((entry) => (entry.id === cityId ? updated : entry));
      setPlatformCitiesCache(next);
      return next;
    });

    if (isDbConnected) {
      const { error } = await supabase
        .from('platform_cities')
        .upsert(platformCityToDbRow(updated));
      if (error) {
        setPlatformCities((prev) => {
          const next = prev.map((entry) => (entry.id === cityId ? city : entry));
          setPlatformCitiesCache(next);
          return next;
        });
        throw new Error(error.message || 'Could not update Service Areas.');
      }
    }

    void writeAuditLog(currentUser, 'city_market_updated', 'platform_city', cityId, {
      name: city.name,
      status: updated.status,
      waitlistAudience: updated.waitlistAudience,
      recommendOpen: updated.recommendOpen,
    });
  };

  const handleUpdateStaffCityAccess = async (
    staffId: string,
    patch: { managedCities?: string[]; assignedManagerIds?: string[] }
  ) => {
    if (!currentUser) throw new Error('Sign in required.');
    const member = guards.find((g) => g.id === staffId && g.isStaff);
    if (!member) throw new Error('Staff account not found.');

    const managedCities = normalizeStaffManagedCitiesForRole(
      member.staffRole,
      patch.managedCities ?? member.managedCities ?? [],
      platformCities
    );
    validateStaffCityAssignment(member.staffRole, managedCities, {
      staffId,
      platformCities,
    });
    if (!currentUser || !canAssignStaffCityAccess(currentUser)) {
      throw new Error('Only Directors and Founders can assign staff city access.');
    }
    if (!canModerateStaffMember(currentUser.role, currentUser.id, member)) {
      throw new Error('You cannot change city access for this staff member.');
    }
    const assignedManagerIds = patch.assignedManagerIds ?? member.assignedManagerIds ?? [];
    const updated: SecurityGuard = { ...member, managedCities, assignedManagerIds };

    setGuards((prev) => prev.map((g) => (g.id === staffId ? updated : g)));
    if (isDbConnected) {
      const { error } = await supabase
        .from('staff')
        .update({
          managed_cities: managedCities,
          assigned_manager_ids: assignedManagerIds,
        })
        .eq('id', staffId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === staffId ? member : g)));
        throw new Error(error.message || 'Could not update Service Areas access.');
      }
    }

    void writeAuditLog(currentUser, 'staff_city_access_updated', 'staff', staffId, {
      managedCities,
      assignedManagerIds,
    });
  };

  const handleAssignCityManager = async (cityId: string, managerId: string | null) => {
    if (!currentUser || !canManageCityMarkets(currentUser)) {
      throw new Error('Only Directors and Founders can assign city managers.');
    }

    const city = platformCities.find((entry) => entry.id === cityId);
    if (!city) throw new Error('City not found.');

    const previousManagerId = city.cityManagerId ?? null;
    const staffUpdates = new Map<string, string[]>();

    const queueStaffCities = (staffId: string, cities: string[]) => {
      staffUpdates.set(staffId, cities);
    };

    if (previousManagerId && previousManagerId !== managerId) {
      const previousManager = guards.find((g) => g.id === previousManagerId && g.isStaff);
      if (previousManager) {
        queueStaffCities(
          previousManagerId,
          normalizeStaffManagedCitiesForRole(
            previousManager.staffRole,
            (previousManager.managedCities ?? []).filter(
              (name) => name.toLowerCase() !== city.name.toLowerCase()
            ),
            platformCities
          )
        );
      }
    }

    if (managerId) {
      const manager = guards.find((g) => g.id === managerId && g.isStaff);
      if (!manager || manager.staffRole !== 'Manager') {
        throw new Error('City manager must be a Manager staff account.');
      }

      queueStaffCities(
        managerId,
        normalizeStaffManagedCitiesForRole(
          'Manager',
          [...(manager.managedCities ?? []), city.name],
          platformCities
        )
      );
    }

    const updatedCity: PlatformCity = {
      ...city,
      cityManagerId: managerId,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
    };

    const previousCities = platformCities;
    const previousGuards = guards;

    setPlatformCities((prev) => {
      const next = prev.map((entry) => (entry.id === cityId ? updatedCity : entry));
      setPlatformCitiesCache(next);
      return next;
    });
    if (staffUpdates.size > 0) {
      setGuards((prev) =>
        prev.map((guard) => {
          const nextCities = staffUpdates.get(guard.id);
          return nextCities ? { ...guard, managedCities: nextCities } : guard;
        })
      );
    }

    if (isDbConnected) {
      const { error: cityError } = await supabase
        .from('platform_cities')
        .upsert(platformCityToDbRow(updatedCity));
      if (cityError) {
        setPlatformCities(previousCities);
        setPlatformCitiesCache(previousCities);
        setGuards(previousGuards);
        throw new Error(cityError.message || 'Could not update city manager.');
      }

      for (const [staffId, nextManagedCities] of staffUpdates) {
        const { error } = await supabase
          .from('staff')
          .update({ managed_cities: nextManagedCities })
          .eq('id', staffId);
        if (error) {
          setPlatformCities(previousCities);
          setPlatformCitiesCache(previousCities);
          setGuards(previousGuards);
          throw new Error(error.message || 'Could not update manager city access.');
        }
      }
    }

    void writeAuditLog(currentUser, 'city_manager_assigned', 'platform_city', cityId, {
      cityName: city.name,
      previousManagerId,
      managerId,
    });
  };

  const handleApproveClient = async (clientId: string) => {
    if (!currentUser || !canManageClients(currentUser)) {
      appToast('You do not have permission to approve customers.', 'error');
      return;
    }
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              approved: true,
              accountStatus: 'active' as const,
              applicationRevisionRequestedAt: undefined,
              applicationRevisionNote: undefined,
            }
          : c
      )
    );
    if (isDbConnected) {
      const { error: approveError } = await supabase
        .from('clients')
        .update({
          approved: true,
          account_status: 'active',
          application_revision_requested_at: null,
          application_revision_note: null,
        })
        .eq('id', clientId);
      if (approveError) {
        console.error('Client approval update error:', approveError);
        appToast('Could not save client approval to the database. Please try again.', 'error');
        await loadFromSupabase();
        return;
      }
    }
    void writeAuditLog(currentUser, 'client_approved', 'client', clientId);
    void reportPushEvent(currentUser, {
      type: 'support_ticket_status',
      recipientUserId: clientId,
      title: 'Account approved',
      body: 'Your account is active. You can now request security coverage on Guardr.',
    });
  };

  const handleRejectClient = async (clientId: string) => {
    if (!currentUser || !canManageClients(currentUser)) {
      appToast('You do not have permission to reject customers.', 'error');
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    const previousStatus = client ? getClientAccountStatus(client) : undefined;
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, approved: false, accountStatus: 'suspended' as const } : c
      )
    );
    if (isDbConnected) {
      await supabase.from('clients').update({ approved: false, account_status: 'suspended' }).eq('id', clientId);
    }
    void writeAuditLog(currentUser, 'client_application_revoked', 'client', clientId, {
      previousStatus,
    });
    void reportPushEvent(currentUser, {
      type: 'support_ticket_status',
      recipientUserId: clientId,
      title: previousStatus === 'active' ? 'Application revoked' : 'Account not approved',
      body: 'Your account request was not approved. Contact Guardr support if you have questions.',
    });
  };

  const handleApproveGuardAccount = async (guardId: string) => {
    if (!currentUser || !canApproveGuards(currentUser)) {
      appToast('You do not have permission to approve guard applications.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    const blockers = guardAccountApprovalBlockers(guard);
    if (blockers.length > 0) {
      throw new Error(`Cannot approve profile yet:\n• ${blockers.join('\n• ')}`);
    }

    const sealedAt = new Date().toISOString();
    const sealedSnapshot = sealApplicationSubmissionSnapshot(guard, sealedAt);
    const approvedGuard: SecurityGuard = {
      ...guard,
      userStatus: 'approved',
      verified: true,
      credentialGraceDeadline: undefined,
      credentialGraceMissing: undefined,
      applicationRevisionRequestedAt: undefined,
      applicationRevisionNote: undefined,
      applicationSubmissionSnapshot: sealedSnapshot,
    };

    setGuards((prev) => prev.map((g) => (g.id === guardId ? approvedGuard : g)));
    if (isDbConnected) {
      beginLocalMutation();
      const result = await updateGuardAccountRow(
        supabase,
        guardId,
        {
          user_status: 'approved',
          verified: true,
          credential_grace_deadline: null,
          credential_grace_missing: null,
          credential_grace_hours: null,
          application_revision_requested_at: null,
          application_revision_note: null,
          application_submission_snapshot: sealedSnapshot,
        },
        'approve'
      );
      if (result.ok === false) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? guard : g)));
        throw new Error(result.error);
      }
    }
    void writeAuditLog(currentUser, 'guard_approved', 'guard', guardId, { email: guard.email });
    notifyAccountUpdate(
      currentUser,
      guardId,
      'Application approved',
      'Your guard application is approved. Open Guardr to upload your activation credentials.'
    );
    await ensureActivationSupportTicket(approvedGuard);
  };

  const handleRequestGuardApplicationRevision = async (guardId: string, reason?: string) => {
    if (!currentUser || !(canApproveGuards(currentUser) || canManageGuards(currentUser))) {
      appToast('You do not have permission to request application revisions.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard || guard.isStaff) throw new Error('Guard not found.');

    const status = getGuardUserStatus(guard);
    if (status !== 'pending' && status !== 'approved' && status !== 'active') {
      throw new Error('Only pending, approved, or active applications can be sent back for revision.');
    }

    const activeJob = requests.find(
      (r) => r.assignedGuardId === guardId && ['accepted', 'in-progress'].includes(r.status)
    );
    if (activeJob) {
      throw new Error(
        'This guard has an active job. Complete or reassign the shift before requesting revision.'
      );
    }

    const note =
      reason?.trim() ||
      'Staff needs updates to your application before it can stay approved. Please review the note and resubmit.';
    const requestedAt = new Date().toISOString();
    const demote = status === 'approved' || status === 'active';

    const previous = guard;
    const openedSnapshot = unsealApplicationSubmissionSnapshot(guard.applicationSubmissionSnapshot);
    const revisedGuard: SecurityGuard = {
      ...guard,
      ...(demote
        ? {
            userStatus: 'pending' as const,
            verified: false,
            trusted: false,
          }
        : {}),
      applicationRevisionRequestedAt: requestedAt,
      applicationRevisionNote: note,
      applicationSubmissionSnapshot: openedSnapshot,
    };

    setGuards((prev) => prev.map((g) => (g.id === guardId ? revisedGuard : g)));
    if (isDbConnected) {
      beginLocalMutation();
      const result = await updateGuardAccountRow(
        supabase,
        guardId,
        {
          ...(demote
            ? {
                user_status: 'pending',
                verified: false,
                trusted: false,
              }
            : {}),
          application_revision_requested_at: requestedAt,
          application_revision_note: note,
          application_submission_snapshot: openedSnapshot,
        },
        'revision'
      );
      if (result.ok === false) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        throw new Error(result.error);
      }
    }

    void writeAuditLog(currentUser, 'guard_application_revision_requested', 'guard', guardId, {
      email: guard.email,
      reason: note,
      previousStatus: status,
    });
    notifyAccountUpdate(currentUser, guardId, 'Application revision requested', note);
  };

  const handleRequestClientApplicationRevision = async (clientId: string, reason?: string) => {
    if (!currentUser || !canManageClients(currentUser)) {
      appToast('You do not have permission to request customer application revisions.', 'error');
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found.');
    const status = getClientAccountStatus(client);
    if (status !== 'pending' && status !== 'active') {
      throw new Error('Only pending or approved customer applications can be sent back for revision.');
    }

    const activeJob = requests.find(
      (r) =>
        r.clientId === clientId &&
        ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
    );
    if (activeJob) {
      throw new Error(
        'This client has active job postings or shifts. Close those before requesting revision.'
      );
    }

    const note =
      reason?.trim() ||
      'Staff needs updates to your application before it can stay approved. Please review and resubmit.';
    const requestedAt = new Date().toISOString();
    const demote = status === 'active';
    const previous = client;

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              ...(demote ? { approved: false, accountStatus: 'pending' as const } : {}),
              applicationRevisionRequestedAt: requestedAt,
              applicationRevisionNote: note,
            }
          : c
      )
    );
    if (isDbConnected) {
      const { error } = await supabase
        .from('clients')
        .update({
          ...(demote ? { approved: false, account_status: 'pending' } : {}),
          application_revision_requested_at: requestedAt,
          application_revision_note: note,
        })
        .eq('id', clientId);
      if (error) {
        setClients((prev) => prev.map((c) => (c.id === clientId ? previous : c)));
        throw new Error('Could not request customer application revision.');
      }
    }

    void writeAuditLog(currentUser, 'client_application_revision_requested', 'client', clientId, {
      reason: note,
      previousStatus: status,
    });
    void reportPushEvent(currentUser, {
      type: 'support_ticket_status',
      recipientUserId: clientId,
      title: 'Application revision requested',
      body: note,
    });
  };

  const handleSetGuardTrusted = async (guardId: string, trusted: boolean) => {
    if (!currentUser || !canSetTrustedStatus(currentUser)) {
      appToast('Only Directors and Founders can set a guard as trusted.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    let relistedCount = 0;
    if (trusted) {
      if (!guard || guard.userStatus !== 'active' || !guard.verified) {
        appToast('A guard must be approved and active before they can be marked as trusted.', 'error');
        return;
      }
    } else if (guard) {
      const affectedJobs = requests.filter((j) => jobAffectedByTrustedRevocation(guardId, j));
      const revocationUpdates = applyTrustedRevocationToJobs(guardId, affectedJobs);
      relistedCount = revocationUpdates.filter((u) => u.relisted).length;
      for (const update of revocationUpdates) {
        await persistTeamJobUpdate(update.job, update.slots);
        if (update.relisted && currentUser) {
          void reportPushEvent(currentUser, {
            type: 'job_relisted',
            recipientUserId: update.job.clientId,
            requestId: update.job.id,
            body: `"${update.job.title}" is back on the marketplace.`,
          });
        }
        for (const removedId of update.removedGuardIds) {
          if (!currentUser || removedId === guardId) continue;
          void reportPushEvent(currentUser, {
            type: 'assignment',
            recipientUserId: removedId,
            requestId: update.job.id,
            body: `You were removed from "${update.job.title}" because a trusted guard on this job is no longer trusted.`,
          });
        }
      }
      if (revocationUpdates.length > 0) {
        appToast(
          relistedCount > 0
            ? `${guard.name} is no longer trusted. ${relistedCount} job${relistedCount === 1 ? '' : 's'} re-listed.`
            : `${guard.name} is no longer trusted.`,
          'success'
        );
      }
    }
    setGuards((prev) => prev.map((g) => (g.id === guardId ? { ...g, trusted } : g)));
    if (isDbConnected) {
      const { error } = await supabase.from('guards').update({ trusted }).eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? { ...g, trusted: !trusted } : g)));
        appToast('Could not update guard trusted status.', 'error');
        return;
      }
    }
    if (currentUser && guard) {
      if (trusted) {
        void reportPushEvent(currentUser, {
          type: 'guard_trusted_status',
          recipientUserId: guardId,
          guardId,
          title: 'You are now a trusted guard',
          body: 'You can skip Guardr applicant review on Stripe jobs.',
        });
        appToast(`${guard.name} is now a trusted guard.`, 'success');
      } else {
        void reportPushEvent(currentUser, {
          type: 'guard_trusted_status',
          recipientUserId: guardId,
          guardId,
          title: 'Trusted status removed',
          body:
            relistedCount > 0
              ? `Your trusted status was removed. ${relistedCount} scheduled job${relistedCount === 1 ? '' : 's'} were re-listed.`
              : 'Your trusted status was removed. Future applications will require Guardr staff review.',
        });
      }
    }
  };

  const handleSetClientTrusted = async (clientId: string, trusted: boolean) => {
    if (!currentUser || !canSetTrustedStatus(currentUser)) {
      appToast('Only Directors and Founders can set a client as trusted.', 'error');
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, trusted } : c)));
    if (isDbConnected) {
      const { error } = await supabase.from('clients').update({ trusted }).eq('id', clientId);
      if (error) {
        setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, trusted: !trusted } : c)));
        appToast('Could not update client trusted status.', 'error');
        return;
      }
    }
    if (currentUser && client) {
      void reportPushEvent(currentUser, {
        type: 'client_trusted_status',
        recipientUserId: clientId,
        clientId,
        title: trusted ? 'You are now a trusted client' : 'Trusted status removed',
        body: trusted
          ? 'Your job postings will open to guards immediately without Guardr approval.'
          : 'Your job postings will require Guardr staff approval before guards can apply.',
      });
      appToast(
        trusted ? `${client.name} is now a trusted client.` : `${client.name} is no longer a trusted client.`,
        'success'
      );
    }
  };

  const handleToggleFavoriteGuard = async (guardId: string) => {
    if (!currentUser) return;
    const clientId = currentUser.id;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const existing = client.favoriteGuardIds ?? [];
    const isFav = existing.includes(guardId);
    const next = isFav ? existing.filter((id) => id !== guardId) : [...existing, guardId];
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, favoriteGuardIds: next } : c))
    );
    if (isDbConnected) {
      const { error } = await supabase
        .from('clients')
        .update({ favorite_guard_ids: next })
        .eq('id', clientId);
      if (error) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, favoriteGuardIds: existing } : c))
        );
        appToast('Could not update favourites.', 'error');
      }
    }
  };

  const handleSaveJobLocation = async (location: JobLocation) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      throw new Error('You do not have permission to manage locations.');
    }
    const next: JobLocation = {
      ...location,
      updatedAt: location.updatedAt ?? new Date().toISOString(),
    };
    setJobLocations((prev) => {
      const existing = prev.find((l) => l.id === next.id);
      return existing ? prev.map((l) => (l.id === next.id ? next : l)) : [next, ...prev];
    });
    if (isDbConnected) {
      const { error } = await supabase.from('job_locations').upsert(jobLocationToDbRow(next));
      if (error) {
        console.error('Job location save error:', error);
        showAppToast('Could not save location. Run complete_schema_setup.sql if the table is missing.', {
          tone: 'error',
        });
        throw new Error(error.message || 'Could not save location.');
      }
    }
  };

  const handleSaveClientLocation = async (location: ClientLocation) => {
    const client = clients.find((c) => c.id === location.clientId);
    let linked = location;
    try {
      const ensured = ensureSharedLocationFromClientLocation(jobLocations, location, client);
      setJobLocations(ensured.locations);
      linked = { ...location, sharedLocationId: ensured.location.id };
      if (isDbConnected) {
        const { error: sharedErr } = await supabase
          .from('job_locations')
          .upsert(jobLocationToDbRow(ensured.location));
        if (sharedErr && sharedErr.code !== '42P01') {
          console.warn('Shared job location upsert:', sharedErr);
        }
      }
    } catch (err) {
      console.warn('Shared location link skipped:', err);
    }

    setClientLocations((prev) => {
      const existing = prev.find((l) => l.id === linked.id);
      return existing ? prev.map((l) => (l.id === linked.id ? linked : l)) : [linked, ...prev];
    });
    if (isDbConnected) {
      const { error } = await supabase.from('client_locations').upsert({
        id: linked.id,
        client_id: linked.clientId,
        name: linked.name,
        address: linked.address,
        state: linked.state ?? null,
        latitude: linked.latitude ?? null,
        longitude: linked.longitude ?? null,
        risk_level: linked.riskLevel,
        status: linked.status === 'pending' ? 'active' : linked.status,
        listed: linked.listed !== false,
        site_instructions: linked.siteInstructions ?? null,
        shared_location_id: linked.sharedLocationId ?? null,
        created_at: linked.createdAt ?? new Date().toISOString(),
        reviewed_at: linked.reviewedAt ?? null,
        reviewed_by: linked.reviewedBy ?? null,
      });
      if (error) {
        console.error('Client location save error:', error);
        showAppToast('Could not save location.', { tone: 'error' });
      }
    }
  };

  const handleApproveClientLocation = async (locationId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) return;
    const existing = clientLocations.find((l) => l.id === locationId);
    if (!existing) return;
    const next = approveClientLocation(existing, currentUser);
    await handleSaveClientLocation(next);
    showAppToast('Location approved.', { tone: 'success' });
  };

  const handleRejectClientLocation = async (locationId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) return;
    const existing = clientLocations.find((l) => l.id === locationId);
    if (!existing) return;
    const next = rejectClientLocation(existing, currentUser);
    await handleSaveClientLocation(next);
    showAppToast('Location rejected.', { tone: 'info' });
  };

  const handleAckBriefing = async (requestId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job || !activeGuardId) return;
    const acks = appendBriefingAck(job.briefingAcknowledgments, activeGuardId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, briefingAcknowledgments: acks } : r))
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ briefing_acknowledgments: acks })
        .eq('id', requestId);
    }
    showAppToast('Site briefing acknowledged.', { tone: 'success' });
  };

  const handleAckPostOrders = async (requestId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job || !activeGuardId) return;
    const acks = appendPostOrdersAck(job.postOrdersAcknowledgments, activeGuardId);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, postOrdersAcknowledgments: acks } : r))
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ post_orders_acknowledgments: acks })
        .eq('id', requestId);
    }
    showAppToast('Post orders acknowledged.', { tone: 'success' });
  };

  const handleSaveGuardJobPreferences = async (guardId: string, preferences: JobType[]) => {
    const normalized = normalizeJobTypePreferences(preferences);
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, jobTypePreferences: normalized } : g))
    );
    if (isDbConnected) {
      await supabase
        .from('guards')
        .update({ job_type_preferences: normalized })
        .eq('id', guardId);
    }
  };

  const handleCompleteGuardJobTypeOnboarding = async (guardId: string, jobType: JobType) => {
    const completedAt = new Date().toISOString();
    let nextOnboarding: Partial<Record<JobType, string>> | undefined;
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        nextOnboarding = {
          ...(g.jobTypeOnboarding ?? {}),
          [jobType]: completedAt,
        };
        return {
          ...g,
          jobTypeOnboarding: nextOnboarding,
        };
      })
    );
    if (isDbConnected && nextOnboarding) {
      await supabase
        .from('guards')
        .update({ job_type_onboarding: nextOnboarding })
        .eq('id', guardId);
    }
  };

  const handleSubmitGuardIdentityVerification = async (
    guardId: string,
    payload: {
      idDocumentType: import('./types').GovernmentIdDocumentType;
      idLicenseClass?: string;
      idState: string;
      idNumber: string;
      idExpiryDate: string;
      idFrontUrl: string;
      idBackUrl: string;
      idSelfieUrl: string;
    }
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return { ok: false, error: 'Profile not found.' };

    const staffActor = Boolean(
      currentUser && currentUser.id !== guardId && isStaffRole(currentUser.role)
    );
    if (staffActor) {
      return { ok: false, error: STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE };
    }
    if (!guardIdVerificationCanEdit(guard)) {
      return { ok: false, error: GOV_ID_SUBMITTED_LOCKED_MESSAGE };
    }

    const idState = payload.idState.trim().toUpperCase();
    const idNumber = payload.idNumber.trim();
    const idExpiryDate = payload.idExpiryDate.trim();
    const idDocumentType = payload.idDocumentType;
    const idLicenseClass = payload.idLicenseClass?.trim() || undefined;
    const front = payload.idFrontUrl.trim();
    const back = payload.idBackUrl.trim();
    const selfie = payload.idSelfieUrl.trim();
    if (!idState || !idNumber) {
      return { ok: false, error: 'Enter the issuing state and ID number before submitting.' };
    }
    if (!idExpiryDate) {
      return { ok: false, error: 'Enter the ID expiration date before submitting.' };
    }
    if (!front || !back || !selfie) {
      return { ok: false, error: 'Upload ID front, ID back, and an identity selfie before submitting.' };
    }
    if (!idDocumentType) {
      return { ok: false, error: 'Select whether this is a government ID or driver\'s license.' };
    }
    if (idDocumentType === 'drivers_license' && !idLicenseClass) {
      return { ok: false, error: "Enter your driver's license class before submitting." };
    }
    if (getGuardUserStatus(guard) === 'blocked') {
      return { ok: false, error: 'Your application was not approved. Contact Guardr support.' };
    }

    const previous = { ...guard };
    const submittedAt = new Date().toISOString();
    const wasVerified = getGuardIdVerificationStatus(guard) === 'verified';
    const photosChanged =
      front !== (guard.idFrontUrl ?? '').trim() ||
      back !== (guard.idBackUrl ?? '').trim() ||
      selfie !== (guard.idSelfieUrl ?? '').trim();
    let idRevisionHistory = guard.idRevisionHistory;
    if (wasVerified && photosChanged) {
      idRevisionHistory = prependGovIdRevision(
        idRevisionHistory,
        snapshotGovIdRevision(guard, 'superseded')
      );
    }
    const nextGuardBase: SecurityGuard = {
      ...guard,
      idState,
      idNumber,
      idExpiryDate,
      idDocumentType,
      idLicenseClass,
      idFrontUrl: front,
      idBackUrl: back,
      idSelfieUrl: selfie,
      idVerificationStatus: 'pending' as const,
      idVerificationSubmittedAt: submittedAt,
      idVerificationRejectionReason: undefined,
      idUpdateRequestedAt: undefined,
      idUpdateRequestNote: undefined,
      idSubmittedBy: guard.isStaff ? ('staff' as const) : ('guard' as const),
      idRevisionHistory,
    };
    const snapshot = guard.isStaff ? null : captureGovIdApplicationSnapshot(nextGuardBase, submittedAt);
    const nextGuard: SecurityGuard = snapshot
      ? { ...nextGuardBase, applicationSubmissionSnapshot: snapshot }
      : nextGuardBase;

    setGuards((prev) => prev.map((g) => (g.id === guardId ? nextGuard : g)));

    if (isDbConnected) {
      beginLocalMutation();
      const idUpdate = {
        id_state: idState,
        id_number: idNumber,
        id_expiry_date: idExpiryDate,
        id_document_type: idDocumentType,
        id_license_class: idLicenseClass ?? null,
        id_front_url: front,
        id_back_url: back,
        id_selfie_url: selfie,
        id_verification_status: 'pending',
        id_verification_submitted_at: submittedAt,
        id_verification_rejection_reason: null,
        id_update_requested_at: null,
        id_update_request_note: null,
        id_submitted_by: guard.isStaff ? 'staff' : 'guard',
        id_revision_history: idRevisionHistory ?? [],
        ...(snapshot ? { application_submission_snapshot: snapshot } : {}),
      };
      const { error } = await supabase
        .from(guard.isStaff ? 'staff' : 'guards')
        .update(idUpdate)
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('ID verification submit error:', error);
        return { ok: false, error: 'Could not save ID verification. Please try again.' };
      }
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'credential_pending',
        guardId,
        guardName: guard.name,
        body: `${guard.name} submitted government ID for review`,
      });
    }
    return { ok: true };
  };

  const handleApproveGuardIdentityVerification = async (guardId: string) => {
    if (!currentUser || !canVerifyCredentials(currentUser)) {
      appToast('Only Administrators and above can verify government ID.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    const idBlocker = staffApproveIdVerificationBlocker(guard);
    if (idBlocker) throw new Error(idBlocker);
    if (!staffCanApproveIdVerification(guard)) {
      throw new Error('Cannot approve ID yet — ensure state, number, expiration, and all photos are on file.');
    }

    const reviewedAt = new Date().toISOString();
    const previous = { ...guard };
    let stripePayoutsEnabled = false;
    if (guard.isStaff && guard.stripeConnectAccountId) {
      try {
        stripePayoutsEnabled = (await getConnectAccountStatus(guard.stripeConnectAccountId)).payoutsEnabled;
      } catch {
        stripePayoutsEnabled = false;
      }
    }
    const nextGuard = guard.isStaff
      ? withAutoStaffActivation(
          {
            ...guard,
            idVerificationStatus: 'verified' as const,
            idVerificationReviewedAt: reviewedAt,
            idVerificationRejectionReason: undefined,
            idUpdateRequestedAt: undefined,
            idUpdateRequestNote: undefined,
          },
          { stripePayoutsEnabled },
        )
      : withAutoGuardActivation(
          syncGuardCredentialExpiryState(
            syncGuardCredentialGraceState({
              ...guard,
              idVerificationStatus: 'verified' as const,
              idVerificationReviewedAt: reviewedAt,
              idVerificationRejectionReason: undefined,
              idUpdateRequestedAt: undefined,
              idUpdateRequestNote: undefined,
            })
          )
        );
    setGuards((prev) => prev.map((g) => (g.id === guardId ? nextGuard : g)));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from(guard.isStaff ? 'staff' : 'guards')
        .update(
          guard.isStaff
            ? {
                id_verification_status: 'verified',
                id_verification_reviewed_at: reviewedAt,
                id_verification_rejection_reason: null,
                id_update_requested_at: null,
                id_update_request_note: null,
                user_status: nextGuard.userStatus,
                ...(staffAutoActivationRowPatch(previous, nextGuard) ?? {}),
              }
            : {
                id_verification_status: 'verified',
                id_verification_reviewed_at: reviewedAt,
                id_verification_rejection_reason: null,
                id_update_requested_at: null,
                id_update_request_note: null,
                user_status: nextGuard.userStatus,
                verified: nextGuard.verified,
                credential_expiry_restricted: nextGuard.credentialExpiryRestricted ?? false,
                ...(guardAutoActivationRowPatch(guard, nextGuard) ?? {}),
              }
        )
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('ID verification approve error:', error);
        throw new Error('Could not approve government ID. Please try again.');
      }
    }
    if (currentUser) {
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Government ID verified',
        'Your government ID was verified. Continue uploading your remaining activation credentials.'
      );
      if (guardAutoActivated(guard, nextGuard)) {
        void writeAuditLog(currentUser, 'guard_activated', 'guard', guardId, {
          email: nextGuard.email,
          automatic: true,
        });
        notifyAccountUpdate(
          currentUser,
          guardId,
          'Account activated',
          'Your credentials are verified. You can now browse and accept jobs on Guardr.'
        );
      }
    }
  };

  const handleRejectGuardIdentityVerification = async (guardId: string, reason?: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return;

    const reviewedAt = new Date().toISOString();
    const rejectionReason = reason?.trim() || GUARD_APPLICATION_REJECT_DEFAULT_REASON;

    if (guard.isStaff) {
      const previous = { ...guard };
      setGuards((prev) =>
        prev.map((g) =>
          g.id === guardId
            ? {
                ...g,
                idVerificationStatus: 'rejected' as const,
                idVerificationReviewedAt: reviewedAt,
                idVerificationRejectionReason: rejectionReason,
              }
            : g
        )
      );
      if (isDbConnected) {
        beginLocalMutation();
        const { error } = await supabase
          .from('staff')
          .update({
            id_verification_status: 'rejected',
            id_verification_reviewed_at: reviewedAt,
            id_verification_rejection_reason: rejectionReason,
          })
          .eq('id', guardId);
        if (error) {
          setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
          throw new Error('Could not reject staff government ID. Please try again.');
        }
      }
      if (currentUser) {
        notifyAccountUpdate(currentUser, guardId, 'ID verification rejected', rejectionReason);
      }
      return;
    }

    const previousStatus = getGuardUserStatus(guard);
    if (previousStatus === 'active' || previousStatus === 'approved') {
      const activeJob = requests.find(
        (r) => r.assignedGuardId === guardId && ['accepted', 'in-progress'].includes(r.status)
      );
      if (activeJob) {
        throw new Error(
          'This guard has an active job. Complete or reassign the shift before revoking the application.'
        );
      }
    }

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              userStatus: 'blocked' as const,
              verified: false,
              trusted: false,
              idVerificationStatus: 'rejected' as const,
              idVerificationReviewedAt: reviewedAt,
              idVerificationRejectionReason: rejectionReason,
            }
          : g
      )
    );
    if (isDbConnected) {
      beginLocalMutation();
      await supabase
        .from('guards')
        .update({
          user_status: 'blocked',
          verified: false,
          trusted: false,
          id_verification_status: 'rejected',
          id_verification_reviewed_at: reviewedAt,
          id_verification_rejection_reason: rejectionReason,
        })
        .eq('id', guardId);
    }
    if (currentUser) {
      void writeAuditLog(currentUser, 'guard_application_revoked', 'guard', guardId, {
        email: guard.email,
        reason: rejectionReason,
        previousStatus,
      });
      const title =
        previousStatus === 'approved' || previousStatus === 'active'
          ? 'Application revoked'
          : previousStatus === 'pending'
            ? 'Application denied'
            : 'ID verification rejected';
      notifyAccountUpdate(currentUser, guardId, title, rejectionReason);
    }
  };

  const handleStaffUpdateGuardIdImages = async (
    guardId: string,
    payload: {
      idDocumentType?: import('./types').GovernmentIdDocumentType;
      idLicenseClass?: string;
      idState: string;
      idNumber: string;
      idExpiryDate: string;
      idFrontUrl: string;
      idBackUrl: string;
      idSelfieUrl: string;
    }
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return { ok: false, error: 'Guard profile not found.' };
    if (getGuardUserStatus(guard) === 'blocked') {
      return { ok: false, error: 'This application was rejected — account is blocked.' };
    }
    if (!staffCanEditGuardGovernmentId(guard)) {
      const status = getGuardIdVerificationStatus(guard);
      if (status === 'not_submitted') {
        return { ok: false, error: STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE };
      }
      return { ok: false, error: STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE };
    }

    const idState = payload.idState?.trim().toUpperCase() || guard.idState?.trim().toUpperCase() || '';
    const idNumber = payload.idNumber?.trim() || guard.idNumber?.trim() || '';
    const idExpiryDate = payload.idExpiryDate?.trim() || guard.idExpiryDate?.trim() || '';
    const idDocumentType = payload.idDocumentType ?? guard.idDocumentType;
    const idLicenseClass =
      idDocumentType === 'drivers_license'
        ? payload.idLicenseClass?.trim() || guard.idLicenseClass?.trim() || undefined
        : undefined;
    const front = payload.idFrontUrl?.trim() || guard.idFrontUrl?.trim() || '';
    const back = payload.idBackUrl?.trim() || guard.idBackUrl?.trim() || '';
    const selfie = payload.idSelfieUrl?.trim() || guard.idSelfieUrl?.trim() || '';
    const documentTypeChanged =
      idDocumentType !== guard.idDocumentType ||
      (idLicenseClass ?? '') !== (guard.idLicenseClass ?? '').trim();
    const credentialDataChanged =
      idState !== (guard.idState ?? '').trim().toUpperCase() ||
      idNumber !== (guard.idNumber ?? '').trim() ||
      idExpiryDate !== (guard.idExpiryDate ?? '').trim() ||
      front !== (guard.idFrontUrl ?? '').trim() ||
      back !== (guard.idBackUrl ?? '').trim() ||
      selfie !== (guard.idSelfieUrl ?? '').trim();
    if (credentialDataChanged) {
      return { ok: false, error: STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE };
    }
    if (!documentTypeChanged) return { ok: true };
    if (!idDocumentType) {
      return { ok: false, error: 'Select Government ID or Driver’s license.' };
    }
    if (idDocumentType === 'drivers_license' && !idLicenseClass) {
      return { ok: false, error: 'Select the driver’s license class.' };
    }

    const complete = Boolean(idState && idNumber && idExpiryDate && front && back && selfie);
    const dataChanged = documentTypeChanged;
    if (!dataChanged) return { ok: true };

    const previous = { ...guard };
    const now = new Date().toISOString();
    let nextStatus = guard.idVerificationStatus ?? 'not_submitted';

    if (guard.idVerificationStatus === 'verified') {
      nextStatus = 'verified';
    } else if (complete) {
      // Photos + details on file → pending staff review (type can still be set before approve).
      nextStatus = 'pending';
    } else {
      nextStatus = 'not_submitted';
    }

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              idState: idState || undefined,
              idNumber: idNumber || undefined,
              idExpiryDate: idExpiryDate || undefined,
              idDocumentType,
              idLicenseClass,
              idFrontUrl: front || undefined,
              idBackUrl: back || undefined,
              idSelfieUrl: selfie || undefined,
              idVerificationStatus: nextStatus,
              idVerificationSubmittedAt:
                complete && nextStatus !== 'verified' ? now : g.idVerificationSubmittedAt,
              idVerificationReviewedAt:
                nextStatus === 'pending' ? undefined : g.idVerificationReviewedAt,
              idVerificationRejectionReason:
                complete && nextStatus !== 'verified' ? undefined : g.idVerificationRejectionReason,
              // Preserve who originally submitted — staff never submit for the guard.
              idSubmittedBy: g.idSubmittedBy,
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from(guard.isStaff ? 'staff' : 'guards')
        .update({
          id_state: idState || null,
          id_number: idNumber || null,
          id_expiry_date: idExpiryDate || null,
          id_document_type: idDocumentType ?? null,
          id_license_class: idLicenseClass ?? null,
          id_front_url: front || null,
          id_back_url: back || null,
          id_selfie_url: selfie || null,
          id_verification_status: nextStatus,
          id_verification_submitted_at:
            complete && nextStatus !== 'verified' ? now : guard.idVerificationSubmittedAt ?? null,
          id_verification_reviewed_at:
            nextStatus === 'pending' ? null : guard.idVerificationReviewedAt ?? null,
          id_verification_rejection_reason:
            complete && nextStatus !== 'verified' ? null : guard.idVerificationRejectionReason ?? null,
          id_submitted_by: guard.idSubmittedBy ?? null,
        })
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('Staff ID image update error:', error);
        return { ok: false, error: 'Could not save ID photos. Please try again.' };
      }
    }
    return { ok: true };
  };

  const handleRequestGuardIdResubmit = async (
    guardId: string,
    slots: IdVerificationSlot[],
    staffNote?: string
  ) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard || slots.length === 0 || !staffCanRequestIdResubmit(guard)) return;

    const slotSet = new Set(slots);
    const rejectionReason = buildIdResubmitReason(slots, staffNote);
    const reviewedAt = new Date().toISOString();
    const nextFront = slotSet.has('front') ? undefined : guard.idFrontUrl;
    const nextBack = slotSet.has('back') ? undefined : guard.idBackUrl;
    const nextSelfie = slotSet.has('selfie') ? undefined : guard.idSelfieUrl;

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              idFrontUrl: nextFront,
              idBackUrl: nextBack,
              idSelfieUrl: nextSelfie,
              idVerificationStatus: 'rejected' as const,
              idVerificationReviewedAt: reviewedAt,
              idVerificationRejectionReason: rejectionReason,
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      await supabase
        .from(guard.isStaff ? 'staff' : 'guards')
        .update({
          id_front_url: nextFront ?? null,
          id_back_url: nextBack ?? null,
          id_selfie_url: nextSelfie ?? null,
          id_verification_status: 'rejected',
          id_verification_reviewed_at: reviewedAt,
          id_verification_rejection_reason: rejectionReason,
        })
        .eq('id', guardId);
    }
  };

  const handleRequestCertImageResubmit = async (guardId: string, certId: string, staffNote?: string) => {
    const guard = guards.find((g) => g.id === guardId);
    const cert = guard?.certifications.find((c) => c.id === certId);
    if (!cert) return;

    const rejectionReason = buildCertImageResubmitReason(cert.name, staffNote);
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              certifications: g.certifications.map((c) =>
                c.id === certId
                  ? {
                      ...c,
                      status: 'rejected' as const,
                      imageUrl: undefined,
                      rejectionReason,
                    }
                  : c
              ),
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      await supabase
        .from('certifications')
        .update({
          status: 'rejected',
          image_url: null,
          rejection_reason: rejectionReason,
        })
        .eq('id', certId);
    }
  };

  const handleDeleteGuardAccount = async (guardId: string) => {
    if (!currentUser || !canManageGuards(currentUser)) {
      appToast('You do not have permission to delete guard accounts.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    if (guard.isStaff) throw new Error('Use the Team panel to manage staff accounts.');
    const activeJob = requests.find(
      (r) => r.assignedGuardId === guardId && ['accepted', 'in-progress'].includes(r.status)
    );
    if (activeJob) {
      throw new Error('This guard has an active job. Complete or reassign the shift before deleting the account.');
    }
    if (isDbConnected) {
      const { error } = await supabase.from('guards').delete().eq('id', guardId);
      if (error) {
        console.error('Guard delete error:', error);
        throw new Error('Could not delete guard account from the database.');
      }
    }
    setGuards((prev) => prev.filter((g) => g.id !== guardId));
    removeStoredPassword(guard.email);
    if (currentUser?.id === guardId) {
      handleSignOut();
    }
  };

  const handleDeleteClientAccount = async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) throw new Error('Client not found.');
    const activeJob = requests.find(
      (r) =>
        r.clientId === clientId &&
        ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
    );
    if (activeJob) {
      throw new Error('This client has active job postings or shifts. Close those before deleting the account.');
    }
    if (isDbConnected) {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) {
        console.error('Client delete error:', error);
        throw new Error('Could not delete customer from the database.');
      }
    }
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    removeStoredPassword(client.email);
    if (currentUser?.id === clientId) {
      handleSignOut();
    }
  };

  // ── Request CRUD ───────────────────────────────────────────
  const handlePostRequest = async (newRequest: Partial<SecurityRequest>) => {
    const clientRecord = clients.find((c) => c.id === currentUser?.id);
    if (clientRecord && getClientAccountStatus(clientRecord) !== 'active') {
      showAppToast('Your account is pending Guardr approval. You can update your profile, but cannot post jobs yet.', {
        tone: 'info',
      });
      return;
    }
    const requestedJobType = newRequest.type || 'event';
    if (clientRecord) {
      const credentialBlocker = clientJobCredentialBlocker(
        clientRecord,
        requestedJobType,
        platformSettings.clientCredentialRules
      );
      if (credentialBlocker) {
        showAppToast(credentialBlocker, { tone: 'error' });
        return;
      }
    }

    const startDate = newRequest.startDate || new Date().toISOString();
    const endDate = newRequest.endDate || new Date(Date.now() + 8 * 3600000).toISOString();
    const scheduleError = validateShiftSchedule(startDate, endDate);
    if (scheduleError) {
      showAppToast(scheduleError, { tone: 'error' });
      return;
    }

    const clientName = clientRecord?.companyName || currentUser?.clientName || currentUser?.name || 'Customer';
    const clientLogo = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
    const siteName = newRequest.siteName || '';
    const address = newRequest.address || newRequest.location || 'To Be Confirmed';
    const durationHours = newRequest.durationHours ?? computeDurationHours(startDate, endDate);
    const hourlyRate = newRequest.hourlyRate || 35;
    const pricingMode = newRequest.pricingMode ?? 'standard';
    const agreementFeeConfig =
      pricingMode === 'open_contract' ? newRequest.agreementFeeConfig : undefined;
    const jobType = newRequest.type || 'event';
    const billing = computeJobBilling(
      hourlyRate,
      durationHours,
      newRequest.guardsNeeded || 1,
      feeConfigForClientJob(platformSettings, clientRecord?.clientType, jobType),
      agreementFeeConfig
    );
    const platformFeePerHour = newRequest.platformFeePerHour ?? billing.platformFeePerHour;
    const guardPay = newRequest.guardPay ?? billing.guardPay;
    const estimatedPayout = newRequest.estimatedPayout ?? billing.estimatedPayout;
    const location = siteName ? `${siteName} — ${address}` : address;
    const jobState = formatCityLabel(newRequest.state) || resolveJobCity(newRequest.state);

    const resolvedCoords = await resolveJobMapCoordinates({
      latitude: newRequest.latitude,
      longitude: newRequest.longitude,
      siteName,
      address,
      state: jobState,
      location,
    });

    const latitude = resolvedCoords.latitude ?? newRequest.latitude;
    const longitude = resolvedCoords.longitude ?? newRequest.longitude;
    const coordsReady = hasJobCoordinates({ latitude, longitude });

    const reviewMode = platformSettings.jobReviewMode ?? 'trusted-auto';
    const autoPublish = platformSettings.trustedClientAutoPublish !== false;
    const clientIsTrusted = clientRecord?.trusted === true;
    let initialStatus: SecurityRequest['status'] = 'pending-review';
    if (reviewMode === 'none' && coordsReady) {
      initialStatus = 'open';
    } else if (reviewMode === 'trusted-auto' && autoPublish && clientIsTrusted && coordsReady) {
      initialStatus = 'open';
    }
    const openedAt = initialStatus === 'open' ? new Date().toISOString() : undefined;

    let linkedJobLocationId = newRequest.jobLocationId;
    // Shared catalog entries are added when the job is open (staff-approved or auto-published).
    if (address.trim().length >= 4 && initialStatus === 'open') {
      try {
        const selectedClientLoc = newRequest.clientLocationId
          ? clientLocations.find((l) => l.id === newRequest.clientLocationId)
          : undefined;
        const ensured = ensureSharedJobLocation(jobLocations, {
          name: siteName || address,
          address,
          state: jobState,
          latitude,
          longitude,
          riskLevel: newRequest.locationRiskLevel,
          siteInstructions: newRequest.siteInstructions || newRequest.description,
          parkingInstructions: newRequest.parkingInstructions,
          accessInstructions: newRequest.accessInstructions,
          createdByClientId: currentUser?.id,
          preferredStatus: 'active',
          listed: selectedClientLoc?.listed !== false,
        });
        setJobLocations(ensured.locations);
        linkedJobLocationId = ensured.location.id;
        if (isDbConnected) {
          const { error: locErr } = await supabase
            .from('job_locations')
            .upsert(jobLocationToDbRow(ensured.location));
          if (locErr && locErr.code !== '42P01') {
            console.warn('Job location upsert on post:', locErr);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not link shared job location.';
        appToast(message, 'error');
        return;
      }
    }

    const freshJob: SecurityRequest = {
      id: `req-${Date.now()}`,
      title: newRequest.title || 'Security Guard Deployment',
      description: newRequest.description || newRequest.siteInstructions || 'General security patrol.',
      clientId: currentUser?.id || 'client-unknown',
      clientName,
      clientLogo,
      clientRating: clientRecord?.rating,
      siteName,
      address,
      state: jobState,
      location,
      type: jobType,
      armedRequired: newRequest.armedRequired || false,
      guardsNeeded: newRequest.guardsNeeded || 1,
      uniformRequirements: newRequest.uniformRequirements || '',
      equipmentRequirements: newRequest.equipmentRequirements || '',
      siteInstructions: newRequest.siteInstructions || newRequest.description || '',
      contactName: newRequest.contactName,
      contactPhone: newRequest.contactPhone,
      parkingInstructions: newRequest.parkingInstructions,
      accessInstructions: newRequest.accessInstructions,
      latitude,
      longitude,
      operationalDetails: normalizeJobOperationalDetails(newRequest.operationalDetails),
      startDate, endDate,
      scheduleType: newRequest.scheduleType ?? 'one-time',
      recurringEndDate: newRequest.recurringEndDate,
      recurringDays: newRequest.recurringDays,
      assignmentMode: newRequest.assignmentMode ?? clientRecord?.defaultAssignmentMode ?? 'client-approve',
      minYearsExperience: newRequest.minYearsExperience,
      clientLocationId: newRequest.clientLocationId,
      jobLocationId: linkedJobLocationId,
      locationRiskLevel: newRequest.locationRiskLevel,
      tierPayRates: newRequest.tierPayRates,
      postOrdersAcknowledgments: [],
      durationHours, hourlyRate, guardPay,
      platformFeePerHour,
      pricingMode,
      agreementFeeConfig,
      openingPriceOffer: newRequest.openingPriceOffer,
      priceNegotiations: [],
      estimatedPayout,
      status: initialStatus,
      openedAt,
      paymentStatus: 'unpaid',
      assignedGuardId: null,
      requestType: newRequest.requestType ?? 'marketplace',
      targetGuardId: newRequest.requestType === 'direct' ? (newRequest.targetGuardId ?? null) : null,
      requiredCertifications: newRequest.requiredCertifications || [],
      minGuardQualification: newRequest.minGuardQualification ?? 'pending',
      applicants: [],
      breakMinutes: newRequest.breakMinutes ?? 0,
      breakPaid: newRequest.breakPaid !== false,
    };

    setRequests((prev) => [freshJob, ...prev]);

    // Increment client's total_requests
    if (currentUser?.id) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === currentUser.id ? { ...c, totalRequests: c.totalRequests + 1 } : c
        )
      );
      if (isDbConnected) {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('total_requests')
          .eq('id', currentUser.id)
          .single();
        const nextTotal = (clientRow?.total_requests ?? 0) + 1;
        const { error: clientUpdateError } = await supabase
          .from('clients')
          .update({ total_requests: nextTotal })
          .eq('id', currentUser.id);
        if (clientUpdateError) {
          console.error('Client total_requests update error:', clientUpdateError);
        }
      }
    }

    if (freshJob.requestType === 'direct' && freshJob.targetGuardId && currentUser) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        guardId: freshJob.targetGuardId,
        requestId: freshJob.id,
        location: freshJob.location,
        body: `New direct job request: ${freshJob.title}`,
      });
    }

    if (currentUser && freshJob.status === 'pending-review') {
      void reportPushEvent(currentUser, {
        type: 'job_submitted',
        requestId: freshJob.id,
        location: freshJob.location,
        body: `${clientName} submitted "${freshJob.title}" for review`,
      });
      if (isJobLocationCoordsMissing(freshJob)) {
        void reportPushEvent(currentUser, {
          type: 'job_submitted',
          requestId: freshJob.id,
          title: 'Map coordinates missing',
          location: freshJob.location,
          body: `"${freshJob.title}" needs latitude and longitude — add them in Jobs before guards rely on the map.`,
        });
      }
    }

    if (isDbConnected) {
      beginLocalMutation();
      try {
        const { error } = await supabase.from('security_requests').insert({
          id: freshJob.id, title: freshJob.title, description: freshJob.description,
          client_id: freshJob.clientId, client_name: freshJob.clientName, client_logo: freshJob.clientLogo,
          site_name: freshJob.siteName, address: freshJob.address, state: freshJob.state ?? '',
          location: freshJob.location, type: freshJob.type, armed_required: freshJob.armedRequired,
          guards_needed: freshJob.guardsNeeded,
          uniform_requirements: freshJob.uniformRequirements,
          equipment_requirements: freshJob.equipmentRequirements,
          site_instructions: freshJob.siteInstructions,
          start_date: freshJob.startDate, end_date: freshJob.endDate,
          schedule_type: freshJob.scheduleType ?? 'one-time',
          recurring_end_date: freshJob.recurringEndDate ?? null,
          recurring_days: freshJob.recurringDays ?? null,
          assignment_mode: freshJob.assignmentMode ?? 'client-approve',
          min_years_experience: freshJob.minYearsExperience ?? null,
          client_location_id: freshJob.clientLocationId ?? null,
          job_location_id: freshJob.jobLocationId ?? null,
          location_risk_level: freshJob.locationRiskLevel ?? null,
          tier_pay_rates: freshJob.tierPayRates ?? null,
          post_orders_acknowledgments: freshJob.postOrdersAcknowledgments ?? [],
          duration_hours: freshJob.durationHours, hourly_rate: freshJob.hourlyRate,
          guard_pay: freshJob.guardPay, platform_fee_per_hour: freshJob.platformFeePerHour,
          pricing_mode: freshJob.pricingMode ?? 'standard',
          agreement_fee_config: freshJob.agreementFeeConfig ?? null,
          opening_price_offer: freshJob.openingPriceOffer ?? null,
          price_negotiations: freshJob.priceNegotiations ?? [],
          estimated_payout: freshJob.estimatedPayout, status: freshJob.status,
          opened_at: freshJob.openedAt ?? null,
          payment_status: 'unpaid',
          assigned_guard_id: freshJob.assignedGuardId,
          request_type: freshJob.requestType ?? 'marketplace',
          target_guard_id: freshJob.targetGuardId ?? null,
          required_certifications: freshJob.requiredCertifications,
          min_guard_qualification: freshJob.minGuardQualification ?? 'pending',
          applicants: freshJob.applicants,
          break_minutes: freshJob.breakMinutes ?? 0,
          break_paid: freshJob.breakPaid !== false,
          shift_breaks: [],
          ...listingDetailDbColumns(freshJob),
          operational_details: operationalDetailsDbValue(freshJob.operationalDetails),
        });
        if (error) throw error;
      } catch (e) {
        console.error('Request insert error:', e);
        setRequests((prev) => prev.filter((r) => r.id !== freshJob.id));
        if (currentUser?.id) {
          setClients((prev) =>
            prev.map((c) =>
              c.id === currentUser.id
                ? { ...c, totalRequests: Math.max(0, c.totalRequests - 1) }
                : c
            )
          );
        }
        showAppToast('Could not post your job. Please try again.', { tone: 'error' });
        return;
      }
    }

    if (initialStatus === 'open') {
      showAppToast('Job posted — complete payment when ready to publish on the marketplace.', { tone: 'success' });
      if (clientRecord && currentUser) {
        void issueClientJobInvoice(freshJob, clientRecord, currentUser, { notify: false });
      }
    } else if (clientIsTrusted && !coordsReady) {
      showAppToast(
        'Job submitted for staff review — map coordinates are required before it can go live.',
        { tone: 'info' }
      );
    } else {
      showAppToast('Job posted — pending Guardr review.', { tone: 'success' });
    }
    void writeAuditLog(currentUser, 'job_posted', 'security_request', freshJob.id, { status: initialStatus });
  };

  const handleStaffCreateJob = async (input: StaffCreateJobInput): Promise<string> => {
    if (!currentUser || !canManageCompanyOperations(currentUser)) {
      throw new Error('Only directors can create jobs for clients.');
    }
    const scheduleError = validateShiftSchedule(input.startDate, input.endDate);
    if (scheduleError) {
      throw new Error(scheduleError);
    }
    const clientRecord = clients.find((c) => c.id === input.clientId);
    if (!clientRecord) {
      throw new Error('Client not found.');
    }
    if (input.assignGuardId) {
      const guard = guards.find((g) => g.id === input.assignGuardId);
      if (!guard) throw new Error('Guard not found.');
      const userStatus = getGuardUserStatus(guard);
      if (userStatus === 'pending') {
        throw new Error(`${guard.name} cannot pick up this job — account is pending approval.`);
      }
      if (userStatus === 'suspended' || userStatus === 'blocked') {
        throw new Error(`${guard.name} cannot pick up this job — account is ${userStatus}.`);
      }
      if (!guardHasWorkedWithClient(input.assignGuardId, input.clientId, requests)) {
        throw new Error(
          `${guard.name} has not worked with this client before. Leave the job open for applications — Guardr will approve the best fit.`
        );
      }
    }

    const clientName = clientRecord.companyName || clientRecord.name;
    const clientLogo = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
    const siteName = input.siteName || '';
    const address = input.address;
    const location = siteName ? `${siteName} — ${address}` : address;
    const assignedGuardId = input.assignGuardId ?? null;

    const resolvedCoords = await resolveJobMapCoordinates({
      latitude: input.latitude,
      longitude: input.longitude,
      siteName,
      address,
      state: formatCityLabel(input.state) || resolveJobCity(input.state),
      location,
    });
    const latitude = resolvedCoords.latitude ?? input.latitude;
    const longitude = resolvedCoords.longitude ?? input.longitude;
    if (!hasJobCoordinates({ latitude, longitude })) {
      throw new Error(
        'Map coordinates are required before this job can go live. Use current location or enter latitude and longitude.'
      );
    }

    const status: SecurityRequest['status'] = assignedGuardId ? 'accepted' : 'open';
    const jobState = formatCityLabel(input.state) || resolveJobCity(input.state);

    let linkedJobLocationId: string | undefined;
    try {
      const ensured = ensureSharedJobLocation(jobLocations, {
        name: siteName || address,
        address,
        state: jobState,
        latitude,
        longitude,
        siteInstructions: input.siteInstructions || input.description,
        parkingInstructions: input.parkingInstructions,
        accessInstructions: input.accessInstructions,
        createdByClientId: clientRecord.id,
        preferredStatus: 'active',
      });
      setJobLocations(ensured.locations);
      linkedJobLocationId = ensured.location.id;
      if (isDbConnected) {
        const { error: locErr } = await supabase
          .from('job_locations')
          .upsert(jobLocationToDbRow(ensured.location));
        if (locErr && locErr.code !== '42P01') {
          console.warn('Job location upsert on staff create:', locErr);
        }
      }
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error('Could not link shared job location on staff create.');
    }

    const freshJob: SecurityRequest = {
      id: `req-${Date.now()}`,
      title: input.title,
      description: input.description || 'General security coverage.',
      clientId: clientRecord.id,
      clientName,
      clientLogo,
      clientRating: clientRecord.rating,
      siteName,
      address,
      state: jobState,
      location,
      type: input.type,
      armedRequired: false,
      guardsNeeded: input.guardsNeeded,
      uniformRequirements: input.uniformRequirements || '',
      equipmentRequirements: input.equipmentRequirements || '',
      siteInstructions: input.siteInstructions || input.description || '',
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      parkingInstructions: input.parkingInstructions,
      accessInstructions: input.accessInstructions,
      latitude,
      longitude,
      operationalDetails: normalizeJobOperationalDetails(input.operationalDetails),
      startDate: input.startDate,
      endDate: input.endDate,
      jobLocationId: linkedJobLocationId,
      durationHours: input.durationHours,
      hourlyRate: input.hourlyRate,
      guardPay: input.guardPay,
      platformFeePerHour: resolvePlatformFeePerHour(
        input.hourlyRate,
        feeConfigForClientJob(platformSettings, clientRecord.clientType, input.type)
      ),
      estimatedPayout: input.estimatedPayout,
      status,
      paymentStatus: 'unpaid',
      assignedGuardId,
      requestType: assignedGuardId ? 'direct' : 'marketplace',
      targetGuardId: assignedGuardId,
      requiredCertifications: [],
      minGuardQualification: 'pending',
      applicants: assignedGuardId ? [assignedGuardId] : [],
      breakMinutes: input.breakMinutes ?? 0,
      breakPaid: input.breakPaid !== false,
    };

    setRequests((prev) => [freshJob, ...prev]);
    setClients((prev) =>
      prev.map((c) => (c.id === clientRecord.id ? { ...c, totalRequests: c.totalRequests + 1 } : c))
    );

    if (assignedGuardId && currentUser) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        guardId: assignedGuardId,
        requestId: freshJob.id,
        location: freshJob.location,
        body: `Staff assigned you to "${freshJob.title}".`,
      });
    }

    if (currentUser && isJobLocationCoordsMissing(freshJob)) {
      void reportPushEvent(currentUser, {
        type: 'job_submitted',
        requestId: freshJob.id,
        title: 'Map coordinates missing',
        location: freshJob.location,
        body: `Staff-created job "${freshJob.title}" needs latitude and longitude.`,
      });
    }

    if (isDbConnected) {
      try {
        await supabase.from('clients').update({ total_requests: clientRecord.totalRequests + 1 }).eq('id', clientRecord.id);
        await supabase.from('security_requests').insert({
          id: freshJob.id,
          title: freshJob.title,
          description: freshJob.description,
          client_id: freshJob.clientId,
          client_name: freshJob.clientName,
          client_logo: freshJob.clientLogo,
          site_name: freshJob.siteName,
          address: freshJob.address,
          state: freshJob.state ?? '',
          location: freshJob.location,
          type: freshJob.type,
          armed_required: freshJob.armedRequired,
          guards_needed: freshJob.guardsNeeded,
          uniform_requirements: freshJob.uniformRequirements,
          equipment_requirements: freshJob.equipmentRequirements,
          site_instructions: freshJob.siteInstructions,
          start_date: freshJob.startDate,
          end_date: freshJob.endDate,
          duration_hours: freshJob.durationHours,
          hourly_rate: freshJob.hourlyRate,
          guard_pay: freshJob.guardPay,
          platform_fee_per_hour: freshJob.platformFeePerHour,
          estimated_payout: freshJob.estimatedPayout,
          status: freshJob.status,
          payment_status: 'unpaid',
          assigned_guard_id: freshJob.assignedGuardId,
          request_type: freshJob.requestType ?? 'marketplace',
          target_guard_id: freshJob.targetGuardId ?? null,
          job_location_id: freshJob.jobLocationId ?? null,
          required_certifications: freshJob.requiredCertifications,
          min_guard_qualification: freshJob.minGuardQualification ?? 'pending',
          applicants: freshJob.applicants,
          break_minutes: freshJob.breakMinutes ?? 0,
          break_paid: freshJob.breakPaid !== false,
          shift_breaks: [],
          ...listingDetailDbColumns(freshJob),
          operational_details: operationalDetailsDbValue(freshJob.operationalDetails),
        });
      } catch (e) {
        console.error('Staff job insert error:', e);
      }
    }

    return freshJob.id;
  };

  const handleJobPaymentStatus = async (requestId: string, paymentStatus: PaymentStatus) => {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === requestId ? { ...r, paymentStatus } : r));
      setClientInvoices((invoices) => {
        const synced = syncInvoicePaymentStatus(invoices, next);
        saveClientInvoicesToStorage(synced);
        return synced;
      });
      return next;
    });
    if (isDbConnected) {
      await supabase.from('security_requests').update({ payment_status: paymentStatus }).eq('id', requestId);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: SecurityRequest['status']) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this item is not sent to the live queue.', 'info');
      return;
    }
    const req = requests.find(r => r.id === requestId);
    if (req && status === 'completed') {
      const blocked = guardClockOutBlockedMessage(req);
      if (blocked) {
        appToast(blocked, 'error');
        return;
      }
    }
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      if (status === 'completed' && r.assignedGuardId) {
        setGuards(pg => pg.map(g => g.id === r.assignedGuardId ? { ...g, jobsCompleted: g.jobsCompleted + 1 } : g));
      }
      const paymentStatus =
        status === 'completed' && r.paymentStatus === 'paid' ? 'held' as const : r.paymentStatus;
      return { ...r, status, paymentStatus };
    }));
    if (isDbConnected) {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed' && req?.paymentStatus === 'paid') {
        updates.payment_status = 'held';
      }
      await supabase.from('security_requests').update(updates).eq('id', requestId);
    }
    if (status === 'completed' && req && currentUser) {
      notifyJobStatusUpdate(
        currentUser,
        req,
        'Shift completed',
        `"${req.title}" was marked completed.`
      );
    }
    if (status === 'completed' && req?.paymentStatus === 'paid' && !isCashClientPayment(req)) {
      try {
        await holdJobPayment(requestId);
        setPayments(prev => prev.map(p =>
          p.jobId === requestId && p.status === 'paid' ? { ...p, status: 'held' } : p
        ));
      } catch (e) {
        console.error('Hold payment error:', e);
      }
    }
  };

  const applyClientPaidCash = async (_requestId: string, _req: SecurityRequest) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleClientRequestCashPayment = async (_requestId: string) => {
    appToast('Cash payments are not supported. Pay by card via Stripe.', 'error');
  };

  const handleApproveClientCashPayment = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleRejectClientCashPayment = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleMarkClientPaidCash = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const applyOvertimeClientPaid = async (
    requestId: string,
    req: SecurityRequest,
    method: 'cash' | 'stripe',
    paymentRecord?: Payment
  ) => {
    // Cash product path removed — always record Stripe.
    method = 'stripe';
    if (paymentRecord?.paymentMethod === 'cash') {
      paymentRecord = { ...paymentRecord, paymentMethod: 'stripe' };
    }
    const billing = applyOvertimePaidBilling(req);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              ...billing,
              overtimeClientPaymentMethod: method,
              overtimeClientCashPaymentRequested: false,
              overtimeClientCashPaymentRequestedAt: undefined,
            }
          : r
      )
    );
    if (paymentRecord) {
      setPayments((prev) => [...prev, paymentRecord]);
    }
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          duration_hours: billing.durationHours,
          estimated_payout: billing.estimatedPayout,
          overtime_status: billing.overtimeStatus,
          overtime_payment_status: billing.overtimePaymentStatus,
          overtime_client_payment_method: method,
          overtime_client_cash_payment_requested: false,
          overtime_client_cash_payment_requested_at: null,
        })
        .eq('id', requestId);
      if (paymentRecord) {
        await supabase.from('payments').insert({
          id: paymentRecord.id,
          job_id: requestId,
          amount: paymentRecord.amount,
          status: paymentRecord.status,
          payment_method: paymentRecord.paymentMethod,
        });
      }
    }
    if (currentUser && req.assignedGuardId) {
      notifyAccountUpdate(
        currentUser,
        req.assignedGuardId,
        'Overtime payment received',
        `Client overtime payment for "${req.title}" was recorded. Guard pay will be released when eligible.`
      );
    }
  };

  const handleGuardApproveOvertime = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.overtimeStatus !== 'pending_guard') {
      appToast('This overtime request cannot be approved right now.', 'error');
      return;
    }
    const approvedAt = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, overtimeGuardApprovedAt: approvedAt, overtimeStatus: 'pending_client' as const }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          overtime_guard_approved_at: approvedAt,
          overtime_status: 'pending_client',
        })
        .eq('id', requestId);
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        location: req.location,
        body: `Guard approved ${req.overtimeHours ?? 0}h overtime on "${req.title}" — client approval required.`,
      });
      if (req.clientId) {
        notifyAccountUpdate(
          currentUser,
          req.clientId,
          'Overtime approval needed',
          `Guard approved ${req.overtimeHours ?? 0}h overtime on "${req.title}" — approve in your jobs list.`
        );
      }
    }
    appToast('Overtime submitted for client approval.', 'success');
  };

  const handleClientApproveOvertime = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.overtimeStatus !== 'pending_client') {
      appToast('This overtime request cannot be approved right now.', 'error');
      return;
    }
    const approvedAt = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, overtimeClientApprovedAt: approvedAt, overtimeStatus: 'awaiting_payment' as const }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          overtime_client_approved_at: approvedAt,
          overtime_status: 'awaiting_payment',
        })
        .eq('id', requestId);
    }
    appToast('Overtime approved. Pay the difference to settle the bill.', 'success');
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        body: `${req.clientName} approved the overtime charge of $${(req.overtimeAmount ?? 0).toFixed(2)} for "${req.title}". Payment pending.`,
      });
    }
  };

  const handleClientDisputeOvertime = async (requestId: string, input: OvertimeDisputeInput) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const trimmed = input.reason.trim();
    if (!trimmed) {
      appToast('Please explain why you are disputing this charge.', 'error');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.overtimeStatus !== 'pending_client') {
      appToast('This overtime charge cannot be disputed right now.', 'error');
      return;
    }
    const clockOutError = validateDisputeClaimedClockOut(input.claimedClockOutAt, req);
    if (clockOutError) {
      appToast(clockOutError, 'error');
      return;
    }
    const disputedAt = new Date().toISOString();
    const originalHours = req.overtimeHours ?? 0;
    const originalAmount = req.overtimeAmount ?? 0;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              overtimeStatus: 'disputed' as const,
              overtimeDisputeReason: trimmed,
              overtimeDisputedAt: disputedAt,
              overtimeDisputeClaimedClockOutAt: input.claimedClockOutAt,
              overtimeOriginalHours: originalHours,
              overtimeOriginalAmount: originalAmount,
            }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          overtime_status: 'disputed',
          overtime_dispute_reason: trimmed,
          overtime_disputed_at: disputedAt,
          overtime_dispute_claimed_clock_out_at: input.claimedClockOutAt,
          overtime_original_hours: originalHours,
          overtime_original_amount: originalAmount,
        })
        .eq('id', requestId);
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        location: req.location,
        body: `Client disputed $${originalAmount.toFixed(2)} late clock-out charge on "${req.title}".`,
      });
    }
    appToast('Dispute submitted. Staff will review the evidence and update the charge.', 'success');
  };

  const handleStaffResolveOvertimeDispute = async (
    requestId: string,
    action: 'waive' | 'uphold' | 'adjust',
    options?: { adjustedHours?: number; resolutionNote?: string }
  ) => {
    if (!currentUser || !isStaffRole(currentUser.role)) {
      appToast('You do not have permission to resolve disputes.', 'error');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.overtimeStatus !== 'disputed') {
      appToast('This overtime dispute cannot be resolved right now.', 'error');
      return;
    }

    const resolvedAt = new Date().toISOString();
    const resolutionNote =
      options?.resolutionNote?.trim() ||
      (action === 'waive' ? 'Charge waived' : action === 'uphold' ? 'Original charge upheld' : 'Charge adjusted');

    let patch: Partial<SecurityRequest>;
    const dbUpdate: Record<string, unknown> = {
      overtime_dispute_resolved_at: resolvedAt,
      overtime_dispute_resolution: resolutionNote,
    };

    if (action === 'waive') {
      patch = {
        overtimeStatus: 'waived',
        overtimeHours: 0,
        overtimeAmount: 0,
        overtimeDisputeResolvedAt: resolvedAt,
        overtimeDisputeResolution: resolutionNote,
      };
      Object.assign(dbUpdate, {
        overtime_status: 'waived',
        overtime_hours: 0,
        overtime_amount: 0,
      });
    } else if (action === 'uphold') {
      const hours = req.overtimeOriginalHours ?? req.overtimeHours ?? 0;
      const amount = req.overtimeOriginalAmount ?? req.overtimeAmount ?? 0;
      patch = {
        overtimeStatus: 'awaiting_payment',
        overtimeHours: hours,
        overtimeAmount: amount,
        overtimeDisputeResolvedAt: resolvedAt,
        overtimeDisputeResolution: resolutionNote,
      };
      Object.assign(dbUpdate, {
        overtime_status: 'awaiting_payment',
        overtime_hours: hours,
        overtime_amount: amount,
      });
    } else {
      const hours = options?.adjustedHours;
      if (!hours || hours <= 0) {
        appToast('Enter valid adjusted overtime hours.', 'error');
        return;
      }
      const amount = computeOvertimeAmount(hours, req.hourlyRate, req.guardsNeeded ?? 1);
      patch = {
        overtimeStatus: 'awaiting_payment',
        overtimeHours: hours,
        overtimeAmount: amount,
        overtimeDisputeResolvedAt: resolvedAt,
        overtimeDisputeResolution: resolutionNote,
      };
      Object.assign(dbUpdate, {
        overtime_status: 'awaiting_payment',
        overtime_hours: hours,
        overtime_amount: amount,
      });
    }

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, ...patch } : r)));
    if (isDbConnected) {
      await supabase.from('security_requests').update(dbUpdate).eq('id', requestId);
    }

    const toastMessage =
      action === 'waive'
        ? 'Overtime charge waived.'
        : action === 'uphold'
          ? 'Original overtime charge upheld — client can pay.'
          : `Overtime adjusted to ${patch.overtimeHours}h ($${(patch.overtimeAmount ?? 0).toFixed(2)}).`;
    appToast(toastMessage, 'success');

    if (currentUser) {
      const resolutionBody =
        action === 'waive'
          ? `Overtime charge waived for "${req.title}". No additional payment required.`
          : action === 'uphold'
            ? `Overtime charge upheld for "${req.title}" — $${(req.overtimeAmount ?? 0).toFixed(2)} due.`
            : `Overtime adjusted to ${patch.overtimeHours}h ($${(patch.overtimeAmount ?? 0).toFixed(2)}) for "${req.title}".`;
      void reportPushEvent(currentUser, {
        type: 'dispute_update',
        requestId,
        clientId: req.clientId,
        guardId: req.assignedGuardId ?? undefined,
        title: 'Overtime dispute resolved',
        body: resolutionBody,
      });
    }
  };

  const handleClientRequestOvertimeCash = async (_requestId: string) => {
    appToast('Cash payments are not supported. Pay overtime by card via Stripe.', 'error');
  };

  const handleApproveOvertimeCashPayment = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleMarkOvertimePaidCash = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleMakeOvertimeGuardPayoutAvailable = async (requestId: string) => {
    if (!currentUser || !canRecordCashPayments(currentUser)) {
      appToast('Only Directors and Founders can release overtime guard pay.', 'error');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canMakeOvertimeGuardPayoutAvailable(req)) {
      appToast('Overtime guard pay is not ready to release.', 'error');
      return;
    }
    const amount = overtimeGuardEarnings(req);
    if (!(await showAppConfirm({
      title: 'Release overtime guard pay?',
      message: `Make $${amount.toFixed(2)} available for overtime on "${req.title}"? The guard can collect via Pay after client overtime is paid.`,
      confirmLabel: 'Make available',
    }))) return;

    const releasedAt = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, overtimeGuardPayoutAvailable: true, overtimeGuardPayoutAvailableAt: releasedAt }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          overtime_guard_payout_available: true,
          overtime_guard_payout_available_at: releasedAt,
        })
        .eq('id', requestId);
    }
    appToast(`$${amount.toFixed(2)} overtime pay is available for the guard.`, 'success');
    if (currentUser && req.assignedGuardId) {
      notifyPayoutReady(currentUser, req.assignedGuardId, requestId, amount, req.title);
    }
  };

  const handleMarkOvertimeGuardPaidCash = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleUpdatePlatformSettings = async (next: PlatformSettings) => {
    if (!currentUser || !canManagePlatformSettings(currentUser)) {
      appToast('Only the Founder can change platform settings.', 'error');
      return;
    }
    const normalized = normalizePlatformSettings(next);
    if (!normalized) {
      appToast('Enable at least one payment method.', 'error');
      return;
    }
    setPlatformSettings(normalized);
    setStaffRolePermissionOverrides(normalized.staffRolePermissions);
    savePlatformSettingsToStorage(normalized);
    if (isDbConnected) {
      await supabase.from('platform_settings').upsert(platformSettingsToDbRow(normalized));
    }
    appToast('Platform settings saved.', 'success');
  };

  const handleUpdateClientCredentialRules = async (
    rules: import('./lib/clientCredentialCatalog').ClientCredentialRuleOverride[]
  ) => {
    if (!currentUser || !isExecutiveOpsRole(currentUser.role)) {
      appToast('Manager access or above is required to edit the client credential library.', 'error');
      return;
    }
    const next = normalizePlatformSettings({
      ...platformSettings,
      clientCredentialRules: rules,
      updatedAt: new Date().toISOString(),
    });
    if (!next) {
      appToast('Unable to save credential library.', 'error');
      return;
    }
    setPlatformSettings(next);
    savePlatformSettingsToStorage(next);
    if (isDbConnected) {
      const row = platformSettingsToDbRow(next);
      let { error } = await supabase.from('platform_settings').upsert(row);
      if (error && /client_credential_rules/i.test(error.message ?? '')) {
        const { client_credential_rules: _ignored, ...withoutRules } = row as typeof row & {
          client_credential_rules?: unknown;
        };
        ({ error } = await supabase.from('platform_settings').upsert(withoutRules));
      }
      if (error) {
        console.error('Client credential library save error:', error);
        const needsMigration = /client_credential_rules/i.test(error.message ?? '');
        appToast(
          needsMigration
            ? 'Could not save credential library — run the latest platform_settings migration in Supabase (client_credential_rules column).'
            : 'Could not save credential library to the database.',
          'error',
        );
        return;
      }
    }
    appToast('Client credential library saved.', 'success');
  };

  const handleUpdateStaffPermissions = async (patch: StaffPermissionsPatch) => {
    if (!currentUser || !canManageStaffPermissions(currentUser)) {
      appToast('Manager access or above is required to change permissions.', 'error');
      return;
    }
    const next = normalizePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    if (!next) {
      appToast('Unable to save permissions.', 'error');
      return;
    }
    setPlatformSettings(next);
    setStaffRolePermissionOverrides(next.staffRolePermissions);
    savePlatformSettingsToStorage(next);
    if (isDbConnected) {
      await supabase.from('platform_settings').upsert(platformSettingsToDbRow(next));
    }
    appToast('Permissions saved.', 'success');
  };

  const handleUpdatePublicInformation = async (
    patch: Pick<
      PlatformSettings,
      'ownerMessage' | 'directorMessage' | 'ownerMessageUpdatedAt' | 'directorMessageUpdatedAt'
    >
  ) => {
    if (!currentUser || !isStaffRole(currentUser.role)) return;
    if (patch.ownerMessage !== undefined && currentUser.role !== 'owner') {
      appToast('Only the Founder can edit the Founder message.', 'error');
      return;
    }
    if (
      patch.directorMessage !== undefined &&
      currentUser.role !== 'owner' &&
      currentUser.role !== 'director'
    ) {
      appToast('Only the Director or Founder can edit the Director message.', 'error');
      return;
    }
    const next = normalizePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    if (!next) {
      appToast('Unable to save public information.', 'error');
      return;
    }
    setPlatformSettings(next);
    savePlatformSettingsToStorage(next);
    if (isDbConnected) {
      await supabase.from('platform_settings').upsert(platformSettingsToDbRow(next));
    }
    appToast('Public information saved.', 'success');
  };

  const handleUpdateStaffIntegrations = async (
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
  ) => {
    if (!currentUser || !canManageStaffPlatformContent(currentUser)) {
      appToast('Manager access or above is required to change integrations.', 'error');
      return;
    }
    const next = normalizePlatformSettings({
      ...platformSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    if (!next) {
      appToast('Enable at least one payment method.', 'error');
      return;
    }
    setPlatformSettings(next);
    savePlatformSettingsToStorage(next);
    if (isDbConnected) {
      await supabase.from('platform_settings').upsert(platformSettingsToDbRow(next));
    }
    appToast('Integrations saved.', 'success');
  };

  const handleSaveCompanyPublicDocument = async (doc: CompanyPublicDocument) => {
    if (!currentUser || !canManageStaffPlatformContent(currentUser)) {
      appToast('Manager access or above is required to edit company placard credentials.', 'error');
      return;
    }
    const row = companyPublicDocumentToDbRow({
      ...doc,
      uploadedBy: doc.uploadedBy ?? currentUser.email,
      uploadedAt: doc.uploadedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setCompanyPublicDocuments((prev) => {
      const next = prev.filter((item) => item.documentType !== doc.documentType);
      next.push(companyPublicDocumentFromRow(row));
      return next.sort((a, b) => a.title.localeCompare(b.title));
    });
    if (isDbConnected) {
      const { error } = await supabase.from('company_public_documents').upsert(row);
      if (error) {
        appToast('Could not save company credential.', 'error');
        throw error;
      }
    }
  };

  const handleSetCompanyPlacardPublicEnabled = async (enabled: boolean) => {
    if (!currentUser || !canManageStaffPlatformContent(currentUser)) {
      appToast('Manager access or above is required to change the public placard.', 'error');
      return;
    }
    const next = {
      ...platformSettings,
      companyPlacardPublicEnabled: enabled,
      updatedAt: new Date().toISOString(),
    };
    const normalized = normalizePlatformSettings(next);
    if (!normalized) return;
    setPlatformSettings(normalized);
    savePlatformSettingsToStorage(normalized);
    if (isDbConnected) {
      await supabase.from('platform_settings').upsert(platformSettingsToDbRow(normalized));
    }
  };

  const handleMakeGuardPayoutAvailable = async (
    requestId: string,
    options?: { autoRelease?: boolean }
  ) => {
    if (!options?.autoRelease) {
      if (!currentUser || !canRecordCashPayments(currentUser)) {
        appToast('Only Directors and Founders can override payout holds.', 'error');
        return;
      }
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canMakeGuardPayoutAvailable(req)) {
      appToast('This job is not ready to release guard pay.', 'error');
      return;
    }
    if (!options?.autoRelease && !canStaffManuallyReleaseGuardPayout(req)) {
      appToast(
        'Guard pay auto-releases to Stripe Connect after the completion delay. Manual release is only for dispute holds.',
        'error'
      );
      return;
    }
    const amount = guardPayoutAmount(req);
    if (
      !options?.autoRelease &&
      !(await showAppConfirm({
        title: 'Release payout after dispute?',
        message: `Release $${amount.toFixed(2)} for "${req.title}" after resolving the dispute hold?`,
        confirmLabel: 'Release pay',
      }))
    ) {
      return;
    }

    const releasedAt = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, guardPayoutAvailable: true, guardPayoutAvailableAt: releasedAt }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          guard_payout_available: true,
          guard_payout_available_at: releasedAt,
        })
        .eq('id', requestId);
    }
    appToast(`$${amount.toFixed(2)} is now available for the guard to collect.`, 'success');
    if (currentUser && req.assignedGuardId) {
      notifyPayoutReady(currentUser, req.assignedGuardId, requestId, amount, req.title);
    }
  };

  const handleMarkGuardPaidCash = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleMarkPlatformFeePaidCash = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleMarkCashDepositManually = async (_requestId: string) => {
    appToast('Cash payments are not supported.', 'error');
  };

  const handleAddReview = async (
    requestId: string,
    rating: number,
    reviewText: string,
    tipCents?: number
  ): Promise<string | void> => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ratingGiven: rating, reviewText } : r));
    const req = requests.find(r => r.id === requestId);
    if (req?.assignedGuardId) {
      const allRatings = requests
        .filter(r => r.assignedGuardId === req.assignedGuardId && r.ratingGiven !== undefined)
        .map(r => r.ratingGiven!).concat(rating);
      const avg = Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1));
      setGuards(prev => prev.map(g => g.id === req.assignedGuardId ? { ...g, rating: avg } : g));
      if (isDbConnected) {
        await supabase.from('security_requests').update({ rating_given: rating, review_text: reviewText }).eq('id', requestId);
        await supabase.from('guards').update({ rating: avg }).eq('id', req.assignedGuardId);
      }
      if (currentUser) {
        notifyAccountUpdate(
          currentUser,
          req.assignedGuardId,
          'New customer review',
          `You received a ${rating}-star review on "${req.title}".`
        );
      }
    }

    if (tipCents && tipCents >= 100 && req && currentUser?.email && clientPaymentGatesMemo.allowStripe) {
      const guard = guards.find((g) => g.id === req.assignedGuardId);
      if (guard?.stripeConnectAccountId) {
        const { url } = await createTipCheckoutSession({
          jobId: requestId,
          clientEmail: currentUser.email,
          jobTitle: req.title,
          amountCents: tipCents,
        });
        return url;
      }
    }
  };

  const handleReportClientViolation = async (requestId: string, input: ClientViolationReportInput) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req || !currentUser) return;

    const report = createClientViolationReport({
      target: input.target,
      category: input.category,
      description: input.description,
      reportedByClientId: currentUser.id,
      reportedByClientName: currentUser.name,
      guardId: input.guardId,
    });

    const nextReports = [...(req.clientViolationReports ?? []), report];
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, clientViolationReports: nextReports } : r))
    );

    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ client_violation_reports: nextReports })
        .eq('id', requestId);
    }

    const categoryLabel = clientViolationCategoryLabel(input.target, input.category);
    if (input.target === 'guard' && input.guardId) {
      notifyAccountUpdate(
        currentUser,
        input.guardId,
        'Performance violation reported',
        `A client reported "${categoryLabel}" on "${req.title}".`
      );
    }

    appToast(
      input.target === 'guard'
        ? 'Guard violation reported. Staff will review.'
        : 'Job violation reported for staff review.',
      'success'
    );
  };

  const issueClientJobInvoice = useCallback(
    async (
      job: SecurityRequest,
      client: Client,
      actor: SessionUser,
      options?: { notify?: boolean }
    ) => {
      if (job.status !== 'open') return null;
      if (job.paymentStatus && job.paymentStatus !== 'unpaid') return null;
      const invoice = createApprovedJobInvoice(job, client);
      setClientInvoices((prev) => {
        const next = upsertClientInvoice(prev, invoice);
        saveClientInvoicesToStorage(next);
        return next;
      });
      if (isDbConnected) {
        try {
          await persistClientInvoiceToDb(supabase, invoice);
        } catch (error) {
          console.warn('Client invoice persist error:', error);
        }
      }
      if (options?.notify !== false) {
        void reportPushEvent(actor, {
          type: 'client_invoice_ready',
          recipientUserId: job.clientId,
          requestId: job.id,
          title: 'Invoice ready',
          body: invoiceReadyNotificationBody(job, invoice),
          url: invoiceReadyNotificationUrl(job.id),
        });
      }
      return invoice;
    },
    [isDbConnected]
  );

  const handleApproveRequest = async (requestId: string) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this item is not sent to the live queue.', 'info');
      return;
    }
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to approve job requests.', 'error');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    const resolvedCoords = await resolveJobMapCoordinates(job);
    const mergedJob = {
      ...job,
      latitude: resolvedCoords.latitude ?? job.latitude,
      longitude: resolvedCoords.longitude ?? job.longitude,
    };
    const coordsBlocker = jobMapCoordsApprovalBlocker(mergedJob);
    if (coordsBlocker) {
      appToast(coordsBlocker, 'error');
      return;
    }
    const openedAt = new Date().toISOString();
    let linkedJobLocationId = job.jobLocationId;
    if ((job.address ?? '').trim().length >= 4) {
      try {
        const selectedClientLoc = job.clientLocationId
          ? clientLocations.find((l) => l.id === job.clientLocationId)
          : undefined;
        const ensured = ensureSharedJobLocation(jobLocations, {
          name: job.siteName || job.address,
          address: job.address,
          state: job.state,
          latitude: mergedJob.latitude,
          longitude: mergedJob.longitude,
          riskLevel: job.locationRiskLevel,
          siteInstructions: job.siteInstructions || job.description,
          parkingInstructions: job.parkingInstructions,
          accessInstructions: job.accessInstructions,
          createdByClientId: job.clientId,
          preferredStatus: 'active',
          listed: selectedClientLoc?.listed !== false,
        });
        setJobLocations(ensured.locations);
        linkedJobLocationId = ensured.location.id;
        if (isDbConnected) {
          const { error: locErr } = await supabase
            .from('job_locations')
            .upsert(jobLocationToDbRow(ensured.location));
          if (locErr && locErr.code !== '42P01') {
            console.warn('Job location upsert on approve:', locErr);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not add job location.';
        appToast(message, 'error');
        return;
      }
    }

    const patch = {
      status: 'open' as const,
      openedAt,
      latitude: mergedJob.latitude,
      longitude: mergedJob.longitude,
      jobLocationId: linkedJobLocationId,
    };
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...patch } : r));
    if (isDbConnected) {
      await supabase.from('security_requests').update({
        status: 'open',
        opened_at: openedAt,
        latitude: mergedJob.latitude,
        longitude: mergedJob.longitude,
        job_location_id: linkedJobLocationId ?? null,
      }).eq('id', requestId);
    }
    if (job) {
      void writeAuditLog(currentUser, 'job_approved', 'security_request', requestId, {
        title: job.title,
        clientName: job.clientName,
      });
      void reportPushEvent(currentUser, {
        type: 'support_ticket_status',
        recipientUserId: job.clientId,
        requestId,
        title: 'Job approved',
        body: `"${job.title}" was approved and is ready for payment.`,
      });
      const approvedJob: SecurityRequest = { ...mergedJob, ...patch };
      const client = clients.find((c) => c.id === job.clientId);
      if (client) {
        void issueClientJobInvoice(approvedJob, client, currentUser);
      }
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this item is not sent to the live queue.', 'info');
      return;
    }
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to decline job requests.', 'error');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
    if (job) {
      void writeAuditLog(currentUser, 'job_denied', 'security_request', requestId, {
        title: job.title,
        clientName: job.clientName,
      });
      void reportPushEvent(currentUser, {
        type: 'job_status_update',
        recipientUserId: job.clientId,
        requestId,
        title: 'Job declined',
        body: `Guardr staff declined "${job.title}". Contact support if you need to revise and resubmit.`,
      });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this item is not sent to the live queue.', 'info');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (existing && !canClientEditRequest(existing)) {
      appToast('Paid or in-progress jobs cannot be cancelled from here. Contact staff for help.', 'error');
      return;
    }
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
    if (currentUser && existing) {
      notifyJobStatusUpdate(
        currentUser,
        existing,
        'Job cancelled',
        `"${existing.title}" was cancelled.`
      );
    }
  };

  const dispatchScheduleChangeNotifications = (
    actor: SessionUser,
    previous: SecurityRequest,
    updated: SecurityRequest
  ) => {
    const oldRange = formatShiftRange(previous.startDate, previous.endDate);
    const newRange = formatShiftRange(updated.startDate, updated.endDate);

    if (updated.status === 'open') {
      void reportPushEvent(actor, {
        type: 'assignment',
        requestId: updated.id,
        location: updated.location,
        body: `New shift: ${updated.title} — ${newRange}`,
      });
      return;
    }

    for (const guardId of guardsToNotifyForScheduleChange(updated)) {
      void reportPushEvent(actor, {
        type: 'job_schedule_changed',
        recipientUserId: guardId,
        requestId: updated.id,
        body: `Your job time has changed from ${oldRange} to ${newRange}`,
      });
    }

    if (updated.clientId) {
      void reportPushEvent(actor, {
        type: 'job_status_update',
        requestId: updated.id,
        clientId: updated.clientId,
        title: 'Shift time updated',
        body: `"${updated.title}" is now scheduled for ${newRange}.`,
      });
    }
  };

  const applyApprovedScheduleChange = async (
    requestId: string,
    existing: SecurityRequest,
    change: {
      startDate: string;
      endDate: string;
      durationHours: number;
      estimatedPayout?: number;
      guardPay?: number;
    }
  ) => {
    const guardsNeeded = existing.guardsNeeded ?? 1;
    const billing = rebillJobFromSnapshot(existing, {
      durationHours: change.durationHours,
      guardsNeeded,
    });
    const estimatedPayout = change.estimatedPayout ?? billing.estimatedPayout;
    const guardPay = change.guardPay ?? billing.guardPay;

    const merged: SecurityRequest = {
      ...existing,
      startDate: change.startDate,
      endDate: change.endDate,
      durationHours: change.durationHours,
      estimatedPayout,
      guardPay,
      ...clearScheduleChangePending(),
    };

    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update({
          start_date: merged.startDate,
          end_date: merged.endDate,
          duration_hours: merged.durationHours,
          estimated_payout: merged.estimatedPayout,
          guard_pay: merged.guardPay,
          ...scheduleChangePendingDbColumns(merged),
        })
        .eq('id', requestId);
      if (error) {
        console.error('Schedule change apply error:', error);
        appToast(`Could not apply schedule change: ${error.message}`, 'error');
        throw new Error(error.message);
      }
    }

    setRequests((prev) => prev.map((r) => (r.id === requestId ? merged : r)));
    if (currentUser) {
      dispatchScheduleChangeNotifications(currentUser, existing, merged);
    }
    return merged;
  };

  const persistJobListingUpdate = async (requestId: string, existing: SecurityRequest, raw: Partial<SecurityRequest>) => {
    const safe = sanitizeJobListingUpdates(existing, raw);
    const siteName = safe.siteName ?? existing.siteName ?? '';
    const address = safe.address ?? existing.address ?? existing.location;
    const startDate = safe.startDate ?? existing.startDate;
    const endDate = safe.endDate ?? existing.endDate;
    const hourlyRate = safe.hourlyRate ?? existing.hourlyRate;
    const durationHours = safe.durationHours ?? computeDurationHours(startDate, endDate);
    const location = safe.location ?? buildLocationLabel(siteName, address);
    const state = safe.state?.toUpperCase() ?? existing.state;
    const status = !isJobPaid(existing) && existing.status === 'open' ? 'open' : existing.status;

    const merged = mergeJobListingUpdates(existing, safe, {
      siteName,
      address,
      startDate,
      endDate,
      durationHours,
      hourlyRate,
      location,
      state,
      status,
    });

    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update(buildJobListingDbPayload(merged))
        .eq('id', requestId);
      if (error) {
        console.error('Job listing update error:', error);
        appToast(`Could not save job changes: ${error.message}`, 'error');
        throw new Error(error.message);
      }
    }

    setRequests((prev) => prev.map((r) => (r.id === requestId ? merged : r)));

    if (
      currentUser &&
      jobHasAssignedOrOnDutyGuards(merged) &&
      hasOperationalListingChange(existing, merged)
    ) {
      notifyAssignedGuards(
        currentUser,
        merged,
        'Job details updated',
        `Details were updated for "${merged.title}" — review the site briefing before your shift.`
      );
    }

    if (
      currentUser &&
      merged.status === 'open' &&
      hasScheduleDateChange(existing, merged.startDate, merged.endDate)
    ) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        requestId: merged.id,
        location: merged.location,
        body: `New shift: ${merged.title} — ${formatShiftRange(merged.startDate, merged.endDate)}`,
      });
    }

    return merged;
  };

  const submitPendingScheduleChange = async (
    requestId: string,
    baseJob: SecurityRequest,
    change: {
      startDate: string;
      endDate: string;
      durationHours: number;
      estimatedPayout?: number;
    },
    options: {
      status: 'pending_staff' | 'pending_client';
      requestedBy: 'client' | 'staff';
    }
  ) => {
    const requestedAt = new Date().toISOString();
    const extraAmount = computeScheduleChangeExtraAmount(
      baseJob,
      change.durationHours,
      change.estimatedPayout
    );
    const pendingJob: SecurityRequest = {
      ...baseJob,
      pendingStartDate: change.startDate,
      pendingEndDate: change.endDate,
      pendingDurationHours: change.durationHours,
      pendingEstimatedPayout: change.estimatedPayout,
      scheduleChangeStatus: options.status,
      scheduleChangeRequestedAt: requestedAt,
      scheduleChangeRequestedBy: options.requestedBy,
      scheduleChangeExtraAmount: extraAmount > 0 ? extraAmount : undefined,
    };
    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update(scheduleChangePendingDbColumns(pendingJob))
        .eq('id', requestId);
      if (error) {
        appToast(`Could not submit schedule change: ${error.message}`, 'error');
        throw new Error(error.message);
      }
    }
    setRequests((prev) => prev.map((r) => (r.id === requestId ? pendingJob : r)));
    return pendingJob;
  };

  const processScheduleChangeResolution = async (
    requestId: string,
    existing: SecurityRequest,
    approver: 'staff' | 'client'
  ) => {
    const pending = pendingScheduleChangeFromJob(existing);
    if (!pending) {
      appToast('Pending schedule data is incomplete.', 'error');
      return;
    }

    const resolution = resolveScheduleChangeAfterApproval(existing, approver);

    if (resolution.action === 'apply') {
      await applyApprovedScheduleChange(requestId, existing, pending);
      return 'applied' as const;
    }

    const nextJob: SecurityRequest = {
      ...existing,
      scheduleChangeStatus:
        resolution.action === 'awaiting_payment' ? 'awaiting_payment' : 'pending_staff_billing',
      scheduleChangeExtraAmount: resolution.extraAmount,
    };

    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update(scheduleChangePendingDbColumns(nextJob))
        .eq('id', requestId);
      if (error) {
        appToast(`Could not update schedule change: ${error.message}`, 'error');
        throw new Error(error.message);
      }
    }
    setRequests((prev) => prev.map((r) => (r.id === requestId ? nextJob : r)));

    if (currentUser) {
      if (resolution.action === 'awaiting_payment') {
        void reportPushEvent(currentUser, {
          type: 'support_ticket_status',
          recipientUserId: existing.clientId,
          title: 'Schedule change approved — payment due',
          body: `Pay $${resolution.extraAmount.toFixed(2)} to update "${existing.title}" to ${formatShiftRange(pending.startDate, pending.endDate)}.`,
        });
      } else {
        void reportPushEvent(currentUser, {
          type: 'payment_attention',
          requestId,
          location: existing.location,
          body: `Client approved schedule change for "${existing.title}" — confirm billing before times go live.`,
        });
      }
    }

    return resolution.action;
  };

  const handleEditRequest = async (requestId: string, updates: Partial<SecurityRequest>) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this item is not sent to the live queue.', 'info');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !canClientEditJobListing(existing)) {
      appToast(existing ? jobEditBlockedReason(existing) ?? 'This job cannot be edited.' : 'Job not found.', 'error');
      return;
    }

    const scheduleChange = isJobPaid(existing)
      ? resolveScheduleChangeFromUpdate(existing, updates)
      : null;

    if (scheduleChange) {
      if (!canClientReschedulePaidSchedule(existing)) {
        appToast('This job cannot be rescheduled right now.', 'error');
        return;
      }
      if (jobHasAssignedOrOnDutyGuards(existing) && !isJobPaid(existing)) {
        appToast('Payment must clear before changing times for assigned guards.', 'error');
        return;
      }
      const scheduleError = validateShiftSchedule(scheduleChange.startDate, scheduleChange.endDate);
      if (scheduleError) {
        appToast(scheduleError, 'error');
        return;
      }

      const listingOnly = sanitizeJobListingUpdates(existing, updates);
      const refreshed =
        Object.keys(listingOnly).length > 0
          ? await persistJobListingUpdate(requestId, existing, listingOnly)
          : existing;

      if (scheduleChangeRequiresStaffApproval(refreshed, scheduleChange.durationHours)) {
        await submitPendingScheduleChange(requestId, refreshed, scheduleChange, {
          status: 'pending_staff',
          requestedBy: 'client',
        });
        if (currentUser) {
          void reportPushEvent(currentUser, {
            type: 'payment_attention',
            requestId,
            location: refreshed.location,
            body: `${refreshed.clientName} requested a schedule change for "${refreshed.title}" (${formatShiftRange(scheduleChange.startDate, scheduleChange.endDate)})`,
          });
        }
        appToast('Schedule change submitted for staff approval.', 'info');
        return;
      }

      await applyApprovedScheduleChange(requestId, refreshed, scheduleChange);
      appToast('Shift times updated. Guards have been notified.', 'success');
      return;
    }

    if (!isJobPaid(existing)) {
      const startDate = updates.startDate || existing.startDate;
      const endDate = updates.endDate || existing.endDate;
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        appToast(scheduleError, 'error');
        return;
      }
    }
    await persistJobListingUpdate(requestId, existing, updates);
  };

  const handleApproveScheduleChange = async (requestId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to approve schedule changes.', 'error');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || existing.scheduleChangeStatus !== 'pending_staff') {
      appToast('No pending schedule change for this job.', 'error');
      return;
    }

    const outcome = await processScheduleChangeResolution(requestId, existing, 'staff');

    if (outcome === 'applied' && currentUser) {
      void writeAuditLog(currentUser, 'schedule_change_approved', 'security_request', requestId, {
        title: existing.title,
        outcome,
      });
      void reportPushEvent(currentUser, {
        type: 'support_ticket_status',
        recipientUserId: existing.clientId,
        title: 'Schedule change approved',
        body: `Guardr approved your new times for "${existing.title}". Guards have been notified.`,
      });
      appToast('Schedule change approved and guards notified.', 'success');
    } else if (outcome === 'awaiting_payment') {
      if (currentUser) {
        void writeAuditLog(currentUser, 'schedule_change_approved', 'security_request', requestId, {
          title: existing.title,
          outcome,
        });
      }
      appToast('Schedule change approved. Client must pay the extension before times go live.', 'success');
    } else if (outcome === 'pending_staff_billing') {
      if (currentUser) {
        void writeAuditLog(currentUser, 'schedule_change_approved', 'security_request', requestId, {
          title: existing.title,
          outcome,
        });
      }
      appToast('Schedule change awaiting billing confirmation.', 'success');
    }
  };

  const handleApproveScheduleChangeBilling = async (requestId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to confirm schedule billing.', 'error');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || existing.scheduleChangeStatus !== 'pending_staff_billing') {
      appToast('No schedule billing confirmation pending for this job.', 'error');
      return;
    }
    const pending = pendingScheduleChangeFromJob(existing);
    if (!pending) {
      appToast('Pending schedule data is incomplete.', 'error');
      return;
    }

    await applyApprovedScheduleChange(requestId, existing, pending);
    if (currentUser) {
      void writeAuditLog(currentUser, 'schedule_change_approved', 'security_request', requestId, {
        title: existing.title,
        outcome: 'billing_confirmed',
      });
      void reportPushEvent(currentUser, {
        type: 'support_ticket_status',
        recipientUserId: existing.clientId,
        title: 'Schedule change live',
        body: `Guardr confirmed billing and updated times for "${existing.title}".`,
      });
    }
    appToast('Schedule change confirmed and guards notified.', 'success');
  };

  const handleClientApproveScheduleChange = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || existing.scheduleChangeStatus !== 'pending_client') {
      appToast('This schedule change cannot be approved right now.', 'error');
      return;
    }

    const outcome = await processScheduleChangeResolution(requestId, existing, 'client');

    if (outcome === 'applied') {
      appToast('New shift times approved. Guards have been notified.', 'success');
    } else if (outcome === 'awaiting_payment') {
      appToast('Times approved. Pay the extension to update the listing.', 'success');
    } else if (outcome === 'pending_staff_billing') {
      appToast('Times approved. Guardr will confirm billing before guards are notified.', 'info');
    }
  };

  const handleClientRejectScheduleChange = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || existing.scheduleChangeStatus !== 'pending_client') {
      appToast('This schedule change cannot be declined right now.', 'error');
      return;
    }

    const cleared = { ...existing, ...clearScheduleChangePending() };
    setRequests((prev) => prev.map((r) => (r.id === requestId ? cleared : r)));
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update(scheduleChangePendingDbColumns(cleared))
        .eq('id', requestId);
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        location: existing.location,
        body: `Client declined Guardr's proposed schedule change for "${existing.title}".`,
      });
    }
    appToast('Schedule change declined.', 'info');
  };

  const handleRejectScheduleChange = async (requestId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to decline schedule changes.', 'error');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || existing.scheduleChangeStatus !== 'pending_staff') {
      appToast('No pending schedule change for this job.', 'error');
      return;
    }

    const cleared = { ...existing, ...clearScheduleChangePending() };
    setRequests((prev) => prev.map((r) => (r.id === requestId ? cleared : r)));
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update(scheduleChangePendingDbColumns(cleared))
        .eq('id', requestId);
    }
    if (currentUser) {
      void writeAuditLog(currentUser, 'schedule_change_rejected', 'security_request', requestId, {
        title: existing.title,
        clientName: existing.clientName,
      });
      void reportPushEvent(currentUser, {
        type: 'support_ticket_status',
        recipientUserId: existing.clientId,
        title: 'Schedule change declined',
        body: `Guardr declined the requested time change for "${existing.title}". Contact support if you need help.`,
      });
    }
    appToast('Schedule change declined.', 'info');
  };

  const handleStaffEditJobListing = async (requestId: string, updates: Partial<SecurityRequest>) => {
    if (!currentUser) return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) {
      appToast('Job not found.', 'error');
      return;
    }

    const canFullEdit =
      canEditJobListingDetails(currentUser) && canStaffEditJobTitleAndLocation(existing, currentUser.role);
    const canCoordsEdit = canStaffEditJobMapCoordinates(existing, currentUser.role);

    if (!canFullEdit && !canCoordsEdit) {
      appToast('You do not have permission to edit this job.', 'error');
      return;
    }

    if (!canFullEdit && canCoordsEdit) {
      const latitude = updates.latitude ?? existing.latitude;
      const longitude = updates.longitude ?? existing.longitude;
      if (!hasJobCoordinates({ latitude, longitude })) {
        appToast('Enter valid map coordinates before saving.', 'error');
        return;
      }
      await persistJobListingUpdate(requestId, existing, { latitude, longitude });
      appToast('Map coordinates saved.', 'success');
      return;
    }

    const scheduleChange = isJobPaid(existing)
      ? resolveScheduleChangeFromUpdate(existing, updates)
      : null;

    if (scheduleChange) {
      if (!canStaffReschedulePaidSchedule(existing)) {
        appToast('This job cannot be rescheduled right now.', 'error');
        return;
      }
      const scheduleError = validateShiftSchedule(scheduleChange.startDate, scheduleChange.endDate);
      if (scheduleError) {
        appToast(scheduleError, 'error');
        return;
      }

      const listingOnly = sanitizeJobListingUpdates(existing, updates);
      const refreshed =
        Object.keys(listingOnly).length > 0
          ? await persistJobListingUpdate(requestId, existing, listingOnly)
          : existing;

      await submitPendingScheduleChange(requestId, refreshed, scheduleChange, {
        status: 'pending_client',
        requestedBy: 'staff',
      });

      if (currentUser) {
        void reportPushEvent(currentUser, {
          type: 'support_ticket_status',
          recipientUserId: refreshed.clientId,
          title: 'Schedule change proposed',
          body: `Guardr proposed new times for "${refreshed.title}": ${formatShiftRange(scheduleChange.startDate, scheduleChange.endDate)}. Approve in your jobs list.`,
        });
      }
      appToast('Schedule change sent to client for approval.', 'success');
      return;
    }

    if (!isJobPaid(existing)) {
      const unpaidScheduleChange = resolveScheduleChangeFromUpdate(existing, updates);
      if (unpaidScheduleChange) {
        const scheduleError = validateShiftSchedule(
          unpaidScheduleChange.startDate,
          unpaidScheduleChange.endDate
        );
        if (scheduleError) {
          appToast(scheduleError, 'error');
          return;
        }
        const listingOnly = sanitizeJobListingUpdates(existing, updates);
        const refreshed =
          Object.keys(listingOnly).length > 0
            ? await persistJobListingUpdate(requestId, existing, listingOnly)
            : existing;
        await submitPendingScheduleChange(requestId, refreshed, unpaidScheduleChange, {
          status: 'pending_client',
          requestedBy: 'staff',
        });
        if (currentUser) {
          void reportPushEvent(currentUser, {
            type: 'support_ticket_status',
            recipientUserId: refreshed.clientId,
            title: 'Schedule change proposed',
            body: `Guardr proposed new times for "${refreshed.title}": ${formatShiftRange(unpaidScheduleChange.startDate, unpaidScheduleChange.endDate)}. Approve in your jobs list.`,
          });
        }
        appToast('Schedule change sent to client for approval.', 'success');
        return;
      }
      const startDate = updates.startDate || existing.startDate;
      const endDate = updates.endDate || existing.endDate;
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        appToast(scheduleError, 'error');
        return;
      }
    }
    await persistJobListingUpdate(requestId, existing, updates);
  };

  const assignGuardToJob = async (
    requestId: string,
    guardId: string,
    options?: { assignmentSource?: 'self' | 'client' | 'staff' }
  ): Promise<boolean> => {
    const job = requests.find((r) => r.id === requestId);
    const guard = guards.find((g) => g.id === guardId);
    if (!job) {
      appToast('Job not found. Please refresh and try again.', 'error');
      return false;
    }
    if (!guard) {
      appToast('Guard profile not found. Please refresh and try again.', 'error');
      return false;
    }
    // Client/staff machines often lack the guard's full credential blobs (RLS / image hydration).
    // Guards already passed apply-time checks when pending; trust that for client confirmation.
    const trustPriorApplication =
      options?.assignmentSource === 'client' ||
      options?.assignmentSource === 'staff' ||
      job.pendingGuardId === guardId ||
      job.applicants.includes(guardId);
    if (!trustPriorApplication) {
      const workBlocked = guardWorkBlockedMessage(guard, job.state);
      if (workBlocked) {
        appToast(workBlocked, 'error');
        return false;
      }
      // Availability is stored on the guard's device — never evaluate it on client/staff browsers.
      const { canAccept } = checkJobRequirements(guard, toGuardJobView(job, guard.id), requests, {
        skipAvailability: true,
      });
      if (!canAccept) {
        appToast(`${guard.name} does not meet the requirements for this job.`, 'error');
        return false;
      }
    }
    const scheduleBlocked = guardScheduleConflictError(guardId, job, requests, { guardName: guard.name });
    if (scheduleBlocked) {
      appToast(scheduleBlocked, 'error');
      return false;
    }
    const nextApplicants = [...new Set([...job.applicants, guardId])];
    const resolvedGuardPay = resolveGuardPayForJob(job, guard);
    const previousRequest = job;
    const acceptedJob: SecurityRequest = {
      ...job,
      status: 'accepted',
      assignedGuardId: guardId,
      pendingGuardId: undefined,
      staffApprovedGuardAt: undefined,
      applicants: nextApplicants,
      guardPay: resolvedGuardPay,
    };
    setRequests((prev) => prev.map((r) => (r.id === requestId ? acceptedJob : r)));
    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update({
          status: 'accepted',
          assigned_guard_id: guardId,
          pending_guard_id: null,
          staff_approved_guard_at: null,
          applicants: nextApplicants,
          guard_pay: resolvedGuardPay,
        })
        .eq('id', requestId);
      if (error) {
        console.error('assignGuardToJob update error:', error);
        setRequests((prev) => prev.map((r) => (r.id === requestId ? previousRequest : r)));
        appToast('Could not confirm guard. Please try again.', 'error');
        return false;
      }
    }
    if (currentUser && guardId !== currentUser.id) {
      const source = options?.assignmentSource ?? 'self';
      const guardBody =
        source === 'client'
          ? `The client approved you for "${job.title}".`
          : source === 'staff'
            ? `Staff assigned you to "${job.title}".`
            : `You picked up ${job.title}`;
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: guardId,
        requestId,
        location: job.location,
        body: guardBody,
      });
    }
    if (currentUser && job.clientId && job.clientId !== currentUser.id) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: job.clientId,
        requestId,
        guardId,
        guardName: guard.name,
        title: 'Guard confirmed',
        body: `${guard.name} is booked for "${job.title}".`,
      });
    }
    await ensureJobChatThread(acceptedJob);
    const client = clients.find((c) => c.id === job.clientId);
    if (client) {
      const agreement = buildJobServiceAgreement(acceptedJob, client, guard);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, serviceAgreement: agreement } : r))
      );
      if (isDbConnected) {
        await supabase
          .from('security_requests')
          .update({ service_agreement: agreement })
          .eq('id', requestId);
      }
    }
    return true;
  };

  const persistTeamJobUpdate = async (
    updatedJob: SecurityRequest,
    slots: JobGuardSlot[]
  ) => {
    const normalizedSlots = ensureSlotIds(updatedJob, slots);
    const nextJob = { ...updatedJob, guardSlots: normalizedSlots };
    setRequests((prev) =>
      prev.map((r) => (r.id === nextJob.id ? nextJob : r))
    );
    if (isDbConnected) {
      await persistJobGuardSlots(supabase, normalizedSlots);
      await persistJobSlotMeta(supabase, nextJob.id, {
        pendingGuardId: nextJob.pendingGuardId ?? null,
        staffApprovedGuardAt: nextJob.staffApprovedGuardAt,
        applicants: nextJob.applicants,
        status: nextJob.status,
        assignedGuardId: nextJob.assignedGuardId,
      });
    }
    return { job: nextJob, slots: normalizedSlots };
  };

  const finalizeTeamJobIfReady = async (job: SecurityRequest, slots: JobGuardSlot[]) => {
    if (!teamJobReadyForAcceptance(job, slots)) return;
    const leadId =
      slots.find((s) => s.isLead && s.guardId && s.status === 'approved')?.guardId ??
      slots.find((s) => s.status === 'approved' && s.guardId)?.guardId ??
      null;
    if (!leadId) return;
    const acceptedJob: SecurityRequest = {
      ...job,
      status: 'accepted',
      assignedGuardId: leadId,
      pendingGuardId: undefined,
      staffApprovedGuardAt: undefined,
      guardSlots: slots,
    };
    setRequests((prev) => prev.map((r) => (r.id === job.id ? acceptedJob : r)));
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          status: 'accepted',
          assigned_guard_id: leadId,
          pending_guard_id: null,
          staff_approved_guard_at: null,
        })
        .eq('id', job.id);
      await persistJobGuardSlots(supabase, ensureSlotIds(job, slots));
    }
    for (const slot of slots.filter((s) => s.guardId && s.status === 'approved')) {
      if (currentUser && slot.guardId && slot.guardId !== currentUser.id) {
        void reportPushEvent(currentUser, {
          type: 'assignment',
          guardId: slot.guardId,
          requestId: job.id,
          location: job.location,
          body: `Roster confirmed for ${job.title}`,
        });
      }
    }
    await ensureJobChatThread({ ...acceptedJob, status: 'accepted', assignedGuardId: leadId });
    appToast('All guards confirmed — job is locked in.', 'success');
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!currentUser) return;
    const next = markNotificationClicked(userNotifications, notification.id);
    setUserNotifications(next);
    await persistUserNotifications(next, currentUser.id, isDbConnected);
    const destination = resolveNotificationDestination(notification, currentUser);
    if (destination) {
      navigateFromLocation(destination, { source: 'deeplink' });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    const next = markAllNotificationsRead(userNotifications);
    setUserNotifications(next);
    await persistUserNotifications(next, currentUser.id, isDbConnected);
  };

  const accountNotificationMenuProps: AccountMenuNotificationProps = currentUser
    ? {
        notifications: userNotifications,
        onNotificationClick: handleNotificationClick,
        onMarkAllNotificationsRead: handleMarkAllNotificationsRead,
      }
    : {};

  const accountMenuExtras = {
    onOpenDownload: openDownloadPage,
    themeMode,
    onChangeTheme: changeThemeMode,
    ...accountNotificationMenuProps,
  };

  const handleClientApproveTeamSlot = async (requestId: string, slotId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    const pendingSlot = job.guardSlots?.find((s) => s.id === slotId);
    if (pendingSlot?.guardId) {
      const guard = guards.find((g) => g.id === pendingSlot.guardId);
      const scheduleBlocked = guardScheduleConflictError(pendingSlot.guardId, job, requests, {
        guardName: guard?.name,
      });
      if (scheduleBlocked) {
        appToast(scheduleBlocked, 'error');
        return;
      }
    }
    const result = clientApproveTeamSlot(job, slotId);
    if ('error' in result) {
      appToast(result.error, 'error');
      return;
    }
    const slot = result.slots.find((s) => s.id === slotId);
    const { job: nextJob, slots: nextSlots } = await persistTeamJobUpdate(result.job, result.slots);
    if (slot?.guardId && currentUser) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: slot.guardId,
        requestId,
        body: `The client approved you for "${job.title}".`,
      });
    }
    appToast('Guard approved for this slot.', 'success');
    await finalizeTeamJobIfReady(nextJob, nextSlots);
  };

  const handleClientDenyTeamSlot = async (requestId: string, slotId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    const result = clientDenyTeamSlot(job, slotId);
    if ('error' in result) {
      appToast(result.error, 'error');
      return;
    }
    const deniedGuardId = job.guardSlots?.find((s) => s.id === slotId)?.guardId;
    await persistTeamJobUpdate(result.job, result.slots);
    if (deniedGuardId && currentUser) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: deniedGuardId,
        requestId,
        body: `The client declined you for "${job.title}".`,
      });
    }
    appToast('Guard declined — slot reopened.', 'success');
  };

  const proposeGuardForClientApproval = async (
    requestId: string,
    guardId: string,
    options?: { initiatedByGuard?: boolean }
  ) => {
    const job = requests.find((r) => r.id === requestId);
    const guard = guards.find((g) => g.id === guardId);
    if (!job || !guard) return;
    if (job.assignedGuardId) {
      appToast('A guard has already picked up this job.', 'error');
      return;
    }
    if (job.status !== 'open') {
      appToast('This job is not open for guard placement.', 'error');
      return;
    }
    const workBlocked = guardWorkBlockedMessage(guard, job.state);
    if (workBlocked) {
      appToast(workBlocked, 'error');
      return;
    }
    const { canAccept } = checkJobRequirements(guard, toGuardJobView(job, guard.id), requests, {
      skipAvailability: true,
    });
    if (!canAccept) {
      appToast(`${guard.name} does not meet the requirements for this job.`, 'error');
      return;
    }
    const scheduleBlocked = guardScheduleConflictError(guardId, job, requests, { guardName: guard.name });
    if (scheduleBlocked) {
      appToast(scheduleBlocked, 'error');
      return;
    }
    if (shouldSkipClientGuardApproval(job, guardId)) {
      await assignGuardToJob(requestId, guardId);
      return;
    }

    if (isMultiGuardJob(job)) {
      const result = proposeIndependentGuardToClient(job, guardId, true, requests);
      if ('error' in result) {
        appToast(result.error, 'error');
        return;
      }
      const { job: nextJob } = await persistTeamJobUpdate(result.job, result.slots);
      if (currentUser) {
        if (options?.initiatedByGuard) {
          notifyGuardAppliedToJob(currentUser, job, guard);
        } else {
          void reportPushEvent(currentUser, {
            type: 'assignment',
            recipientUserId: job.clientId,
            requestId,
            guardId,
            guardName: guard.name,
            title: 'Independent guard request',
            body: `${guard.name} was placed on "${job.title}". Confirm to add them to your roster.`,
          });
        }
        void reportPushEvent(currentUser, {
          type: 'assignment',
          recipientUserId: guardId,
          requestId,
          body: options?.initiatedByGuard
            ? `Your application for "${job.title}" is awaiting client confirmation.`
            : `You were placed on "${job.title}" — awaiting client confirmation.`,
        });
      }
      appToast(`${guard.name} sent to ${job.clientName} for approval.`, 'success');
      return;
    }

    if (job.pendingGuardId) {
      if (job.pendingGuardId === guardId) {
        appToast('This guard is already waiting for client approval.', 'error');
        return;
      }
      appToast('Another guard is awaiting client approval. Decline them first or wait for the client.', 'error');
      return;
    }

    const approvedAt = new Date().toISOString();
    const nextApplicants = [...new Set([...job.applicants, guardId])];
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              pendingGuardId: guardId,
              staffApprovedGuardAt: approvedAt,
              applicants: nextApplicants,
            }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          pending_guard_id: guardId,
          staff_approved_guard_at: approvedAt,
          applicants: nextApplicants,
        })
        .eq('id', requestId);
    }
    if (currentUser) {
      const clientTitle = options?.initiatedByGuard ? 'Guard application' : 'Guard placement';
      const clientBody = options?.initiatedByGuard
        ? `${guard.name} applied for "${job.title}". Confirm to hire them.`
        : `${guard.name} was placed on "${job.title}" for your review (dispute/safety). Confirm to hire them.`;
      if (options?.initiatedByGuard) {
        notifyGuardAppliedToJob(currentUser, job, guard);
      } else {
        void reportPushEvent(currentUser, {
          type: 'assignment',
          recipientUserId: job.clientId,
          requestId,
          guardId,
          guardName: guard.name,
          title: clientTitle,
          body: clientBody,
        });
      }
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: guardId,
        requestId,
        body: options?.initiatedByGuard
          ? `Your application for "${job.title}" is awaiting client confirmation.`
          : `You were placed on "${job.title}" — awaiting client confirmation.`,
      });
    }
    appToast(`${guard.name} sent to ${job.clientName} for approval.`, 'success');
  };

  const denyGuardApplication = async (
    requestId: string,
    guardId: string,
    opts?: { deniedBy: 'staff' | 'client' }
  ) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    const wasPending = job.pendingGuardId === guardId;
    const nextApplicants = removeGuardFromApplicants(job.applicants, guardId);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              applicants: nextApplicants,
              pendingGuardId: wasPending ? undefined : r.pendingGuardId,
              staffApprovedGuardAt: wasPending ? undefined : r.staffApprovedGuardAt,
            }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          applicants: nextApplicants,
          ...(wasPending ? { pending_guard_id: null, staff_approved_guard_at: null } : {}),
        })
        .eq('id', requestId);
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: guardId,
        requestId,
        body:
          opts?.deniedBy === 'client'
            ? `The client declined you for "${job.title}". You can apply to other open jobs.`
            : `Your application for "${job.title}" was not selected.`,
      });
    }
    appToast(
      opts?.deniedBy === 'client'
        ? 'Guard declined — job is open for other applicants.'
        : 'Application removed.',
      'success'
    );
  };

  const handleClientApprovePendingGuard = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const job = requests.find((r) => r.id === requestId);
    if (!job || job.clientId !== currentUser.id) {
      appToast('You cannot approve guards on this job.', 'error');
      return;
    }
    if (!isAwaitingClientGuardApproval(job) && !hasIndependentSlotsPendingClient(job)) {
      appToast('No guard is waiting for your approval on this job.', 'error');
      return;
    }
    if (isMultiGuardJob(job)) {
      const slot =
        job.guardSlots?.find(
          (s) => s.guardId === job.pendingGuardId && s.status === 'pending_client'
        ) ?? job.guardSlots?.find((s) => s.status === 'pending_client' && s.guardId);
      if (slot?.id) {
        await handleClientApproveTeamSlot(requestId, slot.id);
        return;
      }
      appToast('No independent guard is waiting for your approval.', 'error');
      return;
    }
    if (!job.pendingGuardId) {
      appToast('No guard is waiting for your approval on this job.', 'error');
      return;
    }
    const assigned = await assignGuardToJob(requestId, job.pendingGuardId, { assignmentSource: 'client' });
    if (assigned) {
      appToast('Guard confirmed for this job.', 'success');
    }
  };

  const handleClientDenyPendingGuard = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const job = requests.find((r) => r.id === requestId);
    if (!job || job.clientId !== currentUser.id) {
      appToast('You cannot update this job.', 'error');
      return;
    }
    if (isMultiGuardJob(job)) {
      const slot = job.guardSlots?.find(
        (s) =>
          s.guardId === job.pendingGuardId &&
          (s.status === 'pending_client' || s.status === 'pending_staff')
      ) ?? job.guardSlots?.find((s) => s.status === 'pending_client' && s.guardId);
      if (slot?.id) {
        if (
          !(await showAppConfirm({
            title: 'Decline this guard?',
            message: `Decline ${job.title} for this guard and reopen the slot?`,
            confirmLabel: 'Decline guard',
            tone: 'danger',
          }))
        ) {
          return;
        }
        await handleClientDenyTeamSlot(requestId, slot.id);
        return;
      }
    }
    if (!job.pendingGuardId) {
      appToast('No guard is waiting for your approval.', 'error');
      return;
    }
    if (
      !(await showAppConfirm({
        title: 'Decline this guard?',
        message: `Send "${job.title}" back to the applicant list so Guardr can recommend someone else.`,
        confirmLabel: 'Decline guard',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await denyGuardApplication(requestId, job.pendingGuardId, { deniedBy: 'client' });
  };

  const persistJobPricingPatch = async (
    requestId: string,
    patch: Partial<
      Pick<
        SecurityRequest,
        | 'priceNegotiations'
        | 'hourlyRate'
        | 'guardPay'
        | 'platformFeePerHour'
        | 'agreementFeeConfig'
        | 'estimatedPayout'
        | 'applicants'
      >
    >
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, ...patch } : r))
    );
    if (!isDbConnected) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.priceNegotiations !== undefined) {
      dbPatch.price_negotiations = patch.priceNegotiations;
    }
    if (patch.hourlyRate !== undefined) dbPatch.hourly_rate = patch.hourlyRate;
    if (patch.guardPay !== undefined) dbPatch.guard_pay = patch.guardPay;
    if (patch.platformFeePerHour !== undefined) {
      dbPatch.platform_fee_per_hour = patch.platformFeePerHour;
    }
    if (patch.agreementFeeConfig !== undefined) {
      dbPatch.agreement_fee_config = patch.agreementFeeConfig ?? null;
    }
    if (patch.estimatedPayout !== undefined) dbPatch.estimated_payout = patch.estimatedPayout;
    if (patch.applicants !== undefined) dbPatch.applicants = patch.applicants;
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from('security_requests').update(dbPatch).eq('id', requestId);
    }
  };

  const handleSubmitPriceOffer = async (
    requestId: string,
    guardId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: SecurityRequest['agreementFeeConfig'];
      message?: string;
    },
    offeredBy: 'client' | 'guard'
  ) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job || !isOpenContractPricing(job.pricingMode)) {
      appToast('Price negotiation is only available on open-contract jobs.', 'error');
      return;
    }
    const offer = createPriceOffer({
      offeredBy,
      offeredByUserId: offeredBy === 'client' ? job.clientId : guardId,
      hourlyRate: input.hourlyRate,
      agreementFeeConfig: input.agreementFeeConfig,
      message: input.message,
    });
    const priceNegotiations = appendGuardPriceOffer(job.priceNegotiations, guardId, offer);
    const applicants =
      offeredBy === 'guard' && !job.applicants.includes(guardId)
        ? [...new Set([...job.applicants, guardId])]
        : job.applicants;
    await persistJobPricingPatch(requestId, { priceNegotiations, applicants });
    if (currentUser) {
      const recipientUserId = offeredBy === 'client' ? guardId : job.clientId;
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId,
        requestId,
        guardId,
        title: 'Price offer',
        body: `New price offer on "${job.title}": $${input.hourlyRate}/hr client rate.`,
      });
    }
    appToast('Price offer sent.', 'success');
  };

  const handleAcceptPriceOffer = async (
    requestId: string,
    guardId: string,
    offerId: string
  ) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job || !isOpenContractPricing(job.pricingMode)) {
      appToast('Price negotiation is only available on open-contract jobs.', 'error');
      return;
    }
    const { negotiations, offer } = acceptGuardPriceOffer(
      job.priceNegotiations,
      guardId,
      offerId
    );
    if (!offer) {
      appToast('That offer is no longer available.', 'error');
      return;
    }
    const billing = applyAgreedOfferToJobBilling({
      offer,
      durationHours: job.durationHours,
      guardsNeeded: job.guardsNeeded ?? 1,
      globalFeeConfig: feeConfigFromJobSnapshot(job),
    });
    const applicants = job.applicants.includes(guardId)
      ? job.applicants
      : [...new Set([...job.applicants, guardId])];
    await persistJobPricingPatch(requestId, {
      priceNegotiations: negotiations,
      hourlyRate: billing.hourlyRate,
      guardPay: billing.guardPay,
      platformFeePerHour: billing.platformFeePerHour,
      agreementFeeConfig: billing.agreementFeeConfig,
      estimatedPayout: billing.estimatedPayout,
      applicants,
    });
    if (offer.offeredBy === 'guard' && currentUser?.id === job.clientId) {
      await proposeGuardForClientApproval(requestId, guardId, { initiatedByGuard: true });
      appToast('Price agreed — confirm this guard to hire.', 'success');
      return;
    }
    if (offer.offeredBy === 'client' && currentUser?.id === guardId) {
      if (job.requestType === 'direct' && job.targetGuardId === guardId) {
        const assigned = await assignGuardToJob(requestId, guardId);
        if (assigned) {
          appToast('Price agreed — job confirmed on your schedule.', 'success');
        }
        return;
      }
      await proposeGuardForClientApproval(requestId, guardId, { initiatedByGuard: true });
      appToast('Price agreed — awaiting client confirmation.', 'success');
      return;
    }
    if (currentUser) {
      const recipientUserId = offer.offeredBy === 'client' ? guardId : job.clientId;
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId,
        requestId,
        guardId,
        title: 'Price agreed',
        body: `Price agreed on "${job.title}" at $${billing.hourlyRate}/hr client rate.`,
      });
    }
    appToast('Price agreed.', 'success');
  };

  // ── Guard applies to open job (self-selection → client approval) ──
  const handleApplyToJob = async (requestId: string) => {
    if (isTutorialDemoId(requestId)) {
      appToast('Tutorial practice only — this job is not sent to the live queue.', 'info');
      return;
    }
    if (activeGuard.isStaff) {
      appToast('Staff accounts cannot apply to field jobs. Sign in with a guard account to work jobs.', 'error');
      return;
    }
    const workBlocked = guardWorkBlockedMessage(activeGuard);
    if (workBlocked) {
      appToast(workBlocked, 'error');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    if (job.status !== 'open') {
      appToast('This job is no longer open for applications.', 'error');
      return;
    }
    if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== activeGuardId) {
      appToast('This request was sent to another guard from their profile.', 'error');
      return;
    }
    if (guardHasApplied(job, activeGuardId)) {
      appToast('You already applied for this job. Awaiting client confirmation.', 'error');
      return;
    }

    const clientRecord = clients.find((c) => c.id === job.clientId);
    if (jobUsesFirstToAccept(job, clientRecord)) {
      if (job.assignedGuardId) {
        appToast('Another guard already picked up this job.', 'error');
        return;
      }
      const assigned = await assignGuardToJob(requestId, activeGuardId);
      if (assigned) {
        appToast('You got the job — first qualified guard wins.', 'success');
      }
      return;
    }

    if (isOpenContractPricing(job.pricingMode)) {
      const agreed = getAgreedPriceOffer(
        getGuardNegotiation(job.priceNegotiations, activeGuardId)
      );
      if (!agreed) {
        appToast(
          'This is an open contract job — submit or accept a price offer before applying.',
          'info'
        );
        return;
      }
    }
    if (!guardCanApplyToJob(activeGuard, toGuardJobView(job, activeGuard.id), requests)) {
      const scheduleBlocked = guardScheduleConflictError(activeGuardId, job, requests);
      if (scheduleBlocked) {
        appToast(scheduleBlocked, 'error');
        return;
      }
      const missing = checkJobRequirements(activeGuard, toGuardJobView(job, activeGuard.id), requests)
        .checks.filter((c) => !c.met)
        .map((c) => c.label)
        .join(', ');
      appToast(`You must qualify before applying: ${missing}. Upload the required credentials in your profile.`, 'error');
      return;
    }

    // Direct requests: guard confirms → assign immediately (client already chose them)
    if (job.requestType === 'direct' && job.targetGuardId === activeGuardId) {
      if (isOpenContractPricing(job.pricingMode)) {
        const agreed = getAgreedPriceOffer(
          getGuardNegotiation(job.priceNegotiations, activeGuardId)
        );
        if (!agreed) {
          appToast('Accept the client offer or send a counter-offer before confirming.', 'info');
          return;
        }
      }
      const assigned = await assignGuardToJob(requestId, activeGuardId);
      if (assigned) {
        appToast('Job confirmed — check your schedule.', 'success');
      }
      return;
    }

    if (isMultiGuardJob(job)) {
      const result = proposeIndependentGuardToClient(job, activeGuardId, true, requests);
      if ('error' in result) {
        appToast(result.error, 'error');
        return;
      }
      await persistTeamJobUpdate(result.job, result.slots);
      if (currentUser) {
        notifyGuardAppliedToJob(currentUser, job, activeGuard);
        void reportPushEvent(currentUser, {
          type: 'assignment',
          recipientUserId: activeGuardId,
          requestId,
          body: `Your application for "${job.title}" is awaiting client confirmation.`,
        });
      }
      appToast('Application sent to client for approval.', 'success');
      return;
    }

    const nextApplicants = [...new Set([...job.applicants, activeGuardId])];
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, applicants: nextApplicants } : r))
    );
    if (isDbConnected) {
      await supabase.from('security_requests').update({ applicants: nextApplicants }).eq('id', requestId);
    }
    await proposeGuardForClientApproval(requestId, activeGuardId, { initiatedByGuard: true });
    appToast('Application sent to client for approval.', 'success');
  };

  const handleGuardDeclineDirectJob = async (requestId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    if (job.requestType !== 'direct' || job.targetGuardId !== activeGuardId) {
      appToast('This is not a direct request for you.', 'error');
      return;
    }
    if (job.status !== 'open') {
      appToast('This job is no longer open.', 'error');
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, requestType: 'marketplace' as const, targetGuardId: undefined }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ request_type: 'marketplace', target_guard_id: null })
        .eq('id', requestId);
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'job_submitted',
        requestId,
        location: job.location,
        body: `Guard declined direct request for "${job.title}" — now open to all guards`,
      });
    }
    appToast('Job declined — it\'s now listed for all guards.', 'info');
  };

  const handleStaffApproveGuardApplication = async (requestId: string, guardId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to approve guard applications.', 'error');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job || job.status !== 'open') {
      appToast('This job is not open for guard applications.', 'error');
      return;
    }
    if (!job.applicants.includes(guardId)) {
      appToast('This guard has not applied for the job.', 'error');
      return;
    }
    if (isMultiGuardJob(job)) {
      const pendingStaff = (job.guardSlots ?? []).find(
        (s) => s.guardId === guardId && s.status === 'pending_staff'
      );
      if (pendingStaff) {
        const result = staffApproveIndependentSlot(job, guardId);
        if ('error' in result) {
          appToast(result.error, 'error');
          return;
        }
        const guard = guards.find((g) => g.id === guardId);
        const { job: nextJob } = await persistTeamJobUpdate(result.job, result.slots);
        if (currentUser && guard) {
          void reportPushEvent(currentUser, {
            type: 'assignment',
            recipientUserId: nextJob.clientId,
            requestId,
            guardId,
            guardName: guard.name,
            title: 'Independent guard request',
            body: `Guardr approved ${guard.name} for "${job.title}".`,
          });
        }
        appToast(`${guard?.name ?? 'Guard'} sent to client for independent approval.`, 'success');
        return;
      }
      const result = proposeIndependentGuardToClient(job, guardId, true, requests);
      if ('error' in result) {
        appToast(result.error, 'error');
        return;
      }
      const guard = guards.find((g) => g.id === guardId);
      await persistTeamJobUpdate(result.job, result.slots);
      if (currentUser && guard) {
        void reportPushEvent(currentUser, {
          type: 'assignment',
          recipientUserId: job.clientId,
          requestId,
          guardId,
          guardName: guard.name,
          title: 'Independent guard request',
          body: `Guardr approved ${guard.name} for "${job.title}".`,
        });
      }
      appToast(`${guard?.name ?? 'Guard'} sent to client for independent approval.`, 'success');
      return;
    }
    await proposeGuardForClientApproval(requestId, guardId);
  };

  const handleStaffDenyGuardApplication = async (requestId: string, guardId: string) => {
    if (!currentUser || !canReviewJobRequests(currentUser)) {
      appToast('You do not have permission to decline guard applications.', 'error');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job || job.status !== 'open') {
      appToast('This job is not open for guard applications.', 'error');
      return;
    }
    if (!job.applicants.includes(guardId)) {
      appToast('This guard has not applied for the job.', 'error');
      return;
    }
    if (
      !(await showAppConfirm({
        title: 'Decline application?',
        message: 'Remove this guard from the applicant list for this job.',
        confirmLabel: 'Decline',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await denyGuardApplication(requestId, guardId, { deniedBy: 'staff' });
  };

  // ── Audit lifecycle ────────────────────────────────────────
  const handleUpdateJobAudit = async (requestId: string, payload: { checkInAudit?: any; midShiftAudit?: any; checkOutAudit?: any; shiftBreaks?: SecurityRequest['shiftBreaks']; shiftAuditViolations?: SecurityRequest['shiftAuditViolations']; status?: SecurityRequest['status']; }): Promise<boolean> => {
    const req = requests.find((r) => r.id === requestId);
    if (req && payload.status === 'in-progress' && payload.checkInAudit) {
      const workBlocked = guardWorkBlockedMessage(activeGuard, req.state);
      if (workBlocked) {
        appToast(workBlocked, 'error');
        return false;
      }
      if (jobRequiresPostOrdersAck(req, activeGuardId)) {
        appToast('Review and acknowledge post orders before clocking in.', 'error');
        return false;
      }
      if (!canGuardClockIn(req)) {
        appToast(guardClockInBlockedMessage(req) ?? 'Job start is not open yet.', 'error');
        return false;
      }
    }
    if (req && payload.status === 'completed') {
      if (!canGuardClockOut(req)) {
        appToast(guardClockOutBlockedMessage(req) ?? 'Complete job is not available right now.', 'error');
        return false;
      }
    }
    const nextMidShiftAudits = payload.midShiftAudit
      ? [...(req?.midShiftAudits || []), payload.midShiftAudit]
      : undefined;

    const previousRequest = req ? (JSON.parse(JSON.stringify(req)) as SecurityRequest) : null;
    const previousActiveBreak = req ? activeShiftBreak(req) : null;
    const completedGuardId =
      payload.status === 'completed' && req?.assignedGuardId ? req.assignedGuardId : null;

    const checkOutAt = payload.checkOutAudit?.checkedAt;
    const checkInAt = req?.checkInAudit?.checkedAt;
    const guardClaimedOvertime = payload.checkOutAudit?.overtimeClaimed === true;
    const detectedOvertime =
      req && payload.status === 'completed' && checkOutAt
        ? detectLateClockOutOvertime(req, checkOutAt, { guardClaimedOvertime, checkInAt })
        : null;
    // Early clock-out: guard left before scheduled end — calculate client refund
    const earlyCheckoutRefund =
      req && payload.status === 'completed' && !detectedOvertime
        ? computeEarlyClockOutRefund({
            ...req,
            checkOutAudit: payload.checkOutAudit ?? req.checkOutAudit,
          })
        : null;

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const updated = { ...r };
      if (payload.checkInAudit) updated.checkInAudit = payload.checkInAudit;
      if (nextMidShiftAudits) updated.midShiftAudits = nextMidShiftAudits;
      if (payload.shiftBreaks) updated.shiftBreaks = payload.shiftBreaks;
      if (payload.checkOutAudit) updated.checkOutAudit = payload.checkOutAudit;
      if (payload.shiftAuditViolations) {
        updated.shiftAuditViolations = payload.shiftAuditViolations;
      }
      if (detectedOvertime) {
        const guardConfirmedAt = new Date().toISOString();
        updated.scheduledDurationHours = detectedOvertime.scheduledDurationHours;
        updated.scheduledEstimatedPayout = detectedOvertime.scheduledEstimatedPayout;
        updated.overtimeHours = detectedOvertime.overtimeHours;
        updated.overtimeAmount = detectedOvertime.overtimeAmount;
        updated.overtimeStatus = detectedOvertime.overtimeStatus;
        updated.overtimeGuardApprovedAt = guardConfirmedAt;
        updated.overtimePaymentStatus = 'unpaid';
      }
      if (earlyCheckoutRefund) {
        updated.earlyClockOutActualHours = earlyCheckoutRefund.actualHours;
        updated.earlyClockOutRefundAmount = earlyCheckoutRefund.clientRefundAmount;
        updated.earlyClockOutRefundStatus = 'pending';
      }
      if (payload.status) {
        updated.status = payload.status;
        if (payload.status === 'completed' && r.assignedGuardId) {
          setGuards(pg => pg.map(g => g.id === r.assignedGuardId ? { ...g, jobsCompleted: g.jobsCompleted + 1 } : g));
        }
        if (payload.status === 'completed' && r.paymentStatus === 'paid') {
          updated.paymentStatus = 'held';
        }
      }
      return updated;
    }));

    if (isDbConnected) {
      beginLocalMutation();
      const updates: Record<string, unknown> = {};
      if (payload.checkInAudit) updates.check_in_audit = payload.checkInAudit;
      if (nextMidShiftAudits) updates.mid_shift_audits = nextMidShiftAudits;
      if (payload.shiftBreaks) updates.shift_breaks = payload.shiftBreaks;
      if (payload.checkOutAudit) updates.check_out_audit = payload.checkOutAudit;
      if (payload.shiftAuditViolations) {
        updates.shift_audit_violations = payload.shiftAuditViolations;
      }
      if (detectedOvertime) {
        const guardConfirmedAt = new Date().toISOString();
        updates.scheduled_duration_hours = detectedOvertime.scheduledDurationHours;
        updates.scheduled_estimated_payout = detectedOvertime.scheduledEstimatedPayout;
        updates.overtime_hours = detectedOvertime.overtimeHours;
        updates.overtime_amount = detectedOvertime.overtimeAmount;
        updates.overtime_status = detectedOvertime.overtimeStatus;
        updates.overtime_guard_approved_at = guardConfirmedAt;
        updates.overtime_payment_status = 'unpaid';
      }
      if (earlyCheckoutRefund) {
        updates.early_clock_out_actual_hours = earlyCheckoutRefund.actualHours;
        updates.early_clock_out_refund_amount = earlyCheckoutRefund.clientRefundAmount;
        updates.early_clock_out_refund_status = 'pending';
      }
      if (payload.status) {
        updates.status = payload.status;
        if (payload.status === 'completed' && req?.paymentStatus === 'paid') {
          updates.payment_status = 'held';
        }
      }
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('security_requests').update(updates).eq('id', requestId);
        if (error) {
          console.error('Job audit update error:', error);
          if (previousRequest) {
            setRequests((prev) => prev.map((r) => (r.id === requestId ? previousRequest : r)));
          }
          if (completedGuardId) {
            setGuards((pg) =>
              pg.map((g) =>
                g.id === completedGuardId ? { ...g, jobsCompleted: Math.max(0, g.jobsCompleted - 1) } : g
              )
            );
          }
          appToast('Could not save photos or job update. Please try again.', 'error');
          return false;
        }
      }
    }
    if (payload.status === 'completed') {
      const req = requests.find(r => r.id === requestId);
      if (req?.paymentStatus === 'paid' && !isCashClientPayment(req)) {
        try {
          await holdJobPayment(requestId);
        } catch (e) {
          console.error('Hold payment error:', e);
        }
      }
      if (
        req &&
        platformSettings.autoStripePayoutEnabled &&
        shouldScheduleAutoStripePayout(req)
      ) {
        const scheduledAt = computeAutoPayoutScheduledAt(
          new Date().toISOString(),
          platformSettings
        );
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, autoPayoutScheduledAt: scheduledAt } : r
          )
        );
        if (isDbConnected) {
          await supabase
            .from('security_requests')
            .update({ auto_payout_scheduled_at: scheduledAt })
            .eq('id', requestId);
        }
      }
    }

    if (payload.checkInAudit && currentUser) {
      const req = requests.find((r) => r.id === requestId);
      const guard = guards.find((g) => g.id === req?.assignedGuardId) ?? activeGuard;
      void reportPushEvent(currentUser, {
        type: 'guard_checkin',
        guardId: guard?.id ?? req?.assignedGuardId,
        guardName: guard?.name ?? currentUser.name,
        requestId,
        siteId: req?.siteName || undefined,
        location: req?.location,
      });
      if (req?.assignedGuardId) {
        void ensureJobChatThread({ ...req, status: 'in-progress' });
      }
    }

    if (payload.midShiftAudit && currentUser && req) {
      const guard = guards.find((g) => g.id === req.assignedGuardId) ?? activeGuard;
      void reportPushEvent(currentUser, {
        type: 'guard_checkin',
        guardId: guard?.id ?? req.assignedGuardId,
        guardName: guard?.name ?? currentUser.name,
        requestId,
        siteId: req.siteName || undefined,
        location: req.location,
        body: `${guard?.name ?? 'Guard'} completed a mid-shift check-in${req.location ? ` at ${req.location}` : ''}`,
      });
    }

    if (payload.status === 'completed' && payload.checkOutAudit && currentUser) {
      const req = requests.find((r) => r.id === requestId);
      const guard = guards.find((g) => g.id === req?.assignedGuardId) ?? activeGuard;
      void reportPushEvent(currentUser, {
        type: 'guard_clockout',
        guardId: guard?.id ?? req?.assignedGuardId,
        guardName: guard?.name ?? currentUser.name,
        requestId,
        siteId: req?.siteName || undefined,
        location: req?.location,
      });
      if (req) {
        notifyJobStatusUpdate(
          currentUser,
          req,
          'Job completed',
          `${guard?.name ?? 'Your guard'} completed "${req.title}".`,
          { guardId: req.assignedGuardId }
        );
      }
    }

    if (payload.shiftBreaks && currentUser && req) {
      const guard = guards.find((g) => g.id === req.assignedGuardId) ?? activeGuard;
      const nextActiveBreak = activeShiftBreak({ ...req, shiftBreaks: payload.shiftBreaks });
      if (!previousActiveBreak && nextActiveBreak) {
        void reportPushEvent(currentUser, {
          type: 'guard_break_start',
          guardId: guard?.id ?? req.assignedGuardId,
          guardName: guard?.name ?? currentUser.name,
          requestId,
          siteId: req.siteName || undefined,
          location: req.location,
        });
      } else if (previousActiveBreak && !nextActiveBreak) {
        void reportPushEvent(currentUser, {
          type: 'guard_break_end',
          guardId: guard?.id ?? req.assignedGuardId,
          guardName: guard?.name ?? currentUser.name,
          requestId,
          siteId: req.siteName || undefined,
          location: req.location,
        });
      }
    }

    if (currentUser && payload.checkOutAudit?.incidentReports) {
      const prevCount =
        req?.checkOutAudit?.incidentReports?.length ??
        (req?.checkOutAudit?.incidentReport?.hasIncident ? 1 : 0);
      const newCount = payload.checkOutAudit.incidentReports.length;
      if (newCount > prevCount) {
        const latest = payload.checkOutAudit.incidentReports[newCount - 1];
        const guard = guards.find((g) => g.id === req?.assignedGuardId);
        void reportPushEvent(currentUser, {
          type: 'emergency_alert',
          requestId,
          guardId: guard?.id,
          guardName: guard?.name,
          location: req?.location,
          body: latest?.description ?? 'Incident reported on active shift',
        });
      }
    }

    if (earlyCheckoutRefund && earlyCheckoutRefund.clientRefundAmount > 0 && currentUser) {
      const earlyReq = requests.find((r) => r.id === requestId);
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        location: earlyReq?.location,
        body: `Early clock-out on "${earlyReq?.title}" — guard worked ${earlyCheckoutRefund.actualHours}h of ${earlyCheckoutRefund.scheduledHours}h. Client refund due: $${earlyCheckoutRefund.clientRefundAmount.toFixed(2)}.`,
      });
    }

    if (detectedOvertime && detectedOvertime.overtimeAmount > 0 && currentUser) {
      const req = requests.find((r) => r.id === requestId);
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        requestId,
        location: req?.location,
        body: `Late clock-out on "${req?.title}" — ${detectedOvertime.overtimeHours}h overtime awaiting client approval.`,
      });
      if (req?.clientId) {
        notifyAccountUpdate(
          currentUser,
          req.clientId,
          'Overtime approval needed',
          `Guard stayed ${detectedOvertime.overtimeHours}h past schedule on "${req.title}" — approve overtime in your jobs list.`
        );
      }
    }

    if (payload.status === 'completed') {
      await archiveJobChatThread(requestId);
    }
    return true;
  };

  const handleStartEnRoute = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.assignedGuardId !== activeGuardId) return;
    if (!canGuardStartEnRoute(req)) return;
    if (jobRequiresPostOrdersAck(req, activeGuardId)) return;
    const enRouteAt = new Date().toISOString();
    const previous = req;
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, enRouteAt } : r))
    );
    if (isDbConnected) {
      const { error } = await supabase
        .from('security_requests')
        .update({ en_route_at: enRouteAt })
        .eq('id', requestId);
      if (error) {
        console.error('En route update error:', error);
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? previous : r))
        );
        appToast('Could not start en route. Please try again.', 'error');
        return;
      }
    }
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'guard_en_route',
        guardId: activeGuardId,
        guardName: activeGuard?.name,
        requestId,
        location: req.location,
        body: `${activeGuard?.name ?? 'Guard'} is en route to "${req.title}".`,
      });
    }
  };

  const handleGuardArrived = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req || req.assignedGuardId !== activeGuardId) return;
    if (req.arrivedAt) {
      // Already persisted — still notify if needed for briefing violation path below.
    }
    const arrivedAt = req.arrivedAt ?? new Date().toISOString();
    const previous = req;
    if (!req.arrivedAt) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, arrivedAt } : r))
      );
      if (isDbConnected) {
        const { error } = await supabase
          .from('security_requests')
          .update({ arrived_at: arrivedAt })
          .eq('id', requestId);
        if (error) {
          console.error('Arrived update error:', error);
          setRequests((prev) =>
            prev.map((r) => (r.id === requestId ? previous : r))
          );
          appToast('Could not record arrival. Please try again.', 'error');
          return;
        }
      }
    }
    if (!currentUser) return;
    const guard = guards.find((g) => g.id === req.assignedGuardId) ?? activeGuard;
    if (jobHasBriefingContent(req) && !guardAcknowledgedBriefing(req, guard?.id ?? activeGuardId)) {
      const violation = createNotReadyBriefingViolation(guard?.id ?? activeGuardId);
      const violations = mergeShiftAuditViolations(req.shiftAuditViolations, [violation]);
      void persistShiftAuditViolations(requestId, violations);
      notifyAccountUpdate(
        currentUser,
        guard?.id ?? activeGuardId,
        "You weren't ready",
        `You arrived without reviewing the briefing for "${req.title}". Complete it before starting the job.`
      );
    }
    void reportPushEvent(currentUser, {
      type: 'guard_arrived',
      guardId: guard?.id,
      guardName: guard?.name,
      requestId,
      location: req.location,
    });
  };

  const handleUpdateGuardLiveLocation = async (
    requestId: string,
    location: { lat: number; lng: number; updatedAt: string }
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, guardLiveLocation: location } : r))
    );
    if (isDbConnected) {
      beginLocalMutation();
      await supabase
        .from('security_requests')
        .update({ guard_live_location: location })
        .eq('id', requestId);
    }
  };

  const broadcastReplacementOffers = async (
    job: SecurityRequest,
    guardIds: string[]
  ) => {
    if (!currentUser) return;
    for (const guardId of guardIds) {
      const guard = guards.find((g) => g.id === guardId);
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: guardId,
        requestId: job.id,
        guardId,
        guardName: guard?.name,
        title: 'Replacement mission offer',
        body: `Urgent coverage needed for "${job.title}" — first to accept gets the mission.`,
        priority: 'high',
      });
    }
    void reportPushEvent(currentUser, {
      type: 'assignment',
      recipientUserId: job.clientId,
      requestId: job.id,
      title: 'Finding replacement',
      body: `${guardIds.length} qualified guard${guardIds.length === 1 ? '' : 's'} notified for "${job.title}".`,
    });
  };

  const handleRequestReplacement = async (requestId: string, reasonNote?: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job || !job.assignedGuardId) return;
    const replacement = createReplacementRequest(job, {
      requestedBy: 'client',
      reason: 'call-off',
      reasonNote,
      previousGuardId: job.assignedGuardId,
    });
    const candidates = findReplacementCandidates(job, guards, requests, [job.assignedGuardId]);
    const withOffers = startReplacementOffers(
      { ...job, replacementRequest: replacement },
      candidates
    );
    if (!withOffers || withOffers.status === 'failed') {
      appToast('No qualified replacement guards available nearby.', 'error');
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, replacementRequest: withOffers } : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ replacement_request: withOffers })
        .eq('id', requestId);
    }
    await broadcastReplacementOffers(job, withOffers.offeredGuardIds);
    appToast('Replacement search started — first guard to accept is auto-assigned.', 'success');
  };

  const handleAcceptReplacementOffer = async (requestId: string, guardId: string) => {
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    const result = acceptReplacementOffer(job, guardId);
    if (!result) {
      appToast('This replacement offer is no longer available.', 'error');
      return;
    }
    const guard = guards.find((g) => g.id === guardId);
    const workBlocked = guard ? guardWorkBlockedMessage(guard, job.state) : null;
    if (workBlocked) {
      appToast(workBlocked, 'error');
      return;
    }
    if (guard) {
      const scheduleBlocked = guardScheduleConflictError(guardId, job, requests, {
        guardName: guard.name,
      });
      if (scheduleBlocked) {
        appToast(scheduleBlocked, 'error');
        return;
      }
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, ...result.patch } : r))
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          replacement_request: result.replacement,
          assigned_guard_id: guardId,
          status: 'accepted',
          pending_guard_id: null,
          staff_approved_guard_at: null,
          en_route_at: null,
          arrived_at: null,
          guard_live_location: null,
          applicants: result.patch.applicants,
        })
        .eq('id', requestId);
    }
    if (currentUser && guard) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: job.clientId,
        requestId,
        guardId,
        guardName: guard.name,
        title: 'Replacement guard assigned',
        body: `${guard.name} accepted the replacement mission for "${job.title}".`,
      });
      void reportPushEvent(currentUser, {
        type: 'assignment',
        recipientUserId: guardId,
        requestId,
        body: `You are booked for "${job.title}" via emergency replacement.`,
      });
    }
    appToast('Mission accepted — you are assigned.', 'success');
  };

  const triggerNoShowReplacement = async (job: SecurityRequest) => {
    if (job.replacementRequest?.status === 'offering' || job.replacementRequest?.status === 'filled') {
      return;
    }
    const replacement = createReplacementRequest(job, {
      requestedBy: 'system',
      reason: 'no-show',
      previousGuardId: job.assignedGuardId ?? undefined,
    });
    const candidates = findReplacementCandidates(
      job,
      guards,
      requests,
      job.assignedGuardId ? [job.assignedGuardId] : []
    );
    const withOffers = startReplacementOffers(
      { ...job, replacementRequest: replacement, noShow: true },
      candidates
    );
    const patch = {
      noShow: true,
      replacementRequest: withOffers ?? { ...replacement, status: 'failed' as const },
    };
    setRequests((prev) =>
      prev.map((r) => (r.id === job.id ? { ...r, ...patch } : r))
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          no_show: true,
          replacement_request: patch.replacementRequest,
        })
        .eq('id', job.id);
    }
    if (withOffers?.status === 'offering' && withOffers.offeredGuardIds.length) {
      await broadcastReplacementOffers(job, withOffers.offeredGuardIds);
      if (currentUser) {
        void reportPushEvent(currentUser, {
          type: 'assignment',
          recipientUserId: job.clientId,
          requestId: job.id,
          title: 'Guard no-show',
          body: `Scheduled guard did not start the job for "${job.title}". Searching for a replacement.`,
          priority: 'high',
        });
      }
    }
  };

  useEffect(() => {
    if (!isDbConnected) return;
    const interval = setInterval(() => {
      const needing = jobsNeedingNoShowReplacement(requests);
      for (const job of needing) {
        void triggerNoShowReplacement(job);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isDbConnected, requests, guards, currentUser?.id]);

  const persistShiftAuditViolations = async (
    requestId: string,
    violations: SecurityRequest['shiftAuditViolations']
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, shiftAuditViolations: violations } : r))
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ shift_audit_violations: violations ?? [] })
        .eq('id', requestId);
    }
  };

  const handleClientVerifyStartCheckpoint = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing?.checkInAudit?.checkedAt) {
      appToast('Start-of-shift package is not available yet.', 'error');
      return;
    }
    const checkInAudit = {
      ...existing.checkInAudit,
      clientConfirmedAt: new Date().toISOString(),
      clientConfirmedBy: currentUser.name,
    };
    const violations = markCheckpointVerified(existing.shiftAuditViolations, 'start');
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, checkInAudit, shiftAuditViolations: violations }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ check_in_audit: checkInAudit, shift_audit_violations: violations })
        .eq('id', requestId);
    }
    if (existing.assignedGuardId) {
      void reportPushEvent(currentUser, {
        type: 'guard_checkin',
        guardId: existing.assignedGuardId,
        requestId,
        location: existing.location,
        body: `Client verified your start-of-shift package for "${existing.title}".`,
      });
    }
    appToast('Start of shift verified.', 'success');
  };

  const handleClientVerifyEndCheckpoint = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing?.checkOutAudit?.checkedAt) {
      appToast('End-of-shift package is not available yet.', 'error');
      return;
    }
    const checkOutAudit = {
      ...existing.checkOutAudit,
      clientConfirmedAt: new Date().toISOString(),
      clientConfirmedBy: currentUser.name,
    };
    const violations = markCheckpointVerified(existing.shiftAuditViolations, 'end');
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, checkOutAudit, shiftAuditViolations: violations }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ check_out_audit: checkOutAudit, shift_audit_violations: violations })
        .eq('id', requestId);
    }
    if (existing.assignedGuardId) {
      void reportPushEvent(currentUser, {
        type: 'guard_clockout',
        guardId: existing.assignedGuardId,
        requestId,
        location: existing.location,
        body: `Client verified your end-of-shift package for "${existing.title}".`,
      });
    }
    appToast('End of shift verified.', 'success');
  };

  const handleClientFlagStartCheckpoint = async (
    requestId: string,
    category: string,
    note: string
  ) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing?.assignedGuardId) return;
    const violation = createClientCheckpointFlag({
      checkpoint: 'start',
      category,
      label: flagReasonLabel('start', category),
      description: note,
      guardId: existing.assignedGuardId,
      reportedByClientId: currentUser.id,
      reportedByClientName: currentUser.name,
    });
    const violations = mergeShiftAuditViolations(existing.shiftAuditViolations, [violation]);
    await persistShiftAuditViolations(requestId, violations);
    notifyAccountUpdate(
      currentUser,
      existing.assignedGuardId,
      'Start-of-shift issue flagged',
      `Client flagged "${violation.label}" on "${existing.title}". You may dispute within 48 hours.`
    );
    appToast('Start-of-shift issue flagged.', 'success');
  };

  const handleClientFlagEndCheckpoint = async (
    requestId: string,
    category: string,
    note: string
  ) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing?.assignedGuardId || !existing.checkOutAudit?.checkedAt) return;
    const violation = createClientCheckpointFlag({
      checkpoint: 'end',
      category,
      label: flagReasonLabel('end', category),
      description: note,
      guardId: existing.assignedGuardId,
      reportedByClientId: currentUser.id,
      reportedByClientName: currentUser.name,
      reviewExpiresAt: new Date(
        new Date(existing.checkOutAudit.checkedAt).getTime() + 48 * 60 * 60 * 1000
      ).toISOString(),
    });
    const violations = mergeShiftAuditViolations(existing.shiftAuditViolations, [violation]);
    await persistShiftAuditViolations(requestId, violations);
    notifyAccountUpdate(
      currentUser,
      existing.assignedGuardId,
      'End-of-shift issue flagged',
      `Client flagged "${violation.label}" on "${existing.title}". You may dispute within 48 hours.`
    );
    appToast('End-of-shift issue flagged.', 'success');
  };

  const handleGuardDisputeShiftAuditViolation = async (
    requestId: string,
    violationId: string,
    guardNote: string
  ) => {
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !activeGuardId) return;
    const violations = submitGuardDispute(existing.shiftAuditViolations ?? [], violationId, guardNote);
    await persistShiftAuditViolations(requestId, violations);
    appToast('Dispute submitted. Guardr will review if the client does not respond.', 'success');
  };

  const handleStaffResolveAuditViolation = async (
    requestId: string,
    violationId: string,
    action: 'uphold' | 'dismiss',
    resolutionNote?: string
  ) => {
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !currentUser) return;
    const violations = resolveAuditViolation(
      existing.shiftAuditViolations ?? [],
      violationId,
      action,
      currentUser.name,
      resolutionNote
    );
    await persistShiftAuditViolations(requestId, violations);
    const violation = violations.find((v) => v.id === violationId);
    if (violation?.guardId) {
      notifyAccountUpdate(
        currentUser,
        violation.guardId,
        'Audit dispute resolved',
        action === 'uphold'
          ? `Guardr upheld the client report: ${violation.label}.`
          : `Guardr dismissed the client report: ${violation.label}.`
      );
    }
    appToast(action === 'uphold' ? 'Violation upheld.' : 'Violation dismissed.', 'success');
  };

  const handleClientConfirmSelfAudit = async (requestId: string) => {
    await handleClientVerifyStartCheckpoint(requestId);
  };

  useEffect(() => {
    if (!isDbConnected) return;
    const tick = () => {
      setRequests((prev) => {
        let changed = false;
        const next = prev.map((req) => {
          const processed = processAutoUpholdDisputes(req.shiftAuditViolations);
          if (JSON.stringify(processed) === JSON.stringify(req.shiftAuditViolations ?? [])) {
            return req;
          }
          changed = true;
          return { ...req, shiftAuditViolations: processed };
        });
        if (!changed) return prev;
        void Promise.all(
          next
            .filter((req, index) => req !== prev[index])
            .map((req) =>
              supabase
                .from('security_requests')
                .update({ shift_audit_violations: req.shiftAuditViolations ?? [] })
                .eq('id', req.id)
            )
        );
        return next;
      });
    };
    tick();
    const id = window.setInterval(tick, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [isDbConnected]);

  const persistGuardPayoutInvoiceToDb = async (invoice: GuardPayoutInvoice) => {
    if (!isDbConnected) return;
    try {
      await supabase.from('guard_payout_invoices').upsert({
        id: invoice.id,
        guard_id: invoice.guardId,
        guard_name: invoice.guardName,
        guard_email: invoice.guardEmail,
        method: invoice.method,
        job_ids: invoice.jobIds,
        lines: invoice.lines,
        total: invoice.total,
        status: invoice.status,
        created_at: invoice.createdAt,
        resolved_at: invoice.resolvedAt ?? null,
      });
    } catch (e) {
      console.warn('Guard payout invoice DB sync:', e);
    }
  };

  const appendGuardPayoutInvoice = async (invoice: GuardPayoutInvoice) => {
    setGuardPayoutInvoices((prev) => {
      const next = [invoice, ...prev];
      saveGuardPayoutInvoicesToStorage(next);
      return next;
    });
    await persistGuardPayoutInvoiceToDb(invoice);
  };

  const syncOpenPayoutInvoices = async (nextRequests: SecurityRequest[]) => {
    let changed: GuardPayoutInvoice[] = [];
    setGuardPayoutInvoices((prev) => {
      const next = prev.map((invoice) => {
        const updated = maybeCompletePayoutInvoice(invoice, nextRequests);
        if (updated !== invoice) changed.push(updated);
        return updated;
      });
      if (changed.length > 0) saveGuardPayoutInvoicesToStorage(next);
      return next;
    });
    for (const invoice of changed) {
      await persistGuardPayoutInvoiceToDb(invoice);
    }
  };

  const handleCompletePayoutInvoice = async (invoiceId: string) => {
    const now = new Date().toISOString();
    let updated: GuardPayoutInvoice | null = null;
    setGuardPayoutInvoices((prev) => {
      const next = prev.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice;
        updated = { ...invoice, status: 'completed', resolvedAt: now };
        return updated;
      });
      saveGuardPayoutInvoicesToStorage(next);
      return next;
    });
    if (updated) await persistGuardPayoutInvoiceToDb(updated);
    if (currentUser && updated) {
      const methodLabel = 'bank transfer';
      notifyAccountUpdate(
        currentUser,
        updated.guardId,
        'Payout processed',
        `Your $${updated.total.toFixed(2)} ${methodLabel} payout for ${updated.lines.length} job(s) has been processed.`
      );
    }
  };

  const submitGuardPayoutInvoice = async (
    guard: SecurityGuard,
    method: 'stripe',
    eligible: SecurityRequest[]
  ) => {
    const draft = createGuardPayoutInvoiceRecord({ guard, method, jobs: eligible });
    const label = 'bank transfer';
    if (
      !(await showAppConfirm({
        title: 'Send payout invoice?',
        message: `Send a $${draft.total.toFixed(2)} ${label} invoice to Payments for ${eligible.length} completed job(s)?`,
        confirmLabel: 'Send invoice',
      }))
    ) {
      return;
    }
    await appendGuardPayoutInvoice(draft);
    if (currentUser) {
      void reportPushEvent(currentUser, {
        type: 'payment_attention',
        body: `${guard.name} requested a $${draft.total.toFixed(2)} ${label} payout for ${eligible.length} job(s)`,
      });
    }
    appToast(`Bank transfer invoice sent to Payments. Request again anytime you have more unpaid jobs.`, 'success');
  };

  const handleGuardRequestCashPayout = async (_guardId: string) => {
    appToast('Cash pickup is not supported. Use bank transfer from Pay.', 'error');
  };

  const handleGuardRequestStripePayout = async (guardId: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return;
    const eligible = getGuardStripePayoutEligibleJobs(guardId, requests);
    if (eligible.length === 0) {
      appToast('No earnings are available for a bank payout invoice right now.', 'error');
      return;
    }
    await submitGuardPayoutInvoice(guard, 'stripe', eligible);
  };

  const handleReleasePayout = async (requestId: string, force = false) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.assignedGuardId) {
      appToast('No guard has picked up this job yet.', 'error');
      return;
    }
    if (req.guardPayoutMethod === 'cash' || req.guardPayoutMethod === 'stripe') {
      appToast('This guard was already paid for this job.', 'error');
      return;
    }
    const guard = guards.find(g => g.id === req.assignedGuardId);
    if (!guard?.stripeConnectAccountId) {
      appToast('Guard has not connected a Stripe account.', 'error');
      return;
    }
    try {
      const result = await releasePayout({
        jobId: requestId,
        guardConnectAccountId: guard.stripeConnectAccountId,
        hourlyRate: req.hourlyRate,
        durationHours: req.durationHours,
        force,
      });
      await handleJobPaymentStatus(requestId, 'released');
      const nextRequests = requests.map((r) =>
        r.id === requestId ? { ...r, paymentStatus: 'released' as const, guardPayoutMethod: 'stripe' as const } : r
      );
      setRequests(nextRequests);
      if (isDbConnected) {
        await supabase
          .from('security_requests')
          .update({ guard_payout_method: 'stripe' })
          .eq('id', requestId);
      }
      setPayments(prev => prev.map(p =>
        p.jobId === requestId
          ? { ...p, status: 'released', stripeTransferId: result.transferId, paymentMethod: 'stripe' }
          : p
      ));
      if (isDbConnected) {
        const payment = payments.find((p) => p.jobId === requestId);
        if (payment) {
          await supabase
            .from('payments')
            .update({ status: 'released', payment_method: 'stripe', stripe_transfer_id: result.transferId })
            .eq('id', payment.id);
        }
      }
      await syncOpenPayoutInvoices(nextRequests);
      appToast(`Payout released: $${(result.amountCents / 100).toFixed(2)} sent to guard.`, 'success');
      if (currentUser && req.assignedGuardId) {
        notifyAccountUpdate(
          currentUser,
          req.assignedGuardId,
          'Payout sent',
          `$${(result.amountCents / 100).toFixed(2)} was sent to your bank for "${req.title}".`
        );
      }
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Payout failed', 'error');
    }
  };

  const processDueAutoPayouts = useCallback(async () => {
    if (!platformSettings.autoStripePayoutEnabled) return;
    if (!currentUser || !isStaffRole(currentUser.role)) return;
    for (const req of requests) {
      if (req.status !== 'completed' || !req.autoPayoutScheduledAt) continue;
      if (!isAutoPayoutDue(req.autoPayoutScheduledAt)) continue;
      if (req.paymentStatus === 'released') continue;
      if (!shouldScheduleAutoStripePayout(req)) continue;
      if (!req.guardPayoutAvailable) {
        await handleMakeGuardPayoutAvailable(req.id, { autoRelease: true });
      }
      await handleReleasePayout(req.id);
      if (isDbConnected) {
        await supabase
          .from('security_requests')
          .update({ auto_payout_scheduled_at: null })
          .eq('id', req.id);
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, autoPayoutScheduledAt: undefined } : r))
      );
    }
  }, [platformSettings.autoStripePayoutEnabled, requests, currentUser]);

  useEffect(() => {
    if (!currentUser || !isDbConnected || !isStaffRole(currentUser.role)) return;
    const timer = window.setInterval(() => {
      void processDueAutoPayouts();
    }, 60_000);
    void processDueAutoPayouts();
    return () => window.clearInterval(timer);
  }, [currentUser, isDbConnected, processDueAutoPayouts]);

  const handleRefundPayment = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.stripePaymentIntentId) {
      appToast('No payment to refund for this job.', 'error');
      return;
    }
    try {
      await refundPayment({ paymentIntentId: req.stripePaymentIntentId, jobId: requestId });
      await handleJobPaymentStatus(requestId, 'unpaid');
      setPayments(prev => prev.map(p =>
        p.jobId === requestId ? { ...p, status: 'refunded' } : p
      ));
      appToast('Payment refunded successfully.', 'success');
      if (currentUser && req) {
        notifyAccountUpdate(
          currentUser,
          req.clientId,
          'Payment refunded',
          `Your payment for "${req.title}" was refunded.`
        );
        if (req.assignedGuardId) {
          notifyAccountUpdate(
            currentUser,
            req.assignedGuardId,
            'Job payment refunded',
            `The client payment for "${req.title}" was refunded.`
          );
        }
        notifyStaffAttention(currentUser, `Refund processed for "${req.title}".`, { requestId });
      }
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Refund failed', 'error');
    }
  };

  const handleUpdateGuardStripeAccount = async (guardId: string, accountId: string) => {
    const member = guards.find((g) => g.id === guardId);
    let stripePayoutsEnabled = false;
    try {
      stripePayoutsEnabled = (await getConnectAccountStatus(accountId)).payoutsEnabled;
    } catch {
      stripePayoutsEnabled = false;
    }
    const nextMember =
      member?.isStaff && member.userStatus === 'approved'
        ? withAutoStaffActivation(
            { ...member, stripeConnectAccountId: accountId },
            { stripePayoutsEnabled },
          )
        : member
          ? { ...member, stripeConnectAccountId: accountId }
          : null;
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return nextMember ?? { ...g, stripeConnectAccountId: accountId };
      }),
    );
    if (isDbConnected) {
      const table = member?.isStaff ? 'staff' : 'guards';
      await supabase.from(table).update({ stripe_connect_account_id: accountId }).eq('id', guardId);
      if (member?.isStaff && nextMember && nextMember.userStatus === 'active' && member.userStatus !== 'active') {
        await supabase
          .from('staff')
          .update(staffAutoActivationRowPatch(member, nextMember) ?? { user_status: 'active' })
          .eq('id', guardId);
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    const jobId = params.get('job_id');
    const depositResult = params.get('deposit');
    const tipResult = params.get('tip');
    const stripeConnect = params.get('stripe_connect');

    const clearEphemeralQuery = () => {
      const route = parseAppRoute(
        stripEphemeralQueryParams(window.location.pathname + window.location.search)
      );
      if (route) {
        syncAppRoute(route, true);
        return;
      }
      window.history.replaceState(window.history.state ?? { home: true }, '', window.location.pathname);
    };

    if (paymentResult === 'success' && jobId) {
      void loadFromSupabase();
      if (currentUser) {
        void reportPushEvent(currentUser, {
          type: 'payment_attention',
          requestId: jobId,
          body: 'Client card payment received — job may be ready for guard assignment',
        });
      }
      if (currentUser?.role === 'client') {
        setClientViewState('invoices');
        setClientInvoiceRequestIdState(jobId);
        syncAppRoute(
          { role: 'client', clientView: 'invoices', clientInvoiceRequestId: jobId },
          true
        );
      }
      showAppToast('Payment received', {
        body: 'Your job status will update shortly.',
        tone: 'success',
      });
      clearEphemeralQuery();
    } else if (paymentResult === 'cancelled') {
      showAppToast('Payment cancelled', { tone: 'info' });
      clearEphemeralQuery();
    }

    if (depositResult === 'success' && jobId) {
      void loadFromSupabase();
      if (currentUser && isStaffRole(currentUser.role)) {
        setStaffSectionState('payments');
        syncAppRoute({ role: 'staff', staffSection: 'payments' }, true);
      }
      showAppToast('Deposit received', {
        body: 'Stripe balance will update for this job shortly.',
        tone: 'success',
      });
      clearEphemeralQuery();
    } else if (depositResult === 'cancelled') {
      showAppToast('Deposit cancelled', { tone: 'info' });
      clearEphemeralQuery();
    }

    if (tipResult === 'success' && jobId) {
      void loadFromSupabase();
      if (currentUser?.role === 'client') {
        setClientViewState('requests');
        syncAppRoute({ role: 'client', clientView: 'requests' }, true);
      }
      showAppToast('Tip sent', {
        body: 'Thank you — your guard will receive the tip shortly.',
        tone: 'success',
      });
      clearEphemeralQuery();
    } else if (tipResult === 'cancelled') {
      showAppToast('Tip checkout cancelled', {
        body: 'Your review was saved. You can leave a tip later from the job if needed.',
        tone: 'info',
      });
      clearEphemeralQuery();
    }

    if (stripeConnect === 'success' || stripeConnect === 'refresh') {
      void loadFromSupabase().then(async () => {
        if (!currentUser) return;
        const profile = guards.find((g) => g.id === currentUser.id && g.isStaff);
        if (!profile?.stripeConnectAccountId || profile.userStatus !== 'approved') return;
        let payoutsEnabled = false;
        try {
          payoutsEnabled = (await getConnectAccountStatus(profile.stripeConnectAccountId)).payoutsEnabled;
        } catch {
          return;
        }
        const activated = withAutoStaffActivation(profile, { stripePayoutsEnabled: payoutsEnabled });
        if (activated.userStatus === profile.userStatus) return;
        setGuards((prev) => prev.map((g) => (g.id === profile.id ? activated : g)));
        if (isDbConnected) {
          await supabase
            .from('staff')
            .update(staffAutoActivationRowPatch(profile, activated) ?? { user_status: 'active' })
            .eq('id', profile.id);
        }
      });
      if (currentUser?.role === 'guard') {
        setGuardTabState('earnings');
        syncAppRoute({ role: 'guard', guardTab: 'earnings' }, true);
      }
      showAppToast(
        stripeConnect === 'success' ? 'Stripe connected' : 'Continue Stripe setup',
        {
          body:
            stripeConnect === 'success'
              ? isStaffRole(currentUser?.role ?? 'client')
                ? 'Your payout account is linked. Finish any remaining onboarding steps if prompted.'
                : 'Your payout account is linked. Earnings will update shortly.'
              : 'Return here to finish connecting your payout account.',
          tone: stripeConnect === 'success' ? 'success' : 'info',
        }
      );
      clearEphemeralQuery();
    }
  }, [currentUser]);

  // ── Compliance violations ──────────────────────────────────
  const handleRecordAuditViolation = async (guardId: string, reason?: string) => {
    let autoSuspend = false;
    setGuards(prev => prev.map(g => {
      if (g.id !== guardId) return g;
      const fails = (g.failedAudits || 0) + 1;
      if (fails >= 3) autoSuspend = true;
      return { ...g, failedAudits: fails, userStatus: fails >= 3 ? 'suspended' : getGuardUserStatus(g) };
    }));
    if (autoSuspend) {
      appToast('🚨 AUTOMATED ACTION: 3 compliance violations logged. Account automatically suspended.', 'success');
    } else {
      appToast(`⚠ Compliance warning recorded: ${reason || 'Failed audit'}`, 'info');
    }
    if (isDbConnected) {
      const g = guards.find(x => x.id === guardId);
      if (g) {
        const fails = (g.failedAudits || 0) + 1;
        await supabase
          .from('guards')
          .update({
            failed_audits: fails,
            user_status: fails >= 3 ? 'suspended' : getGuardUserStatus(g),
          })
          .eq('id', guardId);
      }
    }
    if (currentUser) {
      const guard = guards.find((g) => g.id === guardId);
      if (autoSuspend) {
        notifyAccountUpdate(
          currentUser,
          guardId,
          'Account suspended',
          'Your account was automatically suspended after 3 compliance violations. Contact Guardr support.'
        );
        notifyStaffAttention(
          currentUser,
          `${guard?.name ?? 'Guard'} auto-suspended after 3 compliance violations.`,
          { title: 'Auto-suspension' }
        );
      } else {
        notifyAccountUpdate(
          currentUser,
          guardId,
          'Compliance warning',
          reason ? `Compliance issue recorded: ${reason}` : 'A compliance warning was recorded on your account.'
        );
        notifyStaffAttention(
          currentUser,
          `${guard?.name ?? 'Guard'} compliance warning: ${reason || 'Failed audit'}`,
          { title: 'Compliance alert' }
        );
      }
    }
  };

  const handleResetAuditFailures = async (guardId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, failedAudits: 0, userStatus: 'active' } : g));
    if (isDbConnected) {
      await supabase
        .from('guards')
        .update({ failed_audits: 0, user_status: 'active' })
        .eq('id', guardId);
    }
    appToast('✓ Compliance record cleared. Account reinstated.', 'success');
    if (currentUser) {
      notifyAccountUpdate(
        currentUser,
        guardId,
        'Account reinstated',
        'Your compliance record was cleared and your account is active again.'
      );
    }
  };

  const persistJobChatThreadToDb = async (thread: JobChatThread) => {
    if (!isDbConnected) return;
    try {
      await supabase.from('job_chat_threads').upsert({
        id: thread.id,
        request_id: thread.requestId,
        client_id: thread.clientId,
        guard_id: thread.guardId,
        status: thread.status,
        created_at: thread.createdAt,
        archived_at: thread.archivedAt ?? null,
      });
    } catch (e) {
      console.warn('Job chat thread DB sync:', e);
    }
  };

  /**
   * Returns whether the message actually reached the shared thread. The
   * previous version never checked Supabase's `{ error }` return (only a
   * thrown exception was caught), so a rejected write — e.g. an RLS policy
   * failure — looked identical to success: the sender's own device already
   * shows the message via localStorage, but it never reaches the other
   * participant's thread, and they'd still get a "new message" push
   * notification for a message they can never actually see.
   */
  const persistJobChatMessageToDb = async (message: JobChatMessage): Promise<boolean> => {
    if (!isDbConnected) return false;
    try {
      const { error } = await supabase.from('job_chat_messages').upsert({
        id: message.id,
        thread_id: message.threadId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        body: message.body,
        created_at: message.createdAt,
      });
      if (error) {
        console.warn('Job chat message DB sync:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Job chat message DB sync:', e);
      return false;
    }
  };

  const persistStaffMessageToDb = async (message: StaffMessage) => {
    let persisted = false;
    if (isDbConnected) {
      try {
        const { error } = await supabase.from('staff_messages').upsert({
          id: message.id,
          sender_id: message.senderId,
          sender_name: message.senderName,
          sender_role: message.senderRole,
          body: message.body,
          created_at: message.createdAt,
        });
        if (!error) persisted = true;
        else console.warn('Staff message DB sync:', error);
      } catch (e) {
        console.warn('Staff message DB sync:', e);
      }
    }
    if (!persisted && currentUser && isStaffRole(currentUser.role)) {
      try {
        await postStaffMessageToApi(currentUser, message);
      } catch (e) {
        console.warn('Staff message API sync:', e);
      }
    }
  };

  const guardRecordForUser = (user: SessionUser) =>
    user.role === 'guard'
      ? verifiedGuards.find((g) => g.id === user.id) ?? guards.find((g) => g.id === user.id) ?? null
      : null;

  const clientRecordForUser = (user: SessionUser) =>
    user.role === 'client' ? clients.find((c) => c.id === user.id) ?? null : null;

  const persistGuardMessageToDb = async (message: GuardMessage) => {
    let persisted = false;
    if (isDbConnected) {
      try {
        const { error } = await supabase.from('guard_messages').upsert({
          id: message.id,
          sender_id: message.senderId,
          sender_name: message.senderName,
          sender_role: message.senderRole,
          body: message.body,
          created_at: message.createdAt,
        });
        if (!error) persisted = true;
        else console.warn('Guard message DB sync:', error);
      } catch (e) {
        console.warn('Guard message DB sync:', e);
      }
    }
    if (!persisted && currentUser && canPostToGuardChat(currentUser, guardRecordForUser(currentUser))) {
      try {
        await postGuardMessageToApi(currentUser, message);
      } catch (e) {
        console.warn('Guard message API sync:', e);
      }
    }
  };

  const handleSendGuardMessage = async (body: string) => {
    if (!currentUser || !body.trim()) return;
    if (!canPostToGuardChat(currentUser, guardRecordForUser(currentUser))) return;
    const message = buildGuardMessage(currentUser, body);
    beginLocalMutation();
    setGuardMessages((prev) => {
      const next = [...prev, message];
      saveGuardMessagesToStorage(next);
      return next;
    });
    await persistGuardMessageToDb(message);
    trackStaffWorkActionForUser(currentUser, {
      action: 'guard_message_sent',
      label: 'Guard message sent',
    });
    void reportPushEvent(currentUser, {
      type: 'guard_message',
      body: `${currentUser.name}: ${body.trim().slice(0, 120)}`,
    });
  };

  const persistClientMessageToDb = async (message: ClientMessage) => {
    let persisted = false;
    if (isDbConnected) {
      try {
        const { error } = await supabase.from('client_messages').upsert({
          id: message.id,
          sender_id: message.senderId,
          sender_name: message.senderName,
          sender_role: message.senderRole,
          body: message.body,
          created_at: message.createdAt,
        });
        if (!error) persisted = true;
        else console.warn('Client message DB sync:', error);
      } catch (e) {
        console.warn('Client message DB sync:', e);
      }
    }
    if (!persisted && currentUser && canPostToClientChat(currentUser, clientRecordForUser(currentUser))) {
      try {
        await postClientMessageToApi(currentUser, message);
      } catch (e) {
        console.warn('Client message API sync:', e);
      }
    }
  };

  const handleSendClientMessage = async (body: string) => {
    if (!currentUser || !body.trim()) return;
    if (!canPostToClientChat(currentUser, clientRecordForUser(currentUser))) return;
    const message = buildClientMessage(currentUser, body);
    beginLocalMutation();
    setClientMessages((prev) => {
      const next = [...prev, message];
      saveClientMessagesToStorage(next);
      return next;
    });
    await persistClientMessageToDb(message);
    trackStaffWorkActionForUser(currentUser, {
      action: 'client_message_sent',
      label: 'Customer message sent',
    });
    void reportPushEvent(currentUser, {
      type: 'client_message',
      body: `${currentUser.name}: ${body.trim().slice(0, 120)}`,
    });
  };

  const ensureJobChatThread = async (req: SecurityRequest) => {
    if (approvedJobGuardIds(req).length === 0) return null;
    const existing = threadForRequest(jobChatThreads, req.id);
    if (existing) return existing;

    const thread = buildJobChatThread(req);
    setJobChatThreads((prev) => {
      const next = [thread, ...prev.filter((t) => t.requestId !== req.id)];
      saveJobChatThreadsToStorage(next);
      return next;
    });
    await persistJobChatThreadToDb(thread);
    return thread;
  };

  const archiveJobChatThread = async (requestId: string) => {
    const now = new Date().toISOString();
    setJobChatThreads((prev) => {
      const next = prev.map((t) =>
        t.requestId === requestId && t.status === 'active'
          ? { ...t, status: 'archived' as const, archivedAt: now }
          : t
      );
      saveJobChatThreadsToStorage(next);
      return next;
    });
    if (isDbConnected) {
      try {
        await supabase
          .from('job_chat_threads')
          .update({ status: 'archived', archived_at: now })
          .eq('request_id', requestId);
      } catch (e) {
        console.warn('Job chat archive DB sync:', e);
      }
    }
  };

  const notifyJobChatParticipants = async (
    req: SecurityRequest,
    sender: SessionUser,
    body: string
  ) => {
    if (!currentUser) return;
    const recipients = new Set<string>();
    if (sender.id !== req.clientId) recipients.add(req.clientId);
    for (const guardId of approvedJobGuardIds(req)) {
      if (guardId !== sender.id) recipients.add(guardId);
    }

    for (const recipientUserId of recipients) {
      void reportPushEvent(currentUser, {
        type: 'job_chat_message',
        recipientUserId,
        requestId: req.id,
        body: `${sender.name}: ${body.slice(0, 120)}`,
      });
    }

    if (!isStaffRole(sender.role)) {
      void reportPushEvent(currentUser, {
        type: 'job_chat_message',
        requestId: req.id,
        body: `${sender.name} on ${req.title}: ${body.slice(0, 100)}`,
      });
    }
  };

  const handleSendJobChatMessage = async (requestId: string, body: string) => {
    if (!currentUser || !body.trim()) return;
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    let thread = threadForRequest(jobChatThreads, requestId);
    if (!thread) {
      thread = (await ensureJobChatThread(req)) ?? undefined;
    }
    if (!thread) return;

    const message = buildJobChatMessage(thread, currentUser, body);
    beginLocalMutation();
    setJobChatMessages((prev) => {
      const next = [...prev, message];
      saveJobChatMessagesToStorage(next);
      return next;
    });
    const synced = await persistJobChatMessageToDb(message);
    if (!synced) {
      // Message still shows locally (it's already in state/localStorage
      // above), but don't tell the other participant a message is waiting
      // when it never actually reached the shared thread for them to read.
      appToast('Message saved on this device but failed to send — check your connection and try again.', 'error');
      return;
    }
    await notifyJobChatParticipants(req, currentUser, body.trim());
    trackStaffWorkActionForUser(currentUser, {
      action: 'job_chat_message_sent',
      label: 'Job chat message sent',
    });
  };

  const handleSendStaffMessage = async (body: string) => {
    if (!currentUser || !body.trim() || !isStaffRole(currentUser.role)) return;
    const message = buildStaffMessage(currentUser, body);
    beginLocalMutation();
    setStaffMessages((prev) => {
      const next = [...prev, message];
      saveStaffMessagesToStorage(next);
      return next;
    });
    await persistStaffMessageToDb(message);
    trackStaffWorkActionForUser(currentUser, {
      action: 'staff_message_sent',
      label: 'Staff message sent',
    });
    void reportPushEvent(currentUser, {
      type: 'staff_message',
      body: `${currentUser.name}: ${body.trim().slice(0, 120)}`,
    });
  };

  const notifySupportParticipants = async (
    ticket: SupportTicket,
    sender: SessionUser,
    body: string
  ) => {
    if (!currentUser) return;

    if (isStaffRole(sender.role)) {
      void reportPushEvent(currentUser, {
        type: 'support_message',
        recipientUserId: ticket.userId,
        ticketId: ticket.id,
        body: `Guardr staff replied: ${body.slice(0, 120)}`,
      });
    } else {
      void reportPushEvent(currentUser, {
        type: 'support_message',
        ticketId: ticket.id,
        body: `${ticket.userName} (${ticket.userRole}): ${body.slice(0, 100)}`,
      });
      if (ticket.kind === 'report' && ['payment', 'job-issue'].includes(ticket.category)) {
        void reportPushEvent(currentUser, {
          type: 'dispute_update',
          ticketId: ticket.id,
          requestId: ticket.relatedRequestId,
          title: 'Dispute update',
          body: `${ticket.userName} added to dispute report: ${body.slice(0, 100)}`,
        });
      }
      if (ticket.category === 'safety' && ticket.priority === 'urgent') {
        void reportPushEvent(currentUser, {
          type: 'emergency_alert',
          ticketId: ticket.id,
          requestId: ticket.relatedRequestId,
          body: `Urgent safety support ticket from ${ticket.userName}`,
        });
      }
    }
  };

  const handleSubmitIncidentReport = async (requestId: string, input: IncidentReportFormInput) => {
    if (!currentUser) throw new Error('Your session expired. Sign in again to file this report.');
    const req = requests.find((r) => r.id === requestId);
    if (!req) throw new Error('This job could not be found. Refresh and try again.');
    const guard = guards.find((g) => g.id === req.assignedGuardId) ?? activeGuard;
    if (!guard) throw new Error('Your guard profile could not be loaded. Refresh and try again.');

    const detail = createIncidentReportDetail(input, { id: guard.id, name: guard.name });
    const stamp = new Date().toISOString();
    const existing = req.checkOutAudit;
    const priorReports = existing?.incidentReports ?? [];
    const incidentReports = [...priorReports, detail];

    const incidentReport = {
      hasIncident: true,
      incidentType: detail.incidentType,
      priority: detail.priority,
      occurredAt: detail.occurredAt,
      locationOnSite: detail.locationOnSite,
      description: detail.description,
      partiesInvolved: detail.partiesInvolved,
      witnesses: detail.witnesses,
      causeOrTrigger: detail.causeOrTrigger,
      actionsTaken: detail.actionsTaken,
      authoritiesNotified: detail.authoritiesNotified,
      authorityDetails: detail.authorityDetails,
      injuryInvolved: detail.injuryInvolved,
      propertyDamageInvolved: detail.propertyDamageInvolved,
      injuryDetails: detail.injuryDetails,
      propertyDamageDetails: detail.propertyDamageDetails,
      followUpRequired: detail.followUpRequired,
      followUpNotes: detail.followUpNotes,
      evidenceNotes: detail.evidenceNotes,
      submittedAt: detail.submittedAt,
      submittedByGuardId: detail.submittedByGuardId,
      submittedByGuardName: detail.submittedByGuardName,
    };

    await handleUpdateJobAudit(requestId, {
      checkOutAudit: {
        checkedAt: existing?.checkedAt ?? stamp,
        completed: existing?.completed ?? false,
        noViolations: existing?.noViolations ?? true,
        noEquipmentIssues: existing?.noEquipmentIssues ?? true,
        dailyActivityReport: existing?.dailyActivityReport ?? '',
        incidentReport,
        incidentReports,
        clientNotes: existing?.clientNotes ?? '',
        endSelfie: existing?.endSelfie,
        attachments: existing?.attachments,
        leftEarlier: existing?.leftEarlier,
      },
    });

    const chatBody = incidentChatSummary(detail, guard.name, req.location);
    await handleSendJobChatMessage(requestId, chatBody);
  };

  const persistSupportTicketToDb = async (ticket: SupportTicket) => {
    if (!isDbConnected) return;
    try {
      await supabase.from('support_tickets').upsert({
        id: ticket.id,
        user_id: ticket.userId,
        user_name: ticket.userName,
        user_email: ticket.userEmail,
        user_role: ticket.userRole,
        kind: ticket.kind,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        related_request_id: ticket.relatedRequestId ?? null,
        created_at: ticket.createdAt,
        updated_at: ticket.updatedAt,
      });
      const latest = ticket.messages[ticket.messages.length - 1];
      if (latest) {
        await supabase.from('support_messages').upsert({
          id: latest.id,
          ticket_id: latest.ticketId,
          sender_id: latest.senderId,
          sender_name: latest.senderName,
          sender_role: latest.senderRole,
          body: latest.body,
          created_at: latest.createdAt,
        });
      }
    } catch (e) {
      console.warn('Support ticket DB sync:', e);
    }
  };

  const handleCreateSupportTicket = async (input: CreateSupportTicketInput): Promise<string> => {
    if (!currentUser) return '';
    const ticket = buildNewTicket(currentUser, input);
    beginLocalMutation();
    setSupportTickets((prev) => {
      const next = [ticket, ...prev];
      saveSupportTicketsToStorage(next);
      return next;
    });
    await persistSupportTicketToDb(ticket);
    notifySupportTicketCreated(currentUser, ticket);
    return ticket.id;
  };

  const handleSendSupportMessage = async (ticketId: string, body: string) => {
    if (!currentUser || !body.trim()) return;
    let updated: SupportTicket | null = null;
    beginLocalMutation();
    setSupportTickets((prev) => {
      const next = prev.map((t) => {
        if (t.id !== ticketId) return t;
        updated = appendMessage(t, currentUser, body);
        return updated;
      });
      saveSupportTicketsToStorage(next);
      return next;
    });
    if (!updated) return;
    await persistSupportTicketToDb(updated);
    await notifySupportParticipants(updated, currentUser, body.trim());
    trackStaffWorkActionForUser(currentUser, {
      action: 'support_message_sent',
      label: 'Support message sent',
    });
  };

  const handleDeleteSupportTicket = async (ticketId: string) => {
    if (!currentUser) return;
    const ticket = supportTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    if (!canDeleteResolvedSupportChat(currentUser) || !isDeletableResolvedSupportChat(ticket)) {
      appToast('You can only delete resolved support conversations.', 'error');
      return;
    }
    if (
      !(await showAppConfirm({
        title: 'Delete support conversation?',
        message: `Permanently delete "${ticket.subject}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        tone: 'danger',
      }))
    ) {
      return;
    }

    beginLocalMutation();
    setSupportTickets((prev) => {
      const next = prev.filter((t) => t.id !== ticketId);
      saveSupportTicketsToStorage(next);
      return next;
    });
    if (supportTicketId === ticketId) {
      setSupportTicketId(null);
    }
    if (isDbConnected) {
      try {
        await supabase.from('support_tickets').delete().eq('id', ticketId);
      } catch (e) {
        console.warn('Support ticket delete DB sync:', e);
      }
    }
    appToast('Support conversation deleted.', 'success');
  };

  const confirmDeleteChatMessage = async (body: string) =>
    showAppConfirm({
      title: 'Delete message?',
      message:
        body.trim().length > 160
          ? `${body.trim().slice(0, 160).replace(/\s+/g, ' ')}…`
          : body.trim().replace(/\s+/g, ' '),
      confirmLabel: 'Delete',
      tone: 'danger',
    });

  const handleDeleteStaffMessage = async (messageId: string) => {
    if (!currentUser) return;
    const message = staffMessages.find((entry) => entry.id === messageId);
    if (!message || !canDeleteChatMessage(currentUser, message, 'staff')) {
      appToast('You cannot delete this message.', 'error');
      return;
    }
    if (!(await confirmDeleteChatMessage(message.body))) return;

    beginLocalMutation();
    setStaffMessages((prev) => {
      const next = removeStaffMessage(prev, messageId);
      saveStaffMessagesToStorage(next);
      return next;
    });

    try {
      await deleteStaffMessageFromApi(currentUser, messageId);
    } catch (e) {
      if (isDbConnected) {
        try {
          const { error } = await supabase.from('staff_messages').delete().eq('id', messageId);
          if (error) console.warn('Staff message delete DB sync:', error);
        } catch (dbErr) {
          console.warn('Staff message delete DB sync:', dbErr);
        }
      } else {
        console.warn('Staff message delete API sync:', e);
      }
    }
    appToast('Message deleted.', 'success');
  };

  const handleDeleteGuardMessage = async (messageId: string) => {
    if (!currentUser) return;
    const message = guardMessages.find((entry) => entry.id === messageId);
    if (!message || !canDeleteChatMessage(currentUser, message, 'guard')) {
      appToast('You cannot delete this message.', 'error');
      return;
    }
    if (!(await confirmDeleteChatMessage(message.body))) return;

    beginLocalMutation();
    setGuardMessages((prev) => {
      const next = removeGuardMessage(prev, messageId);
      saveGuardMessagesToStorage(next);
      return next;
    });

    try {
      await deleteGuardMessageFromApi(currentUser, messageId);
    } catch (e) {
      if (isDbConnected) {
        try {
          const { error } = await supabase.from('guard_messages').delete().eq('id', messageId);
          if (error) console.warn('Guard message delete DB sync:', error);
        } catch (dbErr) {
          console.warn('Guard message delete DB sync:', dbErr);
        }
      } else {
        console.warn('Guard message delete API sync:', e);
      }
    }
    appToast('Message deleted.', 'success');
  };

  const handleDeleteClientMessage = async (messageId: string) => {
    if (!currentUser) return;
    const message = clientMessages.find((entry) => entry.id === messageId);
    if (!message || !canDeleteChatMessage(currentUser, message, 'client')) {
      appToast('You cannot delete this message.', 'error');
      return;
    }
    if (!(await confirmDeleteChatMessage(message.body))) return;

    beginLocalMutation();
    setClientMessages((prev) => {
      const next = removeClientMessage(prev, messageId);
      saveClientMessagesToStorage(next);
      return next;
    });

    try {
      await deleteClientMessageFromApi(currentUser, messageId);
    } catch (e) {
      if (isDbConnected) {
        try {
          const { error } = await supabase.from('client_messages').delete().eq('id', messageId);
          if (error) console.warn('Client message delete DB sync:', error);
        } catch (dbErr) {
          console.warn('Client message delete DB sync:', dbErr);
        }
      } else {
        console.warn('Client message delete API sync:', e);
      }
    }
    appToast('Message deleted.', 'success');
  };

  const handleDeleteJobChatMessage = async (messageId: string) => {
    if (!currentUser) return;
    const message = jobChatMessages.find((entry) => entry.id === messageId);
    if (!message || !canDeleteChatMessage(currentUser, message, 'job_chat')) {
      appToast('You cannot delete this message.', 'error');
      return;
    }
    if (!(await confirmDeleteChatMessage(message.body))) return;

    beginLocalMutation();
    setJobChatMessages((prev) => {
      const next = removeJobChatMessage(prev, messageId);
      saveJobChatMessagesToStorage(next);
      return next;
    });

    if (isDbConnected) {
      try {
        const { error } = await supabase.from('job_chat_messages').delete().eq('id', messageId);
        if (error) console.warn('Job chat message delete DB sync:', error);
      } catch (e) {
        console.warn('Job chat message delete DB sync:', e);
      }
    }
    appToast('Message deleted.', 'success');
  };

  const handleDeleteSupportMessage = async (ticketId: string, messageId: string) => {
    if (!currentUser) return;
    const ticket = supportTickets.find((entry) => entry.id === ticketId);
    const message = ticket?.messages.find((entry) => entry.id === messageId);
    if (!ticket || !message || !canDeleteChatMessage(currentUser, message, 'support')) {
      appToast('You cannot delete this message.', 'error');
      return;
    }
    if (!(await confirmDeleteChatMessage(message.body))) return;

    beginLocalMutation();
    setSupportTickets((prev) => {
      const next = prev
        .map((entry) => {
          if (entry.id !== ticketId) return entry;
          const updated = removeSupportTicketMessage(entry, messageId);
          return updated ?? entry;
        })
        .filter(Boolean);
      saveSupportTicketsToStorage(next);
      return next;
    });

    if (isDbConnected) {
      try {
        const { error } = await supabase.from('support_messages').delete().eq('id', messageId);
        if (error) console.warn('Support message delete DB sync:', error);
      } catch (e) {
        console.warn('Support message delete DB sync:', e);
      }
    }
    appToast('Message deleted.', 'success');
  };

  const handleUpdateSupportTicketStatus = async (ticketId: string, status: SupportTicketStatus) => {
    const ticket = supportTickets.find((t) => t.id === ticketId);
    const previousStatus = ticket?.status;
    const now = new Date().toISOString();
    setSupportTickets((prev) => {
      const next = prev.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: now } : t));
      saveSupportTicketsToStorage(next);
      return next;
    });
    if (isDbConnected) {
      try {
        await supabase.from('support_tickets').update({ status, updated_at: now }).eq('id', ticketId);
      } catch (e) {
        console.warn('Support status DB sync:', e);
      }
    }
    if (currentUser && ticket && previousStatus !== status) {
      notifySupportTicketStatus(currentUser, { ...ticket, status, updatedAt: now }, status);
    }
  };

  const handleResolveDispute = async (
    dispute: import('./lib/staffOps').OpsDispute,
    action: import('./lib/staffOps').DisputeResolutionAction
  ) => {
    if (!currentUser) return;
    if (!canHandleDisputes(currentUser)) {
      appToast('You do not have permission to resolve disputes.', 'error');
      return;
    }
    notifyDisputeResolution(currentUser, dispute, action);
    if (!dispute.ticketId) return;
    if (action === 'hold_funds') {
      await handleUpdateSupportTicketStatus(dispute.ticketId, 'in-progress');
      return;
    }
    if (action === 'approve_payout') {
      await handleUpdateSupportTicketStatus(dispute.ticketId, 'resolved');
    }
  };

  // ── Render ─────────────────────────────────────────────────
  const legalAcceptanceRole: LegalUserRole | null = currentUser
    ? currentUser.role === 'client'
      ? 'client'
      : currentUser.role === 'guard'
        ? 'guard'
        : 'staff'
    : null;
  const legalAcceptanceProfileId = currentUser
    ? resolveLegalAcceptanceUserId(currentUser, verifiedGuards, clients)
    : '';
  const legalAcceptanceUserIds = currentUser
    ? resolveLegalAcceptanceUserIds(currentUser, verifiedGuards, clients)
    : [];

  const marketplaceLegalGate =
    currentUser && legalAcceptanceRole ? (
      <LegalAcceptanceModal
        role={legalAcceptanceRole}
        userIds={legalAcceptanceUserIds}
        acceptedKeys={legalAcceptanceKeys}
        onOpenLegal={openLegalPage}
        onAccept={(documentIds) =>
          recordLegalAcceptances(legalAcceptanceRole, legalAcceptanceProfileId, documentIds)
        }
      />
    ) : null;

  const passwordChangeOverlay = currentUser ? (
    <ChangePasswordPrompt
      open={passwordChangePromptOpen}
      userName={currentUser.name}
      onChangePassword={handleChangeAccountPassword}
      onDismiss={handleDismissPasswordChange}
    />
  ) : null;

  const activeOnboardingTour = currentUser ? getTourForRole(currentUser.role) : null;
  const tutorialOverlay =
    currentUser && activeOnboardingTour && tutorialState ? (
      <TutorialExperience
        tour={activeOnboardingTour}
        state={tutorialState}
        onStart={() => {
          const next = startTutorialSession(currentUser.id, currentUser.role);
          setTutorialState(next);
        }}
        onDecline={() => setTutorialState(declineTutorial(currentUser.id))}
        onEnd={() => setTutorialState(endTutorial(currentUser.id))}
        onNext={() => {
          if (!tutorialState) return;
          setTutorialState(advanceTutorialStep(currentUser.id, tutorialState));
        }}
        onBack={() => {
          if (!tutorialState) return;
          setTutorialState(retreatTutorialStep(currentUser.id, tutorialState));
        }}
        navigation={{
          onGuardTab: (tab) => setGuardTab(tab as GuardTab),
          onClientView: (view) => setClientView(view as ClientView),
          onStaffSection: (section) => setStaffSection(section as StaffSection),
        }}
      />
    ) : null;

  const tutorialSettingsProps = currentUser
    ? {
        tutorialAvailable: Boolean(activeOnboardingTour),
        tutorialCompleted: tutorialState?.lifecycle === 'completed',
        tutorialActive: isTutorialActive(tutorialState),
        onStartTutorial: () => {
          const next = restartTutorial(currentUser.id, currentUser.role);
          setTutorialState(next);
        },
      }
    : {};

  if (loading) {
    return <LoadingScreen />;
  }

  if (downloadPageOpen) {
    return (
      <>
        <AppDownloadScreen
          onBack={closeDownloadPage}
          headerRight={
            currentUser ? (
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => undefined}
                onOpenSettings={() => undefined}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            ) : undefined
          }
        />
        <InstallPrompt />
      </>
    );
  }

  if (legalPage) {
    return (
      <>
        <LegalPage
          page={legalPage}
          onBack={closeLegalPage}
          onOpenLegal={openLegalPage}
          headerRight={
            currentUser ? (
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => undefined}
                onOpenSettings={() => undefined}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            ) : undefined
          }
        />
        <InstallPrompt />
      </>
    );
  }

  if (!currentUser) {
    if (publicGuideOpen && !isAppExperience()) {
      return (
        <>
          <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
            <AppGuidePage audience="all" onBack={closePublicGuide} />
          </div>
          <InstallPrompt />
        </>
      );
    }
    if (authChoiceMode && !isAppExperience()) {
      return (
        <>
          <AuthRoleChoicePage
            mode={authChoiceMode}
            signupStep={authSignupPick ?? 'path'}
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            onNavigateToAuth={navigateToAuth}
            onSelectRole={(role) => openAuthView(role, authChoiceMode ?? 'sign-in')}
            onSelectSignupPath={(path) => openAuthChoice('sign-up', path)}
            onSelectClientType={(kind) => openAuthView('client', 'sign-up', kind)}
            onOpenGuide={openPublicGuide}
            onBack={closeAuthChoice}
          />
          <InstallPrompt />
        </>
      );
    }
    if (isAuthView && !isAppExperience()) {
      return (
        <>
          <AuthPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            guardsList={guards}
            clientsList={clients}
            isDbConnected={isDbConnected}
            isAppLoading={loading}
            onBackToHome={closeAuthView}
            onBackToRoleChoice={backToAuthRoleChoice}
            onOpenLegal={openLegalPage}
            onOpenGuide={openPublicGuide}
            onAuthModeChange={setAuthViewMode}
            onAuthRoleChange={setAuthViewRole}
            initialRole={initialAuthRole}
            initialMode={initialAuthMode}
            initialClientType={initialClientType}
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            presentation="page"
          />
          <InstallPrompt />
        </>
      );
    }
    if (isAppExperience()) {
      if (authChoiceMode) {
        return (
          <>
            <AuthRoleChoicePage
              mode={authChoiceMode}
              signupStep={authSignupPick ?? 'path'}
              themeMode={themeMode}
              onChangeTheme={changeThemeMode}
              onNavigateToAuth={navigateToAuth}
              onSelectRole={(role) => openAuthView(role, authChoiceMode ?? 'sign-in')}
              onSelectSignupPath={(path) => openAuthChoice('sign-up', path)}
              onSelectClientType={(kind) => openAuthView('client', 'sign-up', kind)}
              onOpenGuide={openPublicGuide}
              onBack={closeAuthChoice}
            />
            <InstallPrompt />
          </>
        );
      }
      // PWA/APK: full-page auth (not bottom sheets / floating cards).
      if (isAuthView) {
        return (
          <>
            <AuthPage
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              guardsList={guards}
              clientsList={clients}
              isDbConnected={isDbConnected}
              isAppLoading={loading}
              onBackToHome={closeAuthView}
              onBackToRoleChoice={backToAuthRoleChoice}
              onOpenLegal={openLegalPage}
              onOpenGuide={openPublicGuide}
              onAuthModeChange={setAuthViewMode}
              onAuthRoleChange={setAuthViewRole}
              initialRole={initialAuthRole}
              initialMode={initialAuthMode}
              initialClientType={initialClientType}
              themeMode={themeMode}
              onChangeTheme={changeThemeMode}
              presentation="page"
            />
            <InstallPrompt />
          </>
        );
      }
      return (
        <>
          <AppHomeScreen
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            onNavigateToAuth={navigateToAuth}
            onOpenLegal={openLegalPage}
          />
          <InstallPrompt />
        </>
      );
    }
    return (
      <>
        <HomePage
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          ownerMessage={platformSettings.ownerMessage}
          directorMessage={platformSettings.directorMessage}
          companyPlacardDocuments={companyPlacardPublicDocuments}
          onNavigateToAuth={navigateToAuth}
          onOpenLegal={openLegalPage}
          onOpenGuide={openPublicGuide}
        />
        <InstallPrompt />
      </>
    );
  }

  // ── Guard view ─────────────────────────────────────────────
  if (currentUser.role === 'guard') {
    if (!activeGuard?.id) {
      return (
        <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
          <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
            <AccountMenu
              userName={currentUser.name}
              userSubtitle={currentUser.email}
              avatarUrl={currentUser.avatar}
              onOpenProfile={() => setGuardTab('settings')}
              onOpenSettings={() => setGuardTab('settings')}
              onSignOut={handleSignOut}
              hideProfile
              {...accountMenuExtras}
            />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <p className="text-brand-text font-semibold">We could not load your guard profile.</p>
            <p className="text-brand-text-muted text-sm max-w-sm">
              Your sign-in may be out of date after a database change. Sign out and sign in again with your guard email.
            </p>
          </div>
        </div>
      );
    }
    const inactiveGuard = isInactiveGuardSession(currentUser, verifiedGuards);

    if (
      inactiveGuard &&
      resolvedGuardTab !== 'settings' &&
      resolvedGuardTab !== 'support' &&
      resolvedGuardTab !== 'guide'
    ) {
      return (
        <>
          {marketplaceLegalGate}
          {passwordChangeOverlay}
          <div className="page-shell h-[100dvh] flex flex-col overflow-hidden bg-brand-bg">
            <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => setGuardTab('settings')}
                onOpenSettings={() => setGuardTab('settings')}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <AccountPendingScreen
              role="guard"
              guard={activeGuard}
              onOpenProfile={() => setGuardTab('settings')}
              onContactSupport={isGuardAccountApproved(activeGuard) ? openGuardActivationSupport : undefined}
              hasActivationSupportChat={Boolean(activationSupportChat)}
              onAddCertification={(cert) => handleAddCertification(activeGuard.id, cert, 'guard')}
              onDeleteCertification={(certId) => handleDeleteCertification(activeGuard.id, certId)}
              onAttachCertificationImage={(certId, imageUrl) =>
                handleAttachCertificationImage(activeGuard.id, certId, imageUrl)
              }
              onUpdateCertification={(certId, payload) =>
                handleUpdateCertification(activeGuard.id, certId, payload, 'guard')
              }
              onSubmitIdentityVerification={(payload) =>
                handleSubmitGuardIdentityVerification(activeGuard.id, payload)
              }
              onSaveInsurance={(policy) => handleSaveGuardInsurance(policy)}
              />
            </div>
          </div>
          <InstallPrompt />
        </>
      );
    }

    const guardJobs = getGuardVisibleJobs(activeGuard, displayRequests);
    const guardPayouts = getGuardPayoutHistory(activeGuard.id, requests, payments);

    return (
      <>
        {marketplaceLegalGate}
        <GuardDashboard
          guard={activeGuard}
          tab={resolvedGuardTab}
          onTabChange={setGuardTab}
          selectedJobId={guardSelectedJobId}
          onSelectedJobIdChange={setGuardSelectedJobId}
          browseTab={guardBrowseTab}
          onBrowseTabChange={setGuardBrowseTab}
          accountNotifications={accountNotificationMenuProps}
          requests={guardJobs}
          allRequests={requests}
          payments={guardPayouts}
          onAddCertification={(cert) => handleAddCertification(activeGuard.id, cert, 'guard')}
          onDeleteCertification={(certId) => handleDeleteCertification(activeGuard.id, certId)}
          onAttachCertificationImage={(certId, imageUrl) =>
            handleAttachCertificationImage(activeGuard.id, certId, imageUrl)
          }
          onUpdateCertification={(certId, payload) =>
            handleUpdateCertification(activeGuard.id, certId, payload, 'guard')
          }
          onAddExperience={(exp) => handleAddExperience(activeGuard.id, exp)}
          onAddEducation={(edu) => handleAddEducation(activeGuard.id, edu)}
          onSubmitIdentityVerification={(payload) =>
            handleSubmitGuardIdentityVerification(activeGuard.id, payload)
          }
          onSaveInsurance={(policy) => handleSaveGuardInsurance(policy)}
          onSaveVehicleInsurance={(policy) => handleSaveGuardVehicleInsurance(policy)}
          onSaveVehicle={(profile) => handleSaveGuardVehicle(profile)}
          onSubmitVehicle={(profile) => handleSubmitGuardVehicle(profile)}
          onAcceptJob={handleApplyToJob}
          onDeclineDirectJob={handleGuardDeclineDirectJob}
          feeConfig={platformSettings.feeConfig}
          onSubmitPriceOffer={(requestId, input) =>
            void handleSubmitPriceOffer(requestId, activeGuardId, input, 'guard')
          }
          onAcceptPriceOffer={(requestId, offerId) =>
            void handleAcceptPriceOffer(requestId, activeGuardId, offerId)
          }
          coworkerGuards={getBrowsableGuards(verifiedGuards)}
          onUpdateJobAudit={handleUpdateJobAudit}
          onAckPostOrders={handleAckPostOrders}
          onSaveJobPreferences={(prefs) => handleSaveGuardJobPreferences(activeGuardId, prefs)}
          onCompleteJobTypeOnboarding={(jobType) =>
            handleCompleteGuardJobTypeOnboarding(activeGuardId, jobType)
          }
          onStartEnRoute={handleStartEnRoute}
          onUpdateGuardLiveLocation={handleUpdateGuardLiveLocation}
          onAcceptReplacementOffer={(requestId) =>
            void handleAcceptReplacementOffer(requestId, activeGuardId)
          }
          onGuardArrived={(requestId) => {
            void handleGuardArrived(requestId);
          }}
          onAckBriefing={handleAckBriefing}
          onGeofenceLeave={(requestId) => {
            if (!currentUser) return;
            const req = requests.find((r) => r.id === requestId);
            const guard = guards.find((g) => g.id === req?.assignedGuardId) ?? activeGuard;
            void reportPushEvent(currentUser, {
              type: 'guard_left_site',
              guardId: guard?.id,
              guardName: guard?.name,
              requestId,
              location: req?.location,
              priority: 'high',
            });
          }}
          onApproveOvertime={handleGuardApproveOvertime}
          onRecordAuditViolation={handleRecordAuditViolation}
          onDisputeShiftAuditViolation={handleGuardDisputeShiftAuditViolation}
          onUpdateStripeAccount={handleUpdateGuardStripeAccount}
          onSignOut={handleSignOut}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onUpdateProfile={(payload) => handleUpdateGuardProfile(activeGuard.id, payload)}
          currentUser={currentUser}
          supportTickets={supportTickets}
          relatedRequests={guardJobs.filter((r) => r.assignedGuardId === activeGuard.id)}
          onCreateSupportTicket={handleCreateSupportTicket}
          onSendSupportMessage={handleSendSupportMessage}
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          onSendJobChatMessage={handleSendJobChatMessage}
          guardMessages={guardMessages}
          onSendGuardMessage={handleSendGuardMessage}
          onDeleteGuardMessage={handleDeleteGuardMessage}
          onDeleteJobChatMessage={handleDeleteJobChatMessage}
          onDeleteSupportMessage={handleDeleteSupportMessage}
          onRefreshGuardMessages={refreshGuardMessages}
          jobChatRequestId={jobChatRequestId}
          openJobChat={openJobChat}
          initialSelectedJobId={jobChatRequestId && !openJobChat ? jobChatRequestId : null}
          onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
          onJobChatOpenChange={(open) => {
            setOpenJobChatState(open);
            if (!open) setJobChatRequestId(null);
            else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
          }}
          supportTicketId={supportTicketId}
          onSupportTicketIdChange={setSupportTicketId}
          supportMode={supportMode}
          supportSection={supportSection}
          onOpenSupportCompose={openGuardSupportCompose}
          onOpenActivationSupport={openGuardActivationSupport}
          onOpenSupportReport={openGuardSupportReport}
          onCloseSupportForm={closeGuardSupportForm}
          performanceFactorId={performanceFactorId}
          onPerformanceFactorChange={setPerformanceFactorId}
          onSubmitIncidentReport={handleSubmitIncidentReport}
          guardPayoutInvoices={guardPayoutInvoices}
          onRequestStripePayout={() => handleGuardRequestStripePayout(activeGuard.id)}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          isDbConnected={isDbConnected}
          {...tutorialSettingsProps}
        />
        {passwordChangeOverlay}
        {tutorialOverlay}
        <InstallPrompt />
      </>
    );
  }

  // ── Client view ────────────────────────────────────────────
  if (currentUser.role === 'client') {
    const clientRecord = clients.find(c => c.id === currentUser.id);
    // Show only THIS client's requests
    const myRequests = displayRequests.filter(r =>
      r.clientId === currentUser.id ||
      r.clientName === currentUser.clientName ||
      r.clientName === currentUser.name
    );
    const hireableGuards = getBrowsableGuards(verifiedGuards);
    // Pending applicants must remain visible for Approve even if directory filters change.
    const clientGuardsForJobs = (() => {
      const byId = new Map(hireableGuards.map((g) => [g.id, g]));
      for (const req of myRequests) {
        const pendingId = req.pendingGuardId;
        if (pendingId && !byId.has(pendingId)) {
          const pending = verifiedGuards.find((g) => g.id === pendingId);
          if (pending) byId.set(pending.id, pending);
        }
        for (const applicantId of req.applicants ?? []) {
          if (!byId.has(applicantId)) {
            const applicant = verifiedGuards.find((g) => g.id === applicantId);
            if (applicant) byId.set(applicant.id, applicant);
          }
        }
      }
      return [...byId.values()];
    })();
    const clientAccountPending = isClientAccountPending({
      accountStatus: clientRecord?.accountStatus,
      approved: clientRecord?.approved,
    });
    const handleClientNavigate = (view: ClientView) => {
      const allowedView = resolveAllowedClientView(view, clientRecord?.clientType) as ClientView;
      if (
        clientAccountPending &&
        allowedView !== 'home' &&
        allowedView !== 'profile' &&
        allowedView !== 'settings' &&
        allowedView !== 'messages' &&
        allowedView !== 'support' &&
        allowedView !== 'guide' &&
        allowedView !== 'support-compose' &&
        allowedView !== 'support-report' &&
        allowedView !== 'invoices'
      ) {
        setClientView('home');
        return;
      }
      setClientView(allowedView);
    };

    const clientInvoicesBadge = unpaidClientInvoices(clientInvoices, currentUser.id).length;

    const setClientInvoiceRequestId = (requestId: string | null) => {
      setClientInvoiceRequestIdState(requestId);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'invoices',
          clientInvoiceRequestId: requestId ?? undefined,
        })
      );
    };

    const setClientRequestsSelectedId = (jobId: string | null) => {
      setClientRequestsSelectedIdState(jobId);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'requests',
          clientJobId: jobId ?? undefined,
          clientJobsTab: clientRequestsJobTab,
          jobChatRequestId: undefined,
          openJobChat: undefined,
        })
      );
    };

    const setClientRequestsJobTab = (tab: ClientJobsTab) => {
      setClientRequestsJobTabState(tab);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'requests',
          clientJobsTab: tab,
          clientJobId: clientRequestsSelectedId ?? undefined,
        })
      );
    };

    const clientHideHeader =
      clientView === 'support-compose' ||
      clientView === 'support-report' ||
      (clientView === 'guards' && (!!clientGuardId || clientTeamDetailOpen)) ||
      (clientView === 'requests' && !!clientRequestsSelectedId) ||
      (clientView === 'invoices' && !!clientInvoiceRequestId);

    const clientMessagesShellHeaderTrailing =
      clientView === 'messages' || clientView === 'support' ? (
        <div className="shrink-0 flex items-center gap-2">
          <AccountMenu
            userName={currentUser.name}
            userSubtitle={currentUser.email}
            avatarUrl={currentUser.avatar}
            onOpenProfile={() => handleClientNavigate('profile')}
            onOpenSettings={() => handleClientNavigate('settings')}
            onSignOut={handleSignOut}
            active={false}
            {...accountMenuExtras}
          />
        </div>
      ) : null;

    return (
      <>
        {marketplaceLegalGate}
        <ClientCapabilitiesProvider clientType={clientRecord?.clientType}>
        <ClientAppLayout
          currentUser={currentUser}
          companyName={
            clientRecord
              ? clientWorkspaceLabel(clientRecord)
              : currentUser.clientName || currentUser.name || 'Your company'
          }
          onSignOut={handleSignOut}
          activeView={clientView}
          requestsJobTab={clientRequestsJobTab}
          onRequestsJobTabChange={setClientRequestsJobTab}
          onNavigate={handleClientNavigate}
          accountPending={clientAccountPending}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          messagesBadge={clientMessagesBadge(jobChatThreads, supportTickets, currentUser)}
          supportBadge={clientSupportBadge(supportTickets, currentUser)}
          invoicesBadge={clientInvoicesBadge}
          hideHeader={clientHideHeader}
          accountNotifications={accountNotificationMenuProps}
          messagesChrome={clientMessagesChrome}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
        >
          {clientView === 'profile' ? (
            <UserProfileScreen
              currentUser={currentUser}
              client={clientRecord ?? null}
              onSave={(payload) => handleUpdateClientProfile(currentUser.id, payload)}
              onSubmitClientCredential={(credential) =>
                handleSubmitClientCredential(currentUser.id, credential)
              }
              platformSettings={platformSettings}
            />
          ) : clientView === 'settings' ? (
            <div data-tour="client-settings">
            <UserSettingsScreen
              currentUser={currentUser}
              isDbConnected={isDbConnected}
              onOpenLegal={openLegalPage}
              onOpenDownload={openDownloadPage}
            />
            </div>
          ) : clientView === 'support-compose' ? (
            <SupportComposePage
              onBack={() => closeClientSupportForm('support')}
              onCreateTicket={handleCreateSupportTicket}
              onCreated={(ticketId) => setSupportTicketId(ticketId)}
            />
          ) : clientView === 'support-report' ? (
            <SupportReportPage
              relatedRequests={myRequests}
              onBack={() => closeClientSupportForm('reports')}
              onCreateTicket={handleCreateSupportTicket}
              onSubmitted={() => closeClientSupportForm('reports')}
            />
          ) : (
            <ClientDashboard
              companyName={
                clientRecord
                  ? clientWorkspaceLabel(clientRecord)
                  : currentUser.clientName || currentUser.name || 'Your Company'
              }
              clientId={currentUser.id}
              accountStatus={clientRecord?.accountStatus}
              approved={clientRecord?.approved}
              requests={myRequests}
              platformRequests={requests}
              guards={clientGuardsForJobs}
                  clientEmail={currentUser.email}
              avatarUrl={currentUser.avatar}
              activeView={clientView}
              onViewChange={handleClientNavigate}
              profileGuardId={clientGuardId}
              onProfileGuardIdChange={setClientGuardId}
              directRequestGuardId={clientDirectGuardId}
              onDirectRequestGuardIdChange={setClientDirectGuardId}
              onPostRequest={handlePostRequest}
              onEditRequest={handleEditRequest}
              onUpdateStatus={handleUpdateStatus}
              onCancelRequest={handleCancelRequest}
              onAddReview={handleAddReview}
              onReportViolation={handleReportClientViolation}
              onConfirmSelfAudit={handleClientConfirmSelfAudit}
              onVerifyStartCheckpoint={handleClientVerifyStartCheckpoint}
              onFlagStartCheckpoint={handleClientFlagStartCheckpoint}
              onVerifyEndCheckpoint={handleClientVerifyEndCheckpoint}
              onFlagEndCheckpoint={handleClientFlagEndCheckpoint}
              onApproveOvertime={handleClientApproveOvertime}
              onDisputeOvertime={handleClientDisputeOvertime}
              onApproveScheduleChange={handleClientApproveScheduleChange}
              onRejectScheduleChange={handleClientRejectScheduleChange}
              onApprovePendingGuard={handleClientApprovePendingGuard}
              onDenyPendingGuard={handleClientDenyPendingGuard}
              onApproveTeamSlot={handleClientApproveTeamSlot}
              onDenyTeamSlot={handleClientDenyTeamSlot}
              onRequestReplacement={handleRequestReplacement}
              onSubmitPriceOffer={(requestId, guardId, input) =>
                void handleSubmitPriceOffer(requestId, guardId, input, 'client')
              }
              onAcceptPriceOffer={(requestId, guardId, offerId) =>
                void handleAcceptPriceOffer(requestId, guardId, offerId)
              }
              crewSettings={platformSettings}
              favoriteGuardIds={clientRecord?.favoriteGuardIds ?? []}
              onToggleFavoriteGuard={handleToggleFavoriteGuard}
              clientLocations={clientLocations}
              jobLocations={jobLocations}
              onSaveClientLocation={handleSaveClientLocation}
              clientRecord={clientRecord}
              paymentGates={clientPaymentGatesMemo}
              feeConfig={platformSettings.feeConfig}
              currentUser={currentUser}
              jobChatThreads={jobChatThreads}
              jobChatMessages={jobChatMessages}
              clientMessages={clientMessages}
              onSendJobChatMessage={handleSendJobChatMessage}
              onSendClientMessage={handleSendClientMessage}
              onDeleteClientMessage={handleDeleteClientMessage}
              onDeleteJobChatMessage={handleDeleteJobChatMessage}
              onDeleteSupportMessage={handleDeleteSupportMessage}
              onRefreshClientMessages={refreshClientMessages}
              jobChatRequestId={jobChatRequestId}
              openJobChat={openJobChat}
              onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
              onJobChatOpenChange={(open) => {
                setOpenJobChatState(open);
                if (!open) setJobChatRequestId(null);
                else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
              }}
              onOpenJobChat={(requestId) => {
                setJobChatRequestId(requestId, { openChat: true });
              }}
              supportTickets={supportTickets}
              onSendSupportMessage={handleSendSupportMessage}
              supportTicketId={supportTicketId}
              onSupportTicketIdChange={setSupportTicketId}
              onOpenSupportCompose={openClientSupportCompose}
              onOpenSupportReport={openClientSupportReport}
              onRequestsSelectedIdChange={setClientRequestsSelectedId}
              requestsSelectedId={clientRequestsSelectedId}
              requestsJobTab={clientRequestsJobTab}
              onRequestsJobTabChange={setClientRequestsJobTab}
              clientInvoices={clientInvoices}
              invoiceRequestId={clientInvoiceRequestId}
              onInvoiceRequestIdChange={setClientInvoiceRequestId}
              onMessagesDetailOpenChange={setClientMessagesDetailOpen}
              onMessagesChromeChange={setClientMessagesChrome}
              messagesShellHeaderTrailing={clientMessagesShellHeaderTrailing}
              {...tutorialSettingsProps}
            />
          )}
        </ClientAppLayout>
        </ClientCapabilitiesProvider>
        {passwordChangeOverlay}
        {tutorialOverlay}
        <InstallPrompt />
      </>
    );
  }

  // ── Staff Operations Command Center ─────────────────────────
  if (isStaffRole(currentUser.role)) {
    const activeStaffProfile = guards.find((g) => g.id === currentUser.id && g.isStaff);
    if (
      activeStaffProfile &&
      staffNeedsCredentialCompletion(activeStaffProfile) &&
      !isManagementStaffMember(activeStaffProfile)
    ) {
      return (
        <>
          {marketplaceLegalGate}
          {passwordChangeOverlay}
          <div className="page-shell flex h-[100dvh] flex-col overflow-hidden bg-brand-bg">
            <header className="flex shrink-0 items-center justify-end gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => {}}
                onOpenSettings={() => {}}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <StaffAccountPendingScreen
                member={activeStaffProfile}
                onSubmitIdentityVerification={(payload) =>
                  handleSubmitGuardIdentityVerification(activeStaffProfile.id, payload)
                }
                onUpdateStripeAccount={handleUpdateGuardStripeAccount}
              />
            </div>
          </div>
          <InstallPrompt />
        </>
      );
    }
    return (
      <>
        {marketplaceLegalGate}
        <StaffDashboard
          section={staffSection}
          onSectionChange={setStaffSection}
          accountNotifications={accountNotificationMenuProps}
          selectedGuardId={staffGuardId}
          onSelectedGuardIdChange={setStaffGuardId}
          selectedClientId={staffClientId}
          onSelectedClientIdChange={setStaffClientId}
          selectedJobId={staffJobId}
          onSelectedJobIdChange={setStaffJobId}
          selectedCredentialItemId={staffCredentialItemId}
          onSelectedCredentialItemIdChange={setStaffCredentialItemId}
          selectedTeamId={staffTeamId}
          onSelectedTeamIdChange={setStaffTeamId}
          staffGuardEdit={staffEdit}
          onStaffGuardEditChange={setStaffEdit}
          staffGuardTab={staffGuardTab}
          onStaffGuardTabChange={setStaffGuardTab}
          performanceFactorId={performanceFactorId}
          onPerformanceFactorChange={setStaffPerformanceFactorId}
          selectedSupportTicketId={supportTicketId}
          onSelectedSupportTicketIdChange={setSupportTicketId}
          selectedJobChatRequestId={jobChatRequestId}
          onSelectedJobChatRequestIdChange={(id) => setJobChatRequestId(id)}
          initialStaffMessagesTab={staffMessagesTab}
          guards={verifiedGuards}
          clients={clients}
          requests={displayRequests}
          supportTickets={supportTickets}
          payments={payments}
          guardPayoutInvoices={guardPayoutInvoices}
          onUpdateGuardUserStatus={handleUpdateGuardUserStatus}
          onApproveRequest={handleApproveRequest}
          onDenyRequest={handleDenyRequest}
          onApproveScheduleChange={handleApproveScheduleChange}
          onRejectScheduleChange={handleRejectScheduleChange}
          onApproveScheduleChangeBilling={handleApproveScheduleChangeBilling}
          onApproveClient={handleApproveClient}
          onRejectClient={handleRejectClient}
          onApproveGuardAccount={handleApproveGuardAccount}
          onRequestGuardApplicationRevision={handleRequestGuardApplicationRevision}
          onRequestClientApplicationRevision={handleRequestClientApplicationRevision}
          onSetGuardTrusted={handleSetGuardTrusted}
          onSetClientTrusted={handleSetClientTrusted}
          onSubmitGuardIdentityVerification={handleSubmitGuardIdentityVerification}
          onApproveGuardIdentityVerification={handleApproveGuardIdentityVerification}
          onRejectGuardIdentityVerification={handleRejectGuardIdentityVerification}
          onRequestGuardIdResubmit={handleRequestGuardIdResubmit}
          onUpdateGuardIdImages={handleStaffUpdateGuardIdImages}
          onRequestCertImageResubmit={handleRequestCertImageResubmit}
          onReviewGuardInsurance={handleReviewGuardInsurance}
          onApproveVehicle={(guardId) => handleReviewGuardVehicle(guardId, 'verified')}
          onRejectVehicle={(guardId, reason) => handleReviewGuardVehicle(guardId, 'rejected', reason)}
          onRequestCoiUpdate={handleRequestCoiUpdate}
          onRequestCertUpdate={handleRequestCertUpdate}
          onRevokeGuardIdentityVerification={handleRevokeGuardIdentityVerification}
          onApproveClientCredential={handleApproveClientCredential}
          onRejectClientCredential={handleRejectClientCredential}
          onUpdateClientCredentialRules={handleUpdateClientCredentialRules}
          onDeleteGuardAccount={handleDeleteGuardAccount}
          onDeleteClientAccount={handleDeleteClientAccount}
          onApproveCert={handleApproveCert}
          onRejectCert={handleRejectCert}
          onUpdateBackgroundChecked={handleUpdateBackgroundChecked}
          onRecordAuditViolation={handleRecordAuditViolation}
          onResetAuditFailures={handleResetAuditFailures}
          onMakeGuardPayoutAvailable={handleMakeGuardPayoutAvailable}
          onReleasePayout={handleReleasePayout}
          onRefundPayment={handleRefundPayment}
          onResolveOvertimeDispute={handleStaffResolveOvertimeDispute}
          onResolveAuditViolation={handleStaffResolveAuditViolation}
          onMakeOvertimeGuardPayoutAvailable={handleMakeOvertimeGuardPayoutAvailable}
          onCompletePayoutInvoice={handleCompletePayoutInvoice}
          platformSettings={platformSettings}
          platformCities={platformCities}
          jobLocations={jobLocations}
          clientLocations={clientLocations}
          onSaveJobLocation={handleSaveJobLocation}
          onUpdatePlatformCity={handleUpdatePlatformCity}
          onUpdateStaffCityAccess={handleUpdateStaffCityAccess}
          onAssignCityManager={handleAssignCityManager}
          onUpdatePlatformSettings={handleUpdatePlatformSettings}
          onUpdatePublicInformation={handleUpdatePublicInformation}
          onUpdateStaffIntegrations={handleUpdateStaffIntegrations}
          onUpdateStaffPermissions={handleUpdateStaffPermissions}
          isDbConnected={isDbConnected}
          currentUser={currentUser}
          onAddStaffProfile={handleAddStaffProfile}
          onApproveStaffAccount={handleApproveStaffAccount}
          onRejectStaffAccount={handleRejectStaffAccount}
          onUpdateStaffRole={handleUpdateStaffRole}
          onAddGuardProfile={handleAddGuardProfile}
          onAddClientProfile={handleAddClientProfile}
          onStaffCreateJob={handleStaffCreateJob}
          onEditJobListing={handleStaffEditJobListing}
          onApproveGuardApplication={handleStaffApproveGuardApplication}
          onDenyGuardApplication={handleStaffDenyGuardApplication}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onSignOut={handleSignOut}
          onUpdateGuardProfile={handleUpdateGuardProfile}
          onAddCertification={(guardId, cert) => handleAddCertification(guardId, cert, 'staff')}
          onDeleteCertification={handleDeleteCertification}
          onAttachCertificationImage={handleAttachCertificationImage}
          onUpdateCertification={(guardId, certId, payload) =>
            handleUpdateCertification(guardId, certId, payload, 'staff')
          }
          onAddExperience={handleAddExperience}
          onAddEducation={handleAddEducation}
          onSendSupportMessage={handleSendSupportMessage}
          onUpdateSupportStatus={handleUpdateSupportTicketStatus}
          onDeleteSupportTicket={handleDeleteSupportTicket}
          onResolveDispute={handleResolveDispute}
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          staffMessages={staffMessages}
          guardMessages={guardMessages}
          clientMessages={clientMessages}
          onSendStaffMessage={handleSendStaffMessage}
          onDeleteStaffMessage={handleDeleteStaffMessage}
          onSendGuardMessage={handleSendGuardMessage}
          onDeleteGuardMessage={handleDeleteGuardMessage}
          onSendClientMessage={handleSendClientMessage}
          onDeleteClientMessage={handleDeleteClientMessage}
          onDeleteJobChatMessage={handleDeleteJobChatMessage}
          onDeleteSupportMessage={handleDeleteSupportMessage}
          onRefreshStaffMessages={refreshStaffMessages}
          onSendJobChat={handleSendJobChatMessage}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          legalAcceptances={legalAcceptanceRecords}
          companyPublicDocuments={companyPublicDocuments}
          onSaveCompanyPublicDocument={handleSaveCompanyPublicDocument}
          onSetCompanyPlacardPublicEnabled={handleSetCompanyPlacardPublicEnabled}
          {...tutorialSettingsProps}
        />
        {passwordChangeOverlay}
        {tutorialOverlay}
        <InstallPrompt />
      </>
    );
  }

  return (
    <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
      <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
        <AccountMenu
          userName={currentUser.name}
          userSubtitle={currentUser.email}
          avatarUrl={currentUser.avatar}
          onOpenProfile={() => undefined}
          onOpenSettings={() => undefined}
          onSignOut={handleSignOut}
          hideProfile
          {...accountMenuExtras}
        />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <p className="text-brand-text font-semibold">This account role is not supported.</p>
        <p className="text-brand-text-muted text-sm max-w-sm">
          Sign out and sign in again with a Guardr client, guard, or staff account.
        </p>
      </div>
    </div>
  );
}
