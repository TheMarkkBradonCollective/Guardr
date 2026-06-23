import React, { useEffect, useMemo, useState } from 'react';
import { Client, JobChatMessage, JobChatThread, SecurityGuard, SecurityRequest, SessionUser, SupportTicket } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { isClientAccountPending } from '../lib/accountStatus';
import type { ClientPaymentGates } from '../lib/platformSettings';
import { AccountPendingScreen } from './account/AccountPendingScreen';
import { RequestSecurityFlow, RequestFlowPreset } from './client/RequestSecurityFlow';
import { DirectGuardRequestFlow } from './client/DirectGuardRequestFlow';
import { LiveCoverageScreen } from './client/LiveCoverageScreen';
import { ClientReportsScreen } from './client/ClientReportsScreen';
import { ClientRequestsList } from './client/ClientRequestsList';
import { GuardDirectoryScreen } from './client/GuardDirectoryScreen';
import { GuardProfileScreen } from './client/GuardProfileScreen';
import { ClientMapScreen } from './client/ClientMapScreen';
import { AppPageTransition } from './ui/motion/AppMotion';
import { ClientMessagesPanel } from './client/ClientMessagesPanel';
import { AppWorkflowPage } from './docs/AppWorkflowPage';

export type ClientView =
  | 'map'
  | 'home'
  | 'request'
  | 'direct-request'
  | 'coverage'
  | 'messages'
  | 'reports'
  | 'requests'
  | 'guards'
  | 'profile'
  | 'support'
  | 'support-compose'
  | 'support-report'
  | 'guide';

interface ClientDashboardProps {
  companyName: string;
  clientId: string;
  requests: SecurityRequest[];
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
  onApprovePendingGuard?: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard?: (requestId: string) => void | Promise<void>;
  paymentGates: ClientPaymentGates;
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
  onApprovePendingGuard,
  onDenyPendingGuard,
  paymentGates,
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
    if (openJobChat && jobChatRequestId && (view === 'map' || view === 'coverage')) {
      navigate('messages');
    }
  }, [openJobChat, jobChatRequestId, view]);

  const coverage = useMemo(() => computeCoverageSummary(requests), [requests]);
  const recentReports = useMemo(() => buildRecentReports(requests), [requests]);

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
        navigate('reports');
        break;
      case 'coverage':
        navigate('coverage');
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

  if (accountPending && view !== 'profile' && view !== 'messages' && view !== 'home') {
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
        onOpenCoverage={() => navigate('coverage')}
        onOpenJobChat={openMessages}
        initialLiveJobId={jobChatRequestId}
        onLiveJobIdChange={onJobChatRequestIdChange}
      />
    );
  }

  if (view === 'request') {
    return page(
      'request',
      <RequestSecurityFlow
        preset={flowPreset}
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
          onBack={() => setSelectedGuard(null)}
          onRequestGuard={startDirectGuardRequest}
        />
      );
    }
    return page(
      'guards',
      <GuardDirectoryScreen guards={guards} onSelectGuard={setSelectedGuard} />
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

  if (view === 'coverage') {
    return page(
      'coverage',
      <LiveCoverageScreen
        requests={requests}
        guards={guards}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onConfirmSpotCheck={onConfirmSpotCheck}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
      />
    );
  }

  if (view === 'reports') {
    return page(
      'reports',
      <ClientReportsScreen
        reports={recentReports}
        onBack={() => navigate('home')}
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
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
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
    return page('guide', <AppWorkflowPage audience="client" />);
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
    />
  );
}
