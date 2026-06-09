import React from 'react';
import {
  Heart,
  Smile,
  Eye,
  Stethoscope,
  Baby,
  Video,
} from 'lucide-react';
import { WfSearchBar, WfSectionHeader } from '../ui/wireframe';
import { HealthTopBar } from './HealthTopBar';
import {
  HEALTH_CATEGORIES,
  MOCK_APPOINTMENTS,
  MOCK_TRACKER_METRICS,
} from './mockData';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cardiology: Heart,
  dental: Smile,
  ophthalmology: Eye,
  dermatology: Stethoscope,
  pediatrics: Baby,
};

interface PatientHomeScreenProps {
  userName?: string;
  avatarUrl?: string;
  onSearch?: (query: string) => void;
  onSeeAllAppointments?: () => void;
  onSeeAllTracker?: () => void;
  onSeeAllCategories?: () => void;
  onProfileClick?: () => void;
}

export function PatientHomeScreen({
  avatarUrl,
  onSearch,
  onSeeAllAppointments,
  onSeeAllTracker,
  onSeeAllCategories,
  onProfileClick,
}: PatientHomeScreenProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="h-full overflow-y-auto overscroll-contain pb-4">
      <HealthTopBar avatarUrl={avatarUrl} onAvatarClick={onProfileClick} />

      <div className="px-4 space-y-6">
        <WfSearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Find a doctor"
          onFilterClick={() => {}}
        />

        <section>
          <WfSectionHeader title="My Appointments" actionLabel="See all" onAction={onSeeAllAppointments} />
          <div className="app-scroll-row mt-3">
            {MOCK_APPOINTMENTS.map((appt) => (
              <div key={appt.id} className="appointment-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-[0.9375rem]">{appt.doctorName}</p>
                    <p className="text-sm text-brand-text-muted">{appt.specialty}</p>
                  </div>
                  {appt.videoEnabled && (
                    <Video className="w-4 h-4 text-brand-text-muted shrink-0" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-sm text-brand-text-muted">
                  {appt.date} · {appt.time}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <WfSectionHeader title="Tracker" actionLabel="See all" onAction={onSeeAllTracker} />
          <div className="app-scroll-row mt-3">
            {MOCK_TRACKER_METRICS.map((metric) => (
              <div key={metric.id} className="tracker-metric-card">
                <p className="text-xs text-brand-text-muted mb-1">{metric.label}</p>
                <p className="text-lg font-bold tracking-tight">
                  {metric.value}
                  {metric.unit && (
                    <span className="text-xs font-medium text-brand-text-muted ml-0.5">
                      {metric.unit}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <WfSectionHeader title="Categories" actionLabel="See all" onAction={onSeeAllCategories} />
          <div className="app-scroll-row mt-3">
            {HEALTH_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] ?? Stethoscope;
              return (
                <button key={cat.id} type="button" className="category-circle">
                  <span className="category-circle-icon">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </span>
                  <span className="text-xs font-medium text-brand-text">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
