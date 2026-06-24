import React, { useEffect, useMemo, useState } from 'react';
import { Client, JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser, SupportTicket } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { getClientRehireableGuards } from '../lib/guardDirectory';
import { buildIncidentReportViews } from '../lib/incidentReports';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { isClientAccountPending } from '../lib/accountStatus';
import type { ClientPaymentGates, PlatformSettings } from '../lib/platformSettings';
import type { PlatformFeeConfig } from '../lib/payments';
import type { OvertimeDisputeInput } from '../lib/shiftBilling';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import { RequestSecurityFlow, RequestFlowPreset } from './client/RequestSecurityFlow';
import { DirectGuardRequestFlow } from './client/DirectGuardRequestFlow';
import { ClientReportsScreen } from './client/ClientReportsScreen';
import { ClientRequestsList } from './client/ClientRequestsList';
import { GuardDirectoryScreen } from './client/GuardDirectoryScreen';
import { GuardProfileScreen } from './client/GuardProfileScreen';
import { ClientMapScreen } from './client/ClientMapScreen';
import { AppPageTransition } from './ui/motion/AppMotion';
import { ClientMessagesPanel } from './client/ClientMessagesPanel';
import { AppGuidePage } from './docs/AppGuidePage';

export type ClientView =
  | 'map'
  | 'home'
  | 'request'
  | 'direct-request'
  | 'messages'
  | 'reports'
  | 'requests'
  | 'guards'
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
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
  onConfirmSelfAudit?: (requestId: string) => void | Promise<void>;
  onConfirmSpotCheck?: (requestId: string, spotCheckId: string) => void | Promise<void>;
  onRequestCashPayment?: (requestId: string) => void | Promise<void>;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onDisputeOvertime?: (requestId: string, input: OvertimeDisputeInput) => void | Promise<void>;
  onRequestOvertimeCash?: (requestId: string) => void | Promise<void>;
  onApproveScheduleChange?: (requestId: string) => void | Promise<void>;
  onRejectScheduleChange?: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
  onApproveTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onDenyTeamSlot?: (requestId: string, slotId: string) => void | Promise<void>;
  onApproveFullTeam?: (requestId: string) => void | Promise<void>;
  onDenyFullTeam?: (requestId: string) => void | Promise<void>;
  crewSettings?: PlatformSettings;
  /** @deprecated Use crewSettings */
  teamLeadSettings?: PlatformSettings;
  favoriteGuardIds?: string[];
  onToggleFavoriteGuard?: (guardId: string) => void | Promise<void>;
  paymentGates: ClientPaymentGates;
  feeConfig: PlatformFeeConfig;
  currentUser?: SessionUser;
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
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
  onConfirmSelfAudit,
  onConfirmSpotCheck,
  onRequestCashPayment,
  onApproveOvertime,
  onDisputeOvertime,
  onRequestOvertimeCash,
  onApproveScheduleChange,
  onRejectScheduleChange,
  onApprovePendingGuard,
  onDenyPendingGuard,
  onApproveTeamSlot,
  onDenyTeamSlot,
  onApproveFullTeam,
  onDenyFullTeam,
  crewSettings,
  teamLeadSettings,
  favoriteGuardIds = [],
  onToggleFavoriteGuard,
  paymentGates,
  feeConfig,
  currentUser,
  jobChatThreads = [],
  jobChatMessages = [],
  onSendJobChatMessage,
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
      case 'messages':
        navigate('messages');
        break;
      case 'map':
        navigate('map');
        break;
    }
  };

  const startDirectGuardRequest = (guard: SecurityGuard) => {
    setRequestTargetGuard(guard);
    navigate('direct-request');
  };

  const wrap = (node: React.ReactNode) => (
    <div className="h-full max-w-full min-w-0 overflow-hidden">{node}</div>
  );

  const page = (key: string, node: React.ReactNode) => (
    <AppPageTransition motionKey={key} className="h-full min-h-0">
      {wrap(node)}
    </AppPageTransition>
  );

  if (accountPending && view !== 'profile' && view !== 'settings' && view !== 'messages' && view !== 'home') {
    return page(
      'pending',
      <AccountPendingScreen role="client" onOpenProfile={() => navigate('profile')} />
    );
  }

  if (view === 'map') {
    return (
      <ClientMapScreen
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        crewSettings={crewSettings ?? teamLeadSettings}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
        initialLiveJobId={jobChatRequestId}
        onLiveJobIdChange={onJobChatRequestIdChange}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onConfirmSpotCheck={onConfirmSpotCheck}
        onRequestCashPayment={onRequestCashPayment}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onRequestOvertimeCash={onRequestOvertimeCash}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        onAddReview={onAddReview}
      />
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
        onBack={() => navigate('home')}
        onSubmit={(req) => {
          onPostRequest(req);
          navigate('home');
        }}
      />
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
      <GuardDirectoryScreen
        guards={guards}
        onSelectGuard={setSelectedGuard}
        favoriteGuardIds={favoriteGuardIds}
        onToggleFavorite={onToggleFavoriteGuard}
        clientId={clientId}
        requests={requests}
        onRequestGuard={startDirectGuardRequest}
      />
    );
  }

  if (view === 'messages' && currentUser && onSendJobChatMessage && onSendSupportMessage) {
    return page(
      'messages',
      <ClientMessagesPanel
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        jobChatMessages={jobChatMessages}
        supportTickets={supportTickets}
        onSendJobChatMessage={onSendJobChatMessage}
        onSendSupportMessage={onSendSupportMessage}
        initialChatRequestId={jobChatRequestId}
        initialChatOpen={openJobChat}
        onChatRequestIdChange={onJobChatRequestIdChange}
        onChatOpenChange={onJobChatOpenChange}
        initialSupportTicketId={supportTicketId}
        onSupportTicketIdChange={onSupportTicketIdChange}
        onOpenCompose={onOpenSupportCompose}
        onOpenReport={onOpenSupportReport}
      />
    );
  }

  if (view === 'reports') {
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
      />
    );
  }

  if (view === 'requests') {
    return page(
      'requests',
      <ClientRequestsList
        requests={requests}
        guards={guards}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
        onAddReview={onAddReview}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onConfirmSpotCheck={onConfirmSpotCheck}
        onRequestCashPayment={onRequestCashPayment}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onRequestOvertimeCash={onRequestOvertimeCash}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        crewSettings={crewSettings ?? teamLeadSettings}
        onRequestNew={() => {
          setFlowPreset('default');
          navigate('request');
        }}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        jobChatMessages={jobChatMessages}
        onSendJobChatMessage={onSendJobChatMessage}
        onOpenJobChat={openMessages}
      />
    );
  }

  if (view === 'guide') {
    return page('guide', <AppGuidePage audience="client" />);
  }

  return page(
    'home',
    <ClientHomeScreen
      companyName={companyName}
      coverage={coverage}
      requests={requests}
      recentReports={recentReports}
      accountPending={accountPending}
      onOpenProfile={() => navigate('profile')}
      onAction={handleHomeAction}
      recentGuards={getClientRehireableGuards(clientId, requests, guards).slice(0, 5)}
      onHireGuard={startDirectGuardRequest}
      onViewGuard={(guard) => {
        setSelectedGuard(guard);
        navigate('guards');
      }}
    />
  );
}
