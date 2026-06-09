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
import { Award, BookOpen, Shield } from 'lucide-react';

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
    category: 'bsis-required',
    title: 'Required to Work (California)',
    subtitle: 'Power to Arrest, Use of Force, and 40-hour BSIS completion — required for Level 2 (Active).',
    icon: BookOpen,
  },
  {
    category: 'bsis-training',
    title: 'BSIS Training Course Certificates',
    subtitle: 'Individual course certs earned while completing the 40-hour requirement.',
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
    subtitle: 'OSHA, CIT, mental health first aid, and other professional development.',
    icon: Award,
  },
];

interface GuardCredentialsPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  onAddCertification?: (cert: Partial<Certification>) => void | Promise<void>;
}

export function GuardCredentialsPanel({
  guard,
  editing,
  onAddCertification,
}: GuardCredentialsPanelProps) {
  const grouped = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const [openSection, setOpenSection] = useState<CertCategory | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [issuer, setIssuer] = useState('');
  const [number, setNumber] = useState('');
  const [state, setState] = useState('CA');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const resetForm = () => {
    setSelectedCatalogId('');
    setIssuer('');
    setNumber('');
    setState('CA');
    setIssueDate('');
    setExpiryDate('');
    setOpenSection(null);
  };

  const submitCert = async (e: React.FormEvent, category: CertCategory) => {
    e.preventDefault();
    if (!onAddCertification || !selectedCatalogId || !issuer.trim() || !number.trim()) return;
    const entry = getCertCatalogEntry(selectedCatalogId);
    if (!entry) return;
    if (entry.requiresState && !state) return;

    await onAddCertification({
      catalogId: entry.id,
      category: entry.category,
      name: entry.name,
      issuer: issuer.trim(),
      number: number.trim(),
      state: entry.requiresState ? state.toUpperCase() : undefined,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
    });
    resetForm();
  };

  return (
    <div className="space-y-4">
      <GuardQualificationPanel guard={guard} />

      <div className="app-card bg-brand-primary/5 border-brand-primary/20">
        <p className="text-sm font-semibold text-brand-primary">Upload credentials</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Upload required BSIS documents to qualify for jobs. Guardr staff may verify uploads — that badge helps clients
          trust your profile but is not required to accept work.
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
              <form onSubmit={(e) => submitCert(e, category)} className="space-y-3 border-t border-brand-border pt-3">
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
                  <div key={cert.id}>
                    <CredentialRow cert={cert} />
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CredentialRow({ cert }: { cert: Certification }) {
  const entry = cert.catalogId ? getCertCatalogEntry(cert.catalogId) : undefined;
  return (
    <div className="p-3 rounded-xl surface-muted flex justify-between gap-3">
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
      <span
        className={`shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border h-fit ${
          cert.status === 'verified'
            ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
            : cert.status === 'rejected'
              ? 'text-red-400 border-red-500/30'
              : 'text-brand-text-muted border-brand-border'
        }`}
      >
        {cert.status === 'verified' ? 'Guardr verified' : cert.status}
      </span>
    </div>
  );
}
