import React, { useState } from 'react';
import {
  Certification,
  Experience,
  GuardEducation,
  GuardInsurancePolicy,
  GUARD_SPECIALTY_OPTIONS,
  GuardWeaponGearId,
  GuardEquipmentGearId,
  JobType,
  SecurityGuard,
} from '../../types';
import { joinTagInput, parseTagInput } from '../../lib/guardResume';
import {
  formatCityLabel,
} from '../../lib/californiaCities';
import { getSelectableCityNamesForGuards } from '../../lib/platformCities';
import { Briefcase, GraduationCap, Plus, BookOpen } from 'lucide-react';
import { GuardCredentialsPanel } from './GuardCredentialsPanel';
import { GuardWeaponGearPanel } from './GuardWeaponGearPanel';
import { GuardEquipmentGearPanel } from './GuardEquipmentGearPanel';
import { AppFormSheet } from '../ui/app/AppFormSheet';

export interface GuardResumeSavePayload {
  headline: string;
  summary: string;
  about: string;
  skills: string[];
  languages: string[];
  serviceAreas: string[];
  specialties: string[];
  yearsExperience?: number;
  availabilityNotes: string;
  hourlyRateRequirement?: number;
  listedWeaponGear?: GuardWeaponGearId[];
  listedEquipmentGear?: GuardEquipmentGearId[];
  jobTypePreferences?: JobType[];
}

