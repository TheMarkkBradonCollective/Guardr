import React, { useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import {
  BSIS_EMPLOYER_CERT_NOTE,
  BSIS_OFFICIAL_TRAINING_URL,
  BSIS_TERMINOLOGY_NOTE,
  GUARD_ACTIVATION_REQUIREMENTS,
  MARKETPLACE_ELIGIBILITY_WHY_BODY,
  MARKETPLACE_ELIGIBILITY_WHY_POINTS,
  MARKETPLACE_ELIGIBILITY_WHY_TITLE,
  REQUIREMENT_KEY_TO_CREDENTIAL_LINK_KEY,
  getContinuingEducationPackageCourses,
} from '../../lib/guardBsisActivationRequirements';
import {
  credentialLinksForCityLabel,
  resolveCredentialLinksForGuard,
  resolveGuardCredentialCityName,
  type CredentialLinkKey,
  type ResolvedCredentialLink,
} from '../../lib/cityCredentialLinks';
import type { SecurityGuard } from '../../types';
import { GuardCredentialResourceLinkList } from './GuardCredentialResourceLinkList';

interface GuardBsisRequirementsReferenceProps {
  defaultOpen?: boolean;
  guard?: SecurityGuard | null;
}

export function GuardBsisRequirementsReference({
  defaultOpen = false,
  guard,
}: GuardBsisRequirementsReferenceProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [whyOpen, setWhyOpen] = useState(false);
  const ceCourses = getContinuingEducationPackageCourses();

  const resolvedLinks = guard
    ? resolveCredentialLinksForGuard(guard)
    : null;
  const cityLabel = guard ? credentialLinksForCityLabel(resolveGuardCredentialCityName(guard)) : null;

  const linksForRequirement = (requirementKey: string): ResolvedCredentialLink[] => {
    if (!resolvedLinks) return [];
    const linkKey = REQUIREMENT_KEY_TO_CREDENTIAL_LINK_KEY[requirementKey] as CredentialLinkKey | undefined;
    if (!linkKey) return [];
    return resolvedLinks[linkKey] ?? [];
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-brand-border bg-brand-bg-sec/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setWhyOpen((value) => !value)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg-sec transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-brand-primary shrink-0" />
          <span className="flex-1 text-sm font-semibold text-brand-text">{MARKETPLACE_ELIGIBILITY_WHY_TITLE}</span>
          <ChevronDown
            className={`w-4 h-4 text-brand-text-muted shrink-0 transition-transform ${whyOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {whyOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-brand-border pt-3">
            <p className="text-xs text-brand-text-muted leading-relaxed">{MARKETPLACE_ELIGIBILITY_WHY_BODY}</p>
            <ul className="space-y-2">
              {MARKETPLACE_ELIGIBILITY_WHY_POINTS.map((point) => (
                <li key={point.title} className="text-xs leading-relaxed">
                  <span className="font-semibold text-brand-text">{point.title}</span>
                  <span className="text-brand-text-muted"> — {point.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-bg-sec/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg-sec transition-colors"
        >
          <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
          <span className="flex-1 text-sm font-semibold text-brand-text">
            What guards need — California BSIS + Guardr
          </span>
          <ChevronDown
            className={`w-4 h-4 text-brand-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="px-4 pb-4 space-y-4 border-t border-brand-border pt-3">
            {cityLabel && resolvedLinks && (
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Resource links below are tailored to your primary service area ({cityLabel}). City-specific
                links appear first; platform defaults are listed as alternates.
              </p>
            )}
            <p className="text-xs text-brand-text-muted leading-relaxed">{BSIS_TERMINOLOGY_NOTE}</p>
            <ol className="space-y-3">
              {GUARD_ACTIVATION_REQUIREMENTS.map((item, index) => {
                const itemLinks = linksForRequirement(item.key);
                return (
                  <li key={item.key} className="text-xs leading-relaxed">
                    <span className="font-semibold text-brand-text">{index + 1}. {item.label}</span>
                    <span className="text-brand-text-muted"> — {item.detail}</span>
                    {itemLinks.length > 0 && (
                      <GuardCredentialResourceLinkList links={itemLinks} className="mt-1.5" />
                    )}
                  </li>
                );
              })}
            </ol>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
                32-hour CE package courses (9 certificates)
              </p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {ceCourses.map((course) => (
                  <li key={course.catalogId} className="text-xs text-brand-text-muted">
                    <span className="text-brand-text">{course.name}</span>
                    {course.hoursLabel ? ` — ${course.hoursLabel}` : ''}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-brand-text-muted leading-relaxed">{BSIS_EMPLOYER_CERT_NOTE}</p>
            <a
              href={BSIS_OFFICIAL_TRAINING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
            >
              Official BSIS guard training regulation
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
