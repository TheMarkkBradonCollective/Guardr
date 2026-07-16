import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSearchBar } from '../ui/wireframe';
import {
  StaffGuardCredentialAddWizard,
  type StaffCredentialAddWizardSheetMeta,
} from './StaffGuardCredentialAddWizard';

interface StaffCredentialAddForGuardFormProps {
  guards: SecurityGuard[];
  onAddCertification: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onCredentialAdded?: (guardId: string) => void;
}

const GUARD_PICKER_META: StaffCredentialAddWizardSheetMeta = {
  title: 'Add credential for guard',
  subtitle: 'Step 1 — Choose a guard',
};

export function StaffCredentialAddForGuardForm({
  guards,
  onAddCertification,
  onCredentialAdded,
}: StaffCredentialAddForGuardFormProps) {
  const [open, setOpen] = useState(false);
  const [guardSearch, setGuardSearch] = useState('');
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [sheetMeta, setSheetMeta] = useState<StaffCredentialAddWizardSheetMeta>(GUARD_PICKER_META);

  const roster = useMemo(() => guards.filter((guard) => !guard.isStaff), [guards]);

  const selectedGuard = useMemo(
    () => (selectedGuardId ? roster.find((guard) => guard.id === selectedGuardId) ?? null : null),
    [roster, selectedGuardId]
  );

  const filteredGuards = useMemo(() => {
    const query = guardSearch.trim().toLowerCase();
    return roster
      .filter(
        (guard) =>
          !query ||
          guard.name.toLowerCase().includes(query) ||
          guard.email.toLowerCase().includes(query) ||
          guard.badgeNumber.toLowerCase().includes(query)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, guardSearch]);

  const closeFlow = () => {
    setOpen(false);
    setGuardSearch('');
    setSelectedGuardId(null);
    setSheetMeta(GUARD_PICKER_META);
  };

  const openFlow = () => {
    setSelectedGuardId(null);
    setGuardSearch('');
    setSheetMeta(GUARD_PICKER_META);
    setOpen(true);
  };

  const selectGuard = (guardId: string) => {
    setSelectedGuardId(guardId);
  };

  const returnToGuardPicker = () => {
    setSelectedGuardId(null);
    setGuardSearch('');
    setSheetMeta(GUARD_PICKER_META);
  };

  return (
    <>
      <button
        type="button"
        onClick={openFlow}
        className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add for guard
      </button>

      <AppFormSheet
        open={open}
        onClose={closeFlow}
        title={sheetMeta.title}
        subtitle={sheetMeta.subtitle}
      >
        {!selectedGuard ? (
          <>
            <WfSearchBar
              value={guardSearch}
              onChange={setGuardSearch}
              placeholder="Search guards..."
              className="mb-3"
            />
            {filteredGuards.length === 0 ? (
              <p className="text-sm text-brand-text-muted py-4 text-center">
                {roster.length === 0 ? 'No guards on the roster yet.' : 'No guards match your search.'}
              </p>
            ) : (
              <AppItemCardStack>
                {filteredGuards.map((guard) => (
                  <AppItemCard key={guard.id} onClick={() => selectGuard(guard.id)}>
                    <div className="flex items-center gap-3 w-full text-left min-w-0">
                      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{guard.name}</p>
                        <p className="text-xs text-brand-text-muted truncate">
                          {guard.badgeNumber} · {guard.email}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 text-brand-text-muted" />
                    </div>
                  </AppItemCard>
                ))}
              </AppItemCardStack>
            )}
          </>
        ) : (
          <StaffGuardCredentialAddWizard
            embedded
            guard={selectedGuard}
            open
            onClose={closeFlow}
            onChangeGuard={returnToGuardPicker}
            onSheetMetaChange={setSheetMeta}
            onAddCertification={(cert) => onAddCertification(selectedGuard.id, cert)}
            onAdded={() => onCredentialAdded?.(selectedGuard.id)}
          />
        )}
      </AppFormSheet>
    </>
  );
}
