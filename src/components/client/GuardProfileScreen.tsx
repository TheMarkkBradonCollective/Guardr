import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardHistoryWithClient } from '../../lib/guardDirectory';
import {
  formatServiceAreas,
  formatSkillList,
  getGuardDisplayHeadline,
  getGuardDisplaySummary,
} from '../../lib/guardResume';
import { groupGuardCertsByCategory } from '../../lib/certMatching';
import { CERT_CATEGORY_LABELS, CertCategory } from '../../lib/certCatalog';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertItemCard } from '../credentials/CertItemCard';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { formatShiftRange } from '../../lib/dates';
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
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

          <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-4 overflow-hidden p-0">
            <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
              <div className="flex items-start gap-4">
                <ProfileAvatar src={guard.avatar} name={guard.name} size="2xl" rounded="xl" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold">{guard.name}</h1>
                  <p className="text-base text-brand-primary font-medium mt-1">{getGuardDisplayHeadline(guard)}</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">{getGuardDisplaySummary(guard)}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                    <WfMetricTile label="Rating" value={guard.rating.toFixed(1)} accent />
                    <WfMetricTile label="Jobs" value={guard.jobsCompleted} />
                    {guard.yearsExperience != null && guard.yearsExperience > 0 && (
                      <WfMetricTile label="Experience" value={`${guard.yearsExperience}+ yrs`} />
                    )}
                  </div>
                  {guard.backgroundChecked && (
                    <p className="inline-flex items-center gap-1 text-sm text-brand-primary mt-3">
                      <Check className="w-4 h-4" />
                      Background checked
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CertBadgeRow guard={guard} />

          {aboutText && (
            <section>
              <WfSectionHeader title="Full profile" className="mb-2" />
              <div className="wf-list-card flex-col items-stretch !flex !flex-col">
                <BookOpen className="w-4 h-4 text-brand-primary mb-2" />
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aboutText}</p>
              </div>
            </section>
          )}

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
            <section>
              <WfSectionHeader title="Specialties" className="mb-2" />
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
              <section key={category}>
                <div className="flex items-center gap-2 mb-2">
                  {category === 'guard-card' ? <Shield className="w-4 h-4 text-brand-text-muted" /> : <Award className="w-4 h-4 text-brand-text-muted" />}
                  <h2 className="app-section-title mb-0">{CERT_CATEGORY_LABELS[category]}</h2>
                </div>
                <div className="app-cert-item-stack !pt-0">
                  {items.map((cert) => (
                    <CertItemCard key={cert.id} cert={cert} guardName={guard.name} />
                  ))}
                </div>
              </section>
            );
          })}

          {guard.experience.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-brand-text-muted" />
                <h2 className="app-section-title mb-0">Work experience</h2>
              </div>
              <div className="space-y-3">
                {guard.experience.map((exp) => (
                  <div key={exp.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <p className="font-semibold">{exp.title}</p>
                    <p className="text-sm text-brand-primary">{exp.company}</p>
                    <p className="text-xs text-brand-text-muted">{exp.period}</p>
                    <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {guard.education && guard.education.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-brand-text-muted" />
                <h2 className="app-section-title mb-0">Education</h2>
              </div>
              <div className="space-y-3">
                {guard.education.map((edu) => (
                  <div key={edu.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <p className="font-semibold">{edu.school}</p>
                    <p className="text-sm text-brand-primary">
                      {[edu.degree, edu.field].filter(Boolean).join(' · ') || 'Program'}
                    </p>
                    <p className="text-xs text-brand-text-muted">{edu.period}</p>
                    {edu.description && (
                      <p className="text-sm text-brand-text-muted">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <WfSectionHeader title={`Your history with ${guard.name.split(' ')[0]}`} className="mb-2" />
            {history.length === 0 ? (
              <div className="wf-list-card text-sm text-brand-text-muted justify-center">
                You have not worked with this guard on Guardr yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div key={item.requestId} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <WfBadge className="shrink-0">{STATUS_LABEL[item.status]}</WfBadge>
                    </div>
                    <p className="text-xs text-brand-text-muted">{item.location}</p>
                    <p className="text-sm text-brand-primary">{formatShiftRange(item.startDate, item.endDate)}</p>
                    {item.ratingGiven != null && (
                      <p className="text-xs text-brand-text-muted">
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
          className="app-button-primary"
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
    <div className="wf-metric-tile">
      <p className="wf-metric-label flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </p>
      <p className="wf-metric-value text-base leading-relaxed">{value}</p>
    </div>
  );
}
