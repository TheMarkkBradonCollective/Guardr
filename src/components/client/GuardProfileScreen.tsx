import React, { useMemo } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { getGuardHistoryWithClient } from '../../lib/guardDirectory';
import { formatShiftRange } from '../../lib/dates';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Check,
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

  const verifiedCerts = guard.certifications.filter((c) => c.status === 'verified');

  return (
    <div className="h-full flex flex-col overflow-hidden client-content-shell">
      <div className="guard-scroll-panel flex-1">
        <div className="px-4 py-4 space-y-6 pb-28">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to directory
          </button>

          <div className="app-card p-0 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-brand-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                  {guard.avatar ? (
                    <img src={guard.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 text-brand-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold">{guard.name}</h1>
                  <p className="text-sm text-brand-text-muted mt-1">Badge #{guard.badgeNumber}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="w-4 h-4 fill-brand-primary text-brand-primary" />
                      {guard.rating.toFixed(1)}
                    </span>
                    <span className="text-brand-text-muted">{guard.jobsCompleted} completed shifts</span>
                    {guard.isArmed && (
                      <span className="text-brand-primary font-medium">Armed certified</span>
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

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-text-muted">About</h2>
            <div className="app-card">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {guard.bio || 'This guard has not added a bio yet.'}
              </p>
            </div>
          </section>

          {guard.experience.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Experience
              </h2>
              <div className="space-y-3">
                {guard.experience.map((exp) => (
                  <div key={exp.id} className="app-card">
                    <p className="font-semibold">{exp.title}</p>
                    <p className="text-sm text-brand-primary mt-0.5">{exp.company}</p>
                    <p className="text-xs text-brand-text-muted mt-1">{exp.period}</p>
                    <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {verifiedCerts.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-brand-text-muted flex items-center gap-2">
                <Award className="w-4 h-4" />
                Certifications
              </h2>
              <div className="space-y-2">
                {verifiedCerts.map((cert) => (
                  <div key={cert.id} className="app-card flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{cert.name}</p>
                      <p className="text-xs text-brand-text-muted mt-0.5">{cert.issuer}</p>
                      {cert.state && (
                        <p className="text-xs text-brand-text-muted">{cert.state} license</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-brand-primary shrink-0">Verified</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-brand-text-muted">Your history with {guard.name.split(' ')[0]}</h2>
            {history.length === 0 ? (
              <div className="app-card text-sm text-brand-text-muted">
                You have not worked with this guard yet. Request them directly for your next assignment.
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
                    <p className="text-sm text-brand-primary mt-2">
                      {formatShiftRange(item.startDate, item.endDate)}
                    </p>
                    {item.ratingGiven != null && (
                      <p className="text-xs text-brand-text-muted mt-2">
                        Your rating: {item.ratingGiven}/5
                        {item.reviewText ? ` — "${item.reviewText}"` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => onRequestGuard(guard)}
          className="w-full uber-button-sage"
        >
          Request {guard.name.split(' ')[0]} for a shift
        </button>
      </div>
    </div>
  );
}
