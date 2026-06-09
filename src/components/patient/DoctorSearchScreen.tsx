import React, { useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import { HealthTopBar } from './HealthTopBar';
import { AppList, AppListRow, AvatarPlaceholder, InlineSearch } from './AppPrimitives';
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
    <div className="h-full flex flex-col overflow-hidden bg-brand-bg">
      <HealthTopBar avatarUrl={avatarUrl} onAvatarClick={onProfileClick} />

      <InlineSearch
        value={query}
        onChange={setQuery}
        placeholder="Find a doctor"
        onFilterClick={() => {}}
      />

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AppList>
          {filtered.map((doctor) => (
            <AppListRow key={doctor.id} className="app-list-row-align-top !items-start !py-4">
              <AvatarPlaceholder name={doctor.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[0.9375rem]">{doctor.name}</p>
                  {doctor.videoEnabled && (
                    <Video className="w-4 h-4 text-brand-text-muted shrink-0" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-sm text-brand-text-muted mt-0.5">
                  {doctor.specialty} | {doctor.location}
                </p>
                <p className="text-xs text-brand-text-muted mt-1">
                  Next available {doctor.nextAvailable}
                </p>
                <button
                  type="button"
                  onClick={() => onMakeAppointment?.(doctor.id)}
                  className="app-pill-btn mt-3"
                >
                  Make appointment
                </button>
              </div>
            </AppListRow>
          ))}
        </AppList>
      </div>
    </div>
  );
}
