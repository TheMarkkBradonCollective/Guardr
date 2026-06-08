import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../types';
import {
  buildRecentReports,
  computeCoverageSummary,
} from '../lib/clientCoverage';
import { ClientHomeScreen, ClientHomeAction } from './client/ClientHomeScreen';
import { RequestSecurityFlow, RequestFlowPreset } from './client/RequestSecurityFlow';
import { LiveCoverageScreen } from './client/LiveCoverageScreen';
import { ClientReportsScreen } from './client/ClientReportsScreen';
import { ClientRequestsList } from './client/ClientRequestsList';

export type ClientView = 'home' | 'request' | 'coverage' | 'reports' | 'requests' | 'profile';

interface ClientDashboardProps {
  companyName: string;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clientEmail: string;
  isClientApproved?: boolean;
  activeView?: ClientView;
  onViewChange?: (view: ClientView) => void;
  onPostRequest: (req: Partial<SecurityRequest>) => void;
  onEditRequest: (requestId: string, req: Partial<SecurityRequest>) => void;
  onCancelRequest: (requestId: string) => void;
  onHireGuard: (requestId: string, guardId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
}

export function ClientDashboard({
  companyName,
  requests,
  guards,
  clientEmail,
  isClientApproved = true,
  activeView,
  onViewChange,
  onPostRequest,
  onCancelRequest,
  onHireGuard,
  onUpdateStatus,
  onAddReview,
}: ClientDashboardProps) {
  const [view, setView] = useState<ClientView>(activeView ?? 'home');
  const [flowPreset, setFlowPreset] = useState<RequestFlowPreset>('default');

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
    }
  };

  const wrap = (node: React.ReactNode) => (
    <div className="h-full overflow-y-auto overscroll-contain">{node}</div>
  );

  if (view === 'request') {
    return wrap(
      <RequestSecurityFlow
        isClientApproved={isClientApproved}
        preset={flowPreset}
        onBack={() => navigate('home')}
        onSubmit={(req) => {
          onPostRequest(req);
          navigate('home');
        }}
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
        onHireGuard={onHireGuard}
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
      isClientApproved={isClientApproved}
      onAction={handleHomeAction}
    />
  );
}
