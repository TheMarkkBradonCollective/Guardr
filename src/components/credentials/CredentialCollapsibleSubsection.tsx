import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CredentialCollapsibleSubsectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function CredentialCollapsibleSubsection({
  title,
  open,
  onToggle,
  actions,
  children,
}: CredentialCollapsibleSubsectionProps) {
  return (
    <div className="border-t border-brand-border pt-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 text-brand-text-muted transition-transform ${
              open ? '' : '-rotate-90'
            }`}
            strokeWidth={2}
          />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            {title}
          </p>
        </button>
        {actions}
      </div>
      {open && children}
    </div>
  );
}
