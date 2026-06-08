import React from 'react';
import { SecurityGuard } from '../../types';
import { getVerifiedProfileBadges } from '../../lib/certMatching';
import { CA_REQUIRED_LISTING_IDS, getCertCatalogEntry } from '../../lib/certCatalog';
import { guardMeetsCaListingBaseline } from '../../lib/certMatching';
import { getVerifiedLicensedStates } from '../../lib/guardLicenses';
import { formatStateName } from '../../lib/states';
import { Check, Shield } from 'lucide-react';

interface CertBadgeRowProps {
  guard: SecurityGuard;
  showCaBaseline?: boolean;
}

export function CertBadgeRow({ guard, showCaBaseline = true }: CertBadgeRowProps) {
  const badges = getVerifiedProfileBadges(guard);
  const licensedStates = getVerifiedLicensedStates(guard);
  const caBaselineMet = guardMeetsCaListingBaseline(guard, 'CA');

  const requiredBadges = CA_REQUIRED_LISTING_IDS.filter((id) => id !== 'bsis-guard-card').map((id) => {
    const entry = getCertCatalogEntry(id)!;
    const verified = guard.certifications.some(
      (c) => c.status === 'verified' && (c.catalogId === id || c.name.toLowerCase().includes(entry.name.toLowerCase().slice(0, 10)))
    );
    return { id, shortLabel: entry.shortLabel, verified };
  });

  if (licensedStates.length === 0 && badges.length === 0 && !showCaBaseline) return null;

  return (
    <div className="space-y-3">
      {licensedStates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            Guard Card · {licensedStates.map(formatStateName).join(', ')}
          </span>
        </div>
      )}

      {showCaBaseline && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Required to work (CA)</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredBadges.map(({ id, shortLabel, verified }) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                  verified
                    ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/30'
                    : 'bg-brand-border/20 text-brand-text-muted border-brand-border'
                }`}
              >
                {verified && <Check className="w-3 h-3" />}
                {shortLabel}
              </span>
            ))}
            {caBaselineMet && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary px-2 py-1">
                <Check className="w-3.5 h-3.5" /> CA baseline complete
              </span>
            )}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ catalogId, shortLabel }) => (
              <span
                key={catalogId}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {shortLabel}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
