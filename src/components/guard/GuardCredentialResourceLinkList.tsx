import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ResolvedCredentialLink } from '../../lib/cityCredentialLinks';

interface GuardCredentialResourceLinkListProps {
  links: ResolvedCredentialLink[];
  /** Compact layout for inline use inside checklist steps. */
  compact?: boolean;
  className?: string;
}

export function GuardCredentialResourceLinkList({
  links,
  compact = false,
  className = '',
}: GuardCredentialResourceLinkListProps) {
  if (links.length === 0) return null;

  const primary = links[0];
  const secondary = links.slice(1);

  if (compact) {
    return (
      <div className={`space-y-1.5 mt-2 ${className}`}>
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
        >
          {primary.label || 'Get this credential'}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
        {secondary.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {secondary.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand-text-muted hover:text-brand-primary hover:underline"
              >
                {link.label || 'Alternate resource'}
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        {primary.source === 'city' ? primary.label || 'Local resource' : primary.label || 'Get this credential'}
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>
      {secondary.length > 0 && (
        <ul className="space-y-1">
          {secondary.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-primary hover:underline"
              >
                {link.label || 'Alternate resource'}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
