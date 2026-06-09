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

export type ClientView = 'map' | 'home' | 'request' | 'direct-request' | 'coverage' | 'reports' | 'requests' | 'guards' | 'profile' | 'support';

interface ClientDashboardProps {
  companyName: string;
  clientId: string;
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
  clientId,
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

  const blockIfNotApproved = (): boolean => {
    if (isClientApproved) return false;
    alert('Your account is pending approval. You cannot post jobs yet.');
    return true;
  };

  const handleHomeAction = (action: ClientHomeAction) => {
    if ((action === 'request' || action === 'schedule' || action === 'recurring') && blockIfNotApproved()) {
      return;
    }
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
    if (blockIfNotApproved()) return;
    setRequestTargetGuard(guard);
    navigate('direct-request');
  };

  const wrap = (node: React.ReactNode) => (
    <div className="h-full overflow-y-auto overscroll-contain">{node}</div>
  );

  if (view === 'map') {
    return <ClientMapScreen requests={requests} />;
  }

  if (view === 'request') {
    if (!isClientApproved) {
      return wrap(
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <p className="text-sm text-brand-text-muted">
            Your account is pending approval. You cannot submit assignment requests until staff approves your company.
          </p>
          <button type="button" onClick={() => navigate('home')} className="uber-button-outline h-11 px-6 text-sm">
            Back to home
          </button>
        </div>
      );
    }
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

  if (view === 'direct-request' && requestTargetGuard) {
    if (!isClientApproved) {
      return wrap(
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <p className="text-sm text-brand-text-muted">
            Your account is pending approval. You cannot send direct assignment requests until staff approves your company.
          </p>
          <button type="button" onClick={() => navigate('guards')} className="uber-button-outline h-11 px-6 text-sm">
            Back to guards
          </button>
        </div>
      );
    }
    return (
      <DirectGuardRequestFlow
        guard={requestTargetGuard}
        isClientApproved={isClientApproved}
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
          isClientApproved={isClientApproved}
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
        onHireGuard={onHireGuard}
        onUpdateStatus={onUpdateStatus}
        onAddReview={onAddReview}
        onRequestNew={() => {
          if (blockIfNotApproved()) return;
          setFlowPreset('default');
          navigate('request');
        }}
        isClientApproved={isClientApproved}
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
