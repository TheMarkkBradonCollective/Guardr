import React, { useEffect, useMemo, useState } from 'react';
import { renderClientViews } from '../app/client/ViewRoutes';
import { Client, ClientMessage, JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser, SupportTicket } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { getClientRehireableGuards } from '../lib/guardDirectory';
import { buildIncidentReportViews } from '../lib/incidentReports';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { ClientHomeDesktop } from './client/ClientHomeDesktop';
import { useMediaQuery } from '../lib/platform';
import { useLayoutFormFactor } from '../surfaces';
import { isClientAccountPending } from '../lib/accountStatus';
import type { ClientPaymentGates, PlatformSettings } from '../lib/platformSettings';
import type { PlatformFeeConfig } from '../lib/payments';
import type { ClientInvoice } from '../lib/clientInvoicing';
import type { OvertimeDisputeInput } from '../lib/shiftBilling';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import { RequestSecurityFlow, RequestFlowPreset } from './client/RequestSecurityFlow';
import { DirectGuardRequestFlow } from './client/DirectGuardRequestFlow';
import { ClientReportsScreen } from './client/ClientReportsScreen';
import { ClientInvoiceScreen } from './client/ClientInvoiceScreen';
import { PaymentsPage } from './payments/PaymentsPage';
import { ClientRequestsList } from './client/ClientRequestsList';
import { GuardDirectoryScreen } from './client/GuardDirectoryScreen';
import { GuardProfileScreen } from './client/GuardProfileScreen';
import { ClientLocationsPanel } from './client/ClientLocationsPanel';
import { ClientMapScreen } from './client/ClientMapScreen';
import { AppPageTransition } from './ui/motion/AppMotion';
import { ClientMessagesPanel } from './client/ClientMessagesPanel';
import { AppGuidePage } from './docs/AppGuidePage';
import { AppScreen, AppStatusBanner } from './ui/app/AppPrimitives';
import { ResponsivePage } from './layouts/desktop/DesktopPageShell';
import { WorkbenchEmpty, WorkbenchFlatSplit } from './baseui/layout/WorkbenchLayout';
import { isTutorialDemoId } from '../lib/tutorialDemoData';
import type { MessagesChrome } from '../lib/messagesChrome';
import { SecurityCompanyRosterScreen } from './client/SecurityCompanyRosterScreen';
import { SecurityCompanyOperationsScreen } from './client/SecurityCompanyOperationsScreen';
import { useClientCapabilities } from './client/ClientCapabilitiesContext';
import { constrainClientViewToMessenger } from '../lib/messengerCompanion';

export type ClientView =
  | 'map'
  | 'home'
  | 'request'
  | 'direct-request'
  | 'messages'
  | 'reports'
  | 'invoices'
  | 'requests'
  | 'guards'
  | 'locations'
  | 'roster'
  | 'operations'
  | 'profile'
  | 'settings'
  | 'support'
  | 'support-compose'
  | 'support-report'
  | 'guide';

