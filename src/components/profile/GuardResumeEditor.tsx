import React, { useState } from 'react';
import {
  Certification,
  Experience,
  GuardEducation,
  GUARD_SPECIALTY_OPTIONS,
  SecurityGuard,
} from '../../types';
import { joinTagInput, parseTagInput } from '../../lib/guardResume';
import { US_STATES } from '../../lib/states';
import { Briefcase, GraduationCap, Plus, BookOpen } from 'lucide-react';
import { GuardCardPanel } from './GuardCardPanel';
import { GuardCredentialsPanel } from './GuardCredentialsPanel';
import { GuardIdentityVerificationPanel } from './GuardIdentityVerificationPanel';

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
  onAddExperience?: (exp: Omit<Experience, 'id'>) => void | Promise<void>;
  onAddEducation?: (edu: Omit<GuardEducation, 'id'>) => void | Promise<void>;
  onSubmitIdentityVerification?: (
    payload: import('./GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('./GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  identityVerificationCompact?: boolean;
  /** Allow guard card + credential uploads without full profile edit (e.g. pending activation). */
  credentialsEditing?: boolean;
}

export function GuardResumeEditor({
  guard,
  editing,
  payload,
  onChange,
  onAddCertification,
  onDeleteCertification,
  onAttachCertificationImage,
  onAddExperience,
  onAddEducation,
  onSubmitIdentityVerification,
  identityVerificationCompact = false,
  credentialsEditing,
}: GuardResumeEditorProps) {
  const credEditing = credentialsEditing ?? editing;
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

  const toggleServiceArea = (code: string) => {
    const set = new Set(payload.serviceAreas);
    if (set.has(code)) set.delete(code);
    else set.add(code);
    onChange({ serviceAreas: [...set] });
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
          editing={editing}
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
          editing={editing}
          onChange={(v) => onChange({ yearsExperience: v ? parseInt(v, 10) || undefined : undefined })}
          type="number"
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
          editing={editing}
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
                disabled={!editing}
                onClick={() => toggleSpecialty(opt)}
                className={`chip text-xs ${active ? 'chip-active' : 'chip-inactive'} ${!editing ? 'opacity-80' : ''}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </section>

      <section className="app-form-section space-y-3">
        <p className="uber-label">Service areas (states)</p>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {US_STATES.map(({ code, name }) => {
            const active = payload.serviceAreas.includes(code);
            return (
              <button
                key={code}
                type="button"
                disabled={!editing}
                onClick={() => toggleServiceArea(code)}
                className={`chip text-xs ${active ? 'chip-active' : 'chip-inactive'} ${!editing ? 'opacity-80' : ''}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </section>

      {!guard.isStaff && onSubmitIdentityVerification && (
        <GuardIdentityVerificationPanel
          guard={guard}
          onSubmit={onSubmitIdentityVerification}
          compact={identityVerificationCompact}
        />
      )}

      {!guard.isStaff && (
        <GuardCardPanel
          guard={guard}
          editing={credEditing}
          onAddCertification={onAddCertification}
          onDeleteCertification={onDeleteCertification}
          onAttachCertificationImage={onAttachCertificationImage}
        />
      )}

      <GuardCredentialsPanel
        guard={guard}
        editing={credEditing}
        onAddCertification={onAddCertification}
        onDeleteCertification={onDeleteCertification}
        onAttachCertificationImage={onAttachCertificationImage}
      />

      <ExperienceSection
        title="Work experience"
        icon={Briefcase}
        items={guard.experience}
        canAdd={editing && !!onAddExperience}
        onAdd={() => setShowAddExp((v) => !v)}
        showForm={showAddExp}
        form={
          <form onSubmit={submitExperience} className="space-y-3 border-t border-brand-border pt-3">
            <input className="uber-input w-full" placeholder="Job title" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required />
            <input className="uber-input w-full" placeholder="Company / site" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} required />
            <input className="uber-input w-full" placeholder="Period (e.g. 2020 – 2024)" value={expPeriod} onChange={(e) => setExpPeriod(e.target.value)} />
            <textarea className="uber-input w-full resize-none" rows={3} placeholder="What you did, sites, responsibilities…" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} />
            <button type="submit" className="w-full app-button-primary !h-11 !text-sm">Add experience</button>
          </form>
        }
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
        onAdd={() => setShowAddEdu((v) => !v)}
        showForm={showAddEdu}
        form={
          <form onSubmit={submitEducation} className="space-y-3 border-t border-brand-border pt-3">
            <input className="uber-input w-full" placeholder="School / academy" value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} required />
            <input className="uber-input w-full" placeholder="Degree or program" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
            <input className="uber-input w-full" placeholder="Field of study" value={eduField} onChange={(e) => setEduField(e.target.value)} />
            <input className="uber-input w-full" placeholder="Years" value={eduPeriod} onChange={(e) => setEduPeriod(e.target.value)} />
            <textarea className="uber-input w-full resize-none" rows={2} placeholder="Notes (optional)" value={eduDescription} onChange={(e) => setEduDescription(e.target.value)} />
            <button type="submit" className="w-full app-button-primary !h-11 !text-sm">Add education</button>
          </form>
        }
      />
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
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
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
  showForm,
  form,
}: {
  title: string;
  icon: typeof Briefcase;
  items: Experience[];
  canAdd: boolean;
  onAdd: () => void;
  showForm: boolean;
  form: React.ReactNode;
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
      {showForm && form}
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
