import React from 'react';
import { ChevronRight, FileText, Scale, Shield } from 'lucide-react';
import type { LegalPageId } from '../../lib/legalContent';
import { LEGAL_DOCUMENTS } from '../../lib/legalContent';

interface LegalInfoCardsProps {
  onOpenLegal: (page: LegalPageId) => void;
  className?: string;
}

const CARD_COPY: Partial<
  Record<LegalPageId, { icon: typeof FileText; title: string; description: string; readLabel?: string }>
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
  'equal-opportunity': {
    icon: Scale,
    title: 'Equal opportunity',
    description: 'How we consider qualified applicants, including veterans and people with disabilities.',
    readLabel: 'Read equal opportunity notice',
  },
};

export function LegalInfoCards({ onOpenLegal, className = '' }: LegalInfoCardsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {(['privacy', 'terms', 'equal-opportunity'] as const).map((id) => {
        const card = CARD_COPY[id];
        if (!card) return null;
        const { icon: Icon, title, description, readLabel } = card;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onOpenLegal(id)}
            className="landing-how-card legal-info-card group text-left w-full"
          >
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-lg border border-brand-border bg-brand-bg-sec flex items-center justify-center text-brand-primary group-hover:border-brand-primary/40 group-hover:bg-brand-primary/6 transition-colors">
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-brand-text tracking-tight">{title}</p>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{description}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                  {readLabel ?? `Read ${LEGAL_DOCUMENTS[id].title.toLowerCase()}`}
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