interface ClientDashboardProps {
  companyName: string;
  clientId: string;
  requests: SecurityRequest[];
  platformRequests?: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  accountStatus?: Client['accountStatus'];
  approved?: boolean;
  avatarUrl?: string;
  activeView?: ClientView;
  onViewChange?: (view: ClientView) => void;
  profileGuardId?: string | null;
  onProfileGuardIdChange?: (guardId: string | null) => void;
  directRequestGuardId?: string | null;
  onDirectRequestGuardIdChange?: (guardId: string | null) => void;
  onPostRequest: (req: Partial<SecurityRequest>) => void;
  onEditRequest: (requestId: string, req: Partial<SecurityRequest>) => void;
  onCancelRequest: (requestId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (
    requestId: string,
    rating: number,
    reviewText: string,
    tipCents?: number
  ) => Promise<string | void> | void;
  onReportViolation?: (requestId: string, input: import('./client/ClientViolationReportSheet').ClientViolationReportInput) => void | Promise<void>;
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onVerifyStartCheckpoint?: (requestId: string) => void | Promise<void>;
  onFlagStartCheckpoint?: (requestId: string, category: string, note: string) => void | Promise<void>;
  onVerifyEndCheckpoint?: (requestId: string) => void | Promise<void>;
  onFlagEndCheckpoint?: (requestId: string, category: string, note: string) => void | Promise<void>;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onDisputeOvertime?: (requestId: string, input: OvertimeDisputeInput) => void | Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
  onApproveTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onDenyTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onRequestSuggestedGuard?: (requestId: string, guardId: string) => void | Promise<void>;
  onDismissGuardSuggestion?: (requestId: string, suggestionId: string) => void | Promise<void>;
  onAddToCompanyRoster?: (guardId: string) => void | Promise<void>;
  onRemoveFromCompanyRoster?: (guardId: string) => void | Promise<void>;
  onApproveFullTeam?: (requestId: string) => void | Promise<void>;
  onDenyFullTeam?: (requestId: string) => void | Promise<void>;
  onRequestReplacement?: (requestId: string, reasonNote?: string) => void | Promise<void>;
  onSubmitPriceOffer?: (
    requestId: string,
    guardId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: import('../types').AgreementPlatformFeeConfig;
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (requestId: string, guardId: string, offerId: string) => void | Promise<void>;
  crewSettings?: PlatformSettings;
  /** @deprecated Use crewSettings */
  teamLeadSettings?: PlatformSettings;
  favoriteGuardIds?: string[];
  onToggleFavoriteGuard?: (guardId: string) => void | Promise<void>;
  clientLocations?: import('../types').ClientLocation[];
  jobLocations?: import('../types').JobLocation[];
  onSaveClientLocation?: (location: import('../types').ClientLocation) => void | Promise<void>;
  clientRecord?: Client;
  paymentGates: ClientPaymentGates;
  feeConfig: PlatformFeeConfig;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  clientMessages?: ClientMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onSendClientMessage?: (body: string) => void | Promise<void>;
  onDeleteClientMessage?: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage?: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage?: (ticketId: string, messageId: string) => void | Promise<void>;
  onRefreshClientMessages?: () => void | Promise<void>;
  jobChatRequestId?: string | null;
  openJobChat?: boolean;
  onJobChatRequestIdChange?: (requestId: string | null) => void;
  onJobChatOpenChange?: (open: boolean) => void;
  onOpenJobChat?: (requestId: string) => void;
  supportTickets?: SupportTicket[];
  onSendSupportMessage?: (ticketId: string, body: string) => void | Promise<void>;
  supportTicketId?: string | null;
  onSupportTicketIdChange?: (ticketId: string | null) => void;
  onOpenSupportCompose?: () => void;
  onOpenSupportReport?: () => void;
  onRequestsSelectedIdChange?: (jobId: string | null) => void;
  requestsSelectedId?: string | null;
  requestsJobTab?: 'open' | 'scheduled' | 'completed' | 'missed';
  onRequestsJobTabChange?: (tab: 'open' | 'scheduled' | 'completed' | 'missed') => void;
  clientInvoices?: ClientInvoice[];
  onInvoiceRequestIdChange?: (requestId: string | null) => void;
  invoiceRequestId?: string | null;
  onMessagesDetailOpenChange?: (open: boolean) => void;
  onMessagesChromeChange?: (chrome: MessagesChrome) => void;
  messagesShellHeaderTrailing?: React.ReactNode;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  messagesOnly?: boolean;
}

export function ClientDashboard({
  companyName,
  clientId,
  requests,
  platformRequests = [],
  guards,
  clientEmail,
  accountStatus,
  approved,
  avatarUrl,
  activeView,
  onViewChange,
  profileGuardId,
  onProfileGuardIdChange,
  directRequestGuardId,
  onDirectRequestGuardIdChange,
  onPostRequest,
  onEditRequest,
  onCancelRequest,
  onUpdateStatus,
  onAddReview,
  onReportViolation,
  onConfirmSelfAudit,
  onVerifyStartCheckpoint,
  onFlagStartCheckpoint,
  onVerifyEndCheckpoint,
  onFlagEndCheckpoint,
  onApproveOvertime,
  onDisputeOvertime,
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApprovePendingGuard,
  onDenyPendingGuard,
  onApproveTeamSlot,
  onDenyTeamSlot,
  onRequestSuggestedGuard,
  onDismissGuardSuggestion,
  onAddToCompanyRoster,
  onRemoveFromCompanyRoster,
  onApproveFullTeam,
  onDenyFullTeam,
  onRequestReplacement,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  crewSettings,
  teamLeadSettings,
  favoriteGuardIds = [],
  onToggleFavoriteGuard,
  clientLocations = [],
  jobLocations = [],
  onSaveClientLocation,
  clientRecord,
  paymentGates,
  feeConfig,
  currentUser,
  jobChatThreads = [],
  jobChatMessages = [],
  clientMessages = [],
  onSendJobChatMessage,
  onSendClientMessage,
  onDeleteClientMessage,
  onDeleteJobChatMessage,
  onDeleteSupportMessage,
  onRefreshClientMessages,
  jobChatRequestId = null,
  openJobChat = false,
  onJobChatRequestIdChange,
  onJobChatOpenChange,
  onOpenJobChat,
  supportTickets = [],
  onSendSupportMessage,
  supportTicketId = null,
  onSupportTicketIdChange,
  onOpenSupportCompose,
  onOpenSupportReport,
  onRequestsSelectedIdChange,
  requestsSelectedId = null,
  requestsJobTab = 'open',
  onRequestsJobTabChange,
  clientInvoices = [],
  onInvoiceRequestIdChange,
  invoiceRequestId = null,
  onMessagesDetailOpenChange,
  onMessagesChromeChange,
  messagesShellHeaderTrailing,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  messagesOnly = false,
}: ClientDashboardProps) {
  const [view, setView] = useState<ClientView>(activeView ?? 'home');
  const [flowPreset, setFlowPreset] = useState<RequestFlowPreset>('default');
  const [internalProfileGuardId, setInternalProfileGuardId] = useState<string | null>(null);
  const [internalDirectGuardId, setInternalDirectGuardId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const caps = useClientCapabilities();

  const effectiveProfileGuardId =
    profileGuardId !== undefined ? profileGuardId : internalProfileGuardId;
  const effectiveDirectGuardId =
    directRequestGuardId !== undefined ? directRequestGuardId : internalDirectGuardId;

  const selectedGuard = useMemo(
    () => (effectiveProfileGuardId ? guards.find((g) => g.id === effectiveProfileGuardId) ?? null : null),
    [guards, effectiveProfileGuardId]
  );
  const requestTargetGuard = useMemo(
    () => (effectiveDirectGuardId ? guards.find((g) => g.id === effectiveDirectGuardId) ?? null : null),
    [guards, effectiveDirectGuardId]
  );

  const setSelectedGuard = (guard: SecurityGuard | null) => {
    if (profileGuardId === undefined) setInternalProfileGuardId(guard?.id ?? null);
    onProfileGuardIdChange?.(guard?.id ?? null);
  };

  const setRequestTargetGuard = (guard: SecurityGuard | null) => {
    if (directRequestGuardId === undefined) setInternalDirectGuardId(guard?.id ?? null);
    onDirectRequestGuardIdChange?.(guard?.id ?? null);
  };
  const accountPending = isClientAccountPending({ accountStatus, approved });
  const formFactor = useLayoutFormFactor();
  const tabletPortrait = useMediaQuery('(orientation: portrait)');

  useEffect(() => {
    if (activeView) setView(activeView);
  }, [activeView]);

  useEffect(() => {
    if (messagesOnly) {
      const next = constrainClientViewToMessenger(view);
      if (next !== view) navigate(next);
      return;
    }
    if (!caps.allowsView(view)) {
      navigate('home');
    }
  }, [view, caps, messagesOnly]);

  useEffect(() => {
    if (messagesOnly) return;
    if (view !== 'direct-request' || requestTargetGuard) return;
    if (!effectiveDirectGuardId) {
      navigate('guards');
      return;
    }
    if (guards.length === 0) return;
    const found = guards.some((g) => g.id === effectiveDirectGuardId);
    if (!found) navigate('guards');
  }, [view, requestTargetGuard, effectiveDirectGuardId, guards, messagesOnly]);

  const navigate = (next: ClientView) => {
    setView(next);
    onViewChange?.(next);
  };

  const openMessages = (requestId: string) => {
    onJobChatRequestIdChange?.(requestId);
    onJobChatOpenChange?.(true);
    navigate('messages');
  };

  useEffect(() => {
    if (openJobChat && jobChatRequestId && (view === 'map' || view === 'messages')) {
      navigate('messages');
    }
  }, [openJobChat, jobChatRequestId, view]);

  const coverage = useMemo(() => computeCoverageSummary(requests), [requests]);
  const recentReports = useMemo(() => buildRecentReports(requests), [requests]);
  const incidentDetails = useMemo(() => buildIncidentReportViews(requests, guards), [requests, guards]);

  const handleHomeAction = (action: ClientHomeAction) => {
    switch (action) {
      case 'request':
        setFlowPreset('default');
        navigate('request');
        break;
      case 'schedule':
        setFlowPreset('schedule');
        navigate('request');
        break;
      case 'recurring':
        setFlowPreset('recurring');
        navigate('request');
        break;
      case 'reports':
        if (!caps.has('reporting')) {
          navigate('home');
          break;
        }
        setSelectedIncidentId(null);
        navigate('reports');
        break;
      case 'requests':
        navigate('requests');
        break;
      case 'guards':
        setSelectedGuard(null);
        navigate('guards');
        break;
      case 'locations':
        navigate('locations');
        break;
      case 'messages':
        navigate('messages');
        break;
      case 'map':
        navigate('map');
        break;
      case 'invoices':
        navigate('invoices');
        break;
      case 'roster':
        if (!caps.has('roster-management')) {
          navigate('home');
          break;
        }
        navigate('roster');
        break;
      case 'operations':
        if (!caps.has('shift-operations')) {
          navigate('home');
          break;
        }
        navigate('operations');
        break;
    }
  };

  const startDirectGuardRequest = (guard: SecurityGuard) => {
    setRequestTargetGuard(guard);
    navigate('direct-request');
  };

  const tutorialDemoRequest = requests.find((r) => isTutorialDemoId(r.id));

  const tutorialDemoBanner = tutorialDemoRequest ? (
    <div className="tutorial-demo-card relative z-[1003] mx-4 mt-3">
      <p className="tutorial-demo-card-label">Tutorial sample request</p>
      <p className="text-sm font-semibold text-brand-text">{tutorialDemoRequest.title}</p>
      <p className="text-xs text-brand-text-muted mt-1">
        Stored on this device only — not visible to guards or staff until you post a real job.
      </p>
    </div>
  ) : null;

  const wrap = (node: React.ReactNode, dataTour?: string) => (
    <div className="h-full max-w-full min-w-0 overflow-hidden" data-tour={dataTour}>
      {node}
    </div>
  );

  const page = (key: string, node: React.ReactNode, dataTour?: string) => (
    <AppPageTransition motionKey={key} className="h-full min-h-0">
      {wrap(node, dataTour)}
    </AppPageTransition>
  );
  return renderClientViews({
    accountPending,
    accountStatus,
    approved,
    avatarUrl,
    caps,
    clientEmail,
    clientId,
    clientInvoices,
    clientLocations,
    clientMessages,
    clientRecord,
    companyName,
    coverage,
    crewSettings,
    currentUser,
    favoriteGuardIds,
    feeConfig,
    flowPreset,
    formFactor,
    guards,
    handleHomeAction,
    incidentDetails,
    invoiceRequestId,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    jobLocations,
    messagesShellHeaderTrailing,
    navigate,
    onAcceptPriceOffer,
    onAddReview,
    onAddToCompanyRoster,
    onApproveFullTeam,
    onApproveOvertime,
    onApprovePendingGuard,
    onApproveScheduleChange,
    onApproveTeamSlot,
    onCancelRequest,
    onConfirmSelfAudit,
    onDeleteClientMessage,
    onDeleteJobChatMessage,
    onDeleteSupportMessage,
    onDenyFullTeam,
    onDenyPendingGuard,
    onDenyTeamSlot,
    onDismissGuardSuggestion,
    onDisputeOvertime,
    onEditRequest,
    onFlagEndCheckpoint,
    onFlagStartCheckpoint,
    onInvoiceRequestIdChange,
    onJobChatOpenChange,
    onJobChatRequestIdChange,
    onMessagesChromeChange,
    onMessagesDetailOpenChange,
    onOpenJobChat,
    onOpenSupportCompose,
    onOpenSupportReport,
    onPostRequest,
    onRefreshClientMessages,
    onRejectScheduleChange,
    onRemoveFromCompanyRoster,
    onReportViolation,
    onRequestReplacement,
    onRequestSuggestedGuard,
    onRequestsJobTabChange,
    onRequestsSelectedIdChange,
    onSaveClientLocation,
    onSendClientMessage,
    onSendJobChatMessage,
    onSendSupportMessage,
    onStartTutorial,
    onSubmitPriceOffer,
    onSupportTicketIdChange,
    onToggleFavoriteGuard,
    onUpdateStatus,
    onVerifyEndCheckpoint,
    onVerifyStartCheckpoint,
    openJobChat,
    openMessages,
    page,
    paymentGates,
    platformRequests,
    recentReports,
    requestTargetGuard,
    requests,
    requestsJobTab,
    requestsSelectedId,
    selectedGuard,
    selectedIncidentId,
    setFlowPreset,
    setRequestTargetGuard,
    setSelectedGuard,
    setSelectedIncidentId,
    startDirectGuardRequest,
    supportTicketId,
    supportTickets,
    tabletPortrait,
    teamLeadSettings,
    tutorialActive,
    tutorialAvailable,
    tutorialCompleted,
    tutorialDemoBanner,
    view,
  });

}
