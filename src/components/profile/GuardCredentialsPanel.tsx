import React, { useMemo, useState } from 'react';
import { Certification, GuardEquipmentGearId, GuardInsurancePolicy, GuardWeaponGearId, SecurityGuard } from '../../types';
import {
  BSIS_REFRESHER_CATALOG_ID,
  CertCategory,
  credentialRequiresExpiry,
  getCertCatalogEntry,
} from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
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
import { Plus } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { catalogOptionsForCredentialSection } from '../../lib/guardCredentialCatalog';
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
import {
  CATALOG_CREDENTIAL_SECTION_IDS,
  getCredentialSectionMeta,
  type CredentialViewSectionId,
} from '../../lib/guardCredentialSections';
import { GuardCredentialCatalogSectionBlock } from '../credentials/GuardCredentialCatalogSectionBlock';

type CredentialOpenSection = CertCategory | 'bsis-refresher' | 'bsis-other-training';

function credentialAddSectionKey(section: CredentialViewSectionId): CredentialOpenSection {
  if (section === 'bsis-other-training') return 'bsis-other-training';
  if (section === 'bsis-refresher') return 'bsis-refresher';
  return section as CertCategory;
}

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
  weaponGearEditing?: boolean;
  equipmentGearEditing?: boolean;
  weaponGearSelected?: GuardWeaponGearId[];
  equipmentGearSelected?: GuardEquipmentGearId[];
  onWeaponGearChange?: (next: GuardWeaponGearId[]) => void;
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullGearCatalog?: boolean;
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
  weaponGearEditing = false,
  equipmentGearEditing = false,
  weaponGearSelected,
  equipmentGearSelected,
  onWeaponGearChange,
  onEquipmentGearChange,
  showFullGearCatalog = true,
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
  const canUpload = canUploadGuardCredentials(editing, staffMode, onAddCertification, guard);
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
    if (openSection === 'bsis-other-training') {
      return {
        title: 'Add BSIS training',
        subtitle: 'Supplemental BSIS courses beyond the 32-hour CE package — not required for activation.',
      };
    }
    const sectionMeta = getCredentialSectionMeta(openSection as CredentialViewSectionId);
    return {
      title: sectionMeta ? `Add ${sectionMeta.title}` : 'Upload credential',
      subtitle: sectionMeta?.subtitle,
    };
  })();

  const renderCredentialAddForm = () => {
    if (!openSection) return null;
    const showCatalogSelect =
      openSection === 'bsis-other-training' ||
      (openSection !== 'bsis-refresher' && CATALOG_CREDENTIAL_SECTION_IDS.includes(openSection as CredentialViewSectionId));

    const catalogOptions =
      openSection === 'bsis-other-training'
        ? catalogOptionsForCredentialSection('bsis-other-training')
        : openSection !== 'bsis-refresher'
          ? catalogOptionsForCredentialSection(openSection as CredentialViewSectionId)
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
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Every required and optional credential slot in one place — upload, track status, and list weapons
            you carry after Guardr verifies the matching BSIS permits.
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
          {!guard.isStaff && (
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
      {CATALOG_CREDENTIAL_SECTION_IDS.map((sectionId) => (
        <GuardCredentialCatalogSectionBlock
          key={sectionId}
          sectionId={sectionId}
          guard={guard}
          search={search}
          staffMode={staffMode}
          canUpload={canUpload}
          editing={editing}
          showFullCatalog
          showFullGearCatalog={showFullGearCatalog}
          weaponGearEditing={weaponGearEditing}
          equipmentGearEditing={equipmentGearEditing}
          weaponGearSelected={weaponGearSelected}
          equipmentGearSelected={equipmentGearSelected}
          onWeaponGearChange={onWeaponGearChange}
          onEquipmentGearChange={onEquipmentGearChange}
          groupedCerts={grouped}
          onAdd={(catalogId, section) => openCredentialAddSheet(credentialAddSectionKey(section), catalogId)}
          renderCertRow={renderCertRow}
          certCardProps={certCardProps}
        />
      ))}

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
