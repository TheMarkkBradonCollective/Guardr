import React from 'react';

interface CredentialQuickViewLinksProps {
  onViewFull?: () => void;
  viewFullLabel?: string;
}

/** Footer link on credential quick-view sheets to open the full review page. */
export function CredentialQuickViewLinks({
  onViewFull,
  viewFullLabel = 'View full →',
}: CredentialQuickViewLinksProps) {
  if (!onViewFull) return null;

  return (
    <div className="pt-4 border-t border-brand-border">
      <button
        type="button"
        onClick={onViewFull}
        className="text-xs font-semibold text-brand-primary hover:underline"
      >
        {viewFullLabel}
      </button>
    </div>
  );
}
