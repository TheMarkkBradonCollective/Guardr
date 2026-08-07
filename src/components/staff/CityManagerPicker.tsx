import React, { useMemo, useState } from 'react';
import type { SecurityGuard } from '../../types';
import { getStaffDisplayName } from '../../lib/staffProfile';
import { managerStaffForCityAssignment } from '../../lib/staffCityAccess';
import type { PlatformCity } from '../../lib/platformCities';

interface CityManagerPickerProps {
  city: PlatformCity;
  staffRoster: SecurityGuard[];
  canEdit: boolean;
  busy?: boolean;
  onAssignCityManager: (cityId: string, managerId: string | null) => Promise<void>;
}

export function CityManagerPicker({
  city,
  staffRoster,
  canEdit,
  busy = false,
  onAssignCityManager,
}: CityManagerPickerProps) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const managerOptions = useMemo(() => managerStaffForCityAssignment(staffRoster), [staffRoster]);

  const currentManagerId = city.cityManagerId ?? '';
  const currentManager = managerOptions.find((manager) => manager.id === currentManagerId);

  const handleChange = async (nextManagerId: string) => {
    if (!canEdit || busy || saving) return;
    const normalized = nextManagerId.trim();
    if (normalized === currentManagerId) return;

    setError('');
    setSaving(true);
    try {
      await onAssignCityManager(city.id, normalized || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update city manager.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">City manager</h4>
        <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
          Assign one Manager to run {city.name}. Directors and Founders oversee all cities and are
          not tied to a market.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="uber-label">Manager for {city.name}</span>
        <select
          value={currentManagerId}
          disabled={!canEdit || busy || saving}
          onChange={(e) => void handleChange(e.target.value)}
          className="uber-select w-full"
        >
          <option value="">No city manager assigned</option>
          {managerOptions.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.badgeNumber || getStaffDisplayName(manager as SecurityGuard)}
            </option>
          ))}
        </select>
      </label>

      {currentManager && (
        <p className="text-xs text-brand-text-muted">
          {getStaffDisplayName(currentManager as SecurityGuard)} is the city manager for {city.name}.
        </p>
      )}

      {!canEdit && (
        <p className="text-xs text-brand-text-muted">
          Only Directors and Founders can assign city managers.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
