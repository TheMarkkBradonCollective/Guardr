import React, { useEffect, useMemo, useState } from 'react';
import { Client, ClientMessage, GuardStandingCrewMember, JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser, SupportTicket } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { getClientRehireableGuards } from '../lib/guardDirectory';
import { buildIncidentReportViews } from '../lib/incidentReports';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { ClientHomeDesktop } from './client/ClientHomeDesktop';
import { useDevice } from '../lib/platform';
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
  standingCrewMembers?: GuardStandingCrewMember[];
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
  clientInvoices?: ClientInvoice[];
  onInvoiceRequestIdChange?: (requestId: string | null) => void;
  invoiceRequestId?: string | null;
  onMessagesDetailOpenChange?: (open: boolean) => void;
  onMessagesChromeChange?: (chrome: MessagesChrome) => void;
  messagesShellHeaderTrailing?: React.ReactNode;
  onTeamDetailOpenChange?: (open: boolean) => void;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  onEnterPracticeMode?: () => void;
}

export function ClientDashboard({
  companyName,
  clientId,
  requests,
  platformRequests = [],
  guards,
  standingCrewMembers = [],
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
  clientInvoices = [],
  onInvoiceRequestIdChange,
  invoiceRequestId = null,
  onMessagesDetailOpenChange,
  onMessagesChromeChange,
  messagesShellHeaderTrailing,
  onTeamDetailOpenChange,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  onEnterPracticeMode,
}: ClientDashboardProps) {
  const [view, setView] = useState<ClientView>(activeView ?? 'home');
  const [flowPreset, setFlowPreset] = useState<RequestFlowPreset>('default');
  const [internalProfileGuardId, setInternalProfileGuardId] = useState<string | null>(null);
  const [internalDirectGuardId, setInternalDirectGuardId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

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
  const { formFactor } = useDevice();

  useEffect(() => {
    if (activeView) setView(activeView);
  }, [activeView]);

  useEffect(() => {
    if (view !== 'direct-request' || requestTargetGuard) return;
    if (!effectiveDirectGuardId) {
      navigate('guards');
      return;
    }
    if (guards.length === 0) return;
    const found = guards.some((g) => g.id === effectiveDirectGuardId);
    if (!found) navigate('guards');
  }, [view, requestTargetGuard, effectiveDirectGuardId, guards]);

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
    }
  };

  const startDirectGuardRequest = (guard: SecurityGuard) => {
    setRequestTargetGuard(guard);
    navigate('direct-request');
  };

  const tutorialDemoRequest = requests.find((r) => isTutorialDemoId(r.id));

  const tutorialDemoBanner = tutorialDemoRequest ? (
    <div className="tutorial-demo-card relative z-[1003] mx-4 mt-3">
      <p className="tutorial-demo-card-label">Tutorial practice request</p>
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

  if (accountPending && view !== 'profile' && view !== 'settings' && view !== 'messages' && view !== 'home' && view !== 'guide' && view !== 'invoices') {
    return page(
      'pending',
      <AccountPendingScreen role="client" onOpenProfile={() => navigate('profile')} />
    );
  }

  if (view === 'map') {
    return page(
      'map',
      <ClientMapScreen
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        crewSettings={crewSettings ?? teamLeadSettings}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
        onPostJob={() => {
          setFlowPreset('default');
          navigate('request');
        }}
        onRequestGuard={() => navigate('guards')}
        initialLiveJobId={jobChatRequestId}
        onLiveJobIdChange={onJobChatRequestIdChange}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onVerifyStartCheckpoint={onVerifyStartCheckpoint}
        onFlagStartCheckpoint={onFlagStartCheckpoint}
        onVerifyEndCheckpoint={onVerifyEndCheckpoint}
        onFlagEndCheckpoint={onFlagEndCheckpoint}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        onRequestReplacement={onRequestReplacement}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        onAddReview={onAddReview}
        onReportViolation={onReportViolation}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
      />,
      'client-map'
    );
  }

  if (view === 'request') {
    return page(
      'request',
      <RequestSecurityFlow
        preset={flowPreset}
        feeConfig={feeConfig}
        guards={guards}
        favoriteGuardIds={favoriteGuardIds}
        clientLocations={clientLocations}
        clientId={clientId}
        defaultAssignmentMode={clientRecord?.defaultAssignmentMode}
        onBack={() => navigate('home')}
        onSubmit={(req) => {
          onPostRequest(req);
          navigate('home');
        }}
      />
    );
  }

  if (view === 'locations' && clientRecord && onSaveClientLocation) {
    return page(
      'locations',
      <ResponsivePage>
        <ClientLocationsPanel
          client={clientRecord}
          locations={clientLocations}
          onSave={onSaveClientLocation}
        />
      </ResponsivePage>
    );
  }

  if (view === 'direct-request' && requestTargetGuard) {
    return page(
      `direct-request-${requestTargetGuard.id}`,
      <DirectGuardRequestFlow
        guard={requestTargetGuard}
        feeConfig={feeConfig}
        onBack={() => {
          setRequestTargetGuard(null);
          navigate('guards');
        }}
        onSubmit={(req) => {
          onPostRequest(req);
          setRequestTargetGuard(null);
          navigate('requests');
        }}
      />
    );
  }

  if (view === 'guards') {
    if (formFactor === 'desktop') {
      return page(
        'guards',
        <>
          {tutorialDemoBanner}
          <WorkbenchFlatSplit
            list={
              <GuardDirectoryScreen
                guards={guards}
                onSelectGuard={setSelectedGuard}
                favoriteGuardIds={favoriteGuardIds}
                onToggleFavorite={onToggleFavoriteGuard}
                clientId={clientId}
                requests={requests}
                standingCrewMembers={standingCrewMembers}
                onRequestGuard={startDirectGuardRequest}
                onTeamDetailOpenChange={onTeamDetailOpenChange}
              />
            }
            detail={
              selectedGuard ? (
                <GuardProfileScreen
                  guard={selectedGuard}
                  clientId={clientId}
                  requests={requests}
                  platformRequests={platformRequests}
                  onBack={() => setSelectedGuard(null)}
                  onRequestGuard={startDirectGuardRequest}
                  jobChatThreads={jobChatThreads}
                  currentUser={currentUser}
                  onSendJobChatMessage={onSendJobChatMessage}
                  onOpenJobChat={onOpenJobChat ?? openMessages}
                  isFavorite={favoriteGuardIds.includes(selectedGuard.id)}
                  onToggleFavorite={
                    onToggleFavoriteGuard ? () => onToggleFavoriteGuard(selectedGuard.id) : undefined
                  }
                />
              ) : (
                <WorkbenchEmpty message="Select a guard or team to view profile and hire options" variant="detail" />
              )
            }
          />
        </>,
        'client-guards',
      );
    }
    if (selectedGuard) {
      return page(
        `guards-${selectedGuard.id}`,
        <GuardProfileScreen
          guard={selectedGuard}
          clientId={clientId}
          requests={requests}
          platformRequests={platformRequests}
          onBack={() => setSelectedGuard(null)}
          onRequestGuard={startDirectGuardRequest}
          jobChatThreads={jobChatThreads}
          currentUser={currentUser}
          onSendJobChatMessage={onSendJobChatMessage}
          onOpenJobChat={onOpenJobChat ?? openMessages}
          isFavorite={favoriteGuardIds.includes(selectedGuard.id)}
          onToggleFavorite={onToggleFavoriteGuard ? () => onToggleFavoriteGuard(selectedGuard.id) : undefined}
        />
      );
    }
    return page(
      'guards',
      <>
        {tutorialDemoBanner}
        <GuardDirectoryScreen
        guards={guards}
        onSelectGuard={setSelectedGuard}
        favoriteGuardIds={favoriteGuardIds}
        onToggleFavorite={onToggleFavoriteGuard}
        clientId={clientId}
        requests={requests}
        standingCrewMembers={standingCrewMembers}
        onRequestGuard={startDirectGuardRequest}
        onTeamDetailOpenChange={onTeamDetailOpenChange}
      />
      </>,
      'client-guards'
    );
  }

  if (view === 'messages' && currentUser && onSendJobChatMessage && onSendSupportMessage) {
    return page(
      'messages',
      <>
        {tutorialDemoBanner}
        <ClientMessagesPanel
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        accountStatus={accountStatus}
        approved={approved}
        jobChatThreads={jobChatThreads}
        jobChatMessages={jobChatMessages}
        clientMessages={clientMessages}
        supportTickets={supportTickets}
        onSendJobChatMessage={onSendJobChatMessage}
        onSendClientMessage={onSendClientMessage}
        onRefreshClientMessages={onRefreshClientMessages}
        onSendSupportMessage={onSendSupportMessage}
        initialChatRequestId={jobChatRequestId}
        initialChatOpen={openJobChat}
        onChatRequestIdChange={onJobChatRequestIdChange}
        onChatOpenChange={onJobChatOpenChange}
        initialSupportTicketId={supportTicketId}
        onSupportTicketIdChange={onSupportTicketIdChange}
        onOpenCompose={onOpenSupportCompose}
        onOpenReport={onOpenSupportReport}
        onDetailOpenChange={onMessagesDetailOpenChange}
        onMessagesChromeChange={onMessagesChromeChange}
        shellHeaderTrailing={messagesShellHeaderTrailing}
      />
      </>,
      'client-messages'
    );
  }

  if (view === 'messages') {
    return page(
      'messages-unavailable',
      <AppScreen className="p-5">
        <AppStatusBanner title="Messages are temporarily unavailable">
          <p className="text-sm text-brand-text-muted leading-relaxed">
            We could not initialize job chat or support messaging for this session. Refresh the app or
            contact Guardr support if this keeps happening.
          </p>
        </AppStatusBanner>
      </AppScreen>
    );
  }

  if (view === 'reports') {
    const clientRecord: Client = {
      id: clientId,
      name: companyName,
      companyName,
      email: clientEmail,
      phone: '',
      avatar: avatarUrl ?? '',
      totalRequests: requests.length,
    };
    return page(
      'reports',
      <ClientReportsScreen
        reports={recentReports}
        incidentDetails={incidentDetails}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={setSelectedIncidentId}
        onBack={() => {
          setSelectedIncidentId(null);
          navigate('home');
        }}
        client={clientRecord}
        requests={requests}
      />
    );
  }

  if (view === 'invoices' && clientRecord) {
    return page(
      'invoices',
      <ClientInvoiceScreen
        client={clientRecord}
        clientEmail={clientEmail}
        requests={requests}
        invoices={clientInvoices}
        paymentGates={paymentGates}
        selectedRequestId={invoiceRequestId}
        onSelectRequestId={onInvoiceRequestIdChange}
      />
    );
  }

  if (view === 'requests') {
    return page(
      'requests',
      <>
        {tutorialDemoBanner}
        <ClientRequestsList
        requests={requests}
        guards={guards}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
        onAddReview={onAddReview}
        onReportViolation={onReportViolation}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onVerifyStartCheckpoint={onVerifyStartCheckpoint}
        onFlagStartCheckpoint={onFlagStartCheckpoint}
        onVerifyEndCheckpoint={onVerifyEndCheckpoint}
        onFlagEndCheckpoint={onFlagEndCheckpoint}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        onRequestReplacement={onRequestReplacement}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        crewSettings={crewSettings ?? teamLeadSettings}
        onRequestNew={() => {
          setFlowPreset('default');
          navigate('request');
        }}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
        onSelectedJobIdChange={onRequestsSelectedIdChange}
        initialSelectedId={requestsSelectedId}
        initialJobTab={requestsJobTab}
      />
      </>,
      'client-request'
    );
  }

  if (view === 'guide') {
    return page(
      'guide',
      <AppGuidePage
        audience="client"
        tutorialAvailable={tutorialAvailable}
        tutorialCompleted={tutorialCompleted}
        tutorialActive={tutorialActive}
        onStartTutorial={onStartTutorial}
        onEnterPracticeMode={onEnterPracticeMode}
      />
    );
  }

  const homeProps = {
    companyName,
    coverage,
    requests,
    recentReports,
    accountPending,
    onOpenProfile: () => navigate('profile'),
    onAction: handleHomeAction,
    recentGuards: getClientRehireableGuards(clientId, requests, guards).slice(0, 5),
    onHireGuard: startDirectGuardRequest,
    onViewGuard: (guard: SecurityGuard) => {
      setSelectedGuard(guard);
      navigate('guards');
    },
  };

  return page(
    'home',
    formFactor === 'desktop' ? (
      <ClientHomeDesktop {...homeProps} />
    ) : (
      <ClientHomeScreen {...homeProps} />
    ),
    'client-home'
  );
}
