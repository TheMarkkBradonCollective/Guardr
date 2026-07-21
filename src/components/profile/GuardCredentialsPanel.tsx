import React, { useMemo, useState } from 'react';
import { Certification, GuardInsurancePolicy, SecurityGuard } from '../../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  CERT_CATEGORY_LABELS,
  CertCategory,
  credentialRequiresExpiry,
  getCertCatalogEntry,
  getCertsByCategory,
} from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import {
  isPtaUofCatalogId,
  isThirtyTwoHourCatalogId,
} from '../../lib/guardQualification';
import { resolveCertCatalogId } from '../../lib/certCatalog';
import { US_STATES } from '../../lib/states';
import { CertItemCard } from '../credentials/CertItemCard';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { GuardPtaUofPanel } from '../guard/GuardPtaUofPanel';
import { GuardThirtyTwoHourPanel } from '../guard/GuardThirtyTwoHourPanel';
import { GuardCardPanel } from './GuardCardPanel';
import { GuardCoiItemCard } from './GuardCoiItemCard';
import { GuardVehicleInsuranceItemCard } from './GuardVehicleInsuranceItemCard';
import { GuardIdItemCard } from './GuardIdItemCard';
import {
  type GuardIdentityVerificationPayload,
  type IdentityVerificationSubmitResult,
} from './GuardIdentityVerificationPanel';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationCanEdit,
} from '../../lib/guardIdentityVerification';
import { Award, BookOpen, Plus, Shield } from 'lucide-react';
import { CredentialRowAction, CredentialRowHeader } from '../credentials/CredentialStatusLabels';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { credentialMatchesSearch } from '../../lib/credentialSearch';
import { getCourseUploadStatus } from '../../lib/certStatus';
import {
  CERT_IMAGE_POLICY_HINT,
  guardCertificationCanEdit,
  validateCertDeletion,
  validateCertSubmission,
} from '../../lib/certImagePolicy';
import type { CertImageMutationResult } from '../../lib/certImagePolicy';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';
import { certOverlayProps, type CertOverlayNavigation } from '../credentials/credentialOverlayNavigation';
import { coiApprovalItemId, govIdApprovalItemId } from '../../lib/guardCredentialSections';
import { showAppToast } from '../ui/AppToast';
import { showAppConfirm } from '../ui/AppConfirm';
import { AppFormSheet } from '../ui/app/AppFormSheet';
import { canUploadGuardCredentials } from '../../lib/guardCredentialUpload';
import { GuardOptionalCredentialAddSheet } from '../guard/GuardOptionalCredentialAddSheet';
import {
  staffCanEditCertification,
  staffCanEditGuardGovernmentId,
} from '../../lib/staffCredentialRules';
import { WfSearchBar } from '../ui/wireframe';

