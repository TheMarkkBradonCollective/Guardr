import React from 'react';
import { Heart, Smile, Eye, Stethoscope, Baby, Video } from 'lucide-react';
import { HealthTopBar } from './HealthTopBar';
import { AppSection, InlineSearch } from './AppPrimitives';
import { HEALTH_CATEGORIES, MOCK_APPOINTMENTS, MOCK_TRACKER_METRICS } from './mockData';

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
    <div className="app-screen pb-6">
      <HealthTopBar avatarUrl={avatarUrl} onAvatarClick={onProfileClick} />

      <InlineSearch
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Find a doctor"
        onFilterClick={() => {}}
      />

      <AppSection title="My Appointments" actionLabel="See all" onAction={onSeeAllAppointments} bleed>
        <div className="app-h-scroll">
          {MOCK_APPOINTMENTS.map((appt) => (
            <div key={appt.id} className="app-h-tile">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[0.9375rem] leading-snug">{appt.doctorName}</p>
                {appt.videoEnabled && (
                  <Video className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-sm text-brand-text-muted">{appt.specialty}</p>
              <p className="text-sm text-brand-text-muted mt-2">
                {appt.date} · {appt.time}
              </p>
            </div>
          ))}
        </div>
      </AppSection>

      <AppSection title="Tracker" actionLabel="See all" onAction={onSeeAllTracker} bleed>
        <div className="app-metric-strip">
          {MOCK_TRACKER_METRICS.map((metric) => (
            <div key={metric.id} className="app-metric-item">
              <p className="app-metric-label">{metric.label}</p>
              <p className="app-metric-value">{metric.value}</p>
              {metric.unit && <span className="app-metric-unit">{metric.unit}</span>}
            </div>
          ))}
        </div>
      </AppSection>

      <AppSection title="Categories" actionLabel="See all" onAction={onSeeAllCategories} bleed>
        <div className="app-category-row">
          {HEALTH_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] ?? Stethoscope;
            return (
              <button key={cat.id} type="button" className="app-category-item">
                <span className="app-category-icon">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </span>
                <span className="app-category-label">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </AppSection>
    </div>
  );
}
