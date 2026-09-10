import React, { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  LayoutGrid,
  LifeBuoy,
  Shield,
  Users,
} from 'lucide-react';
import { MarkdownDoc } from './MarkdownDoc';
import { UserManualDownloads } from './UserManualDownloads';
import { StakeholderDocumentDownloads } from './StakeholderDocumentDownloads';
import { StaffRolesReference } from '../staff/RolePermissionsGuide';
import { parseGuide, type GuideSection, type GuideSubsection } from '../../lib/guideParser';
import { AppScreen, AppScreenTitle, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { useLayoutFormFactor } from '../../surfaces';
import { StaffListFilterTabs } from '../staff/StaffListFilterTabs';
import { StaffOpsPageShell } from '../staff/StaffOpsPageShell';
import { WorkbenchEmpty, WorkbenchSplit } from '../baseui/layout/WorkbenchLayout';
import type { PlatformRole } from '../../types';

// ── Section metadata ──────────────────────────────────────────────────────────

type GuideAudienceTag =
  | 'guard'
  | 'client'
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'director'
  | 'founder';

interface SectionMeta {
  icon: React.ElementType;
  description: string;
  audience?: GuideAudienceTag;
}

const SECTION_META: Record<string, SectionMeta> = {
  'whole-app-start-to-finish-your-perspective': {
    icon: ArrowRight,
    description: 'The complete Guardr journey from sign-up to payout — who does what and when.',
  },
  'job-status-lifecycle': {
    icon: Activity,
    description: 'All job statuses, what each one means, and how jobs move through the platform.',
  },
  'client-guide': {
    icon: Building2,
    description: 'Post jobs, pay, approve guards, confirm coverage, and review reports.',
    audience: 'client',
  },
  'guard-guide': {
    icon: Shield,
    description: 'Application approval, credentials, shifts, reports, overtime, and pay.',
    audience: 'guard',
  },
  'support-guide': {
    icon: Users,
    description: 'Handle support messages, review incident reports, and monitor activity.',
    audience: 'support',
  },
  'moderator-guide': {
    icon: Users,
    description: 'Approve applications, monitor jobs, and review reports.',
    audience: 'moderator',
  },
  'administrator-guide': {
    icon: BookOpen,
    description: 'Verify credentials, review job offers, handle disputes, and manage users.',
    audience: 'administrator',
  },
  'director-guide': {
    icon: Award,
    description: 'Financial controls, team management, trusted status, and full operations.',
    audience: 'director',
  },
  'founder-guide': {
    icon: Crown,
    description: 'Platform governance, payment modes, Director management, and oversight.',
    audience: 'founder',
  },
  'staff-role-permissions': {
    icon: Shield,
    description: 'What each staff role can see and do — sidebar access, payouts, and governance.',
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
    description: 'Every key action organised by client, guard, and staff role.',
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

type AudienceFilter = 'all' | GuideAudienceTag;

const CLIENT_GUARD_TABS: { id: AudienceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'guard', label: 'Guards' },
  { id: 'client', label: 'Customers' },
];

const STAFF_TABS: { id: AudienceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'support', label: 'Support' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'administrator', label: 'Admin' },
  { id: 'director', label: 'Director' },
  { id: 'founder', label: 'Founder' },
  { id: 'client', label: 'Customers' },
  { id: 'guard', label: 'Guards' },
];

function platformRoleToGuideAudience(role?: PlatformRole): GuideAudienceTag | undefined {
  switch (role) {
    case 'support':
      return 'support';
    case 'moderator':
      return 'moderator';
    case 'administrator':
      return 'administrator';
    case 'manager':
      return 'administrator';
    case 'director':
      return 'director';
    case 'owner':
      return 'founder';
    case 'guard':
      return 'guard';
    case 'client':
      return 'client';
    default:
      return undefined;
  }
}

// ── Subsection accordion item ─────────────────────────────────────────────────

function SubsectionAccordion({
  sub,
  defaultOpen,
  variant = 'mobile',
}: {
  sub: GuideSubsection;
  defaultOpen?: boolean;
  variant?: 'mobile' | 'desktop';
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const isDesktop = variant === 'desktop';

  return (
    <div className={isDesktop ? 'adm-guide-accordion' : 'border-b border-brand-border last:border-b-0'}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          isDesktop
            ? 'adm-guide-accordion-trigger'
            : 'w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-brand-bg-sec/50 transition-colors'
        }
      >
        <span className="text-sm font-semibold text-brand-text leading-snug">{sub.title}</span>
        <ChevronDown
          className={`w-4 h-4 text-brand-text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className={isDesktop ? 'adm-guide-accordion-body' : 'px-4 pb-5 pt-1'}>
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
  variant = 'mobile',
}: {
  section: GuideSection;
  onBack: () => void;
  variant?: 'mobile' | 'desktop';
}) {
  const isDesktop = variant === 'desktop';

  const body = (
    <>
      {section.topRaw.trim() && (
        <div className={isDesktop ? 'adm-guide-intro' : 'px-4 pt-3 pb-4 border-b border-brand-border'}>
          <MarkdownDoc source={section.topRaw} />
        </div>
      )}

      {section.id === 'staff-role-permissions' && (
        <div className={isDesktop ? 'adm-guide-roles' : 'px-4 py-4 border-b border-brand-border'}>
          <StaffRolesReference />
        </div>
      )}

      {section.subsections.length > 0 && (
        <div className={isDesktop ? 'adm-guide-subsections' : 'divide-y-0'}>
          {section.subsections.map((sub, i) => (
            <SubsectionAccordion key={sub.id} sub={sub} defaultOpen={i === 0} variant={variant} />
          ))}
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <>
        <div className="adm-workbench-detail-head">
          <h2 className="adm-card-title">{section.title}</h2>
        </div>
        <div className="adm-guide-doc">{body}</div>
      </>
    );
  }

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      <AppSubScreenHeader title={section.title} onBack={onBack} backLabel="Guide" />
      {body}
    </AppScreen>
  );
}

// ── Section card (hub list item) ──────────────────────────────────────────────

function SectionCard({
  section,
  onClick,
  active = false,
  variant = 'mobile',
}: {
  section: GuideSection;
  onClick: () => void;
  active?: boolean;
  variant?: 'mobile' | 'desktop';
}) {
  const meta = getSectionMeta(section);
  const Icon = meta.icon;
  const isDesktop = variant === 'desktop';

  if (isDesktop) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`adm-guide-section-row${active ? ' adm-guide-section-row--active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <span className="adm-guide-section-icon" aria-hidden>
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="adm-guide-section-title">{section.title}</span>
          {meta.description ? (
            <span className="adm-guide-section-desc">{meta.description}</span>
          ) : null}
        </span>
        {section.subsections.length > 0 ? (
          <span className="adm-guide-section-count">
            {section.subsections.length}
          </span>
        ) : null}
      </button>
    );
  }

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

// ── Tutorial panel ────────────────────────────────────────────────────────────

function TutorialPanel({
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  variant = 'mobile',
}: {
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  variant?: 'mobile' | 'desktop';
}) {
  if (!tutorialAvailable || !onStartTutorial) return null;
  const isDesktop = variant === 'desktop';

  return (
    <div className={isDesktop ? 'adm-guide-tutorial' : 'px-4 pt-2 pb-4 border-b border-brand-border'}>
      <div
        className={
          isDesktop
            ? 'adm-card adm-guide-tutorial-card'
            : 'rounded-xl border border-brand-border bg-brand-bg-sec/60 p-4 space-y-3'
        }
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">Interactive tutorial</p>
          <p className="text-xs text-brand-text-muted leading-relaxed mt-1.5">
            Page-by-page walkthrough with sample data that stays on this device only. Sample rows are
            removed when you finish or end the tutorial.
          </p>
        </div>
        <div className={`flex flex-col sm:flex-row gap-2${isDesktop ? ' adm-guide-tutorial-actions' : ''}`}>
          <button
            type="button"
            onClick={onStartTutorial}
            className={
              isDesktop
                ? 'adm-btn adm-btn--sand'
                : 'app-button-primary !w-auto !h-10 !px-5'
            }
          >
            {tutorialCompleted ? 'Restart tutorial' : 'Start tutorial'}
          </button>
        </div>
        {tutorialActive && (
          <p className="text-xs text-brand-primary font-medium">
            Tutorial is active — use End tutorial (top right) when you are done.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Hub (index) view ──────────────────────────────────────────────────────────

function GuideHub({
  sections,
  tabs,
  initialAudience = 'all',
  highlightAudience,
  activeSectionId,
  onSelect,
  onBack,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
  variant = 'mobile',
}: {
  sections: GuideSection[];
  tabs: { id: AudienceFilter; label: string }[];
  initialAudience?: AudienceFilter;
  highlightAudience?: GuideAudienceTag;
  activeSectionId?: string | null;
  onSelect: (section: GuideSection) => void;
  onBack?: () => void;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
  variant?: 'mobile' | 'desktop';
}) {
  const defaultTab = highlightAudience ?? initialAudience;
  const [audience, setAudience] = useState<AudienceFilter>(defaultTab);
  const isDesktop = variant === 'desktop';

  const visible = sections.filter((s) => {
    if (audience === 'all') return true;
    const meta = getSectionMeta(s);
    return !meta.audience || meta.audience === audience;
  });

  const filterTabs = (
    <div className={isDesktop ? 'adm-guide-filter-tabs' : 'px-4 pb-3 border-b border-brand-border'}>
      <StaffListFilterTabs
        aria-label="Guide audience"
        activeId={audience}
        onChange={(id) => setAudience(id as AudienceFilter)}
        tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
      />
    </div>
  );

  const stakeholderPanel = (
    <StakeholderDocumentDownloads distribution="public" variant={variant} />
  );
  const manualsPanel = <UserManualDownloads audienceFilter={audience} variant={variant} />;

  const sectionList = (
    <div className={isDesktop ? 'adm-guide-section-list' : undefined}>
      {visible.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          active={activeSectionId === section.id}
          variant={variant}
          onClick={() => onSelect(section)}
        />
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <div className="adm-guide-sidebar">
        <TutorialPanel
          variant="desktop"
          tutorialAvailable={tutorialAvailable}
          tutorialCompleted={tutorialCompleted}
          tutorialActive={tutorialActive}
          onStartTutorial={onStartTutorial}
        />
        {stakeholderPanel}
        {manualsPanel}
        {filterTabs}
        {sectionList}
      </div>
    );
  }

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain">
      {onBack ? (
        <AppSubScreenHeader title="Guide" onBack={onBack} backLabel="Home" />
      ) : (
        <AppScreenTitle>Guide</AppScreenTitle>
      )}

      <TutorialPanel
        tutorialAvailable={tutorialAvailable}
        tutorialCompleted={tutorialCompleted}
        tutorialActive={tutorialActive}
        onStartTutorial={onStartTutorial}
      />

      {stakeholderPanel}
      {manualsPanel}
      {filterTabs}
      {sectionList}
    </AppScreen>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export interface AppGuidePageProps {
  audience?: 'staff' | 'guard' | 'client' | 'all';
  staffRole?: PlatformRole;
  onBack?: () => void;
  tutorialAvailable?: boolean;
  tutorialCompleted?: boolean;
  tutorialActive?: boolean;
  onStartTutorial?: () => void;
}

const ALL_SECTIONS = parseGuide();

export function AppGuidePage({
  audience: initialAudience,
  staffRole,
  onBack,
  tutorialAvailable,
  tutorialCompleted,
  tutorialActive,
  onStartTutorial,
}: AppGuidePageProps) {
  const formFactor = useLayoutFormFactor();
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);

  const tabs = useMemo(
    () => (initialAudience === 'staff' ? STAFF_TABS : CLIENT_GUARD_TABS),
    [initialAudience]
  );

  const highlightAudience = useMemo(
    () => (initialAudience === 'staff' ? platformRoleToGuideAudience(staffRole) : undefined),
    [initialAudience, staffRole]
  );

  const handleSelect = useCallback((section: GuideSection) => {
    setActiveSection(section);
  }, []);

  const handleBack = useCallback(() => {
    setActiveSection(null);
  }, []);

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-platform-page adm-guide-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Platform</p>
            <p className="uber-workbench-subtitle">
              Role-based workflows, permissions, and how Guardr works end to end.
            </p>
          </div>
        }
      >
        <WorkbenchSplit
          className="adm-guide-workbench"
          list={
            <div className="adm-guide-list">
              <GuideHub
                variant="desktop"
                sections={ALL_SECTIONS}
                tabs={tabs}
                initialAudience={
                  initialAudience && initialAudience !== 'all' && initialAudience !== 'staff'
                    ? initialAudience
                    : 'all'
                }
                highlightAudience={highlightAudience}
                activeSectionId={activeSection?.id ?? null}
                onSelect={handleSelect}
                tutorialAvailable={tutorialAvailable}
                tutorialCompleted={tutorialCompleted}
                tutorialActive={tutorialActive}
                onStartTutorial={onStartTutorial}
              />
            </div>
          }
          detail={
            activeSection ? (
              <SectionDetail section={activeSection} onBack={handleBack} variant="desktop" />
            ) : (
              <WorkbenchEmpty icon={BookOpen} message="Select a guide section to read" variant="detail" />
            )
          }
        />
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell className="staff-mgmt-panel staff-roster-panel sft-guide">
        <div
          className="tablet-split-panel"
          data-selected={activeSection ? 'true' : undefined}
        >
          <div className="split-list-pane">
            <GuideHub
              variant="desktop"
              sections={ALL_SECTIONS}
              tabs={tabs}
              initialAudience={
                initialAudience && initialAudience !== 'all' && initialAudience !== 'staff'
                  ? initialAudience
                  : 'all'
              }
              highlightAudience={highlightAudience}
              activeSectionId={activeSection?.id ?? null}
              onSelect={handleSelect}
              tutorialAvailable={tutorialAvailable}
              tutorialCompleted={tutorialCompleted}
              tutorialActive={tutorialActive}
              onStartTutorial={onStartTutorial}
            />
          </div>
          <div className="split-detail-pane">
            {activeSection ? (
              <>
                <div className="tablet-split-back">
                  <button type="button" className="sft-icon-btn" onClick={handleBack} aria-label="Back to list">
                    <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
                  </button>
                  <span className="tablet-split-back-title">Back to list</span>
                </div>
                <SectionDetail section={activeSection} onBack={handleBack} variant="desktop" />
              </>
            ) : (
              <div className="sft-empty">
                <p className="sft-empty-title">Select a guide section</p>
                <p className="sft-empty-message">Choose a topic from the list to read workflows, permissions, and how Guardr works.</p>
              </div>
            )}
          </div>
        </div>
      </StaffOpsPageShell>
    );
  }

  if (activeSection) {
    return <SectionDetail section={activeSection} onBack={handleBack} />;
  }

  return (
    <GuideHub
      sections={ALL_SECTIONS}
      tabs={tabs}
      initialAudience={
        initialAudience && initialAudience !== 'all' && initialAudience !== 'staff'
          ? initialAudience
          : 'all'
      }
      highlightAudience={highlightAudience}
      onSelect={handleSelect}
      onBack={onBack}
      tutorialAvailable={tutorialAvailable}
      tutorialCompleted={tutorialCompleted}
      tutorialActive={tutorialActive}
      onStartTutorial={onStartTutorial}
    />
  );
}