interface GuardResumeEditorProps {
  guard: SecurityGuard;
  editing: boolean;
  payload: GuardResumeSavePayload;
  onChange: (patch: Partial<GuardResumeSavePayload>) => void;
  onAddCertification?: (cert: Partial<Certification>) => Promise<import('../../lib/certUniqueness').AddCertificationResult>;
  onDeleteCertification?: (certId: string) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
  onAttachCertificationImage?: (
    certId: string,
    imageUrl: string
  ) => Promise<import('../../lib/certImagePolicy').CertImageMutationResult>;
  onUpdateCertification?: (
    certId: string,
    payload: import('../credentials/CertDetailModal').CertUpdatePayload
  ) => Promise<import('../credentials/CertDetailModal').CertUpdateResult>;
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    payload: import('./GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onSaveInsurance?: (
    policy: Partial<GuardInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onSaveVehicleInsurance?: (
    policy: Partial<import('../../types').GuardVehicleInsurancePolicy> & { guardId: string }
  ) => Promise<void>;
  onReviewInsurance?: (status: 'verified' | 'rejected', rejectionReason?: string) => Promise<void>;
  /** Allow guard card + credential uploads without full profile edit (e.g. pending activation). */
  credentialsEditing?: boolean;
  /** Application intake fields (summary, service areas, specialties, etc.). */
  applicationIntakeEditing?: boolean;
  /** Staff editing a guard profile — enables credential modal edit with staff bypass. */
  staffMode?: boolean;
  onEditCredentialFullPage?: () => void;
}

export function GuardResumeEditor({
  guard,
  editing,
  payload,
  onChange,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onUpdateCertification,
  onAddExperience,
  onAddEducation,
  onSubmitIdentityVerification,
  onSaveInsurance,
  onSaveVehicleInsurance,
  onReviewInsurance,
  credentialsEditing,
  applicationIntakeEditing,
  staffMode = false,
  onEditCredentialFullPage,
}: GuardResumeEditorProps) {
  const credEditing = credentialsEditing ?? editing;
  const intakeEditing = applicationIntakeEditing ?? editing;
  const selectableGuardCities = getSelectableCityNamesForGuards();
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);

  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDescription, setExpDescription] = useState('');

  const [eduSchool, setEduSchool] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduPeriod, setEduPeriod] = useState('');
  const [eduDescription, setEduDescription] = useState('');

  const toggleSpecialty = (value: string) => {
    const set = new Set(payload.specialties);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ specialties: [...set] });
  };

  const toggleServiceArea = (city: string) => {
    const label = formatCityLabel(city);
    const set = new Set(payload.serviceAreas.map(formatCityLabel));
    if (set.has(label)) set.delete(label);
    else set.add(label);
    onChange({ serviceAreas: [...set].sort((a, b) => a.localeCompare(b)) });
  };

  const submitExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddExperience || !expTitle.trim() || !expCompany.trim()) return;
    await onAddExperience({
      title: expTitle.trim(),
      company: expCompany.trim(),
      period: expPeriod.trim() || 'Present',
      description: expDescription.trim(),
    });
    setExpTitle('');
    setExpCompany('');
    setExpPeriod('');
    setExpDescription('');
    setShowAddExp(false);
  };

  const submitEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddEducation || !eduSchool.trim()) return;
    await onAddEducation({
      school: eduSchool.trim(),
      degree: eduDegree.trim(),
      field: eduField.trim(),
      period: eduPeriod.trim(),
      description: eduDescription.trim(),
    });
    setEduSchool('');
    setEduDegree('');
    setEduField('');
    setEduPeriod('');
    setEduDescription('');
    setShowAddEdu(false);
  };

  return (
    <div className="space-y-5">
      <section className="app-form-section space-y-4">
        <p className="uber-label flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-primary" />
          Professional resume
        </p>
        <ResumeField
          label="Headline"
          value={payload.headline}
          editing={editing}
          onChange={(v) => onChange({ headline: v })}
          placeholder="e.g. Executive Protection Specialist"
        />
        <ResumeField
          label="Summary"
          value={payload.summary}
          editing={intakeEditing}
          onChange={(v) => onChange({ summary: v })}
          placeholder="One or two sentences clients see in search results"
          multiline
          rows={2}
        />
        <ResumeField
          label="Full description"
          value={payload.about}
          editing={editing}
          onChange={(v) => onChange({ about: v })}
          placeholder="Your full resume — background, approach, sites you've worked, what you're looking for. Build this over time."
          multiline
          rows={8}
        />
        <ResumeField
          label="Years of experience"
          value={payload.yearsExperience != null ? String(payload.yearsExperience) : ''}
          editing={intakeEditing}
          onChange={(v) => {
            const parsed = v ? parseInt(v, 10) : NaN;
            onChange({ yearsExperience: Number.isFinite(parsed) ? Math.max(0, parsed) : undefined });
          }}
          type="number"
          min={0}
        />
        <ResumeField
          label="Skills"
          value={editing ? joinTagInput(payload.skills) : formatSkillList(payload.skills)}
          editing={editing}
          onChange={(v) => onChange({ skills: parseTagInput(v) })}
          placeholder="Surveillance, de-escalation, report writing"
        />
        <ResumeField
          label="Languages"
          value={editing ? joinTagInput(payload.languages) : joinTagInput(payload.languages)}
          editing={editing}
          onChange={(v) => onChange({ languages: parseTagInput(v) })}
          placeholder="English, Spanish"
        />
        <ResumeField
          label="Availability"
          value={payload.availabilityNotes}
          editing={intakeEditing}
          onChange={(v) => onChange({ availabilityNotes: v })}
          placeholder="Nights, weekends, 24hr notice for travel…"
          multiline
          rows={2}
        />
      </section>

      <section className="app-form-section space-y-3">
        <p className="uber-label">Specialties</p>
        <div className="flex flex-wrap gap-2">
          {GUARD_SPECIALTY_OPTIONS.map((opt) => {
            const active = payload.specialties.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                disabled={!intakeEditing}
                onClick={() => toggleSpecialty(opt)}
                className={`chip text-xs ${active ? 'chip-active' : 'chip-inactive'} ${!intakeEditing ? 'opacity-80' : ''}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </section>

      <section className="app-form-section space-y-3">
        <p className="uber-label">Service areas (cities)</p>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {selectableGuardCities.map((city) => {
            const active = payload.serviceAreas.some(
              (area) => formatCityLabel(area).toLowerCase() === city.toLowerCase()
            );
            return (
              <button
                key={city}
                type="button"
                disabled={!intakeEditing}
                onClick={() => toggleServiceArea(city)}
                className={`chip text-xs ${active ? 'chip-active' : 'chip-inactive'} ${!intakeEditing ? 'opacity-80' : ''}`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </section>

      {credEditing && (
        <GuardCredentialsPanel
          guard={guard}
          editing={credEditing}
          staffMode={staffMode}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          onSubmitIdentityVerification={onSubmitIdentityVerification}
          onSaveInsurance={onSaveInsurance}
          onSaveVehicleInsurance={onSaveVehicleInsurance}
          onReviewInsurance={onReviewInsurance}
        />
      )}

      <ExperienceSection
        title="Work experience"
        icon={Briefcase}
        items={guard.experience}
        canAdd={editing && !!onAddExperience}
        onAdd={() => setShowAddExp(true)}
      />

      <ExperienceSection
        title="Education"
        icon={GraduationCap}
        items={(guard.education ?? []).map((e) => ({
          id: e.id,
          title: e.degree ? `${e.degree}${e.field ? ` in ${e.field}` : ''}` : e.field || 'Education',
          company: e.school,
          period: e.period,
          description: e.description ?? '',
        }))}
        canAdd={editing && !!onAddEducation}
        onAdd={() => setShowAddEdu(true)}
      />

      {!credEditing && (
        <GuardCredentialsPanel
          guard={guard}
          editing={credEditing}
          staffMode={staffMode}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
          onUpdateCertification={onUpdateCertification}
          onSubmitIdentityVerification={onSubmitIdentityVerification}
          onSaveInsurance={onSaveInsurance}
          onSaveVehicleInsurance={onSaveVehicleInsurance}
          onReviewInsurance={onReviewInsurance}
          certOverlayNav={
            onEditCredentialFullPage ? { onEditFullPage: onEditCredentialFullPage } : undefined
          }
        />
      )}

      <GuardWeaponGearPanel
        guard={guard}
        editing={intakeEditing}
        selected={payload.listedWeaponGear ?? guard.listedWeaponGear ?? []}
        onChange={(listedWeaponGear) => onChange({ listedWeaponGear })}
      />

      <GuardEquipmentGearPanel
        guard={guard}
        editing={editing}
        selected={payload.listedEquipmentGear ?? guard.listedEquipmentGear ?? []}
        onChange={(listedEquipmentGear) => onChange({ listedEquipmentGear })}
      />

      <AppFormSheet
        open={showAddExp}
        onClose={() => setShowAddExp(false)}
        title="Add work experience"
      >
        <form onSubmit={submitExperience} className="space-y-3">
          <input className="uber-input w-full" placeholder="Job title" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required />
          <input className="uber-input w-full" placeholder="Company / site" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} required />
          <input className="uber-input w-full" placeholder="Period (e.g. 2020 – 2024)" value={expPeriod} onChange={(e) => setExpPeriod(e.target.value)} />
          <textarea className="uber-input w-full resize-none" rows={3} placeholder="What you did, sites, responsibilities…" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} />
          <button type="submit" className="w-full app-button-primary !h-11 !text-sm">Add experience</button>
        </form>
      </AppFormSheet>

      <AppFormSheet
        open={showAddEdu}
        onClose={() => setShowAddEdu(false)}
        title="Add education"
      >
        <form onSubmit={submitEducation} className="space-y-3">
          <input className="uber-input w-full" placeholder="School / academy" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} required />
          <input className="uber-input w-full" placeholder="Degree or program" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
          <input className="uber-input w-full" placeholder="Field of study" value={eduField} onChange={(e) => setEduField(e.target.value)} />
          <input className="uber-input w-full" placeholder="Years" value={eduPeriod} onChange={(e) => setEduPeriod(e.target.value)} />
          <textarea className="uber-input w-full resize-none" rows={2} placeholder="Notes (optional)" value={eduDescription} onChange={(e) => setEduDescription(e.target.value)} />
          <button type="submit" className="w-full app-button-primary !h-11 !text-sm">Add education</button>
        </form>
      </AppFormSheet>
    </div>
  );
}

function formatSkillList(skills: string[]): string {
  return skills.length ? skills.join(' · ') : '—';
}

function ResumeField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  type = 'text',
  min,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="uber-label">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="uber-input w-full mt-1 resize-none"
          />
        ) : (
          <input
            type={type}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="uber-input w-full mt-1"
          />
        )
      ) : (
        <p className="text-sm mt-1 text-brand-text-muted whitespace-pre-wrap">{value || '—'}</p>
      )}
    </div>
  );
}

function ExperienceSection({
  title,
  icon: Icon,
  items,
  canAdd,
  onAdd,
}: {
  title: string;
  icon: typeof Briefcase;
  items: Experience[];
  canAdd: boolean;
  onAdd: () => void;
}) {
  return (
    <section className="app-form-section space-y-3">
      <div className="flex items-center justify-between gap-2 w-full">
        <p className="uber-label flex items-center gap-2">
          <Icon className="w-4 h-4 text-brand-primary" />
          {title}
        </p>
        {canAdd && (
          <button type="button" onClick={onAdd} className="app-button-primary !w-auto !h-8 !px-3 !text-xs gap-1">
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-brand-text-muted text-center py-4">None listed yet — add to build your resume.</p>
        ) : (
          items.map((exp) => (
            <div key={exp.id} className="app-list-subrow">
              <p className="font-semibold text-sm">{exp.title}</p>
              <p className="text-sm text-brand-primary mt-0.5">{exp.company}</p>
              <p className="text-xs text-brand-text-muted mt-1">{exp.period}</p>
              {exp.description && (
                <p className="text-sm text-brand-text-muted mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
