import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  CERT_CATEGORY_LABELS,
  CertCategory,
  getCertCatalogEntry,
  getCertsByCategory,
} from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  getPtaUofCatalogEntries,
  getQualificationProgress,
  guardHasCredentialUploaded,
  isPtaUofCatalogId,
  isThirtyTwoHourCatalogId,
  BSIS_PTA_UOF_COMBINED_ID,
  PTA_UOF_UPLOAD_GUIDANCE,
} from '../../lib/guardQualification';
import { resolveCertCatalogId } from '../../lib/certCatalog';
import { US_STATES } from '../../lib/states';
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardThirtyTwoHourPanel } from '../guard/GuardThirtyTwoHourPanel';
import { GuardCardPanel } from './GuardCardPanel';
import { GuardIdItemCard } from './GuardIdItemCard';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationCanEdit,
} from '../../lib/guardIdentityVerification';
import { Award, BookOpen, ImagePlus, Shield } from 'lucide-react';
import { WfBadge } from '../ui/wireframe';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import {
  CERT_DOCUMENT_PHOTO_LABEL,
  CERT_IMAGE_POLICY_HINT,
  guardCertificationCanEdit,
  validateCertDeletion,
  validateCertSubmission,
} from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { showAppToast } from '../ui/AppToast';

const CREDENTIAL_SECTIONS: {
  category: CertCategory;
  title: string;
  subtitle: string;
  icon: typeof Shield;
}[] = [
  {
    category: 'bsis-permit',
    title: 'BSIS Permits (Weapons)',
    subtitle: 'Required only when applicable — firearm (armed jobs), baton, pepper spray.',
    icon: Shield,
  },
  {
    category: 'medical',
    title: 'Medical & Emergency',
    subtitle: 'CPR, AED, First Aid, Narcan, Stop the Bleed — highly recommended and often required by clients.',
    icon: Award,
  },
  {
    category: 'fema',
    title: 'FEMA / Homeland Security',
    subtitle: 'ICS and awareness courses for incident command and emergency coordination.',
    icon: Award,
  },
  {
    category: 'security-advanced',
    title: 'Advanced Security',
    subtitle: 'Executive protection, active shooter, de-escalation, defensive driving, and specialty training.',
    icon: Award,
  },
  {
    category: 'industry',
    title: 'Industry & Professional',
    subtitle: 'OSHA, CIT, mental health first aid, other licenses — or use Other to add anything not listed.',
    icon: Award,
  },
];

type CredentialOpenSection = CertCategory | 'bsis-refresher' | 'bsis-pta-uof';

interface GuardCredentialsPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => Promise<AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<CertImageMutationResult>;
  onAttachCertificationImage?: (certId: string, imageUrl: string) => Promise<CertImageMutationResult>;
  onUpdateCertification?: (certId: string, payload: CertUpdatePayload) => Promise<CertUpdateResult>;
  onSubmitIdentityVerification?: (
    payload: GuardIdentityVerificationPayload
  ) => Promise<IdentityVerificationSubmitResult>;
  /** Staff viewing a guard profile — enables ID edit in the detail modal. */
  staffMode?: boolean;
  /** Staff approve / resubmit actions shown under the primary credential stack. */
  staffIdReview?: React.ReactNode;
  renderCertActions?: (cert: Certification) => React.ReactNode;
}

