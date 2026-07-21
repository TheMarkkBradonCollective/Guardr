import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import { credentialRequiresExpiry, getCertCatalogEntry } from '../../lib/certCatalog';
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
import { CredentialCategoryBadge } from '../credentials/CredentialCategoryBadge';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { showAppToast } from '../ui/AppToast';

type WizardStep = 'type' | 'details' | 'upload' | 'preview';

export interface StaffCredentialAddWizardSheetMeta {
  title: string;
  subtitle?: string;
}

export function SelectedGuardBanner({
  guard,
  onChangeGuard,
}: {
  guard: SecurityGuard;
  onChangeGuard?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-bg-sec/60 px-3 py-2.5 mb-4">
      <ProfileAvatar src={guard.avatar} name={guard.name} size="sm" rounded="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brand-text-muted">Adding credential for</p>
        <p className="text-sm font-semibold break-words">{guard.name}</p>
        <p className="text-xs text-brand-text-muted break-words">{guard.badgeNumber}</p>
      </div>
      {onChangeGuard && (
        <button type="button" onClick={onChangeGuard} className="text-xs font-semibold text-brand-primary shrink-0">
          Change
        </button>
      )}
    </div>
  );
}

function WizardFooter({
  onBack,
  backLabel = 'previous',
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  onSubmit,
  submitLabel = 'Add credential',
  submitting = false,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  submitting?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {onBack && (
        <button type="button" onClick={onBack} className="app-button-outline !w-auto !min-w-[5.5rem] !h-11 !px-4 !text-sm">
          {/^back to\s+/i.test(backLabel.trim()) ? backLabel.trim() : `Back to ${backLabel.trim()}`}
        </button>
      )}
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="app-button-primary !w-auto !min-w-[7.5rem] !h-11 !px-5 !text-sm gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? 'Adding…' : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="app-button-primary !w-auto !min-w-[7.5rem] !h-11 !px-5 !text-sm disabled:opacity-50"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function getWizardSheetMeta(
  step: WizardStep,
  guard: SecurityGuard,
  selectedSectionMeta?: { title: string },
  options?: { skipTypeStep?: boolean }
): StaffCredentialAddWizardSheetMeta {
  const stepNumber = (() => {
    if (options?.skipTypeStep) {
      if (step === 'details') return 3;
      if (step === 'upload') return 4;
      if (step === 'preview') return 5;
      return 3;
    }
    if (step === 'type') return 1;
    if (step === 'details') return 2;
    if (step === 'upload') return 3;
    if (step === 'preview') return 4;
    return 1;
  })();

  switch (step) {
    case 'type':
      return {
        title: 'Add credential',
        subtitle: `Step ${stepNumber} — Choose a credential type for ${guard.name}`,
      };
    case 'details':
      return {
        title: selectedSectionMeta?.title ?? 'Credential details',
        subtitle: `Step ${stepNumber} — Enter license or certificate information`,
      };
    case 'upload':
      return {
        title: 'Upload proof',
        subtitle: `Step ${stepNumber} — Photo or scan of the credential document`,
      };
    case 'preview':
      return {
        title: 'Review credential',
        subtitle: `Step ${stepNumber} — Confirm before adding to the guard profile`,
      };
    default:
      return { title: 'Add credential' };
  }
}

interface StaffGuardCredentialAddWizardFlowProps {
  guard: SecurityGuard;
  active: boolean;
  onClose: () => void;
  onAddCertification: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onAdded?: () => void;
  onChangeGuard?: () => void;
  onSheetMetaChange?: (meta: StaffCredentialAddWizardSheetMeta) => void;
  initialSection?: CredentialViewSectionId;
  skipTypeStep?: boolean;
  onBackFromDetails?: () => void;
}

function StaffGuardCredentialAddWizardFlow({
  guard,
  active,
  onClose,
  onAddCertification,
  onAdded,
  onChangeGuard,
  onSheetMetaChange,
  initialSection,
  skipTypeStep = false,
  onBackFromDetails,
}: StaffGuardCredentialAddWizardFlowProps) {
  const [step, setStep] = useState<WizardStep>(skipTypeStep ? 'details' : 'type');
  const [selectedSection, setSelectedSection] = useState<CredentialViewSectionId | null>(
    skipTypeStep ? initialSection ?? null : null,
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [state, setState] = useState('CA');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const credentialSections = useMemo(() => getStaffAddableCredentialSections(), []);
  const selectedSectionMeta = selectedSection
    ? credentialSections.find((section) => section.id === selectedSection)
    : undefined;
  const catalogOptions = selectedSection ? catalogOptionsForStaffAddSection(selectedSection) : [];
  const catalogEntry = selectedCatalogId ? getCertCatalogEntry(selectedCatalogId) : undefined;
  const showCatalogSelect = staffAddSectionShowsCatalogPicker(selectedSection);
  const showPermitExpiry =
    selectedSection === 'bsis-permit' ||
    (selectedCatalogId ? credentialRequiresExpiry(selectedCatalogId) : false);

  const resetFlow = () => {
    setStep(skipTypeStep ? 'details' : 'type');
    setSelectedSection(skipTypeStep ? initialSection ?? null : null);
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

  const initializeSection = (sectionId: CredentialViewSectionId) => {
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
  };

  useEffect(() => {
    if (!active) {
      resetFlow();
      return;
    }
    if (skipTypeStep && initialSection) {
      initializeSection(initialSection);
      setStep('details');
    }
  }, [active, guard.id, initialSection, skipTypeStep]);

  const sheetMeta = getWizardSheetMeta(step, guard, selectedSectionMeta, { skipTypeStep });

  useEffect(() => {
    if (active) {
      onSheetMetaChange?.(sheetMeta);
    }
  }, [active, onSheetMetaChange, sheetMeta.subtitle, sheetMeta.title]);

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const selectSection = (sectionId: CredentialViewSectionId) => {
    initializeSection(sectionId);
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
    if (!catalogEntry || !previewCert) return;
    setSaving(true);
    setFormError('');
    try {
      const isOther = selectedCatalogId === 'other-credential';
      const result = await onAddCertification({
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
      showAppToast(`Credential added for ${guard.name}.`, { tone: 'success' });
      onAdded?.();
      handleClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add credential.');
    } finally {
      setSaving(false);
    }
  };

  if (!active) return null;

  return (
    <>
      <SelectedGuardBanner guard={guard} onChangeGuard={onChangeGuard} />

      {step === 'type' && (
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
            onBack={() => (skipTypeStep && onBackFromDetails ? onBackFromDetails() : setStep('type'))}
            backLabel={skipTypeStep && onBackFromDetails ? 'Credentials' : 'credential type'}
            onNext={() => {
              if (!detailsComplete) {
                setFormError('Fill in all required credential details.');
                return;
              }
              setFormError('');
              setStep('upload');
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
            backLabel="details"
            onNext={() => {
              const proof = validateCertSubmission(imageUrl);
              if (proof.ok === false) {
                setFormError(proof.error);
                return;
              }
              setFormError('');
              setStep('preview');
            }}
            nextDisabled={!imageUrl?.trim()}
          />
        </div>
      )}

      {step === 'preview' && previewCert && (
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CredentialCategoryBadge cert={previewCert} />
              <CredentialStatusBadges cert={previewCert} staffMode />
            </div>
            <div>
              <p className="text-xs text-brand-text-muted">{guard.name}</p>
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
            backLabel="upload"
            onSubmit={() => void handleAdd()}
            submitting={saving}
            submitLabel="Add credential"
          />
        </div>
      )}
    </>
  );
}

interface StaffGuardCredentialAddWizardProps {
  guard: SecurityGuard;
  open: boolean;
  onClose: () => void;
  onAddCertification: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onAdded?: () => void;
  /** Render wizard body only — parent owns the surrounding AppFormSheet. */
  embedded?: boolean;
  onChangeGuard?: () => void;
  onSheetMetaChange?: (meta: StaffCredentialAddWizardSheetMeta) => void;
  initialSection?: CredentialViewSectionId;
  skipTypeStep?: boolean;
  onBackFromDetails?: () => void;
}

export function StaffGuardCredentialAddWizard({
  guard,
  open,
  onClose,
  onAddCertification,
  onAdded,
  embedded = false,
  onChangeGuard,
  onSheetMetaChange,
  initialSection,
  skipTypeStep = false,
  onBackFromDetails,
}: StaffGuardCredentialAddWizardProps) {
  const [sheetMeta, setSheetMeta] = useState<StaffCredentialAddWizardSheetMeta>({
    title: 'Add credential',
    subtitle: `Step 1 — Choose a credential type for ${guard.name}`,
  });

  const flow = (
    <StaffGuardCredentialAddWizardFlow
      guard={guard}
      active={open}
      onClose={onClose}
      onAddCertification={onAddCertification}
      onAdded={onAdded}
      onChangeGuard={onChangeGuard}
      onSheetMetaChange={embedded ? onSheetMetaChange ?? setSheetMeta : setSheetMeta}
      initialSection={initialSection}
      skipTypeStep={skipTypeStep}
      onBackFromDetails={onBackFromDetails}
    />
  );

  if (embedded) {
    return flow;
  }

  return (
    <AppFormSheet open={open} onClose={onClose} title={sheetMeta.title} subtitle={sheetMeta.subtitle}>
      {flow}
    </AppFormSheet>
  );
}
