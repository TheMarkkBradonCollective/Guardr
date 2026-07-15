import React, { useMemo, useState } from 'react';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import {
  credentialRequiresExpiry,
  getCertCatalogEntry,
} from '../../lib/certCatalog';
import { validateCertSubmission } from '../../lib/certImagePolicy';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import {
  catalogOptionsForStaffAddSection,
  staffAddSectionShowsCatalogPicker,
} from '../../lib/staffCredentialAdd';
import {
  getStaffAddableCredentialSections,
  type CredentialViewSectionId,
} from '../../lib/guardCredentialSections';
import { US_STATES, formatStateName } from '../../lib/states';
import { CertItemCard } from '../credentials/CertItemCard';
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { showAppToast } from '../ui/AppToast';
import { WfSearchBar } from '../ui/wireframe';

type WizardStep = 'guard' | 'type' | 'details' | 'upload' | 'preview';

interface StaffCredentialAddForGuardFormProps {
  guards: SecurityGuard[];
  onAddCertification: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onCredentialAdded?: (guardId: string) => void;
}

function SelectedGuardBanner({
  guard,
  onChangeGuard,
}: {
  guard: SecurityGuard;
  onChangeGuard: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-sec/60 px-3 py-2.5 mb-4">
      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brand-text-muted">Adding credential for</p>
        <p className="text-sm font-semibold truncate">{guard.name}</p>
        <p className="text-xs text-brand-text-muted truncate">{guard.badgeNumber}</p>
      </div>
      <button type="button" onClick={onChangeGuard} className="text-xs font-semibold text-brand-primary shrink-0">
        Change
      </button>
    </div>
  );
}

