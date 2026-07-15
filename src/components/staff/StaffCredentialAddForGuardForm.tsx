import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SecurityGuard } from '../../types';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfSearchBar } from '../ui/wireframe';

interface StaffCredentialAddForGuardFormProps {
  guards: SecurityGuard[];
  onSelectGuard: (guardId: string) => void;
}

export function StaffCredentialAddForGuardForm({ guards, onSelectGuard }: StaffCredentialAddForGuardFormProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const roster = useMemo(() => guards.filter((guard) => !guard.isStaff), [guards]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roster
      .filter(
        (guard) =>
          !query ||
          guard.name.toLowerCase().includes(query) ||
          guard.email.toLowerCase().includes(query) ||
          guard.badgeNumber.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, search]);

  const close = () => {
    setOpen(false);
    setSearch('');
  };

  const handleSelect = (guardId: string) => {
    close();
    onSelectGuard(guardId);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add for guard
      </button>

      <AppFormSheet
        open={open}
        onClose={close}
        title="Add credential for guard"
        subtitle="Choose a guard to open their profile in edit mode and upload credentials."
      >
        <WfSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search guards..."
          className="mb-3"
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-brand-text-muted py-4 text-center">
            {roster.length === 0 ? 'No guards on the roster yet.' : 'No guards match your search.'}
          </p>
        ) : (
          <AppItemCardStack>
            {filtered.map((guard) => (
              <AppItemCard key={guard.id} onClick={() => handleSelect(guard.id)}>
                <div className="flex items-center gap-3 w-full text-left min-w-0">
                  <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{guard.name}</p>
                    <p className="text-xs text-brand-text-muted truncate">
                      {guard.badgeNumber} · {guard.email}
                    </p>
                  </div>
                </div>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </AppFormSheet>
    </>
  );
}
