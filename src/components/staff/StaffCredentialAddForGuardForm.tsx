import React, { useCallback, useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { getStaffAddableCredentialSections, type CredentialViewSectionId } from '../../lib/guardCredentialSections';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { WfSearchBar } from '../ui/wireframe';
import { useStaffShellCreateRegistration } from './StaffShellCreateContext';
import { useLayoutFormFactor } from '../../surfaces';
import {
  StaffGuardCredentialAddWizard,
  type StaffCredentialAddWizardSheetMeta,
} from './StaffGuardCredentialAddWizard';

interface StaffCredentialAddForGuardFormProps {
  guards: SecurityGuard[];
  onAddCertification: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onCredentialAdded?: (guardId: string) => void;
}

type FlowStep = 'credential' | 'guard' | 'wizard';

const CREDENTIAL_PICKER_META: StaffCredentialAddWizardSheetMeta = {
  title: 'Add credential',
  subtitle: 'Step 1 — Choose a credential type',
};

const GUARD_PICKER_META: StaffCredentialAddWizardSheetMeta = {
  title: 'Add credential',
  subtitle: 'Step 2 — Choose a guard',
};

function SelectedCredentialBanner({
  title,
  onChange,
}: {
  title: string;
  onChange?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-sec/60 px-3 py-2.5 mb-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brand-text-muted">Credential type</p>
        <p className="text-sm font-semibold break-words">{title}</p>
      </div>
      {onChange && (
        <button type="button" onClick={onChange} className="text-xs font-semibold text-brand-primary shrink-0">
          Change
        </button>
      )}
    </div>
  );
}

export function StaffCredentialAddForGuardForm({
  guards,
  onAddCertification,
  onCredentialAdded,
}: StaffCredentialAddForGuardFormProps) {
  const [open, setOpen] = useState(false);
  const formFactor = useLayoutFormFactor();
  const hideTrigger = formFactor === 'desktop';
  const [flowStep, setFlowStep] = useState<FlowStep>('credential');
  const [guardSearch, setGuardSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<CredentialViewSectionId | null>(null);
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [wizardSheetMeta, setWizardSheetMeta] = useState<StaffCredentialAddWizardSheetMeta>(CREDENTIAL_PICKER_META);

  const credentialSections = useMemo(() => getStaffAddableCredentialSections(), []);
  const roster = useMemo(() => guards.filter((guard) => !guard.isStaff), [guards]);

  const selectedSectionMeta = useMemo(
    () => (selectedSection ? credentialSections.find((section) => section.id === selectedSection) : undefined),
    [credentialSections, selectedSection],
  );

  const selectedGuard = useMemo(
    () => (selectedGuardId ? roster.find((guard) => guard.id === selectedGuardId) ?? null : null),
    [roster, selectedGuardId],
  );

  const filteredGuards = useMemo(() => {
    const query = guardSearch.trim().toLowerCase();
    return roster
      .filter(
        (guard) =>
          !query ||
          guard.name.toLowerCase().includes(query) ||
          guard.email.toLowerCase().includes(query) ||
          guard.badgeNumber.toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, guardSearch]);

  const sheetMeta =
    flowStep === 'credential'
      ? CREDENTIAL_PICKER_META
      : flowStep === 'guard'
        ? GUARD_PICKER_META
        : wizardSheetMeta;

  const selectCredential = (sectionId: CredentialViewSectionId) => {
    setSelectedSection(sectionId);
    setSelectedGuardId(null);
    setGuardSearch('');
    setFlowStep('guard');
  };

  const returnToCredentialPicker = () => {
    setSelectedSection(null);
    setSelectedGuardId(null);
    setGuardSearch('');
    setFlowStep('credential');
  };

  const selectGuard = (guardId: string) => {
    setSelectedGuardId(guardId);
    setFlowStep('wizard');
  };

  const returnToGuardPicker = () => {
    setSelectedGuardId(null);
    setGuardSearch('');
    setFlowStep('guard');
  };

  const openFlow = useCallback(() => {
    setFlowStep('credential');
    setGuardSearch('');
    setSelectedSection(null);
    setSelectedGuardId(null);
    setWizardSheetMeta(CREDENTIAL_PICKER_META);
    setOpen(true);
  }, []);

  const closeFlow = useCallback(() => {
    setOpen(false);
    setFlowStep('credential');
    setGuardSearch('');
    setSelectedSection(null);
    setSelectedGuardId(null);
    setWizardSheetMeta(CREDENTIAL_PICKER_META);
  }, []);

  useStaffShellCreateRegistration('credential', openFlow);

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={openFlow}
          className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add credential
        </button>
      ) : null}

      <AppFormSheet open={open} onClose={closeFlow} title={sheetMeta.title} subtitle={sheetMeta.subtitle}>
        {flowStep === 'credential' && (
          <ul className="space-y-2">
            {credentialSections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => selectCredential(section.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-left hover:border-brand-primary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text">{section.title}</p>
                    {section.subtitle && (
                      <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{section.subtitle}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-brand-text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {flowStep === 'guard' && (
          <>
            {selectedSectionMeta && (
              <SelectedCredentialBanner title={selectedSectionMeta.title} onChange={returnToCredentialPicker} />
            )}
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
                        <p className="text-sm font-semibold break-words">{guard.name}</p>
                        <p className="text-xs text-brand-text-muted break-words">
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
        )}

        {flowStep === 'wizard' && selectedGuard && selectedSection && (
          <StaffGuardCredentialAddWizard
            embedded
            skipTypeStep
            initialSection={selectedSection}
            guard={selectedGuard}
            open
            onClose={closeFlow}
            onChangeGuard={returnToGuardPicker}
            onBackFromDetails={returnToGuardPicker}
            onSheetMetaChange={setWizardSheetMeta}
            onAddCertification={(cert) => onAddCertification(selectedGuard.id, cert)}
            onAdded={() => onCredentialAdded?.(selectedGuard.id)}
          />
        )}
      </AppFormSheet>
    </>
  );
}