function WizardFooter({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextType = 'button',
  onSubmit,
  submitLabel = 'Add credential',
  submitting = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextType?: 'button' | 'submit';
  onSubmit?: () => void;
  submitLabel?: string;
  submitting?: boolean;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {onBack && (
        <button type="button" onClick={onBack} className="flex-1 app-button-outline !h-11 !text-sm">
          Back
        </button>
      )}
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 app-button-primary !h-11 !text-sm gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Adding…' : submitLabel}
        </button>
      ) : (
        <button
          type={nextType}
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          {nextLabel}
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
  const [step, setStep] = useState<WizardStep>('guard');
  const [guardSearch, setGuardSearch] = useState('');
  const [selectedGuardId, setSelectedGuardId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<CredentialViewSectionId | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [state, setState] = useState('CA');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const roster = useMemo(() => guards.filter((guard) => !guard.isStaff), [guards]);
  const credentialSections = useMemo(() => getStaffAddableCredentialSections(), []);

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

  const selectedSectionMeta = selectedSection
    ? credentialSections.find((section) => section.id === selectedSection)
    : undefined;

  const catalogOptions = selectedSection ? catalogOptionsForStaffAddSection(selectedSection) : [];
  const catalogEntry = selectedCatalogId ? getCertCatalogEntry(selectedCatalogId) : undefined;
  const showCatalogSelect = staffAddSectionShowsCatalogPicker(selectedSection);
  const showPermitExpiry =
    selectedSection === 'bsis-permit' ||
    (selectedCatalogId ? credentialRequiresExpiry(selectedCatalogId) : false);

  const resetWizard = () => {
    setStep('guard');
    setGuardSearch('');
    setSelectedGuardId(null);
    setSelectedSection(null);
    setSelectedCatalogId('');
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setCustomCertName('');
    setFormError('');
    setSaving(false);
  };

  const close = () => {
    setOpen(false);
    resetWizard();
  };

  const openWizard = () => {
    resetWizard();
    setOpen(true);
  };

  const selectGuard = (guardId: string) => {
    setSelectedGuardId(guardId);
    setStep('type');
    setGuardSearch('');
  };

  const selectSection = (sectionId: CredentialViewSectionId) => {
    const options = catalogOptionsForStaffAddSection(sectionId);
    setSelectedSection(sectionId);
    setSelectedCatalogId(options[0]?.id ?? '');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setFormError('');
    setStep('details');
  };

  const detailsComplete = Boolean(
    selectedCatalogId &&
      issuer.trim() &&
      number.trim() &&
      (!catalogEntry?.requiresState || state.trim()) &&
      (!showPermitExpiry || expiryDate.trim()) &&
      (selectedCatalogId !== 'other-credential' || customCertName.trim())
  );

  const validateDetails = (): boolean => {
    if (!detailsComplete) {
      setFormError('Fill in all required credential details.');
      return false;
    }
    setFormError('');
    return true;
  };

  const validateUpload = (): boolean => {
    const proof = validateCertSubmission(imageUrl);
    if (proof.ok === false) {
      setFormError(proof.error);
      return false;
    }
    setFormError('');
    return true;
  };

  const previewCert = useMemo((): Certification | null => {
    if (!catalogEntry || !detailsComplete || !imageUrl?.trim()) return null;
    const isOther = selectedCatalogId === 'other-credential';
    return {
      id: 'preview',
      name: isOther ? customCertName.trim() : catalogEntry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      state: catalogEntry.requiresState ? state.trim().toUpperCase() : undefined,
      expiryDate: showPermitExpiry ? expiryDate.trim() : undefined,
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      catalogId: catalogEntry.id,
      category: catalogEntry.category,
      imageUrl: imageUrl.trim(),
      submittedByRole: 'staff',
    };
  }, [
    catalogEntry,
    customCertName,
    detailsComplete,
    expiryDate,
    imageUrl,
    issuer,
    number,
    selectedCatalogId,
    showPermitExpiry,
    state,
  ]);

  const handleAdd = async () => {
    if (!selectedGuardId || !catalogEntry || !previewCert) return;
    setSaving(true);
    setFormError('');
    try {
      const isOther = selectedCatalogId === 'other-credential';
      const result = await onAddCertification(selectedGuardId, {
        catalogId: catalogEntry.id,
        category: catalogEntry.category,
        name: isOther ? customCertName.trim() : catalogEntry.name,
        issuer: issuer.trim(),
        number: number.trim(),
        state: catalogEntry.requiresState ? state.trim().toUpperCase() : undefined,
        expiryDate: showPermitExpiry ? expiryDate.trim() : undefined,
        status: 'pending',
        imageUrl: imageUrl?.trim(),
        submittedByRole: 'staff',
      });
      if (result.ok === false) {
        setFormError(result.error);
        return;
      }
      showAppToast(`Credential added for ${selectedGuard?.name ?? 'guard'}.`, { tone: 'success' });
      onCredentialAdded?.(selectedGuardId);
      close();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add credential.');
    } finally {
      setSaving(false);
    }
  };

  const sheetMeta = (() => {
    switch (step) {
      case 'guard':
        return {
          title: 'Add credential for guard',
          subtitle: 'Step 1 — Choose a guard',
        };
      case 'type':
        return {
          title: 'Credential type',
          subtitle: `Step 2 — What are you adding for ${selectedGuard?.name ?? 'this guard'}?`,
        };
      case 'details':
        return {
          title: selectedSectionMeta?.title ?? 'Credential details',
          subtitle: 'Step 3 — Enter license or certificate information',
        };
      case 'upload':
        return {
          title: 'Upload proof',
          subtitle: 'Step 4 — Photo or scan of the credential document',
        };
      case 'preview':
        return {
          title: 'Review credential',
          subtitle: 'Step 5 — Confirm before adding to the guard profile',
        };
      default:
        return { title: 'Add credential for guard' };
    }
  })();

  return (
    <>
      <button
        type="button"
        onClick={openWizard}
        className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add for guard
      </button>

      <AppFormSheet open={open} onClose={close} title={sheetMeta.title} subtitle={sheetMeta.subtitle}>
        {step !== 'guard' && selectedGuard && (
          <SelectedGuardBanner guard={selectedGuard} onChangeGuard={() => setStep('guard')} />
        )}

        {step === 'guard' && (
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
        )}

        {step === 'type' && (
          <>
            <ul className="space-y-2">
              {credentialSections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => selectSection(section.id)}
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
            <div className="pt-2">
              <button type="button" onClick={() => setStep('guard')} className="w-full app-button-outline !h-11 !text-sm">
                Back
              </button>
            </div>
          </>
        )}

        {step === 'details' && (
          <div className="space-y-3">
            {showCatalogSelect && catalogOptions.length > 0 && (
              <>
                <label className="uber-label">Credential type</label>
                <select
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                  className="uber-select w-full text-sm"
                  required
                >
                  {catalogOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {selectedCatalogId === 'other-credential' && (
              <>
                <label className="uber-label">Credential name</label>
                <input
                  className="uber-input w-full"
                  placeholder="Certificate or license name"
                  value={customCertName}
                  onChange={(e) => setCustomCertName(e.target.value)}
                  required
                />
              </>
            )}
            {catalogEntry?.requiresState && (
              <>
                <label className="uber-label">Issuing state</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="uber-select w-full"
                  required
                >
                  {US_STATES.map(({ code, name }) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label className="uber-label">Issuing organization</label>
            <input
              className="uber-input w-full"
              placeholder="e.g. BSIS, training provider"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
            <label className="uber-label">License / cert number</label>
            <input
              className="uber-input w-full"
              placeholder="Certificate or license number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            {showPermitExpiry && (
              <>
                <label className="uber-label">Expiration date</label>
                <input
                  type="date"
                  className="uber-input w-full"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </>
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <WizardFooter
              onBack={() => setStep('type')}
              onNext={() => {
                if (validateDetails()) setStep('upload');
              }}
              nextDisabled={!detailsComplete}
            />
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-3">
            <DocumentPhotoUploadField
              imageUrl={imageUrl}
              onImageUrlChange={(url) => {
                setImageUrl(url);
                setFormError('');
              }}
              previewAlt={`${catalogEntry?.name ?? 'Credential'} document`}
            />
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <WizardFooter
              onBack={() => setStep('details')}
              onNext={() => {
                if (validateUpload()) setStep('preview');
              }}
              nextDisabled={!imageUrl?.trim()}
            />
          </div>
        )}

        {step === 'preview' && previewCert && selectedGuard && (
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <CredentialCategoryBadge cert={previewCert} />
                <CredentialStatusBadges cert={previewCert} staffMode />
              </div>
              <div>
                <p className="text-xs text-brand-text-muted">{selectedGuard.name}</p>
                <p className="text-lg font-bold leading-snug">{previewCert.name}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm rounded-xl border border-brand-border bg-brand-bg-sec/40 p-4">
              <div>
                <dt className="text-xs text-brand-text-muted">Issuing organization</dt>
                <dd className="font-medium mt-0.5">{previewCert.issuer}</dd>
              </div>
              <div>
                <dt className="text-xs text-brand-text-muted">License / cert number</dt>
                <dd className="font-medium mt-0.5 font-mono text-[0.8125rem]">{previewCert.number}</dd>
              </div>
              {previewCert.state && (
                <div>
                  <dt className="text-xs text-brand-text-muted">State</dt>
                  <dd className="font-medium mt-0.5">{formatStateName(previewCert.state)}</dd>
                </div>
              )}
              {previewCert.expiryDate && (
                <div>
                  <dt className="text-xs text-brand-text-muted">Expiration date</dt>
                  <dd className="font-medium mt-0.5">
                    {new Date(`${previewCert.expiryDate}T12:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            {previewCert.imageUrl && (
              <img
                src={previewCert.imageUrl}
                alt={`${previewCert.name} document`}
                className="w-full max-h-[min(40vh,20rem)] object-contain rounded-xl border border-brand-border bg-brand-bg-sec"
              />
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <WizardFooter
              onBack={() => setStep('upload')}
              onSubmit={() => void handleAdd()}
              submitting={saving}
              submitLabel="Add credential"
            />
          </div>
        )}
      </AppFormSheet>
    </>
  );
}
