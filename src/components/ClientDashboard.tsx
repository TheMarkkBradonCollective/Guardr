import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { RequestSecurityFlow, RequestFlowPreset } from './client/RequestSecurityFlow';
import { DirectGuardRequestFlow } from './client/DirectGuardRequestFlow';
import { LiveCoverageScreen } from './client/LiveCoverageScreen';
import { ClientReportsScreen } from './client/ClientReportsScreen';
import { ClientRequestsList } from './client/ClientRequestsList';
import { GuardDirectoryScreen } from './client/GuardDirectoryScreen';
import { GuardProfileScreen } from './client/GuardProfileScreen';
import { ClientMapScreen } from './client/ClientMapScreen';

export type ClientView =
  | 'map'
  | 'home'
  | 'request'
  | 'direct-request'
  | 'coverage'
  | 'reports'
  | 'requests'
  | 'guards'
  | 'profile'
  | 'support';

interface ClientDashboardProps {
  companyName: string;
  clientId: string;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  avatarUrl?: string;
  activeView?: ClientView;
  onViewChange?: (view: ClientView) => void;
  onPostRequest: (req: Partial<SecurityRequest>) => void;
  onEditRequest: (requestId: string, req: Partial<SecurityRequest>) => void;
  onCancelRequest: (requestId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
}

export function ClientDashboard({
  companyName,
  clientId,
  requests,
  guards,
  clientEmail,
  activeView,
  onViewChange,
  onPostRequest,
  onEditRequest,
  onCancelRequest,
  onUpdateStatus,
  onAddReview,
}: ClientDashboardProps) {
  const [view, setView] = useState<ClientView>(activeView ?? 'map');
  const [flowPreset, setFlowPreset] = useState<RequestFlowPreset>('default');
  const [selectedGuard, setSelectedGuard] = useState<SecurityGuard | null>(null);
  const [requestTargetGuard, setRequestTargetGuard] = useState<SecurityGuard | null>(null);

  useEffect(() => {
    if (activeView) setView(activeView);
  }, [activeView]);

  const navigate = (next: ClientView) => {
    setView(next);
    onViewChange?.(next);
  };

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
    }
  };

  const startDirectGuardRequest = (guard: SecurityGuard) => {
    setRequestTargetGuard(guard);
    navigate('direct-request');
  };

  const wrap = (node: React.ReactNode) => (
    <div className="h-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain">{node}</div>
  );

  if (view === 'map') {
    return <ClientMapScreen requests={requests} />;
  }

  if (view === 'request') {
    return wrap(
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
    return (
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
      return (
        <GuardProfileScreen
          guard={selectedGuard}
          clientId={clientId}
          requests={requests}
          onBack={() => setSelectedGuard(null)}
          onRequestGuard={startDirectGuardRequest}
        />
      );
    }
    return (
      <GuardDirectoryScreen
        guards={guards}
        onSelectGuard={setSelectedGuard}
      />
    );
  }

  if (view === 'coverage') {
    return wrap(
      <LiveCoverageScreen
        requests={requests}
        guards={guards}
        onBack={() => navigate('home')}
      />
    );
  }

  if (view === 'reports') {
    return wrap(
      <ClientReportsScreen
        reports={recentReports}
        onBack={() => navigate('home')}
      />
    );
  }

  if (view === 'requests') {
    return wrap(
      <ClientRequestsList
        requests={requests}
        guards={guards}
        clientEmail={clientEmail}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
        onAddReview={onAddReview}
        onRequestNew={() => {
          setFlowPreset('default');
          navigate('request');
        }}
      />
    );
  }

  return wrap(
    <ClientHomeScreen
      companyName={companyName}
      coverage={coverage}
      requests={requests}
      recentReports={recentReports}
      onAction={handleHomeAction}
    />
  );
}
