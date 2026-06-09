import React, { useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import { WfSearchBar } from '../ui/wireframe';
import { HealthTopBar } from './HealthTopBar';
import { MOCK_DOCTORS } from './mockData';

interface DoctorSearchScreenProps {
  initialQuery?: string;
  avatarUrl?: string;
  onProfileClick?: () => void;
  onMakeAppointment?: (doctorId: string) => void;
}

export function DoctorSearchScreen({
  initialQuery = '',
  avatarUrl,
  onProfileClick,
  onMakeAppointment,
}: DoctorSearchScreenProps) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_DOCTORS;
    return MOCK_DOCTORS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <HealthTopBar avatarUrl={avatarUrl} onAvatarClick={onProfileClick} />

      <div className="shrink-0 px-4 pb-3">
        <WfSearchBar
          value={query}
          onChange={setQuery}
          placeholder="Find a doctor"
          onFilterClick={() => {}}
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 space-y-3">
        {filtered.map((doctor) => (
          <div key={doctor.id} className="doctor-list-card relative">
            {doctor.videoEnabled && (
              <Video
                className="absolute top-4 right-4 w-4 h-4 text-brand-text-muted"
                strokeWidth={1.5}
              />
            )}
            <div className="doctor-avatar-placeholder" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[0.9375rem]">{doctor.name}</p>
              <p className="text-sm text-brand-text-muted mt-0.5">
                {doctor.specialty} | {doctor.location}
              </p>
              <p className="text-xs text-brand-text-muted mt-1">
                Next available {doctor.nextAvailable}
              </p>
              <button
                type="button"
                onClick={() => onMakeAppointment?.(doctor.id)}
                className="mt-3 h-9 px-4 text-xs font-semibold rounded-full bg-brand-primary text-brand-accent-text"
              >
                Make appointment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
