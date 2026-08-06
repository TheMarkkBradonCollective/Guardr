import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import {
  formatCredentialLinkDisplay,
  type ResolvedCredentialLink,
} from '../../lib/cityCredentialLinks';

interface GuardCredentialResourceLinkListProps {
  links: ResolvedCredentialLink[];
  /** Compact layout for inline use inside checklist steps. */
  compact?: boolean;
  className?: string;
}

function LinkRow({
  link,
  compact,
  emphasized,
}: {
  link: ResolvedCredentialLink;
  compact: boolean;
  emphasized: boolean;
}) {
  const textClass = emphasized
    ? compact
      ? 'text-xs font-semibold text-brand-primary'
      : 'text-xs font-semibold text-brand-primary'
    : compact
      ? 'text-[11px] text-brand-text-muted'
      : 'text-xs text-brand-text-muted';

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 hover:underline ${textClass} hover:text-brand-primary`}
    >
      <span>{formatCredentialLinkDisplay(link)}</span>
      <ExternalLink className={compact ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
    </a>
  );
}

export function GuardCredentialResourceLinkList({
  links,
  compact = false,
  className = '',
}: GuardCredentialResourceLinkListProps) {
  const [open, setOpen] = useState(false);

  if (links.length === 0) return null;

  if (links.length === 1) {
    return (
      <div className={`mt-2 ${className}`}>
        <LinkRow link={links[0]} compact={compact} emphasized />
      </div>
    );
  }

  const summaryLabel = compact ? 'Where to get this' : 'Where to get this credential';

  return (
    <div className={`mt-2 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 text-left hover:underline ${
          compact ? 'text-xs font-semibold text-brand-primary' : 'text-xs font-semibold text-brand-text'
        }`}
        aria-expanded={open}
      >
        <span>{summaryLabel} ({links.length} options)</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className={`space-y-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
          {links.map((link) => (
            <li key={link.url}>
              <LinkRow link={link} compact={compact} emphasized={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
