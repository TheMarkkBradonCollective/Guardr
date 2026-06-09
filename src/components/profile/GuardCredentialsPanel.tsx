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
} from '../../lib/guardQualification';
import { resolveCertCatalogId } from '../../lib/certCatalog';
import { US_STATES } from '../../lib/states';
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardQualificationPanel } from '../guard/GuardQualificationPanel';
import { GuardThirtyTwoHourPanel } from '../guard/GuardThirtyTwoHourPanel';
import { Award, BookOpen, ImagePlus, Shield } from 'lucide-react';
import type { AddCertificationResult } from '../../lib/certUniqueness';

const CREDENTIAL_SECTIONS: {
  category: CertCategory;
  title: string;
  subtitle: string;
  icon: typeof Shield;
}[] = [
  {
    category: 'guard-card',
    title: 'BSIS Guard Card',
    subtitle: 'State license — upload a valid card to move from Inactive toward Active. Guardr verification is a trust badge for clients.',
    icon: Shield,
  },
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
  onDeleteCertification?: (certId: string) => void | Promise<void>;
}

export function GuardCredentialsPanel({
  guard,
  editing,
  onAddCertification,
  onDeleteCertification,
}: GuardCredentialsPanelProps) {
  const grouped = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const [openSection, setOpenSection] = useState<CredentialOpenSection | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [issueDate, setIssueDate] = useState('');
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
    setIssueDate('');
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

    const result = await onAddCertification({
      catalogId: entry.id,
      category: entry.category,
      name: isOther ? customCertName.trim() : entry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      state: entry.requiresState ? state.toUpperCase() : undefined,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      imageUrl,
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    resetForm();
  };

  const handleDelete = async (certId: string) => {
    if (!onDeleteCertification) return;
    if (!window.confirm('Remove this credential from your profile?')) return;
    await onDeleteCertification(certId);
  };

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

  return (
    <div className="space-y-4">
      <GuardQualificationPanel guard={guard} />

      <div className="app-form-section space-y-1">
        <p className="text-sm font-semibold text-brand-primary">Upload credentials</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Upload credentials for the Inactive→Active pathway, then add any others you hold — permits, medical, extra training,
          and more. Guardr verification is a trust badge for clients, not required to accept work. Delete and re-upload to change details.
        </p>
      </div>

      {CREDENTIAL_SECTIONS.map(({ category, title, subtitle, icon: Icon }) => {
        const items = grouped[category] ?? [];
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
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input w-full" />
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input w-full" />
                </div>
                <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>Optional: attach scan or photo</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
                )}
                {formError && <p className="text-xs text-red-400">{formError}</p>}
                <button type="submit" className="w-full app-button-primary !h-11 !text-sm">
                  Upload credential
                </button>
              </form>
            )}

            {items.length === 0 ? (
              <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
                No {CERT_CATEGORY_LABELS[category].toLowerCase()} on file.
              </p>
            ) : (
              <div className="app-cert-item-stack border-t border-brand-border">
                {items.map((cert) => (
                  <CertItemCard
                    key={cert.id}
                    cert={cert}
                    editing={editing}
                    onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        );

        if (category !== 'guard-card') return sectionCard;

        return (
          <React.Fragment key="guard-and-bsis-training">
            {sectionCard}
            <section className="app-form-section space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="uber-label flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand-primary" />
                    Power to Arrest &amp; Appropriate Use of Force
                  </p>
                  <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                    Required for Active status. As of 2024, upload the combined 8-hour, 2-part course
                    certificate — or both legacy separate PTA and UOF certs if you have those.
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
                          : 'Legacy separate PTA & UOF certs on file'
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
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input w-full" />
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input w-full" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
                    <ImagePlus className="w-4 h-4 shrink-0" />
                    <span>Optional: attach scan or photo</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                  </label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
                  )}
                  {formError && <p className="text-xs text-red-400">{formError}</p>}
                  <button type="submit" className="w-full app-button-primary !h-11 !text-sm">
                    Upload credential
                  </button>
                </form>
              )}

              {ptaUofItems.length === 0 ? (
                <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">No PTA/UOF training on file.</p>
              ) : (
                <div className="app-cert-item-stack border-t border-brand-border">
                  {ptaUofItems.map((cert) => (
                    <CertItemCard
                      key={cert.id}
                      cert={cert}
                      editing={editing}
                      onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
            <GuardThirtyTwoHourPanel
              guard={guard}
              editing={editing}
              onAddCertification={onAddCertification}
              onDeleteCertification={onDeleteCertification}
            />
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
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input w-full" />
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input w-full" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
                    <ImagePlus className="w-4 h-4 shrink-0" />
                    <span>Optional: attach scan or photo</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                  </label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
                  )}
                  {formError && <p className="text-xs text-red-400">{formError}</p>}
                  <button type="submit" className="w-full app-button-primary !h-11 !text-sm">
                    Upload credential
                  </button>
                </form>
              )}

              {refresherItems.length === 0 ? (
                <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">No refresher course on file.</p>
              ) : (
                <div className="app-cert-item-stack border-t border-brand-border">
                  {refresherItems.map((cert) => (
                    <CertItemCard
                      key={cert.id}
                      cert={cert}
                      editing={editing}
                      onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
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
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="uber-input w-full" />
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="uber-input w-full" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-brand-text-muted cursor-pointer">
                    <ImagePlus className="w-4 h-4 shrink-0" />
                    <span>Optional: attach scan or photo</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageSelect} />
                  </label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Credential preview" className="w-full max-h-40 object-contain rounded-lg border border-brand-border" />
                  )}
                  {formError && <p className="text-xs text-red-400">{formError}</p>}
                  <button type="submit" className="w-full app-button-primary !h-11 !text-sm">
                    Upload credential
                  </button>
                </form>
              )}

              {otherBsisItems.length === 0 ? (
                <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
                  No other BSIS training on file.
                </p>
              ) : (
                <div className="app-cert-item-stack border-t border-brand-border">
                  {otherBsisItems.map((cert) => (
                    <CertItemCard
                      key={cert.id}
                      cert={cert}
                      editing={editing}
                      onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          </React.Fragment>
        );
      })}
    </div>
  );
}
