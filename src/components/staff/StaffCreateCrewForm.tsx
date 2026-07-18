import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { GuardStandingCrewMember, SecurityGuard } from '../../types';
import { makeGuardCrewLeadProfile } from '../../lib/guardCrewJoinRequest';
import { listGuardsEligibleForStaffCrewCreation } from '../../lib/staffGuardEligibility';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppButton } from '../ui/AppButton';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSearchBar } from '../ui/wireframe';
import { useStaffCreateFormOpen } from './useStaffCreateFormOpen';

interface StaffCreateCrewFormProps {
  guards: SecurityGuard[];
  standingCrewMembers: GuardStandingCrewMember[];
  onCreate: (guardId: string) => void | Promise<void>;
  onCreated?: (guardId: string) => void;
}

export function StaffCreateCrewForm({
  guards,
  standingCrewMembers,
  onCreate,
  onCreated,
}: StaffCreateCrewFormProps) {
  const { open, setOpen, hideTrigger } = useStaffCreateFormOpen('crew');
  const [search, setSearch] = useState('');
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const eligibleGuards = useMemo(
    () => listGuardsEligibleForStaffCrewCreation(guards, standingCrewMembers, search),
    [guards, standingCrewMembers, search],
  );

  const selectedGuard = useMemo(
    () => (selectedGuardId ? eligibleGuards.find((guard) => guard.id === selectedGuardId) ?? null : null),
    [eligibleGuards, selectedGuardId],
  );

  const preview = useMemo(() => {
    if (!selectedGuard) return null;
    const result = makeGuardCrewLeadProfile(selectedGuard, standingCrewMembers);
    return 'error' in result ? null : result;
  }, [selectedGuard, standingCrewMembers]);

  const reset = () => {
    setSearch('');
    setSelectedGuardId(null);
    setError('');
  };

  const closeForm = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedGuardId) {
      setError('Choose a trusted guard to lead the crew.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onCreate(selectedGuardId);
      onCreated?.(selectedGuardId);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create crew.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create crew
        </button>
      ) : null}

      <AppFormSheet
        open={open}
        onClose={closeForm}
        title="Create crew"
        subtitle="Choose a trusted guard who is not already leading or on another crew."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <WfSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search trusted guards..."
          />

          {eligibleGuards.length === 0 ? (
            <p className="text-sm text-brand-text-muted py-4 text-center">
              No eligible trusted guards right now. Guards must be trusted, active, and not already on a crew.
            </p>
          ) : (
            <AppItemCardStack>
              {eligibleGuards.map((guard) => {
                const selected = selectedGuardId === guard.id;
                return (
                  <AppItemCard
                    key={guard.id}
                    onClick={() => setSelectedGuardId(guard.id)}
                    className={selected ? 'app-item-card-selected' : undefined}
                  >
                    <div className="flex items-center gap-3 w-full text-left min-w-0">
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{guard.name}</p>
                        <p className="text-xs text-brand-text-muted truncate">
                          {guard.badgeNumber ? `${guard.badgeNumber} · ` : ''}
                          {guard.email}
                        </p>
                      </div>
                    </div>
                  </AppItemCard>
                );
              })}
            </AppItemCardStack>
          )}

          {selectedGuard && preview ? (
            <div className="rounded-xl border border-brand-border bg-brand-bg-sec/60 px-4 py-3 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">Crew profile</p>
              <p className="text-sm font-semibold text-brand-text">{preview.standingCrewName}</p>
              {preview.standingCrewDescription ? (
                <p className="text-sm text-brand-text-muted leading-relaxed">{preview.standingCrewDescription}</p>
              ) : (
                <p className="text-sm text-brand-text-muted">
                  The guard can customize their crew name and description from their Crew hub.
                </p>
              )}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <AppButton type="submit" fullWidth disabled={!selectedGuardId || saving}>
            {saving ? 'Creating…' : 'Create crew'}
          </AppButton>
        </form>
      </AppFormSheet>
    </>
  );
}
