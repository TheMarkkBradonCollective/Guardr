import React, { useEffect, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../types';
import {
  PatientHomeScreen,
  DoctorSearchScreen,
  MessageScreen,
  AppointmentScreen,
  MedicationScreen,
  TrackerScreen,
} from './patient';

export type ClientView =
  | 'home'
  | 'message'
  | 'appointment'
  | 'medication'
  | 'tracker'
  | 'search'
  | 'profile'
  | 'support'
  | 'map'
  | 'request'
  | 'direct-request'
  | 'coverage'
  | 'reports'
  | 'requests'
  | 'guards';

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
  onHireGuard: (requestId: string, guardId: string) => void;
  onUpdateStatus: (requestId: string, status: SecurityRequest['status']) => void;
  onAddReview: (requestId: string, rating: number, reviewText: string) => void;
}

export function ClientDashboard({
  companyName,
  avatarUrl,
  activeView,
  onViewChange,
}: ClientDashboardProps) {
  const [view, setView] = useState<ClientView>(activeView ?? 'home');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeView) setView(activeView);
  }, [activeView]);

  const navigate = (next: ClientView) => {
    setView(next);
    onViewChange?.(next);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) navigate('search');
  };

  if (view === 'search') {
    return (
      <DoctorSearchScreen
        initialQuery={searchQuery}
        avatarUrl={avatarUrl}
        onProfileClick={() => navigate('profile')}
        onMakeAppointment={() => navigate('appointment')}
      />
    );
  }

  if (view === 'message') {
    return <MessageScreen />;
  }

  if (view === 'appointment') {
    return <AppointmentScreen />;
  }

  if (view === 'medication') {
    return (
      <MedicationScreen
        avatarUrl={avatarUrl}
        onProfileClick={() => navigate('profile')}
      />
    );
  }

  if (view === 'tracker') {
    return <TrackerScreen />;
  }

  return (
    <PatientHomeScreen
      userName={companyName}
      avatarUrl={avatarUrl}
      onSearch={handleSearch}
      onSeeAllAppointments={() => navigate('appointment')}
      onSeeAllTracker={() => navigate('tracker')}
      onSeeAllCategories={() => navigate('search')}
      onProfileClick={() => navigate('profile')}
    />
  );
}
