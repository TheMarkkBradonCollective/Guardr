import React from 'react';
import type { SecurityGuard } from '../../types';
import { BookOpen, Sparkles } from 'lucide-react';
import { GuardrTag } from '../baseui/GuardrTag';
import {
  STAFF_FOCUS_OPTIONS,
  getStaffDisplayHeadline,
  getStaffProfileSnippet,
  staffProfileHasContent,
} from '../../lib/staffProfile';

export interface StaffProfilePayload {
  headline: string;
  summary: string;
  about: string;
  specialties: string[];
}

interface StaffProfileSectionProps {
  member: Pick<
    SecurityGuard,
    'headline' | 'summary' | 'about' | 'bio' | 'specialties' | 'staffRole'
  >;
  editing?: boolean;
  payload?: StaffProfilePayload;
  onChange?: (patch: Partial<StaffProfilePayload>) => void;
  className?: string;
}

export function StaffProfileSection({
  member,
  editing = false,
  payload,
  onChange,
  className = '',
}: StaffProfileSectionProps) {
  const values: StaffProfilePayload = payload ?? {
    headline: member.headline ?? '',
    summary: member.summary ?? '',
    about: member.about ?? member.bio ?? '',
    specialties: member.specialties ?? [],
  };

  const toggleFocus = (area: string) => {
    if (!onChange) return;
    const set = new Set(values.specialties);
    if (set.has(area)) set.delete(area);
    else set.add(area);
    onChange({ specialties: [...set] });
  };

  if (!editing && !staffProfileHasContent(member)) {
    return (
      <section className={`staff-profile-section staff-profile-section--empty ${className}`.trim()}>
        <div className="staff-profile-empty-card">
          <Sparkles className="w-4 h-4 text-brand-primary shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-text">Build out this profile</p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Add a headline, short intro, and what you focus on so the team knows who does what.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (editing) {
    return (
      <section className={`staff-profile-section space-y-4 ${className}`.trim()}>
        <p className="uber-label flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-primary" aria-hidden />
          Team profile
        </p>
        <ProfileField
          label="Headline"
          value={values.headline}
          onChange={(headline) => onChange?.({ headline })}
          placeholder="e.g. Director of Platform Operations"
        />
        <ProfileField
          label="Short intro"
          value={values.summary}
          onChange={(summary) => onChange?.({ summary })}
          placeholder="One or two sentences — what you do on the platform and how you help the team."
          multiline
          rows={2}
        />
        <ProfileField
          label="About"
          value={values.about}
          onChange={(about) => onChange?.({ about })}
          placeholder="Background, experience, and what you bring to Guardr. This is what teammates see on your profile."
          multiline
          rows={6}
        />
        <div>
          <p className="uber-label">Focus areas</p>
          <p className="text-xs text-brand-text-muted mt-0.5 mb-2">
            Pick the parts of the platform you work on most.
          </p>
          <div className="flex flex-wrap gap-2">
            {STAFF_FOCUS_OPTIONS.map((area) => {
              const active = values.specialties.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleFocus(area)}
                  className={`staff-profile-focus-chip${active ? ' staff-profile-focus-chip--active' : ''}`}
                >
                  {area}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const headline = getStaffDisplayHeadline(member);
  const snippet = getStaffProfileSnippet(member);
  const aboutText = member.about?.trim() || member.bio?.trim();

  return (
    <section className={`staff-profile-section space-y-4 ${className}`.trim()}>
      <div className="staff-profile-hero-copy">
        <p className="staff-profile-headline">{headline}</p>
        {snippet && snippet !== headline && (
          <p className="staff-profile-summary">{snippet}</p>
        )}
      </div>

      {member.specialties && member.specialties.length > 0 && (
        <div>
          <p className="uber-label text-xs mb-2">Focus areas</p>
          <div className="flex flex-wrap gap-2">
            {member.specialties.map((area) => (
              <GuardrTag key={area} kind="accent" closeable={false}>
                {area}
              </GuardrTag>
            ))}
          </div>
        </div>
      )}

      {aboutText && aboutText !== snippet && (
        <div className="staff-profile-about-card">
          <BookOpen className="w-4 h-4 text-brand-primary shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{aboutText}</p>
        </div>
      )}
    </section>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="uber-label">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="uber-input w-full mt-1 resize-y min-h-[4rem]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="uber-input w-full mt-1"
        />
      )}
    </div>
  );
}