export function GuardCredentialsPanel({
  guard,
  editing,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onSubmitIdentityVerification,
  staffMode = false,
  staffIdReview,
  renderCertActions,
}: GuardCredentialsPanelProps) {
  const grouped = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const [openSection, setOpenSection] = useState<CredentialOpenSection | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setSelectedCatalogId('');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setState('CA');
    setExpiryDate('');
    setImageUrl(undefined);
    setFormError('');
    setOpenSection(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
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

    const proof = validateCertSubmission(imageUrl);
    if (!proof.ok) {
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
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      imageUrl,
    });
    if (result.ok === false) {
      setFormError(result.error);
      return;
    }
    resetForm();
  };

  const handleDelete = async (certId: string) => {
    if (!onDeleteCertification) return;
    const cert = guard.certifications.find((c) => c.id === certId);
    if (cert) {
      const allowed = validateCertDeletion(cert);
      if (allowed.ok === false) {
        showAppToast(allowed.error, { tone: 'error' });
        return;
      }
    }
    if (!window.confirm('Remove this credential from your profile?')) return;
    const result = await onDeleteCertification(certId);
    if (result.ok === false) showAppToast(result.error, { tone: 'error' });
  };

  const certCardProps = (cert: Certification) => ({
    onDelete: onDeleteCertification ? () => handleDelete(cert.id) : undefined,
    onAttachImage: onAttachCertificationImage
      ? (imageUrl: string) => onAttachCertificationImage(cert.id, imageUrl)
      : undefined,
    canEdit: staffMode || guardCertificationCanEdit(cert),
    staffMode,
    onUpdate: onUpdateCertification
      ? (payload: CertUpdatePayload) => onUpdateCertification(cert.id, payload)
      : undefined,
    guardName: guard.name,
  });

  const renderCertRow = (cert: Certification) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard cert={cert} editing={editing} showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
  );

  const ptaUofProgress = getQualificationProgress(guard);
  const ptaUofCatalogOptions = useMemo(() => getPtaUofCatalogEntries(), []);
  const ptaUofItems = useMemo(
    () =>
      (grouped['bsis-training'] ?? []).filter((cert) =>
        isPtaUofCatalogId(resolveCertCatalogId(cert))
      ),
    [grouped]
  );
  const refresherEntry = getCertCatalogEntry(BSIS_REFRESHER_CATALOG_ID);
  const refresherItems = useMemo(
    () =>
      (grouped['bsis-training'] ?? []).filter(
        (cert) => resolveCertCatalogId(cert) === BSIS_REFRESHER_CATALOG_ID
      ),
    [grouped]
  );
  const otherBsisItems = useMemo(
    () =>
      (grouped['bsis-training'] ?? []).filter((cert) => {
        const id = resolveCertCatalogId(cert);
        return !isThirtyTwoHourCatalogId(id) && !isPtaUofCatalogId(id) && id !== BSIS_REFRESHER_CATALOG_ID;
      }),
    [grouped]
  );
  const otherBsisCatalogOptions = useMemo(
    () =>
      getCertsByCategory('bsis-training').filter(
        (opt) =>
          !isThirtyTwoHourCatalogId(opt.id) &&
          !isPtaUofCatalogId(opt.id) &&
          opt.id !== BSIS_REFRESHER_CATALOG_ID
      ),
    []
  );
  const isPtaUofOpen = openSection === 'bsis-pta-uof';
  const isRefresherOpen = openSection === 'bsis-refresher';
  const isOtherBsisOpen = openSection === 'bsis-training';
  const showSection = (count: number) => editing || count > 0;
  const idStatus = getGuardIdVerificationStatus(guard);
  const canEditId = !guard.isStaff && guardIdVerificationCanEdit(guard);

  return (
    <section className="app-form-section space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-primary">
          {editing ? 'Upload credentials' : 'Credentials'}
        </p>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          {editing
            ? `Government ID and BSIS Guard Card are required before profile approval. ${CERT_IMAGE_POLICY_HINT}`
            : 'Government ID, guard card, and other licenses. Tap any item to view details and photos.'}
        </p>
      </div>

      {!guard.isStaff && idStatus === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          ID resubmit requested — tap Government ID, then Edit to update. {guard.idVerificationRejectionReason}
        </p>
      )}

      {!guard.isStaff && (
        <div className="app-cert-item-stack">
          {onSubmitIdentityVerification && (
            <GuardIdItemCard
              guard={guard}
              canEdit={staffMode || canEditId}
              staffMode={staffMode}
              onSubmit={onSubmitIdentityVerification}
            />
          )}
          <GuardCardPanel
            guard={guard}
            editing={editing}
            nested
            staffMode={staffMode}
            renderCertActions={renderCertActions}
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onUpdateCertification={onUpdateCertification}
          />
        </div>
      )}

      {staffIdReview}

      <section className="app-form-section space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <BookOpen className="w-4 h-4 text-brand-primary" />
              Power to Arrest &amp; Appropriate Use of Force
              {staffMode && !ptaUofProgress.ptaUofTraining && (
                <WfBadge tone="warning" className="!text-[10px]">
                  Missing
                </WfBadge>
              )}
            </p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Required to work. {PTA_UOF_UPLOAD_GUIDANCE}
            </p>
            <p
              className={`text-xs font-semibold mt-2 ${
                ptaUofProgress.ptaUofTraining ? 'text-brand-primary' : 'text-brand-text-muted'
              }`}
            >
              {ptaUofProgress.ptaUofTraining
                ? ptaUofProgress.ptaUofCombined
                  ? 'Combined 8-hr certificate on file'
                  : ptaUofProgress.legacyPta && ptaUofProgress.legacyWmd
                    ? 'PTA & WMD certs on file'
                    : 'Separate PTA & UOF certificates on file'
                : 'Not yet on file'}
            </p>
          </div>
          {editing && onAddCertification && (
            <button
              type="button"
              onClick={() => {
                if (isPtaUofOpen) {
                  resetForm();
                } else {
                  setOpenSection('bsis-pta-uof');
                  setSelectedCatalogId(BSIS_PTA_UOF_COMBINED_ID);
                }
              }}
              className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
            >
              {isPtaUofOpen ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {isPtaUofOpen && editing && (
          <form onSubmit={submitCert} className="space-y-3 border-t border-brand-border pt-3">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="uber-select w-full text-sm"
              required
            >
              {ptaUofCatalogOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <input
              className="uber-input w-full"
              placeholder="Issuing organization (e.g. BSIS, training provider)"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
            <input
              className="uber-input w-full"
              placeholder="Certificate number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="uber-input w-full"
              aria-label="Expiry date"
            />
            <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
              <ImagePlus className="w-4 h-4 shrink-0" />
              <span>{CERT_DOCUMENT_PHOTO_LABEL}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} required />
            </label>
            {imageUrl && (
              <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button
              type="submit"
              disabled={!imageUrl?.trim()}
              className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
            >
              Upload credential
            </button>
          </form>
        )}

        {ptaUofItems.length === 0 ? (
          <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">No PTA/UOF training on file.</p>
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {ptaUofItems.map((cert) => renderCertRow(cert))}
          </div>
        )}
      </section>
      <GuardThirtyTwoHourPanel
        guard={guard}
        editing={editing}
        staffMode={staffMode}
        onAddCertification={onAddCertification}
        onDeleteCertification={onDeleteCertification}
        onAttachCertificationImage={onAttachCertificationImage}
        onUpdateCertification={onUpdateCertification}
      />
      {showSection(refresherItems.length) && (
      <section className="app-form-section space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="uber-label flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-primary" />
              {refresherEntry?.name ?? '8-Hour BSIS Refresher'}
            </p>
            <p className="text-xs text-brand-text-muted mt-1">
              {refresherEntry?.description ?? 'Upload when applicable for guard card renewals.'}
            </p>
          </div>
          {editing && onAddCertification && (
            <button
              type="button"
              onClick={() => {
                if (isRefresherOpen) {
                  resetForm();
                } else {
                  setOpenSection('bsis-refresher');
                  setSelectedCatalogId(BSIS_REFRESHER_CATALOG_ID);
                }
              }}
              className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
            >
              {isRefresherOpen ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {isRefresherOpen && editing && (
          <form onSubmit={submitCert} className="space-y-3 border-t border-brand-border pt-3">
            <input
              className="uber-input w-full"
              placeholder="Issuing organization (e.g. BSIS, training provider)"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
            <input
              className="uber-input w-full"
              placeholder="Certificate number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="uber-input w-full"
              aria-label="Expiry date"
            />
            <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
              <ImagePlus className="w-4 h-4 shrink-0" />
              <span>{CERT_DOCUMENT_PHOTO_LABEL}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} required />
            </label>
            {imageUrl && (
              <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button
              type="submit"
              disabled={!imageUrl?.trim()}
              className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
            >
              Upload credential
            </button>
          </form>
        )}

        {refresherItems.length === 0 ? (
          editing ? (
            <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">No refresher course on file.</p>
          ) : null
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {refresherItems.map((cert) => renderCertRow(cert))}
          </div>
        )}
      </section>
      )}
      {showSection(otherBsisItems.length) && (
      <section className="app-form-section space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="uber-label flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-primary" />
              Other BSIS Training
            </p>
            <p className="text-xs text-brand-text-muted mt-1">
              Supplemental BSIS courses — not part of the Active pathway or 32-hour block.
            </p>
          </div>
          {editing && onAddCertification && otherBsisCatalogOptions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpenSection(isOtherBsisOpen ? null : 'bsis-training');
                setSelectedCatalogId(otherBsisCatalogOptions[0]?.id ?? '');
              }}
              className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
            >
              {isOtherBsisOpen ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {isOtherBsisOpen && editing && (
          <form onSubmit={submitCert} className="space-y-3 border-t border-brand-border pt-3">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="uber-select w-full text-sm"
              required
            >
              {otherBsisCatalogOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <input
              className="uber-input w-full"
              placeholder="Issuing organization (e.g. BSIS, training provider)"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
            <input
              className="uber-input w-full"
              placeholder="Certificate / license / permit number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="uber-input w-full"
              aria-label="Expiry date"
            />
            <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
              <ImagePlus className="w-4 h-4 shrink-0" />
              <span>{CERT_DOCUMENT_PHOTO_LABEL}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} required />
            </label>
            {imageUrl && (
              <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
            )}
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button
              type="submit"
              disabled={!imageUrl?.trim()}
              className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
            >
              Upload credential
            </button>
          </form>
        )}

        {otherBsisItems.length === 0 ? (
          editing ? (
            <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
              No other BSIS training on file.
            </p>
          ) : null
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {otherBsisItems.map((cert) => renderCertRow(cert))}
          </div>
        )}
      </section>
      )}

      {CREDENTIAL_SECTIONS.map(({ category, title, subtitle, icon: Icon }) => {
        const items = grouped[category] ?? [];
        if (!showSection(items.length)) return null;
        const catalogOptions = getCertsByCategory(category);
        const isOpen = openSection === category;

        const sectionCard = (
          <section key={category} className="app-form-section space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="uber-label flex items-center gap-2">
                  <Icon className="w-4 h-4 text-brand-primary" />
                  {title}
                </p>
                <p className="text-xs text-brand-text-muted mt-1">{subtitle}</p>
              </div>
              {editing && onAddCertification && catalogOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpenSection(isOpen ? null : category);
                    setSelectedCatalogId(catalogOptions[0]?.id ?? '');
                  }}
                  className="app-button-primary !w-auto !h-8 !px-3 !text-xs shrink-0"
                >
                  {isOpen ? 'Cancel' : 'Add'}
                </button>
              )}
            </div>

            {isOpen && editing && (
              <form onSubmit={submitCert} className="space-y-3 border-t border-brand-border pt-3">
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
                      <option key={code} value={code}>{name}</option>
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
                  placeholder="Certificate / license / permit number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="uber-input w-full"
                  aria-label="Expiry date"
                />
                <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>{CERT_DOCUMENT_PHOTO_LABEL}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} required />
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
                )}
                {formError && <p className="text-xs text-red-400">{formError}</p>}
                <button
                  type="submit"
                  disabled={!imageUrl?.trim()}
                  className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
                >
                  Upload credential
                </button>
              </form>
            )}

            {items.length === 0 ? (
              editing ? (
              <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
                No {CERT_CATEGORY_LABELS[category].toLowerCase()} on file.
              </p>
              ) : null
            ) : (
              <div className="app-cert-item-stack border-t border-brand-border">
                {items.map((cert) => renderCertRow(cert))}
              </div>
            )}
          </section>
        );
        return sectionCard;
      })}
    </section>
  );
}
