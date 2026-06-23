import React, { useState, useCallback } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LifeBuoy,
  Shield,
  Users,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { MarkdownDoc } from './MarkdownDoc';
import { parseGuide, type GuideSection, type GuideSubsection } from '../../lib/guideParser';
import { AppScreen, AppScreenTitle, AppSubScreenHeader } from '../ui/app/AppPrimitives';

// ── Section metadata ──────────────────────────────────────────────────────────

interface SectionMeta {
  icon: React.ElementType;
  description: string;
  audience?: 'guard' | 'client' | 'staff';
}

const SECTION_META: Record<string, SectionMeta> = {
  'job-status-lifecycle': {
    icon: Activity,
    description: 'All job statuses, what each one means, and how jobs move through the platform.',
  },
  'client-workflow': {
    icon: Building2,
    description: 'Post jobs, pay, approve guards, confirm coverage, and review reports.',
    audience: 'client',
  },
  'guard-workflow': {
    icon: Shield,
    description: 'Credentials, onboarding, shifts, reports, overtime, and pay.',
    audience: 'guard',
  },
  'staff-workflow': {
    icon: Users,
    description: 'Approvals, operations, payments, disputes, and team management.',
    audience: 'staff',
  },
  'sections-features-reference': {
    icon: BookOpen,
    description: 'What each section of the app contains and how to use it.',
  },
  'end-to-end-sequence-marketplace-job': {
    icon: ArrowRight,
    description: 'A complete marketplace job from posting to final payout, step by step.',
  },
  'quick-reference-by-role': {
    icon: LayoutGrid,
    description: 'Every key action organised by client, guard, and staff.',
  },
  'need-help': {
    icon: LifeBuoy,
    description: 'How to reach support from anywhere in the app.',
  },
};

function getSectionMeta(section: GuideSection): SectionMeta {
  return (
    SECTION_META[section.id] ?? {
      icon: BookOpen,
      description: '',
    }
  );
}

// ── Audience filter type ──────────────────────────────────────────────────────

type AudienceFilter = 'all' | 'guard' | 'client' | 'staff';

// ── Subsection accordion item ─────────────────────────────────────────────────

function SubsectionAccordion({
  sub,
  defaultOpen,
}: {
  sub: GuideSubsection;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-brand-bg-sec/50 transition-colors"
      >
        <span className="text-sm font-semibold text-brand-text leading-snug">{sub.title}</span>
        <ChevronDown
          className={`w-4 h-4 text-brand-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1">
          <MarkdownDoc source={sub.rawContent} />
        </div>
      )}
    </div>
  );
}

// ── Section detail view ───────────────────────────────────────────────────────

function SectionDetail({
  section,
  onBack,
}: {
  section: GuideSection;
  onBack: () => void;
}) {
  const meta = getSectionMeta(section);
  const Icon = meta.icon;

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <AppSubScreenHeader title={section.title} onBack={onBack} />

      {section.topRaw.trim() && (
        <div className="px-4 pt-3 pb-4 border-b border-brand-border">
          <MarkdownDoc source={section.topRaw} />
        </div>
      )}

      {section.subsections.length > 0 && (
        <div className="divide-y-0">
          {section.subsections.map((sub, i) => (
            <SubsectionAccordion key={sub.id} sub={sub} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </AppScreen>
  );
}

// ── Section card (hub list item) ──────────────────────────────────────────────

function SectionCard({
  section,
  onClick,
}: {
  section: GuideSection;
  onClick: () => void;
}) {
  const meta = getSectionMeta(section);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-brand-bg-sec/50 active:bg-brand-bg-sec transition-colors border-b border-brand-border last:border-b-0"
    >
      <span className="w-9 h-9 rounded-xl bg-brand-bg-sec border border-brand-border flex items-center justify-center shrink-0 text-brand-primary">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text leading-snug">{section.title}</p>
        {meta.description && (
          <p className="text-xs text-brand-text-muted mt-0.5 leading-snug line-clamp-2">
            {meta.description}
          </p>
        )}
        {section.subsections.length > 0 && (
          <p className="text-[10px] text-brand-text-muted mt-1 font-medium uppercase tracking-wide">
            {section.subsections.length} {section.subsections.length === 1 ? 'topic' : 'topics'}
          </p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0" />
    </button>
  );
}

// ── Hub (index) view ──────────────────────────────────────────────────────────

const AUDIENCE_TABS: { id: AudienceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'guard', label: 'Guards' },
  { id: 'client', label: 'Clients' },
  { id: 'staff', label: 'Staff' },
];

function GuideHub({
  sections,
  initialAudience = 'all',
  onSelect,
}: {
  sections: GuideSection[];
  initialAudience?: AudienceFilter;
  onSelect: (section: GuideSection) => void;
}) {
  const [audience, setAudience] = useState<AudienceFilter>(initialAudience);

  const visible = sections.filter((s) => {
    if (audience === 'all') return true;
    const meta = getSectionMeta(s);
    return !meta.audience || meta.audience === audience;
  });

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <AppScreenTitle>Guide</AppScreenTitle>

      <div className="px-4 pb-3 border-b border-brand-border">
        <div className="segmented-control segmented-control-full">
          {AUDIENCE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAudience(tab.id)}
              className={`segmented-control-btn flex-1 text-center ${audience === tab.id ? 'segmented-control-btn-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {visible.map((section) => (
          <SectionCard key={section.id} section={section} onClick={() => onSelect(section)} />
        ))}
      </div>
    </AppScreen>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export interface AppWorkflowPageProps {
  audience?: AudienceFilter;
}

const ALL_SECTIONS = parseGuide();

export function AppWorkflowPage({ audience: initialAudience }: AppWorkflowPageProps) {
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);

  const handleSelect = useCallback((section: GuideSection) => {
    setActiveSection(section);
  }, []);

  const handleBack = useCallback(() => {
    setActiveSection(null);
  }, []);

  if (activeSection) {
    return <SectionDetail section={activeSection} onBack={handleBack} />;
  }

  return (
    <GuideHub
      sections={ALL_SECTIONS}
      initialAudience={initialAudience && initialAudience !== 'all' ? initialAudience : 'all'}
      onSelect={handleSelect}
    />
  );
}