const CREDENTIAL_SECTIONS: {
  category: CertCategory;
  title: string;
  subtitle: string;
  icon: typeof Shield;
}[] = [
  {
    category: 'bsis-permit',
    title: 'BSIS Permits (Weapons)',
    subtitle: 'Separate from training certificates — firearm, baton, and pepper spray permits expire and require staff verification.',
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

type CredentialOpenSection = CertCategory | 'bsis-refresher';

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
  onSaveInsurance?: (policy: Partial<GuardInsurancePolicy> & { guardId: string }) => Promise<void>;
  onSaveVehicleInsurance?: (
    policy: Partial<import('../../types').GuardVehicleInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onReviewInsurance?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
  certOverlayNav?: CertOverlayNavigation;
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
  onSaveInsurance,
  onSaveVehicleInsurance,
  onReviewInsurance,
  certOverlayNav,
}: GuardCredentialsPanelProps) {
  const grouped = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const [openSection, setOpenSection] = useState<CredentialOpenSection | null>(null);
  const [optionalAddOpen, setOptionalAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [state, setState] = useState('CA');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setSelectedCatalogId('');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setFormError('');
    setOpenSection(null);
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
    if (!(await showAppConfirm({
      title: 'Remove credential?',
      message: 'Remove this credential from your profile?',
      confirmLabel: 'Remove',
      tone: 'danger',
    }))) return;
    const result = await onDeleteCertification(certId);
    if (result.ok === false) showAppToast(result.error, { tone: 'error' });
  };

  const credentialViewFullLabel = certOverlayNav?.onViewFull ? 'View full in Credentials →' : undefined;

  const certCardProps = (cert: Certification) => ({
    onDelete: onDeleteCertification ? () => handleDelete(cert.id) : undefined,
    onAttachImage: onAttachCertificationImage
      ? (imageUrl: string) => onAttachCertificationImage(cert.id, imageUrl)
      : undefined,
    canEdit: staffMode ? staffCanEditCertification(guard, cert) : guardCertificationCanEdit(cert),
    staffMode,
    onUpdate: onUpdateCertification
      ? (payload: CertUpdatePayload) => onUpdateCertification(cert.id, payload)
      : undefined,
    guardName: guard.name,
    viewFullLabel: credentialViewFullLabel,
    ...certOverlayProps(certOverlayNav, cert.id),
  });

  const renderCertRow = (cert: Certification) => (
    <div key={cert.id} className="space-y-2">
      <CertItemCard cert={cert} editing={editing} showCategory={false} {...certCardProps(cert)} />
      {renderCertActions?.(cert)}
    </div>
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
  const showSection = (count: number) =>
    search.trim() ? count > 0 : editing || staffMode || count > 0;
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification, guard);
  const matchesSearch = (cert: Certification) => credentialMatchesSearch(cert, search);
  const filteredRefresherItems = useMemo(
    () => refresherItems.filter(matchesSearch),
    [refresherItems, search]
  );
  const filteredOtherBsisItems = useMemo(
    () => otherBsisItems.filter(matchesSearch),
    [otherBsisItems, search]
  );
  const idStatus = getGuardIdVerificationStatus(guard);
  const canEditId = !guard.isStaff && (
    staffMode ? staffCanEditGuardGovernmentId(guard) : guardIdVerificationCanEdit(guard)
  );

  const credentialAddSheetMeta = (() => {
    if (!openSection) return { title: 'Upload credential' };
    if (openSection === 'bsis-refresher') {
      return {
        title: refresherEntry?.name ?? '8-Hour BSIS Refresher',
        subtitle: refresherEntry?.description ?? 'Upload when applicable for guard card renewals.',
      };
    }
    if (openSection === 'bsis-training') {
      return {
        title: 'Add BSIS training',
        subtitle: 'Supplemental BSIS courses — not part of the Active pathway or 32-hour block.',
      };
    }
    const sectionMeta = CREDENTIAL_SECTIONS.find((s) => s.category === openSection);
    return {
      title: sectionMeta ? `Add ${sectionMeta.title}` : 'Upload credential',
      subtitle: sectionMeta?.subtitle,
    };
  })();

  const renderCredentialAddForm = () => {
    if (!openSection) return null;
    const showCatalogSelect =
      openSection === 'bsis-training' ||
      (openSection !== 'bsis-refresher' && CREDENTIAL_SECTIONS.some((s) => s.category === openSection));

    const catalogOptions =
      openSection === 'bsis-training'
        ? otherBsisCatalogOptions
        : openSection !== 'bsis-refresher'
          ? getCertsByCategory(openSection as CertCategory)
          : [];

    const showPermitExpiry =
      openSection === 'bsis-permit' ||
      (selectedCatalogId ? credentialRequiresExpiry(selectedCatalogId) : false);

    return (
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
            openSection === 'bsis-refresher' ? 'Certificate number' : 'Certificate / license / permit number'
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
        <button
          type="submit"
          disabled={!imageUrl?.trim()}
          className="w-full app-button-primary !h-11 !text-sm disabled:opacity-50"
        >
          Add
        </button>
      </form>
    );
  };

  const openCredentialAddSheet = (section: CredentialOpenSection, catalogId?: string) => {
    setOpenSection(section);
    if (catalogId) setSelectedCatalogId(catalogId);
    setIssuer('');
    setNumber('');
    setExpiryDate('');
    setState('CA');
    setImageUrl(undefined);
    setCustomCertName('');
    setFormError('');
  };

  return (
    <section className={`${staffMode ? 'staff-credentials-panel' : 'app-form-section'} space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-brand-primary">
            Credentials
          </p>
          {editing && staffMode && (
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Review and edit submitted credentials before approval or denial. After a decision,
              request an update so the guard can resubmit — staff cannot upload for the guard.
            </p>
          )}
        </div>
        {canUpload && onAddCertification && (
          <button
            type="button"
            onClick={() => setOptionalAddOpen(true)}
            className="app-button-primary !w-auto !h-9 !px-4 !text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add credential
          </button>
        )}
      </div>

      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search credentials..."
        className="max-w-md"
      />

      {canUpload && onAddCertification && !staffMode && (
        <GuardOptionalCredentialAddSheet
          guard={guard}
          open={optionalAddOpen}
          onClose={() => setOptionalAddOpen(false)}
          onAddCertification={onAddCertification}
        />
      )}

      {!guard.isStaff && idStatus === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          ID resubmit requested — tap Government ID, then Edit to update. {guard.idVerificationRejectionReason}
        </p>
      )}

      {!guard.isStaff && (onSubmitIdentityVerification || staffMode) && (
        <>
          <GuardIdItemCard
            guard={guard}
            canEdit={canEditId}
            staffMode={staffMode}
            asCredentialSection
            onSubmit={onSubmitIdentityVerification}
            onViewFull={
              certOverlayNav?.onViewFull
                ? () => certOverlayNav.onViewFull!(govIdApprovalItemId(guard.id))
                : undefined
            }
            viewFullLabel={credentialViewFullLabel}
            onEditFullPage={certOverlayNav?.onEditFullPage}
          />
          {staffIdReview && <div className="-mt-2">{staffIdReview}</div>}
          {!guard.isStaff && (onSaveInsurance || onReviewInsurance || guard.insurancePolicy) && (
            <GuardCoiItemCard
              guard={guard}
              editing={editing}
              staffMode={staffMode}
              onSave={onSaveInsurance}
              onReview={onReviewInsurance}
              onViewFull={
                certOverlayNav?.onViewFull
                  ? () => certOverlayNav.onViewFull!(coiApprovalItemId(guard.id))
                  : undefined
              }
              viewFullLabel={credentialViewFullLabel}
              onEditFullPage={certOverlayNav?.onEditFullPage}
            />
          )}
          {(onSaveVehicleInsurance || guard.vehicleInsurancePolicy) && (
            <GuardVehicleInsuranceItemCard
              guard={guard}
              editing={editing}
              onSave={onSaveVehicleInsurance}
            />
          )}
          <GuardCardPanel
            guard={guard}
            editing={editing}
            staffMode={staffMode}
            renderCertActions={renderCertActions}
            onAddCertification={onAddCertification}
            onDeleteCertification={onDeleteCertification}
            onAttachCertificationImage={onAttachCertificationImage}
            onUpdateCertification={onUpdateCertification}
            certOverlayNav={certOverlayNav}
          />
        </>
      )}

      <GuardPtaUofPanel
        guard={guard}
        editing={editing}
        staffMode={staffMode}
        onAddCertification={onAddCertification}
        onDeleteCertification={onDeleteCertification}
        onAttachCertificationImage={onAttachCertificationImage}
        onUpdateCertification={onUpdateCertification}
        renderCertActions={renderCertActions}
        certOverlayNav={certOverlayNav}
      />
      <GuardThirtyTwoHourPanel
        guard={guard}
        editing={editing}
        staffMode={staffMode}
        onAddCertification={onAddCertification}
        onDeleteCertification={onDeleteCertification}
        onAttachCertificationImage={onAttachCertificationImage}
        onUpdateCertification={onUpdateCertification}
        renderCertActions={renderCertActions}
        certOverlayNav={certOverlayNav}
      />
      {showSection(filteredRefresherItems.length) && (
      <div className="mt-14 pt-8 border-t border-b border-brand-border pb-5">
      <section className="app-form-section space-y-3 !pt-0 !border-t-0">
        <CredentialRowHeader
          rawTitle
          title={
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
              {refresherEntry?.name ?? '8-Hour BSIS Refresher'}
            </p>
          }
          subtitle={undefined}
          action={
            canUpload ? (
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={
                  refresherItems.length > 0
                    ? 'on-file'
                    : getCourseUploadStatus(guard, BSIS_REFRESHER_CATALOG_ID)
                }
                canUpload={canUpload}
                onAdd={() => openCredentialAddSheet('bsis-refresher', BSIS_REFRESHER_CATALOG_ID)}
              />
            ) : undefined
          }
        />

        {filteredRefresherItems.length === 0 ? (
          canUpload || editing ? (
            <div className="border-t border-brand-border py-3">
              <p className="text-xs text-brand-text-muted">
                {search.trim() ? 'No matching refresher course on file.' : 'No refresher course on file.'}
              </p>
            </div>
          ) : null
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {filteredRefresherItems.map((cert) => renderCertRow(cert))}
          </div>
        )}
      </section>
      </div>
      )}
      {showSection(filteredOtherBsisItems.length) && (
      <section className="app-form-section space-y-3 pb-4 border-b border-brand-border">
        <CredentialRowHeader
          rawTitle
          title={
            <p className="uber-label flex items-center gap-2 flex-wrap">
              <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
              Other BSIS Training
            </p>
          }
          subtitle={undefined}
          action={
            canUpload && otherBsisCatalogOptions.length > 0 ? (
              <CredentialRowAction
                staffMode={staffMode}
                uploadStatus={
                  otherBsisItems.length > 0
                    ? 'on-file'
                    : getCourseUploadStatus(guard, otherBsisCatalogOptions[0]?.id ?? '')
                }
                canUpload={canUpload}
                onAdd={() => openCredentialAddSheet('bsis-training', otherBsisCatalogOptions[0]?.id ?? '')}
              />
            ) : undefined
          }
        />

        {filteredOtherBsisItems.length === 0 ? (
          canUpload || editing ? (
            <div className="border-t border-brand-border py-3">
              <p className="text-xs text-brand-text-muted">
                {search.trim() ? 'No matching BSIS training on file.' : 'No other BSIS training on file.'}
              </p>
            </div>
          ) : null
        ) : (
          <div className="app-cert-item-stack border-t border-brand-border">
            {filteredOtherBsisItems.map((cert) => renderCertRow(cert))}
          </div>
        )}
      </section>
      )}

      {CREDENTIAL_SECTIONS.map(({ category, title, subtitle, icon: Icon }) => {
        const items = (grouped[category] ?? []).filter(matchesSearch);
        if (!showSection(items.length)) return null;
        const catalogOptions = getCertsByCategory(category);

        const sectionCard = (
          <section key={category} className="app-form-section space-y-3 pb-4 border-b border-brand-border">
            <CredentialRowHeader
              rawTitle
              title={
                <p className="uber-label flex items-center gap-2 flex-wrap">
                  <Icon className="w-4 h-4 text-brand-primary shrink-0" />
                  {title}
                </p>
              }
              subtitle={<p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{subtitle}</p>}
              action={
                canUpload && catalogOptions.length > 0 ? (
                  <CredentialRowAction
                    staffMode={staffMode}
                    uploadStatus={
                      items.length > 0 ? 'on-file' : getCourseUploadStatus(guard, catalogOptions[0]?.id ?? '')
                    }
                    canUpload={canUpload}
                    onAdd={() => openCredentialAddSheet(category, catalogOptions[0]?.id ?? '')}
                  />
                ) : undefined
              }
            />

            {items.length === 0 ? (
              canUpload || editing ? (
                <div className="border-t border-brand-border py-3">
                  <p className="text-xs text-brand-text-muted">
                    {search.trim()
                      ? `No matching ${CERT_CATEGORY_LABELS[category].toLowerCase()} on file.`
                      : `No ${CERT_CATEGORY_LABELS[category].toLowerCase()} on file.`}
                  </p>
                </div>
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

      <AppFormSheet
        open={Boolean(openSection && (editing || staffMode))}
        onClose={resetForm}
        title={credentialAddSheetMeta.title}
        subtitle={credentialAddSheetMeta.subtitle}
      >
        {renderCredentialAddForm()}
      </AppFormSheet>
    </section>
  );
}
