import React, { useMemo, useState } from 'react';
import type { PlatformRole, SecurityGuard } from '../../types';
import { ROLE_LABELS, canModerateStaffMember, staffRoleToPlatformRole } from '../../lib/permissions';
import { formatCityLabel, normalizeManagedCities } from '../../lib/platformCities';
import type { PlatformCity } from '../../lib/platformCities';
import { WfSearchBar } from '../ui/wireframe';

interface CityStaffAccessPickerProps {
  cityName: string;
  staffRoster: SecurityGuard[];
  platformCities: PlatformCity[];
  currentUserId: string;
  currentUserRole: PlatformRole;
  canEdit: boolean;
  onUpdateStaffCityAccess: (
    staffId: string,
    patch: { managedCities: string[] }
  ) => Promise<void>;
}

function staffHasCityAccess(member: SecurityGuard, cityName: string): boolean {
  const label = formatCityLabel(cityName).toLowerCase();
  return (member.managedCities ?? []).some((city) => city.toLowerCase() === label);
}

function isImplicitFullAccessStaff(member: SecurityGuard): boolean {
  return member.staffRole === 'Founder' || member.staffRole === 'Director';
}

export function CityStaffAccessPicker({
  cityName,
  staffRoster,
  platformCities,
  currentUserId,
  currentUserRole,
  canEdit,
  onUpdateStaffCityAccess,
}: CityStaffAccessPickerProps) {
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const eligibleStaff = useMemo(
    () =>
      staffRoster
        .filter((member) => member.isStaff && member.staffRole)
        .sort((a, b) => (a.badgeNumber || a.name).localeCompare(b.badgeNumber || b.name)),
    [staffRoster]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligibleStaff;
    return eligibleStaff.filter((member) => {
      const label = `${member.badgeNumber ?? ''} ${member.name} ${member.staffRole ?? ''}`.toLowerCase();
      return label.includes(q);
    });
  }, [eligibleStaff, search]);

  const assignedCount = useMemo(
    () => eligibleStaff.filter((member) => staffHasCityAccess(member, cityName)).length,
    [eligibleStaff, cityName]
  );

  const toggleStaff = async (member: SecurityGuard) => {
    if (!canEdit || busyId) return;
    if (isImplicitFullAccessStaff(member)) return;
    if (!canModerateStaffMember(currentUserRole, currentUserId, member)) return;

    const cityLabel = formatCityLabel(cityName);
    const current = normalizeManagedCities(member.managedCities, platformCities);
    const hasAccess = staffHasCityAccess(member, cityName);
    const next = hasAccess
      ? current.filter((city) => city.toLowerCase() !== cityLabel.toLowerCase())
      : normalizeManagedCities([...current, cityLabel], platformCities);

    setError('');
    setBusyId(member.id);
    try {
      await onUpdateStaffCityAccess(member.id, { managedCities: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update operations access.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Staff operations access</h4>
        <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
          Choose which staff may manage operations in {cityName}. Founders and directors have full
          platform access automatically.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-brand-text-muted">
          {assignedCount === 0
            ? 'No staff assigned to this city'
            : `${assignedCount} staff member${assignedCount === 1 ? '' : 's'} assigned`}
        </p>
      </div>

      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search staff..."
        className="w-full"
      />

      <div className="rounded-xl border border-brand-border divide-y divide-brand-border overflow-y-auto max-h-56">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-brand-text-muted text-center">No staff match your search.</p>
        ) : (
          filtered.map((member) => {
            const implicitFull = isImplicitFullAccessStaff(member);
            const checked = implicitFull || staffHasCityAccess(member, cityName);
            const rowEditable =
              canEdit &&
              !implicitFull &&
              canModerateStaffMember(currentUserRole, currentUserId, member);
            const inputId = `city-staff-access-${cityName.replace(/\s+/g, '-').toLowerCase()}-${member.id}`;
            const roleLabel = member.staffRole
              ? ROLE_LABELS[staffRoleToPlatformRole(member.staffRole)]
              : 'Staff';

            return (
              <label
                key={member.id}
                htmlFor={inputId}
                className={`flex items-center gap-3 px-3 py-2 text-sm ${
                  rowEditable ? 'cursor-pointer hover:bg-brand-surface/60' : 'opacity-80'
                }`}
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  disabled={!rowEditable || busyId === member.id}
                  onChange={() => void toggleStaff(member)}
                  className="rounded border-brand-border"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium truncate">{member.badgeNumber || member.name}</span>
                  <span className="block text-xs text-brand-text-muted truncate">
                    {implicitFull
                      ? 'Full platform access'
                      : `${member.badgeNumber ? member.name : roleLabel} · ${roleLabel}`}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      {!canEdit && (
        <p className="text-xs text-brand-text-muted">
          You can view staff access for this city. Only directors, founders, and scoped managers may
          change assignments.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
