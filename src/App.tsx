/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  SecurityGuard,
  SecurityRequest,
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
  JobChatThread,
  JobChatMessage,
  StaffMessage,
} from './types';
import { canManageCompanyOperations, canRecordCashPayments, canUploadJobSelfAuditPhotos, canUploadJobSpotCheck, isStaffRole, canAssignStaffRole, canModerateStaffMember } from './lib/permissions';
import type { StaffSelfAuditPhotoPayload } from './components/staff/StaffSelfAuditPhotoUpload';
import {
  canClientConfirmSelfAudit,
  canStaffUploadSelfAuditPhotos,
  selfAuditPhotosComplete,
} from './lib/selfAuditPhotos';
import { canClientConfirmSpotCheck, canStaffAddSpotCheck, hasSpotChecks } from './lib/spotChecks';
import type { StaffCreateJobInput } from './components/staff/StaffCreateJobForm';
import {
  canDirectorDepositCashToStripe,
  canDirectorMarkClientPaidCash,
  canDirectorMarkGuardPaidCash,
  canDirectorMarkPlatformFeePaidCash,
  getPlatformFeeAmount,
  getRemainingStripeDeposit,
  getRequiredStripeDeposit,
  guardPayoutAmount,
  isCashClientPayment,
  parsePaymentMethod,
} from './lib/cashPayments';
import { ChangePasswordPrompt } from './components/auth/ChangePasswordPrompt';
import {
  provisionedPasswordFields,
  setStoredPassword,
  shouldPromptPasswordChange,
  STAFF_PROVISIONED_DEFAULT_PASSWORD,
} from './lib/accountPasswords';
import { GuardDashboard } from './components/GuardDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { LoadingScreen } from './components/LoadingScreen';
import { ClientAppLayout } from './components/layouts/ClientAppLayout';
import { ClientDashboard } from './components/ClientDashboard';
import { InstallPrompt } from './components/InstallPrompt';
import { supabase, isSupabaseConnected } from './lib/supabase';
import { useSupabaseRealtimeSync } from './lib/useSupabaseRealtime';
import { useMessageRealtimeSync } from './lib/messageRealtime';
import { beginLocalMutation, shouldSkipRealtimeSync } from './lib/dbMutationGuard';
import {
  getGuardMissingGraceCredentialLabels,
  type ActivateGuardAccountOptions,
} from './lib/guardMissingCredentials';
import {
  getPendingGuardAccountReviews,
  guardAccountApprovalBlockers,
  guardAccountActivationBlockers,
} from './lib/guardAccountActivation';
import {
  guardCredentialGracePatchForActivation,
  processGuardCredentialGraceBatch,
  syncGuardCredentialGraceState,
} from './lib/guardCredentialGrace';
import { useNativeBackButtonBootstrap } from './lib/useNativeBackButton';
import {
  AddCertificationResult,
  normalizeCertNumber,
  validateCertNumberAvailable,
} from './lib/certUniqueness';
import { validateCertDeletion, validateCertImageAttachment, guardCertificationCanEdit, certImageIsLocked, validateCertSubmission, certDatabaseErrorMessage, staffCanVerifyCertification, staffVerifyCertificationBlocker } from './lib/certImagePolicy';
import { insertCertificationRow, updateCertificationRow } from './lib/certDatabaseWrite';
import type { CertUpdatePayload } from './components/credentials/CertDetailModal';
import type { CertImageMutationResult } from './lib/certImagePolicy';
import {
  buildCertImageResubmitReason,
  buildIdResubmitReason,
  GUARD_APPLICATION_REJECT_DEFAULT_REASON,
  type IdVerificationSlot,
} from './lib/staffDocumentReview';
import {
  staffCanApproveIdVerification,
  staffCanRequestIdResubmit,
} from './lib/guardIdentityVerification';
import { computeDurationHours } from './lib/dates';
import { normalizeJobStatus } from './lib/jobStatus';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from './lib/payments';
import { getGuardPayoutHistory, getGuardVisibleJobs, toGuardJobView } from './lib/guardJobView';
import { getGuardPayoutEligibleJobs } from './lib/guardPayoutInvoice';
import {
  createGuardPayoutInvoiceRecord,
  loadGuardPayoutInvoicesFromStorage,
  maybeCompletePayoutInvoice,
  saveGuardPayoutInvoicesToStorage,
} from './lib/guardPayoutInvoiceStorage';
import { guardHasApplied } from './lib/jobApplications';
import { listingDetailDbColumns, buildJobListingDbPayload, mergeJobListingUpdates } from './lib/jobListing';
import { checkJobRequirements, guardCanApplyToJob } from './lib/guardJobs';
import { guardWorkBlockedMessage } from './lib/guardQualification';
import { findGuardProfileForUser, getBrowsableGuards, guardHasWorkedWithClient } from './lib/guardDirectory';
import { isClientAccountPending } from './lib/accountStatus';
import { createCashDepositCheckoutSession, holdJobPayment, releasePayout, refundPayment } from './lib/stripeApi';
import { ThemeMode, applyThemeToDocument, isThemeMode, loadTheme, saveTheme } from './lib/platform/theme';
import { ProfileSavePayload, UserProfileScreen } from './components/profile/UserProfileScreen';
import { personNameFromPayload, resolvePersonNameParts } from './lib/personName';
import {
  getClientAccountStatus,
  getGuardUserStatus,
  isGuardAccountApproved,
  isGuardAccountPending,
} from './lib/accountStatus';
import { updateGuardAccountRow } from './lib/guardDatabaseWrite';
import { removeStoredPassword } from './lib/accountPasswords';
import { SupportScreen } from './components/support/SupportScreen';
import {
  appendMessage,
  buildNewTicket,
  loadSupportTicketsFromStorage,
  saveSupportTicketsToStorage,
} from './lib/support';
import {
  buildJobChatMessage,
  buildJobChatThread,
  loadJobChatMessagesFromStorage,
  loadJobChatThreadsFromStorage,
  saveJobChatMessagesToStorage,
  saveJobChatThreadsToStorage,
  threadForRequest,
} from './lib/jobChat';
import {
  buildStaffMessage,
  loadStaffMessagesFromStorage,
  mergeStaffMessages,
  appendStaffMessage,
  saveStaffMessagesToStorage,
} from './lib/staffMessenger';
import { fetchStaffMessagesFromApi, postStaffMessageToApi } from './lib/staffMessagesApi';
import { mapStaffRowToSecurityGuard } from './lib/staffAccounts';
import {
  listenForPushNavigation,
  listenForPushSubscriptionChange,
  syncPushSubscriptionWithServer,
} from './lib/push';
import { reportPushEvent } from './lib/pushApi';
import { playWalkieChirpSound } from './lib/walkieChirpSound';
import {
  defaultRouteForRole,
  parseAppRoute,
  readAppRouteFromWindow,
  readLegalPageFromWindow,
  syncAppRoute,
  syncLegalPage,
  type AppRole,
  type AppRoute,
  type AuthViewMode,
  type AuthViewRole,
} from './lib/appNavigation';
import type { LegalPageId } from './lib/legalContent';
import { LegalPage } from './components/legal/LegalPage';
import { showAppToast } from './components/ui/AppToast';
import type { GuardTab } from './components/GuardDashboard';
import type { ClientView } from './components/ClientDashboard';
import { type ApprovalQueueId, type StaffSection } from './lib/staffOps';
import {
  buildLocationLabel,
  canClientEditJobListing,
  canClientEditRequest,
  canEditJobTitleAndLocation,
  canStaffEditJobTitleAndLocation,
  isJobPaid,
  jobEditBlockedReason,
  sanitizeJobListingUpdates,
  validateShiftSchedule,
} from './lib/jobEditRules';
import { canEditJobListingDetails } from './lib/permissions';
import {
  canGuardClockIn,
  canGuardClockOut,
  guardClockInBlockedMessage,
  guardClockOutBlockedMessage,
} from './lib/shiftWindow';

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
  const [isAuthView, setIsAuthView]       = useState(() => !!readAppRouteFromWindow()?.authView);
  const [initialAuthRole, setInitialAuthRole] = useState<'guard' | 'client'>(
    () => readAppRouteFromWindow()?.authRole ?? 'client'
  );
  const [initialAuthMode, setInitialAuthMode] = useState<'sign-in' | 'sign-up'>(
    () => readAppRouteFromWindow()?.authView ?? 'sign-in'
  );
  const [legalPage, setLegalPageState] = useState<LegalPageId | null>(() => readLegalPageFromWindow());
  const [legalReturnAuth, setLegalReturnAuth] = useState(false);

  // ── Theme ──────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadTheme());
  const changeThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode, currentUser?.id);
    applyThemeToDocument(mode);
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
    if (!currentUser) return;
    const local = loadTheme(currentUser.id);
    setThemeMode(local);
    applyThemeToDocument(local);
  }, [currentUser?.id]);

  // ── DB state ───────────────────────────────────────────────
  const [guards,   setGuards]   = useState<SecurityGuard[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [requests, setRequests] = useState<SecurityRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => loadSupportTicketsFromStorage());
  const [jobChatThreads, setJobChatThreads] = useState<JobChatThread[]>(() => loadJobChatThreadsFromStorage());
  const [jobChatMessages, setJobChatMessages] = useState<JobChatMessage[]>(() => loadJobChatMessagesFromStorage());
  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>(() => loadStaffMessagesFromStorage());
  const missedCheckinNotifiedRef = useRef<Set<string>>(new Set());
  const [guardPayoutInvoices, setGuardPayoutInvoices] = useState<GuardPayoutInvoice[]>(() =>
    loadGuardPayoutInvoicesFromStorage()
  );
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [passwordChangePromptOpen, setPasswordChangePromptOpen] = useState(false);

  const initialRoute = readAppRouteFromWindow();
  const [clientView, setClientViewState] = useState<ClientView>(
    () => (initialRoute?.role === 'client' ? initialRoute.clientView : undefined) ?? 'home'
  );
  const [guardTab, setGuardTabState] = useState<GuardTab>(
    () => (initialRoute?.role === 'guard' ? initialRoute.guardTab : undefined) ?? 'map'
  );
  const [staffSection, setStaffSectionState] = useState<StaffSection>(
    () => (initialRoute?.role === 'staff' ? initialRoute.staffSection : undefined) ?? 'overview'
  );
  const [staffGuardId, setStaffGuardIdState] = useState<string | null>(
    () => initialRoute?.staffGuardId ?? null
  );
  const [staffClientId, setStaffClientIdState] = useState<string | null>(
    () => initialRoute?.staffClientId ?? null
  );
  const [staffJobId, setStaffJobIdState] = useState<string | null>(
    () => initialRoute?.staffJobId ?? null
  );
  const [staffTeamId, setStaffTeamIdState] = useState<string | null>(
    () => initialRoute?.staffTeamId ?? null
  );
  const [staffEdit, setStaffEditState] = useState(
    () => initialRoute?.staffEdit ?? false
  );
  const [clientGuardId, setClientGuardIdState] = useState<string | null>(
    () => initialRoute?.clientGuardId ?? null
  );
  const [clientDirectGuardId, setClientDirectGuardIdState] = useState<string | null>(
    () => initialRoute?.clientDirectGuardId ?? null
  );
  const [jobChatRequestId, setJobChatRequestIdState] = useState<string | null>(
    () => initialRoute?.jobChatRequestId ?? null
  );
  const [supportTicketId, setSupportTicketIdState] = useState<string | null>(
    () => initialRoute?.supportTicketId ?? null
  );
  const [staffMessageTab, setStaffMessageTabState] = useState<'team' | 'jobs'>(
    () => initialRoute?.staffMessageTab ?? 'team'
  );
  const [staffApprovalQueue, setStaffApprovalQueueState] = useState<ApprovalQueueId | null>(
    () => initialRoute?.staffApprovalQueue ?? null
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
      staffTeamId: staffTeamId ?? undefined,
      staffEdit: staffEdit || undefined,
      clientGuardId: clientGuardId ?? undefined,
      clientDirectGuardId: clientDirectGuardId ?? undefined,
      jobChatRequestId: jobChatRequestId ?? undefined,
      supportTicketId: supportTicketId ?? undefined,
      staffMessageTab: staffMessageTab ?? undefined,
      staffApprovalQueue: staffApprovalQueue ?? undefined,
      openJobChat: openJobChat || undefined,
      authView: !currentUser && isAuthView ? initialAuthMode : undefined,
      authRole: !currentUser && isAuthView ? initialAuthRole : undefined,
    };
    return { ...base, ...overrides };
  };

  const applyAppRoute = (route: AppRoute) => {
    if (route.clientView) setClientViewState(route.clientView);
    if (route.guardTab) setGuardTabState(route.guardTab);
    if (route.staffSection) setStaffSectionState(route.staffSection);
    setStaffGuardIdState(route.staffGuardId ?? null);
    setStaffClientIdState(route.staffClientId ?? null);
    setStaffJobIdState(route.staffJobId ?? null);
    setStaffTeamIdState(route.staffTeamId ?? null);
    setStaffEditState(route.staffEdit ?? false);
    setClientGuardIdState(route.clientGuardId ?? null);
    setClientDirectGuardIdState(route.clientDirectGuardId ?? null);
    setJobChatRequestIdState(route.jobChatRequestId ?? null);
    setSupportTicketIdState(route.supportTicketId ?? null);
    if (route.staffMessageTab) setStaffMessageTabState(route.staffMessageTab);
    setStaffApprovalQueueState(route.staffApprovalQueue ?? null);
    setOpenJobChatState(route.openJobChat ?? false);
    if (route.authView) {
      setIsAuthView(true);
      setInitialAuthMode(route.authView);
      if (route.authRole) setInitialAuthRole(route.authRole);
    } else if (!currentUser) {
      setIsAuthView(false);
    }
  };

  const setClientView = (view: ClientView) => {
    setClientViewState(view);
    const nextGuardId = view === 'guards' ? clientGuardId ?? undefined : undefined;
    const nextDirectId = view === 'direct-request' ? clientDirectGuardId ?? undefined : undefined;
    const nextJobChatId = view === 'coverage' ? jobChatRequestId ?? undefined : undefined;
    const nextSupportId = view === 'support' ? supportTicketId ?? undefined : undefined;
    setClientGuardIdState(nextGuardId ?? null);
    setClientDirectGuardIdState(nextDirectId ?? null);
    if (view !== 'coverage') {
      setJobChatRequestIdState(null);
      setOpenJobChatState(false);
    }
    if (view !== 'support') {
      setSupportTicketIdState(null);
    }
    syncAppRoute(
      buildAppRoute({
        role: 'client',
        clientView: view,
        clientGuardId: nextGuardId,
        clientDirectGuardId: nextDirectId,
        jobChatRequestId: nextJobChatId,
        openJobChat: view === 'coverage' && openJobChat ? true : undefined,
        supportTicketId: nextSupportId,
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
    setGuardTabState(tab);
    const keepJobChat = tab === 'myJobs' ? jobChatRequestId ?? undefined : undefined;
    const keepOpenChat = tab === 'myJobs' && openJobChat ? true : undefined;
    if (tab !== 'myJobs') {
      setJobChatRequestIdState(null);
      setOpenJobChatState(false);
    }
    if (tab !== 'support') {
      setSupportTicketIdState(null);
    }
    syncAppRoute(
      buildAppRoute({
        role: 'guard',
        guardTab: tab,
        jobChatRequestId: keepJobChat,
        openJobChat: keepOpenChat,
        supportTicketId: tab === 'support' ? supportTicketId ?? undefined : undefined,
      })
    );
  };

  const setJobChatRequestId = (requestId: string | null, options?: { openChat?: boolean }) => {
    setJobChatRequestIdState(requestId);
    if (options?.openChat !== undefined) setOpenJobChatState(options.openChat);
    const role = currentUser ? appRoleForUser(currentUser) : null;
    if (role === 'staff') {
      setStaffSectionState('messages');
      setStaffMessageTabState('jobs');
      setStaffApprovalQueueState(null);
      syncAppRoute(
        buildAppRoute({
          role: 'staff',
          staffSection: 'messages',
          staffMessageTab: 'jobs',
          jobChatRequestId: requestId ?? undefined,
          staffApprovalQueue: undefined,
        })
      );
      return;
    }
    if (role === 'guard') {
      setGuardTabState('myJobs');
      syncAppRoute(
        buildAppRoute({
          role: 'guard',
          guardTab: 'myJobs',
          jobChatRequestId: requestId ?? undefined,
          openJobChat: options?.openChat ?? openJobChat,
        })
      );
      return;
    }
    if (role === 'client') {
      setClientViewState('coverage');
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'coverage',
          jobChatRequestId: requestId ?? undefined,
          openJobChat: options?.openChat ?? true,
        })
      );
    }
  };

  const setSupportTicketId = (ticketId: string | null) => {
    setSupportTicketIdState(ticketId);
    const role = currentUser ? appRoleForUser(currentUser) : null;
    if (role === 'staff') {
      setStaffSectionState('support');
      setStaffApprovalQueueState(null);
      syncAppRoute(
        buildAppRoute({
          role: 'staff',
          staffSection: 'support',
          supportTicketId: ticketId ?? undefined,
          staffApprovalQueue: undefined,
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
        })
      );
    }
  };

  const setStaffMessageTab = (tab: 'team' | 'jobs') => {
    setStaffMessageTabState(tab);
    if (tab === 'team') setJobChatRequestIdState(null);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'messages',
        staffMessageTab: tab,
        jobChatRequestId: tab === 'jobs' ? jobChatRequestId ?? undefined : undefined,
      })
    );
  };

  const setStaffSection = (section: StaffSection) => {
    setStaffSectionState(section);
    const nextGuardId = section === 'guards' ? staffGuardId ?? undefined : undefined;
    const nextClientId = section === 'clients' ? staffClientId ?? undefined : undefined;
    const nextJobId = section === 'jobs' ? staffJobId ?? undefined : undefined;
    const nextTeamId = section === 'team' ? staffTeamId ?? undefined : undefined;
    const nextJobChatId = section === 'messages' ? jobChatRequestId ?? undefined : undefined;
    const nextSupportId = section === 'support' ? supportTicketId ?? undefined : undefined;
    const nextMessageTab = section === 'messages' ? staffMessageTab : undefined;
    const nextApprovalQueue =
      section === 'approvals' ? staffApprovalQueue ?? undefined : undefined;
    const nextEdit = section === 'guards' && nextGuardId ? staffEdit || undefined : undefined;
    setStaffGuardIdState(nextGuardId ?? null);
    setStaffClientIdState(nextClientId ?? null);
    setStaffJobIdState(nextJobId ?? null);
    setStaffTeamIdState(nextTeamId ?? null);
    if (section !== 'messages') setJobChatRequestIdState(null);
    if (section !== 'support') setSupportTicketIdState(null);
    if (section !== 'approvals') setStaffApprovalQueueState(null);
    if (section !== 'guards') setStaffEditState(false);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: section,
        staffGuardId: nextGuardId,
        staffClientId: nextClientId,
        staffJobId: nextJobId,
        staffTeamId: nextTeamId,
        staffEdit: nextEdit,
        jobChatRequestId: nextJobChatId,
        supportTicketId: nextSupportId,
        staffMessageTab: nextMessageTab,
        staffApprovalQueue: nextApprovalQueue,
      })
    );
  };

  const openStaffApprovals = (queue: ApprovalQueueId | null) => {
    setStaffApprovalQueueState(queue);
    setStaffSectionState('approvals');
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'approvals',
        staffApprovalQueue: queue ?? undefined,
        staffGuardId: undefined,
        staffClientId: undefined,
        staffJobId: undefined,
        staffTeamId: undefined,
        staffEdit: undefined,
        jobChatRequestId: undefined,
        supportTicketId: undefined,
        staffMessageTab: undefined,
      })
    );
  };

  const clearStaffApprovalQueue = () => {
    setStaffApprovalQueueState(null);
  };

  const updateStaffApprovalQueue = (queue: ApprovalQueueId | null) => {
    setStaffApprovalQueueState(queue);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'approvals',
        staffApprovalQueue: queue ?? undefined,
        staffGuardId: staffGuardId ?? undefined,
        staffClientId: staffClientId ?? undefined,
        staffJobId: staffJobId ?? undefined,
        staffTeamId: staffTeamId ?? undefined,
        staffEdit: staffEdit || undefined,
        jobChatRequestId: jobChatRequestId ?? undefined,
        supportTicketId: supportTicketId ?? undefined,
        staffMessageTab: staffMessageTab,
      })
    );
  };

  const setStaffGuardId = (guardId: string | null) => {
    setStaffGuardIdState(guardId);
    if (!guardId) setStaffEditState(false);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'guards',
        staffGuardId: guardId ?? undefined,
        staffEdit: guardId && staffEdit ? true : undefined,
      })
    );
  };

  const setStaffClientId = (clientId: string | null) => {
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
    setStaffJobIdState(jobId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'jobs',
        staffJobId: jobId ?? undefined,
      })
    );
  };

  const setStaffTeamId = (teamId: string | null) => {
    setStaffTeamIdState(teamId);
    syncAppRoute(
      buildAppRoute({
        role: 'staff',
        staffSection: 'team',
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
    syncAppRoute({ role: 'client', authView: initialAuthMode, authRole: role }, true);
  };

  const setAuthViewMode = (mode: AuthViewMode) => {
    setInitialAuthMode(mode);
    syncAppRoute({ role: 'client', authView: mode, authRole: initialAuthRole }, true);
  };

  const openAuthView = (role: AuthViewRole, mode: AuthViewMode) => {
    setInitialAuthRole(role);
    setInitialAuthMode(mode);
    setIsAuthView(true);
    syncAppRoute({ role: 'client', authView: mode, authRole: role });
  };

  const closeAuthView = () => {
    setIsAuthView(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  };

  const openLegalPage = (page: LegalPageId) => {
    setLegalReturnAuth(isAuthView);
    setLegalPageState(page);
    setIsAuthView(false);
    syncLegalPage(page);
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
          const fallback = defaultRouteForRole(role);
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

  useNativeBackButtonBootstrap(!!currentUser);

  useEffect(() => {
    const applyDeepLink = (url: string) => {
      const legal = readLegalPageFromWindow();
      if (legal) {
        setLegalPageState(legal);
        setIsAuthView(false);
        return;
      }
      setLegalPageState(null);

      const route = parseAppRoute(url);
      if (!route) return;

      const user = currentUserRef.current;
      if (route.authView) {
        if (!user) {
          setIsAuthView(true);
          setInitialAuthRole(route.authRole ?? 'client');
          setInitialAuthMode(route.authView);
        }
        return;
      }

      if (user && !routeMatchesUser(route, user)) {
        return;
      }

      applyAppRouteRef.current(route);
      syncAppRoute(route, true);
    };

    applyDeepLink(window.location.pathname + window.location.search);

    const onPopState = (event: PopStateEvent) => {
      const legal =
        (event.state?.legalPage as LegalPageId | undefined) ?? readLegalPageFromWindow();
      if (legal) {
        setLegalPageState(legal);
        setIsAuthView(false);
        return;
      }
      setLegalPageState(null);

      const route =
        (event.state?.appRoute as AppRoute | undefined) ?? readAppRouteFromWindow();
      if (route) applyAppRouteRef.current(route);
    };
    window.addEventListener('popstate', onPopState);

    const unsubscribe = listenForPushNavigation(applyDeepLink);
    return () => {
      window.removeEventListener('popstate', onPopState);
      unsubscribe();
    };
  }, []);

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
    if (!currentUser) return;
    const role = appRoleForUser(currentUser);
    if (!role) return;

    const route = readAppRouteFromWindow();
    if (route && routeMatchesUser(route, currentUser)) {
      applyAppRouteRef.current(route);
      syncAppRoute(route, true);
      return;
    }

    const fallback = defaultRouteForRole(role);
    applyAppRouteRef.current(fallback);
    syncAppRoute(fallback, true);
  }, [currentUser?.id, currentUser?.role]);

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

  useEffect(() => {
    if (!currentUser) return;
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
    (async () => {
      try {
        setLoading(true);
        await loadFromSupabase();
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
    try {
      const { data: dbGuards, error: guardsErr } = await supabase.from('guards').select('*');
      const { data: dbStaffRows, error: staffErr } = await supabase.from('staff').select('*');
      const staffTableAvailable = !staffErr;
      const { data: dbClients, error: clientsErr } = await supabase.from('clients').select('*');
      const { data: dbCerts, error: certsErr } = await supabase.from('certifications').select('*');
      const { data: dbExps, error: expsErr } = await supabase.from('experience').select('*');
      const { data: dbEducation, error: eduErr } = await supabase.from('education').select('*');
      const { data: dbRequests, error: requestsErr } = await supabase.from('security_requests').select('*');
      const { data: dbPayments, error: paymentsErr } = await supabase.from('payments').select('*');
      const { data: dbSupportTickets, error: supportTicketsErr } = await supabase.from('support_tickets').select('*');
      const { data: dbSupportMessages, error: supportMessagesErr } = await supabase.from('support_messages').select('*');
      const { data: dbJobChatThreads, error: jobChatThreadsErr } = await supabase.from('job_chat_threads').select('*');
      const { data: dbJobChatMessages, error: jobChatMessagesErr } = await supabase.from('job_chat_messages').select('*');
      const { data: dbStaffMessages, error: staffMessagesErr } = await supabase.from('staff_messages').select('*');
      const { data: dbPayoutInvoices, error: payoutInvoicesErr } = await supabase
        .from('guard_payout_invoices')
        .select('*');

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
      if (payoutInvoicesErr) {
        console.warn('Guard payout invoices load (run migration if missing):', payoutInvoicesErr);
      }
      if (guardsErr || clientsErr || certsErr || expsErr || requestsErr || paymentsErr) {
        console.error('Supabase load errors:', { guardsErr, clientsErr, certsErr, expsErr, requestsErr, paymentsErr });
        setGuards([]);
        setClients([]);
        setRequests([]);
        setIsDbConnected(false);
        return;
      }

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
        id: g.id, name: nameParts.name, firstName: nameParts.firstName, middleName: nameParts.middleName, lastName: nameParts.lastName, email: g.email, badgeNumber: g.badge_number,
        avatar: g.avatar, phone: g.phone, bio: g.bio,
        headline: g.headline || undefined,
        summary: g.summary || undefined,
        about: g.about || undefined,
        skills: parseJsonStringArray(g.skills),
        languages: parseJsonStringArray(g.languages),
        serviceAreas: parseJsonStringArray(g.service_areas),
        specialties: parseJsonStringArray(g.specialties),
        yearsExperience: g.years_experience ?? undefined,
        availabilityNotes: g.availability_notes || undefined,
        isArmed: g.is_armed, backgroundChecked: g.background_checked, verified: g.verified,
        rating: Number(g.rating), jobsCompleted: g.jobs_completed,
        hourlyRateRequirement: g.hourly_rate_requirement,
        isStaff: g.is_staff,
        staffRole: g.staff_role,
        userStatus: getGuardUserStatus({ userStatus: g.user_status, isStaff: Boolean(g.is_staff) }),
        failedAudits: g.failed_audits ?? 0,
        stripeConnectAccountId: g.stripe_connect_account_id || undefined,
        themePreference: isThemeMode(g.theme_preference) ? g.theme_preference : undefined,
        password: g.password ?? undefined,
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
        idSubmittedBy: g.id_submitted_by === 'staff' || g.id_submitted_by === 'guard' ? g.id_submitted_by : undefined,
        credentialGraceDeadline: g.credential_grace_deadline ?? undefined,
        credentialGraceMissing: Array.isArray(g.credential_grace_missing)
          ? (g.credential_grace_missing as string[])
          : undefined,
        certifications: (dbCerts ?? []).filter((c: any) => c.guard_id === g.id).map((c: any) => ({
          id: c.id, name: c.name, issuer: c.issuer, number: c.number,
          status: (['verified', 'pending', 'rejected'].includes(c.status) ? c.status : 'pending') as Certification['status'],
          issueDate: c.issue_date, expiryDate: c.expiry_date,
          state: c.state ?? undefined,
          catalogId: c.catalog_id?.trim() || undefined,
          category: c.category ?? undefined,
          imageUrl: c.image_url ?? undefined,
          rejectionReason: c.rejection_reason ?? undefined,
          submittedByRole:
            c.submitted_by_role === 'staff' || c.submitted_by_role === 'guard'
              ? c.submitted_by_role
              : undefined,
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

      const staffFromTable = staffTableAvailable ? (dbStaffRows ?? []).map((row: any) => mapStaffRowToSecurityGuard(row)) : [];
      const staffMigrated = staffTableAvailable && staffFromTable.length > 0;
      const fieldGuardRows = (dbGuards ?? []).filter((g: any) => {
        if (g.migrated_to_staff_at) return false;
        if (staffMigrated) return !g.is_staff;
        return !g.is_staff;
      });
      const legacyStaffRows = staffMigrated
        ? []
        : (dbGuards ?? []).filter((g: any) => g.is_staff && !g.migrated_to_staff_at);

      setGuards([
        ...fieldGuardRows.map(mapGuardRow),
        ...staffFromTable,
        ...legacyStaffRows.map(mapGuardRow),
      ]);

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
        totalRequests: c.total_requests || 0,
        approved: c.account_status === 'active' || (c.approved ?? false),
        accountStatus: c.account_status || (c.approved === false ? 'suspended' : 'active'),
        rating: c.rating != null ? Number(c.rating) : undefined,
        themePreference: isThemeMode(c.theme_preference) ? c.theme_preference : undefined,
        password: c.password ?? undefined,
        mustChangePassword: c.must_change_password ?? false,
      };
      }));

      setRequests((dbRequests ?? []).map((r: any) => ({
        id: r.id, title: r.title, description: r.description,
        clientId: r.client_id, clientName: r.client_name, clientLogo: r.client_logo,
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
        location: r.location, type: r.type,
        armedRequired: r.armed_required,
        guardsNeeded: r.guards_needed ?? 1,
        uniformRequirements: r.uniform_requirements || undefined,
        equipmentRequirements: r.equipment_requirements || undefined,
        siteInstructions: r.site_instructions || undefined,
        startDate: r.start_date, endDate: r.end_date,
        durationHours: r.duration_hours, hourlyRate: r.hourly_rate,
        guardPay: r.guard_pay ?? computeGuardPay(r.hourly_rate),
        platformFeePerHour: r.platform_fee_per_hour ?? PLATFORM_FEE_PER_HOUR,
        estimatedPayout: r.estimated_payout,
        status: normalizeJobStatus(r.status),
        assignedGuardId: r.assigned_guard_id,
        requestType: r.request_type === 'direct' ? 'direct' : 'marketplace',
        targetGuardId: r.target_guard_id ?? r.preferred_guard_id ?? undefined,
        requiredCertifications: r.required_certifications || [],
        minGuardQualification: r.min_guard_qualification === 'active' ? 'active' : 'pending',
        applicants: r.applicants || [],
        ratingGiven: r.rating_given ?? undefined,
        reviewText: r.review_text ?? undefined,
        stripePaymentIntentId: r.stripe_payment_intent_id || undefined,
        paymentStatus: r.payment_status || 'unpaid',
        clientPaymentMethod: parsePaymentMethod(r.client_payment_method),
        guardPayoutMethod: parsePaymentMethod(r.guard_payout_method),
        cashDepositedToStripe: !!r.cash_deposited_to_stripe,
        cashDepositedAmount: r.cash_deposited_amount != null ? Number(r.cash_deposited_amount) : undefined,
        cashDepositedAt: r.cash_deposited_at || undefined,
        platformFeePaidCash: !!r.platform_fee_paid_cash,
        guardCashPayoutRequested: !!r.guard_cash_payout_requested,
        guardCashPayoutRequestedAt: r.guard_cash_payout_requested_at || undefined,
        checkInAudit: r.check_in_audit ?? undefined,
        spotChecks: Array.isArray(r.spot_checks) ? r.spot_checks : [],
        midShiftAudits: Array.isArray(r.mid_shift_audits) ? r.mid_shift_audits : [],
        checkOutAudit: r.check_out_audit ?? undefined,
      })));

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
            lines: row.lines || [],
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
        setStaffMessages((prev) => {
          const next = mergeStaffMessages(prev, mappedStaffMessages);
          saveStaffMessagesToStorage(next);
          return next;
        });
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

  const refreshStaffMessages = useCallback(async () => {
    if (!currentUser || !isStaffRole(currentUser.role)) return;

    const applyRemote = (remote: StaffMessage[]) => {
      setStaffMessages((prev) => {
        const next = mergeStaffMessages(prev, remote);
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
  useSupabaseRealtimeSync(() => {
    if (shouldSkipRealtimeSync()) return;
    void loadRef.current();
  }, isDbConnected);

  useEffect(() => {
    const tick = () => {
      setGuards((prev) => {
        const next = processGuardCredentialGraceBatch(prev);
        let changed = false;
        for (let i = 0; i < prev.length; i++) {
          const before = prev[i];
          const after = next[i];
          if (before === after) continue;
          changed = true;
          if (isDbConnected) {
            beginLocalMutation();
            void supabase
              .from('guards')
              .update({
                user_status: after.userStatus,
                credential_grace_deadline: after.credentialGraceDeadline ?? null,
                credential_grace_missing: after.credentialGraceMissing ?? null,
              })
              .eq('id', after.id);
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
    },
    isDbConnected
  );

  const isInMessagingView = useMemo(() => {
    if (!currentUser) return false;
    const role = appRoleForUser(currentUser);
    if (role === 'client') {
      return clientView === 'support' || (clientView === 'coverage' && openJobChat);
    }
    if (role === 'guard') {
      return guardTab === 'myJobs' && openJobChat;
    }
    if (role === 'staff') {
      return staffSection === 'messages' || staffSection === 'support';
    }
    return false;
  }, [currentUser, clientView, guardTab, staffSection, openJobChat]);

  useEffect(() => {
    if (!isDbConnected || !isInMessagingView) return;
    const interval = setInterval(() => {
      if (staffSection === 'messages' && currentUser && isStaffRole(currentUser.role)) {
        void refreshStaffMessagesRef.current();
        return;
      }
      if (!shouldSkipRealtimeSync()) {
        void loadRef.current();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isDbConnected, isInMessagingView, staffSection, currentUser]);

  useEffect(() => {
    if (!isDbConnected || !currentUser) return;

    const interval = setInterval(() => {
      const now = Date.now();
      for (const req of requests) {
        if (req.status !== 'in-progress' || !req.assignedGuardId || !req.checkInAudit?.checkedAt) continue;
        const key = `${req.id}-${Math.floor(now / (60 * 60 * 1000))}`;
        if (missedCheckinNotifiedRef.current.has(key)) continue;

        const lastMid = req.midShiftAudits?.[req.midShiftAudits.length - 1];
        const lastActivity = lastMid?.checkedAt ?? req.checkInAudit.checkedAt;
        const hoursSince = (now - new Date(lastActivity).getTime()) / (60 * 60 * 1000);
        if (hoursSince < 1) continue;

        missedCheckinNotifiedRef.current.add(key);
        const guard = guards.find((g) => g.id === req.assignedGuardId);
        void reportPushEvent(currentUser, {
          type: 'missed_checkin',
          guardId: guard?.id,
          guardName: guard?.name,
          requestId: req.id,
          location: req.location,
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isDbConnected, currentUser?.id, requests, guards]);

  // Fallback when realtime reconnects after sleep / background tab
  useEffect(() => {
    if (!isDbConnected) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !shouldSkipRealtimeSync()) {
        void loadRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isDbConnected]);

  // ── Derived ────────────────────────────────────────────────
  // Only real guards (not clients/auditors/staff-only accounts)
  const verifiedGuards = guards.filter(g => !g.id.startsWith('client-') && !g.id.startsWith('auditor-'));
  const activeGuard =
    (currentUser?.role === 'guard' ? findGuardProfileForUser(currentUser, verifiedGuards) : undefined) ??
    verifiedGuards.find((g) => g.id === activeGuardId) ??
    verifiedGuards[0] ??
    ({} as SecurityGuard);

  // ── Auth ───────────────────────────────────────────────────
  const handleSignIn = (user: SessionUser, options?: { passwordChangeRecommended?: boolean }) => {
    localStorage.setItem('guardr_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setPasswordChangePromptOpen(!!options?.passwordChangeRecommended);
    setIsAuthView(false);
  };

  const handleDismissPasswordChange = () => {
    setPasswordChangePromptOpen(false);
  };

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
    localStorage.removeItem('guardr_current_user');
    setCurrentUser(null);
    setIsAuthView(false);
    setLegalPageState(null);
    setLegalReturnAuth(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
  };

  /**
   * Sign up handler — routes to the correct table based on role:
   *   guard   → guards table
   *   client  → clients table
   *   auditor → guards table (auditor is a special reviewer role, same table)
   *   staff   → guards table
   */
  const handleSignUp = async (
    profile: SecurityGuard | Client,
    role: 'guard' | 'client',
    password: string
  ): Promise<void> => {
    if (!isDbConnected) {
      throw new Error('Database is not connected. Cannot create accounts until Supabase is linked.');
    }

    const emailLower = assertEmailAvailable(profile.email);

    if (role === 'client') {
      const client = profile as Client;
      const accountStatus = client.accountStatus ?? 'pending';
      try {
        await supabase.from('clients').insert({
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
        setStoredPassword(client.email, { password, mustChangePassword: false, role: 'client' });
        await loadFromSupabase();
      } catch (e) {
        console.error('Client DB insert error:', e);
        throw new Error('Could not create client account. This email may already be registered.');
      }
      return;
    }

    const guard = profile as SecurityGuard;
    const userStatus = guard.userStatus || 'pending';
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
        is_staff: guard.isStaff,
        staff_role: guard.staffRole,
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
      await loadFromSupabase();
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
      status: 'pending',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate || new Date().toISOString().split('T')[0],
      state: newCert.state?.toUpperCase(),
      catalogId: newCert.catalogId,
      category: newCert.category,
      imageUrl: newCert.imageUrl,
      submittedByRole: newCert.submittedByRole ?? submittedByRole,
    };
    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return syncGuardCredentialGraceState({
          ...g,
          certifications: [...g.certifications, certWithId],
        });
      })
    );
    if (isDbConnected) {
      beginLocalMutation();
      try {
        const insertResult = await insertCertificationRow(supabase, {
          id: certWithId.id, guard_id: guardId, name: certWithId.name,
          issuer: certWithId.issuer, number: certWithId.number, status: certWithId.status,
          issue_date: certWithId.issueDate, expiry_date: certWithId.expiryDate,
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
      } catch (e) {
        setGuards(prev =>
          prev.map(g =>
            g.id === guardId
              ? { ...g, certifications: g.certifications.filter((c) => c.id !== certWithId.id) }
              : g
          )
        );
        console.error('Cert insert error:', e);
        return { ok: false, error: certDatabaseErrorMessage(error) };
      }
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

    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              certifications: g.certifications.map((c) =>
                c.id === certId
                  ? {
                      ...c,
                      imageUrl,
                      status: requeueForReview ? ('pending' as const) : c.status,
                      rejectionReason: requeueForReview ? undefined : c.rejectionReason,
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
    const expiryDate = payload.expiryDate?.trim() || '';
    const state = payload.state?.trim().toUpperCase() || undefined;
    const imageUrl = payload.imageUrl?.trim() || undefined;

    if (!issuer || !number || !expiryDate) {
      return { ok: false, error: 'Enter issuer, number, and expiry date.' };
    }

    const nextImageUrl = imageUrl ?? cert.imageUrl;
    const proof = validateCertSubmission(nextImageUrl);
    if (!proof.ok) return proof;

    if (submittedByRole === 'guard' && !guardCertificationCanEdit(cert)) {
      return { ok: false, error: 'This credential cannot be edited while under review.' };
    }

    if (
      submittedByRole === 'guard' &&
      imageUrl &&
      imageUrl !== (cert.imageUrl ?? '').trim() &&
      certImageIsLocked(cert)
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
      expiryDate !== cert.expiryDate.trim() ||
      (state ?? '') !== (cert.state ?? '').trim().toUpperCase() ||
      (imageUrl ?? '') !== (cert.imageUrl ?? '').trim();

    if (!dataChanged) return { ok: true };

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
                      expiryDate,
                      state,
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
            expiry_date: expiryDate,
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
    const before = guards.find((g) => g.id === guardId);
    const cert = before?.certifications.find((c) => c.id === certId);
    if (!cert) throw new Error('Credential not found.');
    const verifyBlocker = staffVerifyCertificationBlocker(cert);
    if (verifyBlocker) throw new Error(verifyBlocker);
    if (!staffCanVerifyCertification(cert)) {
      throw new Error('This credential cannot be verified yet.');
    }

    setGuards((prev) =>
      prev.map((g) => {
        if (g.id !== guardId) return g;
        return syncGuardCredentialGraceState({
          ...g,
          certifications: g.certifications.map((c) =>
            c.id === certId ? { ...c, status: 'verified' as const } : c
          ),
        });
      })
    );
    if (isDbConnected) {
      await supabase.from('certifications').update({ status: 'verified' }).eq('id', certId);
      const after = before
        ? syncGuardCredentialGraceState({
            ...before,
            certifications: before.certifications.map((c) =>
              c.id === certId ? { ...c, status: 'verified' as const } : c
            ),
          })
        : null;
      if (
        after &&
        (after.credentialGraceDeadline !== before?.credentialGraceDeadline ||
          JSON.stringify(after.credentialGraceMissing ?? []) !==
            JSON.stringify(before?.credentialGraceMissing ?? []))
      ) {
        beginLocalMutation();
        await supabase
          .from('guards')
          .update({
            credential_grace_deadline: after.credentialGraceDeadline ?? null,
            credential_grace_missing: after.credentialGraceMissing ?? null,
          })
          .eq('id', guardId);
      }
    }
  };

  const handleRejectCert = async (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'rejected' as const } : c) } : g));
    if (isDbConnected) await supabase.from('certifications').update({ status: 'rejected' }).eq('id', certId);
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
              bio: payload.bio ?? payload.summary ?? g.bio,
              headline: payload.headline ?? g.headline,
              summary: payload.summary ?? g.summary,
              about: payload.about ?? g.about,
              skills: payload.skills ?? g.skills,
              languages: payload.languages ?? g.languages,
              serviceAreas: payload.serviceAreas ?? g.serviceAreas,
              specialties: payload.specialties ?? g.specialties,
              yearsExperience: payload.yearsExperience ?? g.yearsExperience,
              availabilityNotes: payload.availabilityNotes ?? g.availabilityNotes,
              hourlyRateRequirement: payload.hourlyRateRequirement ?? g.hourlyRateRequirement,
              avatar: payload.avatar !== undefined ? payload.avatar : g.avatar,
              badgeNumber: payload.badgeNumber ?? g.badgeNumber,
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
      if (payload.badgeNumber !== undefined) profileUpdate.badge_number = payload.badgeNumber;

      const table = previous.isStaff ? 'staff' : 'guards';
      if (!previous.isStaff) {
        Object.assign(profileUpdate, {
          headline: payload.headline ?? '',
          summary: payload.summary ?? '',
          about: payload.about ?? '',
          skills: payload.skills ?? [],
          languages: payload.languages ?? [],
          service_areas: payload.serviceAreas ?? [],
          specialties: payload.specialties ?? [],
          years_experience: payload.yearsExperience ?? null,
          availability_notes: payload.availabilityNotes ?? '',
          hourly_rate_requirement: payload.hourlyRateRequirement ?? null,
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
      beginLocalMutation();
      const { error } = await supabase.from('clients').update(clientUpdate).eq('id', clientId);
      if (error) {
        if (previous) {
          setClients((prev) => prev.map((c) => (c.id === clientId ? previous : c)));
        }
        console.error('Client profile update error:', error);
        throw new Error('Could not save profile photo. Please try again.');
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

  // ── Staff controls ─────────────────────────────────────────
  const handleUpdateGuardUserStatus = async (guardId: string, status: 'active' | 'suspended' | 'blocked') => {
    const target = guards.find((g) => g.id === guardId);
    if (!target) return;
    if (target.isStaff && currentUser) {
      if (guardId === currentUser.id) {
        alert('You cannot change your own account status.');
        return;
      }
      if (!canModerateStaffMember(currentUser.role, currentUser.id, target)) {
        alert('You cannot moderate staff at the same role level or above your own.');
        return;
      }
    }
    if (!target.isStaff && status === 'active') {
      if (isGuardAccountPending(target)) {
        alert('Approve this guard profile before activating their account.');
        return;
      }
      if (isGuardAccountApproved(target)) {
        const blockers = guardAccountActivationBlockers(target);
        if (blockers.length > 0) {
          alert(`Cannot activate account yet:\n• ${blockers.join('\n• ')}`);
          return;
        }
        alert(
          'Use Activate account in Approvals to fully activate this guard (guard card on file, optional grace for missing PTA/32-hour).'
        );
        return;
      }
    }
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, userStatus: status } : g));
    if (isDbConnected) {
      const table = target.isStaff ? 'staff' : 'guards';
      await supabase.from(table).update({ user_status: status }).eq('id', guardId);
    }
  };

  const assertEmailAvailable = (email: string) => {
    const emailLower = email.trim().toLowerCase();
    if (guards.some((g) => g.email.toLowerCase() === emailLower)) {
      throw new Error('This email is already registered to a guard or staff account.');
    }
    if (clients.some((c) => c.email.toLowerCase() === emailLower)) {
      throw new Error('This email is already registered to a client account.');
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
      badgeNumber: input.badgeNumber?.trim() || `GR-${Math.floor(10000 + Math.random() * 90000)}`,
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
      companyName: input.companyName?.trim() || normalized.name,
      phone: input.phone?.trim() || '',
      avatar: '',
      totalRequests: 0,
      approved: true,
      accountStatus: 'active',
      password,
      mustChangePassword,
    };
    setClients((prev) => [...prev, newClient]);
    if (isDbConnected) {
      try {
        await supabase.from('clients').insert({
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
          approved: true,
          account_status: 'active',
          password,
          must_change_password: mustChangePassword,
        });
      } catch (e) {
        setClients((prev) => prev.filter((c) => c.id !== newClient.id));
        console.error('Client insert error:', e);
        throw new Error('Could not save client to the database.');
      }
    }
    setStoredPassword(emailLower, { password, mustChangePassword, role: 'client' });
    return newClient.id;
  };

  const handleAddStaffProfile = async (
    name: string,
    email: string,
    badgeNumber: string,
    staffRole: StaffRole
  ): Promise<string> => {
    if (!currentUser || !canAssignStaffRole(currentUser.role, staffRole)) {
      throw new Error('You cannot assign that staff role.');
    }
    const emailLower = assertEmailAvailable(email);
    const { password, mustChangePassword } = provisionedPasswordFields();
    const normalized = personNameFromPayload(resolvePersonNameParts({ name }));
    const newStaff: SecurityGuard = {
      id: `staff-${Date.now()}`,
      name: normalized.name,
      firstName: normalized.firstName,
      middleName: normalized.middleName,
      lastName: normalized.lastName,
      email: email.trim(),
      badgeNumber: badgeNumber.trim(),
      avatar: '',
      phone: '',
      bio: `${staffRole} — Platform operations.`,
      isArmed: false,
      backgroundChecked: true,
      verified: true,
      rating: 5.0,
      jobsCompleted: 0,
      certifications: [],
      experience: [],
      hourlyRateRequirement: 0,
      isStaff: true,
      staffRole,
      userStatus: 'active',
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
          middle_name: newStaff.middleName ?? null,
          last_name: newStaff.lastName,
          email: emailLower,
          badge_number: newStaff.badgeNumber,
          avatar: newStaff.avatar,
          phone: newStaff.phone,
          bio: newStaff.bio,
          staff_role: staffRole,
          user_status: 'active',
          password,
          must_change_password: mustChangePassword,
        });
      } catch (e) {
        setGuards((prev) => prev.filter((g) => g.id !== newStaff.id));
        console.error('Staff insert error:', e);
        throw new Error('Could not save staff account to the database.');
      }
    }
    setStoredPassword(emailLower, { password, mustChangePassword, role: 'guard' });
    return newStaff.id;
  };

  const handleUpdateStaffRole = async (
    staffId: string,
    staffRole: StaffRole
  ) => {
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
    if (!canAssignStaffRole(currentUser.role, staffRole)) {
      throw new Error('You cannot assign that staff role.');
    }
    const bio = `${staffRole} — Platform operations.`;
    setGuards((prev) =>
      prev.map((g) => (g.id === staffId ? { ...g, staffRole, bio } : g))
    );
    if (isDbConnected) {
      try {
        await supabase.from('staff').update({ staff_role: staffRole, bio }).eq('id', staffId);
      } catch (e) {
        console.error('Staff role update error:', e);
        throw new Error('Could not update staff role in the database.');
      }
    }
  };

  const handleApproveClient = async (clientId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, approved: true, accountStatus: 'active' as const } : c
      )
    );
    if (isDbConnected) {
      await supabase.from('clients').update({ approved: true, account_status: 'active' }).eq('id', clientId);
    }
  };

  const handleRejectClient = async (clientId: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, approved: false, accountStatus: 'suspended' as const } : c
      )
    );
    if (isDbConnected) {
      await supabase.from('clients').update({ approved: false, account_status: 'suspended' }).eq('id', clientId);
    }
  };

  const handleApproveGuardAccount = async (guardId: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    const blockers = guardAccountApprovalBlockers(guard);
    if (blockers.length > 0) {
      throw new Error(`Cannot approve profile yet:\n• ${blockers.join('\n• ')}`);
    }

    const approvedGuard: SecurityGuard = {
      ...guard,
      userStatus: 'approved',
      verified: true,
      credentialGraceDeadline: undefined,
      credentialGraceMissing: undefined,
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
        },
        'approve'
      );
      if (!result.ok) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? guard : g)));
        throw new Error(result.error);
      }
    }
  };

  const handleActivateGuardAccount = async (guardId: string, options?: ActivateGuardAccountOptions) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    const blockers = guardAccountActivationBlockers(guard);
    if (blockers.length > 0) {
      throw new Error(`Cannot activate account yet:\n• ${blockers.join('\n• ')}`);
    }

    const missingGrace = getGuardMissingGraceCredentialLabels(guard);
    if (missingGrace.length > 0 && (!options?.graceHours || options.graceHours <= 0)) {
      throw new Error(
        `Cannot activate — ${missingGrace.join(', ')} not listed or on file. Set a grace period when activating.`
      );
    }

    const gracePatch = guardCredentialGracePatchForActivation(guard, 'CA', options?.graceHours);
    const activeGuard: SecurityGuard = {
      ...guard,
      userStatus: 'active',
      verified: true,
      ...gracePatch,
    };

    setGuards((prev) => prev.map((g) => (g.id === guardId ? activeGuard : g)));
    if (isDbConnected) {
      beginLocalMutation();
      const result = await updateGuardAccountRow(
        supabase,
        guardId,
        {
          user_status: 'active',
          verified: true,
          credential_grace_deadline: gracePatch.credentialGraceDeadline ?? null,
          credential_grace_missing: gracePatch.credentialGraceMissing ?? null,
        },
        'activate'
      );
      if (!result.ok) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? guard : g)));
        throw new Error(result.error);
      }
    }
  };

  const handleSubmitGuardIdentityVerification = async (
    guardId: string,
    payload: {
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
    if (guard.isStaff) return { ok: false, error: 'Staff accounts do not require ID verification.' };

    const idState = payload.idState.trim().toUpperCase();
    const idNumber = payload.idNumber.trim();
    const idExpiryDate = payload.idExpiryDate.trim();
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
    if (getGuardUserStatus(guard) === 'blocked') {
      return { ok: false, error: 'Your application was not approved. Contact Guardr support.' };
    }

    const previous = { ...guard };
    const submittedAt = new Date().toISOString();
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              idState,
              idNumber,
              idExpiryDate,
              idFrontUrl: front,
              idBackUrl: back,
              idSelfieUrl: selfie,
              idVerificationStatus: 'pending' as const,
              idVerificationSubmittedAt: submittedAt,
              idVerificationRejectionReason: undefined,
              idSubmittedBy: 'guard' as const,
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from('guards')
        .update({
          id_state: idState,
          id_number: idNumber,
          id_expiry_date: idExpiryDate,
          id_front_url: front,
          id_back_url: back,
          id_selfie_url: selfie,
          id_verification_status: 'pending',
          id_verification_submitted_at: submittedAt,
          id_verification_rejection_reason: null,
          id_submitted_by: 'guard',
        })
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('ID verification submit error:', error);
        return { ok: false, error: 'Could not save ID verification. Please try again.' };
      }
    }
    return { ok: true };
  };

  const handleApproveGuardIdentityVerification = async (guardId: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) throw new Error('Guard not found.');
    if (!staffCanApproveIdVerification(guard)) {
      throw new Error('Cannot approve ID yet — ensure state, number, expiration, and all photos are on file.');
    }

    const reviewedAt = new Date().toISOString();
    const previous = { ...guard };
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              idVerificationStatus: 'verified' as const,
              idVerificationReviewedAt: reviewedAt,
              idVerificationRejectionReason: undefined,
            }
          : g
      )
    );
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from('guards')
        .update({
          id_verification_status: 'verified',
          id_verification_reviewed_at: reviewedAt,
          id_verification_rejection_reason: null,
        })
        .eq('id', guardId);
      if (error) {
        setGuards((prev) => prev.map((g) => (g.id === guardId ? previous : g)));
        console.error('ID verification approve error:', error);
        throw new Error('Could not approve government ID. Please try again.');
      }
    }
  };

  const handleRejectGuardIdentityVerification = async (guardId: string, reason?: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard || guard.isStaff) return;

    const reviewedAt = new Date().toISOString();
    const rejectionReason = reason?.trim() || GUARD_APPLICATION_REJECT_DEFAULT_REASON;
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              userStatus: 'blocked' as const,
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
          id_verification_status: 'rejected',
          id_verification_reviewed_at: reviewedAt,
          id_verification_rejection_reason: rejectionReason,
        })
        .eq('id', guardId);
    }
  };

  const handleStaffUpdateGuardIdImages = async (
    guardId: string,
    payload: {
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
    if (guard.isStaff) return { ok: false, error: 'Staff accounts do not require ID verification.' };
    if (getGuardUserStatus(guard) === 'blocked') {
      return { ok: false, error: 'This application was rejected — account is blocked.' };
    }

    const idState = payload.idState?.trim().toUpperCase() || guard.idState?.trim().toUpperCase() || '';
    const idNumber = payload.idNumber?.trim() || guard.idNumber?.trim() || '';
    const idExpiryDate = payload.idExpiryDate?.trim() || guard.idExpiryDate?.trim() || '';
    const front = payload.idFrontUrl?.trim() || guard.idFrontUrl?.trim() || '';
    const back = payload.idBackUrl?.trim() || guard.idBackUrl?.trim() || '';
    const selfie = payload.idSelfieUrl?.trim() || guard.idSelfieUrl?.trim() || '';
    if (!front && !back && !selfie && !idState && !idNumber && !idExpiryDate) {
      return { ok: false, error: 'Enter ID details or upload at least one ID photo to save.' };
    }

    const complete = Boolean(idState && idNumber && idExpiryDate && front && back && selfie);
    const dataChanged =
      idState !== (guard.idState ?? '').trim().toUpperCase() ||
      idNumber !== (guard.idNumber ?? '').trim() ||
      idExpiryDate !== (guard.idExpiryDate ?? '').trim() ||
      front !== (guard.idFrontUrl ?? '').trim() ||
      back !== (guard.idBackUrl ?? '').trim() ||
      selfie !== (guard.idSelfieUrl ?? '').trim();
    if (!dataChanged) return { ok: true };

    const previous = { ...guard };
    const now = new Date().toISOString();
    let nextStatus = guard.idVerificationStatus ?? 'not_submitted';

    if (guard.idVerificationStatus === 'verified') {
      nextStatus = 'verified';
    } else if (complete) {
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
              idSubmittedBy:
                complete && nextStatus === 'pending' ? ('staff' as const) : g.idSubmittedBy,
            }
          : g
      )
    );

    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase
        .from('guards')
        .update({
          id_state: idState || null,
          id_number: idNumber || null,
          id_expiry_date: idExpiryDate || null,
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
          id_submitted_by: complete && nextStatus === 'pending' ? 'staff' : guard.idSubmittedBy ?? null,
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
        .from('guards')
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
        throw new Error('Could not delete client account from the database.');
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
      alert('Your client account is pending Guardr approval. You can update your profile, but cannot post jobs yet.');
      return;
    }

    const startDate = newRequest.startDate || new Date().toISOString();
    const endDate = newRequest.endDate || new Date(Date.now() + 8 * 3600000).toISOString();
    const scheduleError = validateShiftSchedule(startDate, endDate);
    if (scheduleError) {
      alert(scheduleError);
      return;
    }

    const clientName = clientRecord?.companyName || currentUser?.clientName || currentUser?.name || 'Client';
    const clientLogo = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
    const siteName = newRequest.siteName || '';
    const address = newRequest.address || newRequest.location || 'To Be Confirmed';
    const durationHours = newRequest.durationHours ?? computeDurationHours(startDate, endDate);
    const hourlyRate = newRequest.hourlyRate || 35;
    const guardPay = newRequest.guardPay ?? computeGuardPay(hourlyRate);
    const estimatedPayout = newRequest.estimatedPayout ?? Math.round(durationHours * hourlyRate * 100) / 100;
    const location = siteName ? `${siteName} — ${address}` : address;

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
      state: newRequest.state?.toUpperCase() || '',
      location,
      type: newRequest.type || 'event',
      armedRequired: newRequest.armedRequired || false,
      guardsNeeded: newRequest.guardsNeeded || 1,
      uniformRequirements: newRequest.uniformRequirements || '',
      equipmentRequirements: newRequest.equipmentRequirements || '',
      siteInstructions: newRequest.siteInstructions || newRequest.description || '',
      contactName: newRequest.contactName,
      contactPhone: newRequest.contactPhone,
      parkingInstructions: newRequest.parkingInstructions,
      accessInstructions: newRequest.accessInstructions,
      latitude: newRequest.latitude,
      longitude: newRequest.longitude,
      startDate, endDate, durationHours, hourlyRate, guardPay,
      platformFeePerHour: PLATFORM_FEE_PER_HOUR,
      estimatedPayout,
      status: 'pending-review',
      paymentStatus: 'unpaid',
      assignedGuardId: null,
      requestType: newRequest.requestType ?? 'marketplace',
      targetGuardId: newRequest.requestType === 'direct' ? (newRequest.targetGuardId ?? null) : null,
      requiredCertifications: newRequest.requiredCertifications || [],
      minGuardQualification: newRequest.minGuardQualification ?? 'pending',
      applicants: [],
    };

    setRequests(prev => [freshJob, ...prev]);

    // Increment client's total_requests
    if (currentUser?.id) {
      setClients(prev => prev.map(c => c.id === currentUser.id ? { ...c, totalRequests: c.totalRequests + 1 } : c));
      if (isDbConnected) {
        const cl = clients.find(c => c.id === currentUser.id);
        if (cl) await supabase.from('clients').update({ total_requests: cl.totalRequests + 1 }).eq('id', currentUser.id);
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

    if (isDbConnected) {
      try {
        await supabase.from('security_requests').insert({
          id: freshJob.id, title: freshJob.title, description: freshJob.description,
          client_id: freshJob.clientId, client_name: freshJob.clientName, client_logo: freshJob.clientLogo,
          site_name: freshJob.siteName, address: freshJob.address, state: freshJob.state ?? '',
          location: freshJob.location, type: freshJob.type, armed_required: freshJob.armedRequired,
          guards_needed: freshJob.guardsNeeded,
          uniform_requirements: freshJob.uniformRequirements,
          equipment_requirements: freshJob.equipmentRequirements,
          site_instructions: freshJob.siteInstructions,
          start_date: freshJob.startDate, end_date: freshJob.endDate,
          duration_hours: freshJob.durationHours, hourly_rate: freshJob.hourlyRate,
          guard_pay: freshJob.guardPay, platform_fee_per_hour: freshJob.platformFeePerHour,
          estimated_payout: freshJob.estimatedPayout, status: freshJob.status,
          payment_status: 'unpaid',
          assigned_guard_id: freshJob.assignedGuardId,
          request_type: freshJob.requestType ?? 'marketplace',
          target_guard_id: freshJob.targetGuardId ?? null,
          required_certifications: freshJob.requiredCertifications,
          min_guard_qualification: freshJob.minGuardQualification ?? 'pending',
          applicants: freshJob.applicants,
          ...listingDetailDbColumns(freshJob),
        });
      } catch (e) { console.error('Request insert error:', e); }
    }
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
    const status: SecurityRequest['status'] = assignedGuardId ? 'accepted' : 'open';

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
      state: input.state,
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
      latitude: input.latitude,
      longitude: input.longitude,
      startDate: input.startDate,
      endDate: input.endDate,
      durationHours: input.durationHours,
      hourlyRate: input.hourlyRate,
      guardPay: input.guardPay,
      platformFeePerHour: PLATFORM_FEE_PER_HOUR,
      estimatedPayout: input.estimatedPayout,
      status,
      paymentStatus: 'unpaid',
      assignedGuardId,
      requestType: assignedGuardId ? 'direct' : 'marketplace',
      targetGuardId: assignedGuardId,
      requiredCertifications: [],
      minGuardQualification: 'pending',
      applicants: assignedGuardId ? [assignedGuardId] : [],
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
        body: `You picked up ${freshJob.title}`,
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
          required_certifications: freshJob.requiredCertifications,
          min_guard_qualification: freshJob.minGuardQualification ?? 'pending',
          applicants: freshJob.applicants,
          ...listingDetailDbColumns(freshJob),
        });
      } catch (e) {
        console.error('Staff job insert error:', e);
      }
    }

    return freshJob.id;
  };

  const handleStaffAssignGuard = async (requestId: string, guardId: string) => {
    if (!currentUser || !canManageCompanyOperations(currentUser)) {
      alert('Only directors can select guards for jobs.');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    const guard = guards.find((g) => g.id === guardId);
    if (!job || !guard) return;
    if (job.assignedGuardId) {
      alert('A guard has already picked up this job.');
      return;
    }
    if (!['open', 'pending-review'].includes(job.status)) {
      alert('Guards can only be placed on open jobs awaiting a guard.');
      return;
    }
    const userStatus = getGuardUserStatus(guard);
    if (userStatus === 'pending') {
      alert(`${guard.name} cannot pick up this job — account is pending approval.`);
      return;
    }
    if (userStatus === 'suspended' || userStatus === 'blocked') {
      alert(`${guard.name} cannot pick up this job — account is ${userStatus}.`);
      return;
    }

    await assignGuardToJob(requestId, guardId);
  };

  const handleJobPaymentStatus = async (requestId: string, paymentStatus: PaymentStatus) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, paymentStatus } : r));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ payment_status: paymentStatus }).eq('id', requestId);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: SecurityRequest['status']) => {
    const req = requests.find(r => r.id === requestId);
    if (req && status === 'in-progress' && req.assignedGuardId) {
      const assigned = guards.find((g) => g.id === req.assignedGuardId);
      const workBlocked = assigned ? guardWorkBlockedMessage(assigned, req.state) : 'Guard on job not found.';
      if (workBlocked) {
        alert(workBlocked);
        return;
      }
    }
    if (req && status === 'in-progress') {
      const blocked = guardClockInBlockedMessage(req);
      if (blocked) {
        alert(blocked);
        return;
      }
    }
    if (req && status === 'completed') {
      const blocked = guardClockOutBlockedMessage(req);
      if (blocked) {
        alert(blocked);
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

  const handleMarkClientPaidCash = async (requestId: string) => {
    if (!currentUser || !canRecordCashPayments(currentUser)) {
      alert('Only Directors and Owners can record cash client payments.');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canDirectorMarkClientPaidCash(req)) {
      alert('This job cannot be marked as paid in cash.');
      return;
    }
    if (!window.confirm(`Record client cash payment of $${req.estimatedPayout} for "${req.title}"?`)) return;

    const paymentId = `pay-cash-client-${Date.now()}`;
    const existingPayment = payments.find((p) => p.jobId === requestId);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              paymentStatus: 'paid',
              clientPaymentMethod: 'cash',
              cashDepositedToStripe: false,
              cashDepositedAmount: 0,
              cashDepositedAt: undefined,
              platformFeePaidCash: false,
            }
          : r
      )
    );
    setPayments((prev) => {
      if (existingPayment) {
        return prev.map((p) =>
          p.jobId === requestId ? { ...p, status: 'paid', paymentMethod: 'cash' } : p
        );
      }
      return [
        ...prev,
        {
          id: paymentId,
          jobId: requestId,
          amount: req.estimatedPayout,
          status: 'paid' as const,
          paymentMethod: 'cash' as const,
        },
      ];
    });

    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          payment_status: 'paid',
          client_payment_method: 'cash',
          cash_deposited_to_stripe: false,
          cash_deposited_at: null,
          cash_deposited_amount: 0,
          platform_fee_paid_cash: false,
        })
        .eq('id', requestId);
      if (existingPayment) {
        await supabase
          .from('payments')
          .update({ status: 'paid', payment_method: 'cash' })
          .eq('id', existingPayment.id);
      } else {
        await supabase.from('payments').insert({
          id: paymentId,
          job_id: requestId,
          amount: req.estimatedPayout,
          status: 'paid',
          payment_method: 'cash',
        });
      }
    }
  };

  const handleMarkGuardPaidCash = async (requestId: string) => {
    if (!currentUser || !canRecordCashPayments(currentUser)) {
      alert('Only Directors and Owners can record cash guard payouts.');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canDirectorMarkGuardPaidCash(req)) {
      alert('This job is not ready for a cash guard payout.');
      return;
    }
    const amount = guardPayoutAmount(req);
    if (!window.confirm(`Record $${amount} paid in cash to the guard for "${req.title}"?`)) return;

    const paymentId = `pay-cash-guard-${Date.now()}`;
    const existingGuardPayment = payments.find(
      (p) => p.jobId === requestId && p.status === 'released'
    );

    const nextRequests = requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            paymentStatus: 'released' as const,
            guardPayoutMethod: 'cash' as const,
            guardCashPayoutRequested: false,
            guardCashPayoutRequestedAt: undefined,
          }
        : r
    );
    setRequests(nextRequests);
    setPayments((prev) => {
      if (existingGuardPayment) {
        return prev.map((p) =>
          p.id === existingGuardPayment.id
            ? { ...p, status: 'released', paymentMethod: 'cash', amount }
            : p
        );
      }
      return [
        ...prev,
        {
          id: paymentId,
          jobId: requestId,
          amount,
          status: 'released' as const,
          paymentMethod: 'cash' as const,
        },
      ];
    });

    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          payment_status: 'released',
          guard_payout_method: 'cash',
          guard_cash_payout_requested: false,
          guard_cash_payout_requested_at: null,
        })
        .eq('id', requestId);
      if (existingGuardPayment) {
        await supabase
          .from('payments')
          .update({ status: 'released', payment_method: 'cash', amount })
          .eq('id', existingGuardPayment.id);
      } else {
        await supabase.from('payments').insert({
          id: paymentId,
          job_id: requestId,
          amount,
          status: 'released',
          payment_method: 'cash',
        });
      }
    }
    await syncOpenPayoutInvoices(nextRequests);
    alert(`Recorded $${amount} cash payout to guard.`);
  };

  const handleMarkPlatformFeePaidCash = async (requestId: string) => {
    if (!currentUser || !canRecordCashPayments(currentUser)) {
      alert('Only Directors and Owners can manually deposit platform fees.');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canDirectorMarkPlatformFeePaidCash(req)) {
      alert('This job does not have a platform fee ready to manually deposit.');
      return;
    }
    const feeAmount = getPlatformFeeAmount(req);
    if (!window.confirm(`Manually deposit $${feeAmount.toFixed(2)} platform fee for "${req.title}"?`)) {
      return;
    }

    const depositedAt = new Date().toISOString();
    const previousDeposited = req.cashDepositedAmount ?? 0;
    const newDeposited = Math.round((previousDeposited + feeAmount) * 100) / 100;
    const remaining = Math.max(0, getRequiredStripeDeposit(req) - newDeposited);
    const fullySatisfied = remaining <= 0;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              platformFeePaidCash: true,
              cashDepositedAmount: newDeposited,
              cashDepositedToStripe: fullySatisfied,
              cashDepositedAt: depositedAt,
            }
          : r
      )
    );

    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({
          platform_fee_paid_cash: true,
          cash_deposited_amount: newDeposited,
          cash_deposited_to_stripe: fullySatisfied,
          cash_deposited_at: depositedAt,
        })
        .eq('id', requestId);

      const paymentId = `pay-cash-platform-fee-${Date.now()}`;
      await supabase.from('payments').insert({
        id: paymentId,
        job_id: requestId,
        amount: feeAmount,
        status: 'paid',
        payment_method: 'cash',
      });
      setPayments((prev) => [
        ...prev,
        {
          id: paymentId,
          jobId: requestId,
          amount: feeAmount,
          status: 'paid',
          paymentMethod: 'cash',
        },
      ]);
    }

    alert(`Manually deposited $${feeAmount.toFixed(2)} platform fee.`);
  };

  const handleDepositCashToStripe = async (requestId: string) => {
    if (!currentUser || !canRecordCashPayments(currentUser)) {
      alert('Only Directors and Owners can pay client cash into Stripe.');
      return;
    }
    const req = requests.find((r) => r.id === requestId);
    if (!req || !canDirectorDepositCashToStripe(req)) {
      alert('This job does not need a card payment into Stripe right now.');
      return;
    }
    const depositAmount = getRemainingStripeDeposit(req);
    const amountCents = Math.round(depositAmount * 100);
    if (amountCents < 50) {
      alert('Deposit amount is too small to charge.');
      return;
    }

    try {
      const { url } = await createCashDepositCheckoutSession({
        jobId: requestId,
        directorEmail: currentUser.email,
        jobTitle: req.title,
        amountCents,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Unable to start card checkout');
    }
  };

  const handleAddReview = async (requestId: string, rating: number, reviewText: string) => {
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
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'open' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'open' }).eq('id', requestId);
  };

  const handleDenyRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
  };

  const handleCancelRequest = async (requestId: string) => {
    const existing = requests.find((r) => r.id === requestId);
    if (existing && !canClientEditRequest(existing)) {
      alert('Paid or in-progress jobs cannot be cancelled from here. Contact staff for help.');
      return;
    }
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
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
        alert(`Could not save job changes: ${error.message}`);
        throw new Error(error.message);
      }
    }

    setRequests((prev) => prev.map((r) => (r.id === requestId ? merged : r)));
  };

  const handleEditRequest = async (requestId: string, updates: Partial<SecurityRequest>) => {
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !canClientEditJobListing(existing)) {
      alert(existing ? jobEditBlockedReason(existing) ?? 'This job cannot be edited.' : 'Job not found.');
      return;
    }
    if (!isJobPaid(existing)) {
      const startDate = updates.startDate || existing.startDate;
      const endDate = updates.endDate || existing.endDate;
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        alert(scheduleError);
        return;
      }
    }
    await persistJobListingUpdate(requestId, existing, updates);
  };

  const handleStaffEditJobListing = async (requestId: string, updates: Partial<SecurityRequest>) => {
    if (!currentUser || !canEditJobListingDetails(currentUser)) {
      alert('Only directors and administrators can edit job listings.');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !canStaffEditJobTitleAndLocation(existing, currentUser.role)) {
      alert(existing ? 'This job cannot be edited in its current status.' : 'Job not found.');
      return;
    }
    if (!isJobPaid(existing)) {
      const startDate = updates.startDate || existing.startDate;
      const endDate = updates.endDate || existing.endDate;
      const scheduleError = validateShiftSchedule(startDate, endDate);
      if (scheduleError) {
        alert(scheduleError);
        return;
      }
    }
    await persistJobListingUpdate(requestId, existing, updates);
  };

  const assignGuardToJob = async (requestId: string, guardId: string) => {
    const job = requests.find((r) => r.id === requestId);
    const guard = guards.find((g) => g.id === guardId);
    if (!job || !guard) return;
    const workBlocked = guardWorkBlockedMessage(guard, job.state);
    if (workBlocked) {
      alert(workBlocked);
      return;
    }
    const { canAccept } = checkJobRequirements(guard, toGuardJobView(job));
    if (!canAccept) {
      alert(`${guard.name} does not meet the requirements for this job.`);
      return;
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: 'accepted', assignedGuardId: guardId, applicants: [...new Set([...r.applicants, guardId])] }
          : r
      )
    );
    if (isDbConnected) {
      await supabase
        .from('security_requests')
        .update({ status: 'accepted', assigned_guard_id: guardId, applicants: [...new Set([...job.applicants, guardId])] })
        .eq('id', requestId);
    }
    if (currentUser && guardId !== currentUser.id) {
      void reportPushEvent(currentUser, {
        type: 'assignment',
        guardId,
        requestId,
        location: job.location,
        body: `You picked up ${job.title}`,
      });
    }
    await ensureJobChatThread({ ...job, status: 'accepted', assignedGuardId: guardId });
  };

  // ── Guard applies to open job offer (staff approves best fit) ──
  const handleApplyToJob = async (requestId: string) => {
    if (activeGuard.isStaff) {
      alert('Staff accounts cannot apply to field jobs. Sign in with a guard account to work jobs.');
      return;
    }
    const workBlocked = guardWorkBlockedMessage(activeGuard);
    if (workBlocked) {
      alert(workBlocked);
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job) return;
    if (job.status !== 'open') {
      alert('This job is no longer open for applications.');
      return;
    }
    if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== activeGuardId) {
      alert('This request was sent to another guard from their profile.');
      return;
    }
    if (guardHasApplied(job, activeGuardId)) {
      alert('You already applied for this job. Staff will review your application.');
      return;
    }
    if (!guardCanApplyToJob(activeGuard, toGuardJobView(job))) {
      const missing = checkJobRequirements(activeGuard, toGuardJobView(job))
        .checks.filter((c) => !c.met)
        .map((c) => c.label)
        .join(', ');
      alert(`You must qualify before applying: ${missing}. Upload the required credentials in your profile.`);
      return;
    }
    const nextApplicants = [...job.applicants, activeGuardId];
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, applicants: nextApplicants } : r))
    );
    if (isDbConnected) {
      await supabase.from('security_requests').update({ applicants: nextApplicants }).eq('id', requestId);
    }
    alert('Application submitted. Guardr staff will review applicants and approve the best fit.');
  };

  const handleStaffApproveGuardApplication = async (requestId: string, guardId: string) => {
    if (!currentUser || !isStaffRole(currentUser.role)) {
      alert('Only staff can approve guard applications.');
      return;
    }
    const job = requests.find((r) => r.id === requestId);
    if (!job || job.status !== 'open') {
      alert('This job is not open for guard applications.');
      return;
    }
    if (!job.applicants.includes(guardId)) {
      alert('This guard has not applied for the job.');
      return;
    }
    await assignGuardToJob(requestId, guardId);
  };

  // ── Audit lifecycle ────────────────────────────────────────
  const handleUpdateJobAudit = async (requestId: string, payload: { checkInAudit?: any; midShiftAudit?: any; checkOutAudit?: any; status?: SecurityRequest['status']; }) => {
    const req = requests.find((r) => r.id === requestId);
    if (req && payload.status === 'in-progress' && payload.checkInAudit) {
      const workBlocked = guardWorkBlockedMessage(activeGuard, req.state);
      if (workBlocked) {
        alert(workBlocked);
        return;
      }
      if (!canGuardClockIn(req)) {
        alert(guardClockInBlockedMessage(req) ?? 'Clock-in is not open yet.');
        return;
      }
    }
    if (req && payload.status === 'completed') {
      if (!canGuardClockOut(req)) {
        alert(guardClockOutBlockedMessage(req) ?? 'Clock-out is not available right now.');
        return;
      }
    }
    const nextMidShiftAudits = payload.midShiftAudit
      ? [...(req?.midShiftAudits || []), payload.midShiftAudit]
      : undefined;

    const previousRequest = req ? (JSON.parse(JSON.stringify(req)) as SecurityRequest) : null;
    const completedGuardId =
      payload.status === 'completed' && req?.assignedGuardId ? req.assignedGuardId : null;

    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const updated = { ...r };
      if (payload.checkInAudit) updated.checkInAudit = payload.checkInAudit;
      if (nextMidShiftAudits) updated.midShiftAudits = nextMidShiftAudits;
      if (payload.checkOutAudit) updated.checkOutAudit = payload.checkOutAudit;
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
      if (payload.checkOutAudit) updates.check_out_audit = payload.checkOutAudit;
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
          alert('Could not save photos or job update. Please try again.');
          return;
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

    if (payload.checkOutAudit?.incidentReport?.hasIncident && currentUser) {
      const req = requests.find((r) => r.id === requestId);
      const guard = guards.find((g) => g.id === req?.assignedGuardId);
      void reportPushEvent(currentUser, {
        type: 'emergency_alert',
        requestId,
        guardId: guard?.id,
        guardName: guard?.name,
        location: req?.location,
        body: req?.checkOutAudit?.incidentReport?.description ?? 'Incident reported on active shift',
      });
    }

    if (payload.status === 'completed') {
      await archiveJobChatThread(requestId);
    }
  };

  const handleStaffUploadSelfAuditPhotos = async (requestId: string, photos: StaffSelfAuditPhotoPayload) => {
    if (!currentUser || !canUploadJobSelfAuditPhotos(currentUser)) {
      alert('Only staff can upload audit photos on behalf of guards.');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !canStaffUploadSelfAuditPhotos(existing, currentUser.role)) {
      alert(
        existing?.status === 'completed'
          ? currentUser.role === 'director' || currentUser.role === 'owner'
            ? 'Completed jobs only accept audit photos when photos are missing or flagged No Self Audit.'
            : 'Completed jobs only accept staff audit photos when flagged No Self Audit.'
          : existing?.assignedGuardId
            ? 'Audit photos cannot be added for this job right now.'
            : 'Assign a guard before uploading audit photos.'
      );
      return;
    }
    if (Object.keys(photos).length === 0) return;

    const baseAudit = existing.checkInAudit ?? {
      checkedAt: new Date().toISOString(),
      uniform: {
        uniformPresent: true,
        blackShoes: true,
        dutyBelt: true,
        nameBadge: true,
        professionalAppearance: true,
      },
      equipment: {
        radio: true,
        flashlight: true,
        requiredEquipment: true,
      },
      selfieUpload: '',
      gpsVerified: false,
      selfAuditSkipped: true,
      readyForDuty: false,
    };

    const checkInAudit = {
      ...baseAudit,
      ...(photos.self ? { selfieUpload: photos.self } : {}),
      ...(photos.uniform ? { uniformPhoto: photos.uniform } : {}),
      ...(photos.shoes ? { shoesPhoto: photos.shoes } : {}),
      staffUploadedAt: new Date().toISOString(),
      staffUploadedBy: currentUser.name,
    };

    if (selfAuditPhotosComplete(checkInAudit)) {
      checkInAudit.selfAuditSkipped = false;
      checkInAudit.readyForDuty = true;
    }

    const previousRequest = existing ? (JSON.parse(JSON.stringify(existing)) as SecurityRequest) : null;

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, checkInAudit } : r)));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase.from('security_requests').update({ check_in_audit: checkInAudit }).eq('id', requestId);
      if (error) {
        console.error('Staff self-audit upload error:', error);
        if (previousRequest) {
          setRequests((prev) => prev.map((r) => (r.id === requestId ? previousRequest : r)));
        }
        alert('Could not save audit photos. Please try again.');
      }
    }
  };

  const handleStaffUploadSpotCheck = async (requestId: string, imageUrl: string) => {
    if (!currentUser || !canUploadJobSpotCheck(currentUser)) {
      alert('Only staff can upload spot checks.');
      return;
    }
    const existing = requests.find((r) => r.id === requestId);
    if (!existing || !canStaffAddSpotCheck(existing)) {
      alert(
        hasSpotChecks(existing ?? { spotChecks: [] })
          ? 'This job already has a spot check. Only one spot check is allowed per job.'
          : existing?.assignedGuardId
            ? 'Spot checks can only be added while a guard is assigned to an active or completed job.'
            : 'Assign a guard before uploading a spot check.'
      );
      return;
    }
    if (!imageUrl) return;

    const spotCheck = {
      id: crypto.randomUUID(),
      imageUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
    };
    const spotChecks = [...(existing.spotChecks ?? []), spotCheck];
    const previousRequest = JSON.parse(JSON.stringify(existing)) as SecurityRequest;

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, spotChecks } : r)));
    if (isDbConnected) {
      beginLocalMutation();
      const { error } = await supabase.from('security_requests').update({ spot_checks: spotChecks }).eq('id', requestId);
      if (error) {
        console.error('Staff spot check upload error:', error);
        setRequests((prev) => prev.map((r) => (r.id === requestId ? previousRequest : r)));
        alert('Could not save spot check photo. Please try again.');
      }
    }
  };

  const handleClientConfirmSelfAudit = async (requestId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) {
      alert('Job not found.');
      return;
    }
    const ownsJob =
      existing.clientId === currentUser.id ||
      existing.clientName === currentUser.clientName ||
      existing.clientName === currentUser.name;
    if (!ownsJob) {
      alert('You can only confirm audits on your own jobs.');
      return;
    }
    if (!canClientConfirmSelfAudit(existing)) {
      alert(
        existing.checkInAudit?.clientConfirmedAt
          ? 'Self-audit photos are already confirmed.'
          : 'All three self-audit photos must be on file before you can confirm.'
      );
      return;
    }

    const checkInAudit = {
      ...existing.checkInAudit!,
      clientConfirmedAt: new Date().toISOString(),
      clientConfirmedBy: currentUser.name,
    };

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, checkInAudit } : r)));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ check_in_audit: checkInAudit }).eq('id', requestId);
    }
  };

  const handleClientConfirmSpotCheck = async (requestId: string, spotCheckId: string) => {
    if (!currentUser || currentUser.role !== 'client') return;
    const existing = requests.find((r) => r.id === requestId);
    if (!existing) {
      alert('Job not found.');
      return;
    }
    const ownsJob =
      existing.clientId === currentUser.id ||
      existing.clientName === currentUser.clientName ||
      existing.clientName === currentUser.name;
    if (!ownsJob) {
      alert('You can only confirm spot checks on your own jobs.');
      return;
    }
    if (!canClientConfirmSpotCheck(existing, spotCheckId)) {
      alert('This spot check cannot be confirmed right now.');
      return;
    }

    const spotChecks = (existing.spotChecks ?? []).map((check) =>
      check.id === spotCheckId
        ? {
            ...check,
            clientConfirmedAt: new Date().toISOString(),
            clientConfirmedBy: currentUser.name,
          }
        : check
    );

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, spotChecks } : r)));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ spot_checks: spotChecks }).eq('id', requestId);
    }
  };

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
  };

  const submitGuardPayoutInvoice = async (
    guard: SecurityGuard,
    method: 'cash' | 'stripe',
    eligible: SecurityRequest[]
  ) => {
    const draft = createGuardPayoutInvoiceRecord({ guard, method, jobs: eligible });
    const label = method === 'cash' ? 'cash pickup' : 'bank transfer';
    if (
      !window.confirm(
        `Send a $${draft.total.toFixed(2)} ${label} invoice to Payments for ${eligible.length} completed job(s)?`
      )
    ) {
      return;
    }
    await appendGuardPayoutInvoice(draft);
    alert(`${label[0].toUpperCase()}${label.slice(1)} invoice sent to Payments. Request again anytime you have more unpaid jobs.`);
  };

  const handleGuardRequestCashPayout = async (guardId: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return;
    const eligible = getGuardPayoutEligibleJobs(guardId, requests);
    if (eligible.length === 0) {
      alert('No completed jobs are available for a cash payout invoice.');
      return;
    }
    await submitGuardPayoutInvoice(guard, 'cash', eligible);
  };

  const handleGuardRequestStripePayout = async (guardId: string) => {
    const guard = guards.find((g) => g.id === guardId);
    if (!guard) return;
    const eligible = getGuardPayoutEligibleJobs(guardId, requests);
    if (eligible.length === 0) {
      alert('No earnings are available for a bank payout invoice right now.');
      return;
    }
    await submitGuardPayoutInvoice(guard, 'stripe', eligible);
  };

  const handleReleasePayout = async (requestId: string, force = false) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.assignedGuardId) {
      alert('No guard has picked up this job yet.');
      return;
    }
    if (req.guardPayoutMethod === 'cash') {
      alert('This guard was already paid in cash for this job.');
      return;
    }
    const guard = guards.find(g => g.id === req.assignedGuardId);
    if (!guard?.stripeConnectAccountId) {
      alert('Guard has not connected a Stripe account.');
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
      alert(`Payout released: $${(result.amountCents / 100).toFixed(2)} sent to guard.`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Payout failed');
    }
  };

  const handleRefundPayment = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.stripePaymentIntentId) {
      alert('No payment to refund for this job.');
      return;
    }
    try {
      await refundPayment({ paymentIntentId: req.stripePaymentIntentId, jobId: requestId });
      await handleJobPaymentStatus(requestId, 'unpaid');
      setPayments(prev => prev.map(p =>
        p.jobId === requestId ? { ...p, status: 'refunded' } : p
      ));
      alert('Payment refunded successfully.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Refund failed');
    }
  };

  const handleUpdateGuardStripeAccount = async (guardId: string, accountId: string) => {
    setGuards(prev => prev.map(g =>
      g.id === guardId ? { ...g, stripeConnectAccountId: accountId } : g
    ));
    if (isDbConnected) {
      await supabase.from('guards').update({ stripe_connect_account_id: accountId }).eq('id', guardId);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    const jobId = params.get('job_id');
    const depositResult = params.get('deposit');

    const clearPaymentQuery = () => {
      const route = readAppRouteFromWindow();
      if (route) {
        syncAppRoute(route, true);
        return;
      }
      window.history.replaceState({}, '', window.location.pathname);
    };

    if (paymentResult === 'success' && jobId) {
      void loadFromSupabase();
      if (currentUser?.role === 'client') {
        setClientViewState('requests');
        syncAppRoute({ role: 'client', clientView: 'requests' }, true);
      }
      showAppToast('Payment received', {
        body: 'Your job status will update shortly.',
        tone: 'success',
      });
      clearPaymentQuery();
    } else if (paymentResult === 'cancelled') {
      showAppToast('Payment cancelled', { tone: 'info' });
      clearPaymentQuery();
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
      clearPaymentQuery();
    } else if (depositResult === 'cancelled') {
      showAppToast('Deposit cancelled', { tone: 'info' });
      clearPaymentQuery();
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
      alert('🚨 AUTOMATED ACTION: 3 compliance violations logged. Account automatically suspended.');
    } else {
      alert(`⚠ Compliance warning recorded: ${reason || 'Failed audit'}`);
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
  };

  const handleResetAuditFailures = async (guardId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, failedAudits: 0, userStatus: 'active' } : g));
    if (isDbConnected) {
      await supabase
        .from('guards')
        .update({ failed_audits: 0, user_status: 'active' })
        .eq('id', guardId);
    }
    alert('✓ Compliance record cleared. Account reinstated.');
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

  const persistJobChatMessageToDb = async (message: JobChatMessage) => {
    if (!isDbConnected) return;
    try {
      await supabase.from('job_chat_messages').upsert({
        id: message.id,
        thread_id: message.threadId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        body: message.body,
        created_at: message.createdAt,
      });
    } catch (e) {
      console.warn('Job chat message DB sync:', e);
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

  const ensureJobChatThread = async (req: SecurityRequest) => {
    if (!req.assignedGuardId) return null;
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
    const recipients: string[] = [];
    if (sender.id !== req.clientId) recipients.push(req.clientId);
    if (req.assignedGuardId && sender.id !== req.assignedGuardId) recipients.push(req.assignedGuardId);

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
    await persistJobChatMessageToDb(message);
    await notifyJobChatParticipants(req, currentUser, body.trim());
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
      if (ticket.category === 'safety' && ticket.priority === 'urgent') {
        void reportPushEvent(currentUser, {
          type: 'emergency_alert',
          body: `Urgent safety support ticket from ${ticket.userName}`,
        });
      }
    }
  };

  const handleReportIncident = async (requestId: string) => {
    if (!currentUser) return;
    const req = requests.find((r) => r.id === requestId);
    const guard = guards.find((g) => g.id === req?.assignedGuardId);
    await handleSendJobChatMessage(
      requestId,
      'Incident reported — requesting immediate staff attention.'
    );
    void reportPushEvent(currentUser, {
      type: 'emergency_alert',
      requestId,
      guardId: guard?.id,
      guardName: guard?.name ?? currentUser.name,
      location: req?.location,
      body: `Incident reported by ${guard?.name ?? currentUser.name} at ${req?.location ?? 'active job'}`,
    });
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
    const latest = ticket.messages[ticket.messages.length - 1];
    if (latest) {
      await notifySupportParticipants(ticket, currentUser, latest.body);
    }
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
  };

  const handleUpdateSupportTicketStatus = async (ticketId: string, status: SupportTicketStatus) => {
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
  };

  // ── Render ─────────────────────────────────────────────────
  const passwordChangeOverlay = currentUser ? (
    <ChangePasswordPrompt
      open={passwordChangePromptOpen}
      userName={currentUser.name}
      onChangePassword={handleChangeAccountPassword}
      onDismiss={handleDismissPasswordChange}
    />
  ) : null;

  if (loading) {
    return <LoadingScreen />;
  }

  if (legalPage) {
    return (
      <>
        <LegalPage page={legalPage} onBack={closeLegalPage} onOpenLegal={openLegalPage} />
        <InstallPrompt />
      </>
    );
  }

  if (!currentUser) {
    if (isAuthView) {
      return (
        <>
          <AuthPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            guardsList={guards}
            clientsList={clients}
            onBackToHome={closeAuthView}
            onOpenLegal={openLegalPage}
            onAuthModeChange={setAuthViewMode}
            onAuthRoleChange={setAuthViewRole}
            initialRole={initialAuthRole}
            initialMode={initialAuthMode}
            themeMode={themeMode}
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
          onNavigateToAuth={(role, mode) => {
            openAuthView(role ?? 'client', mode ?? 'sign-in');
          }}
          onOpenLegal={openLegalPage}
        />
        <InstallPrompt />
      </>
    );
  }

  // ── Guard view ─────────────────────────────────────────────
  if (currentUser.role === 'guard') {
    if (!activeGuard?.id) {
      return (
        <div className="page-shell min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4">
          <p className="text-brand-text font-semibold">We could not load your guard profile.</p>
          <p className="text-brand-text-muted text-sm max-w-sm">
            Your sign-in may be out of date after a database change. Sign out and sign in again with your guard email.
          </p>
          <button type="button" onClick={handleSignOut} className="app-button-primary !w-auto !px-6 !h-11">
            Sign out
          </button>
        </div>
      );
    }
    const guardJobs = getGuardVisibleJobs(activeGuard, requests);
    const guardPayouts = getGuardPayoutHistory(activeGuard.id, requests, payments);

    return (
      <>
        <GuardDashboard
          guard={activeGuard}
          tab={guardTab}
          onTabChange={setGuardTab}
          requests={guardJobs}
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
          onAcceptJob={handleApplyToJob}
          onUpdateJobAudit={handleUpdateJobAudit}
          onRecordAuditViolation={handleRecordAuditViolation}
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
          jobChatRequestId={jobChatRequestId}
          openJobChat={openJobChat}
          onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
          onJobChatOpenChange={(open) => {
            setOpenJobChatState(open);
            if (!open) setJobChatRequestId(null);
            else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
          }}
          supportTicketId={supportTicketId}
          onSupportTicketIdChange={setSupportTicketId}
          onReportIncident={handleReportIncident}
          guardPayoutInvoices={guardPayoutInvoices}
          onRequestCashPayout={() => handleGuardRequestCashPayout(activeGuard.id)}
          onRequestStripePayout={() => handleGuardRequestStripePayout(activeGuard.id)}
          onOpenLegal={openLegalPage}
        />
        {passwordChangeOverlay}
        <InstallPrompt />
      </>
    );
  }

  // ── Client view ────────────────────────────────────────────
  if (currentUser.role === 'client') {
    const clientRecord = clients.find(c => c.id === currentUser.id);
    // Show only THIS client's requests
    const myRequests = requests.filter(r =>
      r.clientId === currentUser.id ||
      r.clientName === currentUser.clientName ||
      r.clientName === currentUser.name
    );
    const hireableGuards = getBrowsableGuards(verifiedGuards);
    const clientAccountPending = isClientAccountPending({
      accountStatus: clientRecord?.accountStatus,
      approved: clientRecord?.approved,
    });
    const handleClientNavigate = (view: ClientView) => {
      if (
        clientAccountPending &&
        view !== 'home' &&
        view !== 'profile' &&
        view !== 'support'
      ) {
        setClientView('home');
        return;
      }
      setClientView(view);
    };

    return (
      <>
        <ClientAppLayout
          currentUser={currentUser}
          themeMode={themeMode}
          onSignOut={handleSignOut}
          onChangeTheme={changeThemeMode}
          activeView={clientView}
          onNavigate={handleClientNavigate}
          accountPending={clientAccountPending}
          onOpenLegal={openLegalPage}
        >
          {clientView === 'profile' ? (
            <UserProfileScreen
              currentUser={currentUser}
              client={clientRecord ?? null}
              onSave={(payload) => handleUpdateClientProfile(currentUser.id, payload)}
              onOpenLegal={openLegalPage}
            />
          ) : clientView === 'support' ? (
            <SupportScreen
              currentUser={currentUser}
              tickets={supportTickets}
              relatedRequests={myRequests}
              onCreateTicket={handleCreateSupportTicket}
              onSendMessage={handleSendSupportMessage}
              initialTicketId={supportTicketId}
              onActiveTicketIdChange={setSupportTicketId}
            />
          ) : (
            <ClientDashboard
              companyName={clientRecord?.companyName || currentUser.clientName || currentUser.name || 'Your Company'}
              clientId={currentUser.id}
              accountStatus={clientRecord?.accountStatus}
              approved={clientRecord?.approved}
              requests={myRequests}
              guards={hireableGuards}
              clientEmail={currentUser.email}
              avatarUrl={currentUser.avatar}
              activeView={clientView}
              onViewChange={setClientView}
              profileGuardId={clientGuardId}
              onProfileGuardIdChange={setClientGuardId}
              directRequestGuardId={clientDirectGuardId}
              onDirectRequestGuardIdChange={setClientDirectGuardId}
              onPostRequest={handlePostRequest}
              onEditRequest={handleEditRequest}
              onUpdateStatus={handleUpdateStatus}
              onCancelRequest={handleCancelRequest}
              onAddReview={handleAddReview}
              onConfirmSelfAudit={handleClientConfirmSelfAudit}
              onConfirmSpotCheck={handleClientConfirmSpotCheck}
              currentUser={currentUser}
              jobChatThreads={jobChatThreads}
              jobChatMessages={jobChatMessages}
              onSendJobChatMessage={handleSendJobChatMessage}
              jobChatRequestId={jobChatRequestId}
              openJobChat={openJobChat}
              onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
              onJobChatOpenChange={(open) => {
                setOpenJobChatState(open);
                if (!open) setJobChatRequestId(null);
                else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
              }}
              supportTicketId={supportTicketId}
              onSupportTicketIdChange={setSupportTicketId}
            />
          )}
        </ClientAppLayout>
        {passwordChangeOverlay}
        <InstallPrompt />
      </>
    );
  }

  // ── Staff Operations Command Center ─────────────────────────
  if (isStaffRole(currentUser.role)) {
    return (
      <>
        <StaffDashboard
          section={staffSection}
          onSectionChange={setStaffSection}
          selectedGuardId={staffGuardId}
          onSelectedGuardIdChange={setStaffGuardId}
          selectedClientId={staffClientId}
          onSelectedClientIdChange={setStaffClientId}
          selectedJobId={staffJobId}
          onSelectedJobIdChange={setStaffJobId}
          selectedTeamId={staffTeamId}
          onSelectedTeamIdChange={setStaffTeamId}
          staffGuardEdit={staffEdit}
          onStaffGuardEditChange={setStaffEdit}
          selectedSupportTicketId={supportTicketId}
          onSelectedSupportTicketIdChange={setSupportTicketId}
          staffMessageTab={staffMessageTab}
          onStaffMessageTabChange={setStaffMessageTab}
          selectedJobChatRequestId={jobChatRequestId}
          onSelectedJobChatRequestIdChange={(id) => setJobChatRequestId(id)}
          staffApprovalQueue={staffApprovalQueue}
          onOpenStaffApprovals={openStaffApprovals}
          onClearStaffApprovalQueue={clearStaffApprovalQueue}
          onUpdateStaffApprovalQueue={updateStaffApprovalQueue}
          guards={verifiedGuards}
          clients={clients}
          requests={requests}
          supportTickets={supportTickets}
          payments={payments}
          guardPayoutInvoices={guardPayoutInvoices}
          onUpdateGuardUserStatus={handleUpdateGuardUserStatus}
          onApproveRequest={handleApproveRequest}
          onDenyRequest={handleDenyRequest}
          onApproveClient={handleApproveClient}
          onRejectClient={handleRejectClient}
          onApproveGuardAccount={handleApproveGuardAccount}
          onActivateGuardAccount={handleActivateGuardAccount}
          onSubmitGuardIdentityVerification={handleSubmitGuardIdentityVerification}
          onApproveGuardIdentityVerification={handleApproveGuardIdentityVerification}
          onRejectGuardIdentityVerification={handleRejectGuardIdentityVerification}
          onRequestGuardIdResubmit={handleRequestGuardIdResubmit}
          onUpdateGuardIdImages={handleStaffUpdateGuardIdImages}
          onRequestCertImageResubmit={handleRequestCertImageResubmit}
          onDeleteGuardAccount={handleDeleteGuardAccount}
          onDeleteClientAccount={handleDeleteClientAccount}
          onApproveCert={handleApproveCert}
          onRejectCert={handleRejectCert}
          onUpdateBackgroundChecked={handleUpdateBackgroundChecked}
          onRecordAuditViolation={handleRecordAuditViolation}
          onResetAuditFailures={handleResetAuditFailures}
          onReleasePayout={handleReleasePayout}
          onRefundPayment={handleRefundPayment}
          onMarkClientPaidCash={handleMarkClientPaidCash}
          onMarkGuardPaidCash={handleMarkGuardPaidCash}
          onMarkPlatformFeePaidCash={handleMarkPlatformFeePaidCash}
          onDepositCashToStripe={handleDepositCashToStripe}
          onCompletePayoutInvoice={handleCompletePayoutInvoice}
          isDbConnected={isDbConnected}
          currentUser={currentUser}
          onAddStaffProfile={handleAddStaffProfile}
          onUpdateStaffRole={handleUpdateStaffRole}
          onAddGuardProfile={handleAddGuardProfile}
          onAddClientProfile={handleAddClientProfile}
          onStaffCreateJob={handleStaffCreateJob}
          onStaffAssignGuard={handleStaffAssignGuard}
          onUploadSelfAuditPhotos={handleStaffUploadSelfAuditPhotos}
          onUploadSpotCheck={handleStaffUploadSpotCheck}
          onEditJobListing={handleStaffEditJobListing}
          onApproveGuardApplication={handleStaffApproveGuardApplication}
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
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          staffMessages={staffMessages}
          onSendStaffMessage={handleSendStaffMessage}
          onRefreshStaffMessages={refreshStaffMessages}
          onSendJobChat={handleSendJobChatMessage}
          onOpenLegal={openLegalPage}
        />
        {passwordChangeOverlay}
        <InstallPrompt />
      </>
    );
  }

  return null;
}
