import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardHistoryWithClient } from '../../lib/guardDirectory';
import {
  certDisplayName,
  formatServiceAreas,
  formatSkillList,
  getGuardDisplayHeadline,
  getGuardDisplaySummary,
} from '../../lib/guardResume';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import { CERT_CATEGORY_LABELS, CertCategory } from '../../lib/certCatalog';
import { CredentialStatusBadges } from '../guard/CredentialStatusBadge';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { formatStateName } from '../../lib/states';
import { formatShiftRange } from '../../lib/dates';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  Shield,
  Star,
} from 'lucide-react';

interface GuardProfileScreenProps {
  guard: SecurityGuard;
  clientId: string;
  requests: SecurityRequest[];
  onBack: () => void;
  onRequestGuard: (guard: SecurityGuard) => void;
}

const STATUS_LABEL: Record<SecurityRequest['status'], string> = {
  draft: 'Draft',
  'pending-review': 'Pending',
  open: 'Open',
  accepted: 'Scheduled',
  'in-progress': 'In progress',
  completed: 'Completed',
  closed: 'Closed',
};

export function GuardProfileScreen({
  guard,
  clientId,
  requests,
  onBack,
  onRequestGuard,
}: GuardProfileScreenProps) {
  const history = useMemo(
    () => getGuardHistoryWithClient(guard.id, clientId, requests),
    [guard.id, clientId, requests]
  );

  const groupedCerts = useMemo(() => groupGuardCertsByCategory(guard), [guard]);
  const aboutText = guard.about?.trim() || guard.bio?.trim();

  const credentialSections: CertCategory[] = [
    'guard-card',
    'bsis-training',
    'bsis-permit',
    'medical',
    'fema',
    'security-advanced',
    'industry',
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden client-content-shell">
      <div className="guard-scroll-panel flex-1">
        <div className="px-4 py-4 space-y-6 pb-28 max-w-3xl mx-auto">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to directory
          </button>

          {/* Hero */}
          <div className="app-card p-0 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-2xl bg-brand-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                  {guard.avatar ? (
                    <img src={guard.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-10 h-10 text-brand-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold">{guard.name}</h1>
                  <p className="text-base text-brand-primary font-medium mt-1">{getGuardDisplayHeadline(guard)}</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">{getGuardDisplaySummary(guard)}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="w-4 h-4 fill-brand-primary text-brand-primary" />
                      {guard.rating.toFixed(1)}
                    </span>
                    <span className="text-brand-text-muted">{guard.jobsCompleted} shifts with Guardr</span>
                    {guard.yearsExperience != null && guard.yearsExperience > 0 && (
                      <span className="text-brand-text-muted">{guard.yearsExperience}+ years experience</span>
                    )}
                    {guard.backgroundChecked && (
                      <span className="inline-flex items-center gap-1 text-brand-primary">
                        <Check className="w-3.5 h-3.5" />
                        Background checked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CertBadgeRow guard={guard} />

          {/* Full description */}
          {aboutText && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Full profile
              </h2>
              <div className="app-card">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aboutText}</p>
              </div>
            </section>
          )}

          {/* Quick facts */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guard.skills && guard.skills.length > 0 && (
              <FactCard label="Skills" value={formatSkillList(guard.skills)} />
            )}
            {guard.languages && guard.languages.length > 0 && (
              <FactCard label="Languages" value={guard.languages.join(', ')} />
            )}
            {guard.serviceAreas && guard.serviceAreas.length > 0 && (
              <FactCard label="Service areas" value={formatServiceAreas(guard.serviceAreas)} icon={MapPin} />
            )}
            {guard.availabilityNotes && (
              <FactCard label="Availability" value={guard.availabilityNotes} icon={Clock} />
            )}
          </section>

          {guard.specialties && guard.specialties.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {guard.specialties.map((s) => (
                  <span key={s} className="chip chip-active text-xs">{s}</span>
                ))}
              </div>
            </section>
          )}

          {credentialSections.map((category) => {
            const items = (groupedCerts[category] ?? []).filter((c) => c.status !== 'rejected');
            if (items.length === 0) return null;
            return (
              <section key={category} className="space-y-2">
                <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                  {category === 'guard-card' ? <Shield className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  {CERT_CATEGORY_LABELS[category]}
                </h2>
                <div className="space-y-2">
                  {items.map((cert) => (
                    <div key={cert.id} className="app-card flex justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{certDisplayName(cert)}</p>
                        <p className="text-xs text-brand-text-muted mt-1">
                          {cert.state ? `${formatStateName(cert.state)} · ` : ''}{cert.issuer}
                        </p>
                      </div>
                      <CredentialStatusBadges cert={cert} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {guard.experience.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Work experience
              </h2>
              <div className="space-y-3">
                {guard.experience.map((exp) => (
                  <div key={exp.id} className="app-card">
                    <p className="font-semibold">{exp.title}</p>
                    <p className="text-sm text-brand-primary mt-0.5">{exp.company}</p>
                    <p className="text-xs text-brand-text-muted mt-1">{exp.period}</p>
                    <p className="text-sm text-brand-text-muted mt-2 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {guard.education && guard.education.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Education
              </h2>
              <div className="space-y-3">
                {guard.education.map((edu) => (
                  <div key={edu.id} className="app-card">
                    <p className="font-semibold">{edu.school}</p>
                    <p className="text-sm text-brand-primary mt-0.5">
                      {[edu.degree, edu.field].filter(Boolean).join(' · ') || 'Program'}
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">{edu.period}</p>
                    {edu.description && (
                      <p className="text-sm text-brand-text-muted mt-2">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-text-muted">Your history with {guard.name.split(' ')[0]}</h2>
            {history.length === 0 ? (
              <div className="app-card text-sm text-brand-text-muted">
                You have not worked with this guard on Guardr yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.requestId} className="app-card">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <span className="text-xs text-brand-text-muted shrink-0">{STATUS_LABEL[item.status]}</span>
                    </div>
                    <p className="text-xs text-brand-text-muted mt-1">{item.location}</p>
                    <p className="text-sm text-brand-primary mt-2">{formatShiftRange(item.startDate, item.endDate)}</p>
                    {item.ratingGiven != null && (
                      <p className="text-xs text-brand-text-muted mt-2">
                        Your rating: {item.ratingGiven}/5{item.reviewText ? ` — "${item.reviewText}"` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl max-w-3xl mx-auto w-full">
        <button
          type="button"
          onClick={() => onRequestGuard(guard)}
          className="w-full uber-button-sage"
        >
          Send assignment request to {guard.name.split(' ')[0]}
        </button>
        <p className="text-center text-xs text-brand-text-muted mt-2">
          Separate from posting a general job to all guards
        </p>
      </div>
    </div>
  );
}

function FactCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof MapPin;
}) {
  return (
    <div className="app-card">
      <p className="text-xs font-semibold text-brand-text-muted flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </p>
      <p className="text-sm mt-1.5 leading-relaxed">{value}</p>
    </div>
  );
}
