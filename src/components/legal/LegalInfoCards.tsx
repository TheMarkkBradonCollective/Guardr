import React from 'react';
import { ChevronRight, FileText, Shield } from 'lucide-react';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DOCUMENTS } from '../../lib/legalContent';

interface LegalInfoCardsProps {
  onOpenLegal: (page: LegalPageId) => void;
  className?: string;
}

const CARD_COPY: Record<
  LegalPageId,
  { icon: typeof FileText; title: string; description: string }
> = {
  privacy: {
    icon: Shield,
    title: 'Privacy & data',
    description: 'How we collect, use, and protect your information.',
  },
  terms: {
    icon: FileText,
    title: 'Terms of service',
    description: 'Marketplace rules for clients, guards, and staff.',
  },
};

export function LegalInfoCards({ onOpenLegal, className = '' }: LegalInfoCardsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {(['privacy', 'terms'] as const).map((id) => {
        const { icon: Icon, title, description } = CARD_COPY[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onOpenLegal(id)}
            className="legal-info-card group text-left border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 border border-brand-border bg-brand-bg flex items-center justify-center text-brand-primary group-hover:border-brand-primary/30">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-brand-text">{title}</p>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                  Read {LEGAL_DOCUMENTS[id].title.toLowerCase()}
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
