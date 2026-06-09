import React, { useMemo, useState } from 'react';
import { Certification, SecurityGuard } from '../../types';
import {
  CERT_CATEGORY_LABELS,
  CertCategory,
  getCertCatalogEntry,
  getCertsByCategory,
} from '../../lib/certCatalog';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import { formatStateName, US_STATES } from '../../lib/states';
import { GuardQualificationPanel } from '../guard/GuardQualificationPanel';
import { Award, BookOpen, ImagePlus, Shield, Trash2 } from 'lucide-react';

const CREDENTIAL_SECTIONS: {
  category: CertCategory;
  title: string;
  subtitle: string;
  icon: typeof Shield;
}[] = [
  {
    category: 'guard-card',
    title: 'BSIS Guard Card',
    subtitle: 'State license — upload a valid card to reach Level 1. Guardr verification is a trust badge for clients.',
    icon: Shield,
  },
  {
    category: 'bsis-training',
    title: 'BSIS Training',
    subtitle:
      'Required for Level 2: 8-hour PTA/UOF (2-part) and the 32-hour block. You can also add any other BSIS or training certs you hold — more is better for clients.',
    icon: BookOpen,
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

interface GuardCredentialsPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => void | Promise<void>;
  onDeleteCertification?: (certId: string) => void | Promise<void>;
}

export function GuardCredentialsPanel({
  guard,
  editing,
  onAddCertification,
  onDeleteCertification,
}: GuardCredentialsPanelProps) {
  const grouped = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const [openSection, setOpenSection] = useState<CertCategory | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [customCertName, setCustomCertName] = useState('');

  const resetForm = () => {
    setSelectedCatalogId('');
    setCustomCertName('');
    setIssuer('');
    setNumber('');
    setState('CA');
    setIssueDate('');
    setExpiryDate('');
    setImageUrl(undefined);
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
    if (!onAddCertification || !selectedCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(selectedCatalogId);
    if (!entry) return;
    if (entry.requiresState && !state) return;
    const isOther = selectedCatalogId === 'other-credential';
    if (isOther && !customCertName.trim()) return;

    await onAddCertification({
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
    resetForm();
  };

  const handleDelete = async (certId: string) => {
    if (!onDeleteCertification) return;
    if (!window.confirm('Remove this credential from your profile?')) return;
    await onDeleteCertification(certId);
  };

  return (
    <div className="space-y-4">
      <GuardQualificationPanel guard={guard} />

      <div className="app-card bg-brand-primary/5 border-brand-primary/20">
        <p className="text-sm font-semibold text-brand-primary">Upload credentials</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Upload credentials for the Level 1/2 pathway, then add any others you hold — permits, medical, extra training,
          and more. Guardr verification is a trust badge for clients, not required to accept work. Delete and re-upload to change details.
        </p>
      </div>

      {CREDENTIAL_SECTIONS.map(({ category, title, subtitle, icon: Icon }) => {
        const items = grouped[category] ?? [];
        const catalogOptions = getCertsByCategory(category);
        const isOpen = openSection === category;

        return (
          <section key={category} className="app-card space-y-3">
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
                  className="shrink-0 px-3 py-1.5 rounded-full bg-brand-primary text-brand-accent-text text-xs font-semibold"
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
                <button type="submit" className="w-full uber-button-sage h-11 text-sm">
                  Upload credential
                </button>
              </form>
            )}

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-xs text-brand-text-muted text-center py-3">
                  No {CERT_CATEGORY_LABELS[category].toLowerCase()} on file.
                </p>
              ) : (
                items.map((cert) => (
                  <CredentialRow
                    key={cert.id}
                    cert={cert}
                    editing={editing}
                    onDelete={onDeleteCertification ? () => handleDelete(cert.id) : undefined}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CredentialRow({
  cert,
  editing,
  onDelete,
}: {
  cert: Certification;
  editing: boolean;
  onDelete?: () => void;
}) {
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;
  return (
    <div className="p-3 rounded-xl surface-muted flex justify-between gap-3">
      <div className="min-w-0 flex gap-3">
        {cert.imageUrl && (
          <img
            src={cert.imageUrl}
            alt={`${cert.name} document`}
            className="w-14 h-14 rounded-lg object-cover border border-brand-border shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm">{entry?.name ?? cert.name}</p>
          <p className="text-xs text-brand-text-muted mt-1">
            {cert.state ? `${formatStateName(cert.state)} · ` : ''}
            {cert.issuer} · #{cert.number}
          </p>
          {cert.expiryDate && (
            <p className="text-xs text-brand-text-muted">Expires {cert.expiryDate}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span
          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border h-fit ${
            cert.status === 'verified'
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : cert.status === 'rejected'
                ? 'text-red-400 border-red-500/30'
                : 'text-brand-text-muted border-brand-border'
          }`}
        >
          {cert.status === 'verified' ? 'Guardr verified' : cert.status}
        </span>
        {editing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-400 flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
