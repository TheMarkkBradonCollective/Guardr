import React, { useMemo, useState } from 'react';
import { Certification, CertCategory, SecurityGuard } from '../../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  credentialRequiresExpiry,
  getCertCatalogEntry,
  getCertsByCategory,
} from '../../lib/certCatalog';
import { getOptionalCredentialSections } from '../../lib/guardCredentialSections';
import {
  isMandatoryCourseCatalogId,
  isPtaUofCatalogId,
} from '../../lib/guardQualification';
import { US_STATES } from '../../lib/states';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { validateCertSubmission } from '../../lib/certImagePolicy';
import type { CredentialViewSectionId } from '../../lib/guardCredentialSections';
import { ChevronRight } from 'lucide-react';

type OptionalAddSection = CredentialViewSectionId;

interface GuardOptionalCredentialAddSheetProps {
  guard: SecurityGuard;
  open: boolean;
  onClose: () => void;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  /** Skip section picker and open directly on a catalog section. */
  initialSection?: OptionalAddSection;
}

function catalogOptionsForSection(section: OptionalAddSection) {
  if (section === 'bsis-refresher') {
    const entry = getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID);
    return entry ? [entry] : [];
  }
  if (section === 'bsis-other-training') {
    return getCertsByCategory('bsis-training').filter(
      (opt) =>
        !isMandatoryCourseCatalogId(opt.id) &&
        !isPtaUofCatalogId(opt.id) &&
        opt.id !== BSIS_REFRESHER_CATALOG_ID &&
        opt.id !== 'bsis-32-hour-completed' &&
        opt.id !== 'bsis-40-hour-completed'
    );
  }
  return getCertsByCategory(section as CertCategory);
}

export function GuardOptionalCredentialAddSheet({
  open,
  onClose,
  onAddCertification,
  initialSection,
}: GuardOptionalCredentialAddSheetProps) {
  const sections = useMemo(() => getOptionalCredentialSections(), []);
  const [selectedSection, setSelectedSection] = useState<OptionalAddSection | null>(
    initialSection ?? null
  );
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [state, setState] = useState('CA');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');
  const [formError, setFormError] = useState('');

  const selectedMeta = selectedSection
    ? sections.find((section) => section.id === selectedSection)
    : undefined;

  const catalogOptions = selectedSection ? catalogOptionsForSection(selectedSection) : [];

  const resetForm = () => {
    setSelectedSection(null);
    setSelectedCatalogId('');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setFormError('');
    onClose();
  };

  const openSection = (sectionId: OptionalAddSection) => {
    const options = catalogOptionsForSection(sectionId);
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

  const backToSections = () => {
    setSelectedSection(null);
    setSelectedCatalogId('');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setFormError('');
  };

  const submitCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!onAddCertification || !selectedCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(selectedCatalogId);
    if (!entry) return;
    if (entry.requiresState && !state) return;
    const isOther = selectedCatalogId === 'other-credential';
    if (isOther && !customCertName.trim()) return;
    if (credentialRequiresExpiry(entry.id) && !expiryDate.trim()) {
      setFormError('Enter the permit expiration date.');
      return;
    }

    const proof = validateCertSubmission(imageUrl);
    if (proof.ok === false) {
      setFormError(proof.error);
      return;
    }

    const result = await onAddCertification({
      catalogId: entry.id,
      category: entry.category,
      name: isOther ? customCertName.trim() : entry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      state: entry.requiresState ? state.toUpperCase() : undefined,
      expiryDate: credentialRequiresExpiry(entry.id) ? expiryDate.trim() : undefined,
      status: 'pending',
      imageUrl,
    });
    if (result.ok === false) {
      setFormError(result.error);
      return;
    }
    resetForm();
  };

  const showCatalogSelect =
    selectedSection === 'bsis-other-training' ||
    (selectedSection !== null &&
      selectedSection !== 'bsis-refresher' &&
      catalogOptions.length > 1);

  const showPermitExpiry =
    selectedSection === 'bsis-permit' ||
    (selectedCatalogId ? credentialRequiresExpiry(selectedCatalogId) : false);

  return (
    <AppFormSheet
      open={open}
      onClose={resetForm}
      title={selectedMeta?.title ?? 'Add optional credential'}
      subtitle={
        selectedMeta?.subtitle ??
        'Firearms permits, medical certs, FEMA, and more — not required for activation.'
      }
    >
      {!selectedSection ? (
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => openSection(section.id)}
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
      ) : (
        <form onSubmit={submitCert} className="space-y-3">
          {showCatalogSelect && catalogOptions.length > 0 && (
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
          )}
          {selectedCatalogId === 'other-credential' && (
            <input
              className="uber-input w-full"
              placeholder="Certificate or license name"
              value={customCertName}
              onChange={(e) => setCustomCertName(e.target.value)}
              required
            />
          )}
          {getCertCatalogEntry(selectedCatalogId)?.requiresState && (
            <select value={state} onChange={(e) => setState(e.target.value)} className="uber-select w-full" required>
              {US_STATES.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <input
            className="uber-input w-full"
            placeholder="Issuing organization (e.g. BSIS, training provider)"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            required
          />
          <input
            className="uber-input w-full"
            placeholder={
              selectedSection === 'bsis-refresher'
                ? 'Certificate number'
                : 'Certificate / license / permit number'
            }
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
                aria-label="Permit expiration date"
              />
            </>
          )}
          <DocumentPhotoUploadField
            imageUrl={imageUrl}
            onImageUrlChange={(url) => {
              setImageUrl(url);
              setFormError('');
            }}
          />
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={backToSections} className="flex-1 app-button-outline !h-11 !text-sm">
              Back
            </button>
            <button
              type="submit"
              disabled={!imageUrl?.trim()}
              className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50"
            >
              Upload credential
            </button>
          </div>
        </form>
      )}
    </AppFormSheet>
  );
}
