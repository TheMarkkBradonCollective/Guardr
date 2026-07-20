/**
 * Desktop landing — exact Uber.com homepage pattern.
 *
 * Layout:
 *   Black sticky nav bar (wordmark + links left, Log in + Sign up right)
 *   Split hero: left white panel (tabs + bold heading + role cards),
 *               right full-bleed photo that fills remaining viewport
 *   Explore section: wide card grid
 *   Account login band
 *   Footer
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { ParagraphMedium, LabelSmall } from 'baseui/typography';
import {
  Shield,
  Users,
  MapPin,
  ChevronDown,
  ArrowRight,
  Globe,
  BadgeCheck,
  Clock,
  CreditCard,
  Radio,
  Building2,
  Star,
} from 'lucide-react';
import { Logo } from '../../Logo';
import { GuardrButton } from '../../baseui/GuardrButton';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { LEGAL_ENTITY_NAME } from '../../../lib/siteConfig';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { LandingAppDownloads } from '../LandingAppDownloads';

interface DesktopLandingPageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

// ─── Desktop Nav ──────────────────────────────────────────────────────────────

function DesktopNav({
  onNavigateToAuth,
  onOpenGuide,
  onOpenLegal,
}: {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  onOpenGuide?: () => void;
  onOpenLegal: (page: LegalPageId) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!moreWrapRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  return (
    <header
      className="dsk-landing-nav"
      role="banner"
    >
      <div className="dsk-landing-nav-inner">
        {/* Left: wordmark + nav links */}
        <div className="dsk-landing-nav-left">
          <a href="/" className="dsk-landing-wordmark" aria-label="Guardr home">
            <Logo size={20} className="dsk-landing-logo-svg" />
            Guardr
          </a>
          <nav className="dsk-landing-nav-links" aria-label="Primary">
            <button type="button" className="dsk-landing-nav-link" onClick={() => onNavigateToAuth('client', 'sign-up')}>
              For clients
            </button>
            <button type="button" className="dsk-landing-nav-link" onClick={() => onNavigateToAuth('guard', 'sign-up')}>
              For guards
            </button>
            <button type="button" className="dsk-landing-nav-link" onClick={() => onOpenLegal('privacy')}>
              Safety
            </button>
            {onOpenGuide ? (
              <button type="button" className="dsk-landing-nav-link" onClick={onOpenGuide}>
                Help
              </button>
            ) : null}
            <div className="dsk-landing-nav-more-wrap" ref={moreWrapRef}>
              <button
                type="button"
                className="dsk-landing-nav-link dsk-landing-nav-link--more"
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                More <ChevronDown size={14} />
              </button>
              {moreOpen ? (
                <div className="dsk-landing-nav-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="dsk-landing-nav-dropdown-item"
                    onClick={() => { setMoreOpen(false); onOpenLegal('terms'); }}
                  >
                    Terms of Service
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="dsk-landing-nav-dropdown-item"
                    onClick={() => { setMoreOpen(false); onOpenLegal('privacy'); }}
                  >
                    Privacy Policy
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="dsk-landing-nav-dropdown-item"
                    onClick={() => { setMoreOpen(false); onOpenLegal('guard-conduct'); }}
                  >
                    Guard conduct
                  </button>
                  {onOpenGuide ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="dsk-landing-nav-dropdown-item"
                      onClick={() => { setMoreOpen(false); onOpenGuide(); }}
                    >
                      Product guide
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </nav>
        </div>

        {/* Right: language + Log in + Sign up */}
        <div className="dsk-landing-nav-right">
          <button type="button" className="dsk-landing-nav-link dsk-landing-nav-link--icon">
            <Globe size={14} /> EN
          </button>
          <button
            type="button"
            className="dsk-landing-nav-link"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
          >
            Log in
          </button>
          <button
            type="button"
            className="dsk-landing-signup-btn"
            onClick={() => onNavigateToAuth(undefined, 'sign-up')}
          >
            Sign up
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero photo placeholder ───────────────────────────────────────────────────

function HeroPhoto() {
  return (
    <div className="dsk-hero-photo" aria-hidden>
      {/* Premium gradient replacing real photo */}
      <div className="dsk-hero-photo-overlay" />
      <div className="dsk-hero-photo-people">
        {/* Guard silhouettes (SVG shapes) */}
        <div className="dsk-hero-figure dsk-hero-figure--main">
          <div className="dsk-hero-figure-body" />
          <div className="dsk-hero-figure-head" />
          <div className="dsk-hero-figure-badge">
            <Shield size={14} color="#fff" />
          </div>
        </div>
        <div className="dsk-hero-figure dsk-hero-figure--back">
          <div className="dsk-hero-figure-body" />
          <div className="dsk-hero-figure-head" />
        </div>
      </div>
    </div>
  );
}

// ─── Hero split section ───────────────────────────────────────────────────────

type HeroTab = 'client' | 'guard';

function DesktopHero({
  onNavigateToAuth,
}: {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}) {
  const [activeTab, setActiveTab] = useState<HeroTab>('client');

  const tabs: { id: HeroTab; label: string; icon: typeof Shield }[] = [
    { id: 'client', label: 'Post coverage', icon: Building2 },
    { id: 'guard',  label: 'Find work',     icon: Shield },
  ];

  const content = {
    client: {
      heading: <>Protect your sites<br />the right way</>,
      sub: 'Post shifts, review licensed guards, and manage live security operations from one platform.',
      cta: 'Post a job',
      link: 'Learn more about client coverage',
      cards: [
        { icon: MapPin,     title: 'Map-first',    body: 'Guards browse and apply directly from the live map near your sites.' },
        { icon: BadgeCheck, title: 'Verified pros', body: 'Every guard on the platform has verified state licenses and credentials.' },
      ],
    },
    guard: {
      heading: <>Get in the field<br />and get paid</>,
      sub: 'Browse open security shifts near you, apply directly, and receive payment through the platform.',
      cta: 'Sign up to work',
      link: 'Learn more about finding guard work',
      cards: [
        { icon: Clock,      title: 'Flexible hours', body: 'Choose your own shifts. Work when you want around your schedule.' },
        { icon: CreditCard, title: 'Direct pay',      body: 'Complete shifts and receive earnings straight to your account.' },
      ],
    },
  };

  const tab = content[activeTab];

  return (
    <section className="dsk-hero" aria-label="Hero">
      {/* Left editorial panel */}
      <div className="dsk-hero-editorial">
        {/* Tab switcher */}
        <div className="dsk-hero-tabs" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`dsk-hero-tab${activeTab === id ? ' dsk-hero-tab--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>

        {/* Heading */}
        <h1 className="dsk-hero-heading">{tab.heading}</h1>

        {/* Sub-role cards — like Uber's Drive/Ride cards */}
        <div className="dsk-hero-role-cards">
          {tab.cards.map(({ icon: Icon, title, body }) => (
            <div key={title} className="dsk-hero-role-card">
              <p className="dsk-hero-role-card-title">
                <Icon size={18} strokeWidth={1.75} />
                {title}
              </p>
              <p className="dsk-hero-role-card-body">{body}</p>
              <button
                type="button"
                className="dsk-hero-role-card-link"
                onClick={() => onNavigateToAuth(activeTab, 'sign-up')}
              >
                Learn more
              </button>
            </div>
          ))}
        </div>

        {/* Primary CTA — black solid like Uber's "Sign up to drive" */}
        <div className="dsk-hero-ctas">
          <button
            type="button"
            className="dsk-hero-cta-primary"
            onClick={() => onNavigateToAuth(activeTab, 'sign-up')}
          >
            {tab.cta} <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="dsk-hero-cta-link"
            onClick={() => onNavigateToAuth(activeTab, 'sign-up')}
          >
            {tab.link}
          </button>
        </div>
      </div>

      {/* Right: full-bleed photo */}
      <HeroPhoto />
    </section>
  );
}

// ─── Explore section ──────────────────────────────────────────────────────────

const EXPLORE_CARDS = [
  {
    icon: Shield,
    title: 'Post security coverage',
    body: 'Set your site, hours, and requirements. Licensed guards apply directly — no staffing agency markup.',
    role: 'client' as const,
  },
  {
    icon: MapPin,
    title: 'Browse jobs on the map',
    body: 'Open shifts near you appear on the live map. Filter by rate, distance, and coverage type.',
    role: 'guard' as const,
  },
  {
    icon: Radio,
    title: 'Live shift operations',
    body: 'Real-time check-ins, mid-shift audits, incident reports, and guard locations — all in one view.',
    role: 'client' as const,
  },
  {
    icon: Star,
    title: 'Build your reputation',
    body: 'Guards earn verified ratings after each completed shift. Clients see your track record up front.',
    role: 'guard' as const,
  },
  {
    icon: Users,
    title: 'Teams and standing crews',
    body: 'Form permanent crews, coordinate multi-guard posts, and manage team communications easily.',
  },
  {
    icon: CreditCard,
    title: 'Platform payments',
    body: 'Invoice clients automatically, track every payout, and receive earnings with full payment history.',
    role: 'guard' as const,
  },
] as const;

function ExploreSection({
  onNavigateToAuth,
}: {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}) {
  return (
    <section className="dsk-explore" aria-label="Explore Guardr services">
      <div className="dsk-section-inner">
        <h2 className="dsk-explore-heading">Explore what Guardr can do</h2>
        <div className="dsk-explore-grid">
          {EXPLORE_CARDS.map(({ icon: Icon, title, body, ...rest }) => {
            const cardRole = 'role' in rest ? (rest as { role?: 'guard' | 'client' }).role : undefined;
            return (
              <button
                key={title}
                type="button"
                className="dsk-explore-card"
                onClick={() => onNavigateToAuth(cardRole, 'sign-up')}
              >
                <div className="dsk-explore-card-icon">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="dsk-explore-card-title">{title}</h3>
                <p className="dsk-explore-card-body">{body}</p>
                <span className="dsk-explore-card-more" aria-hidden>Details →</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Login band ───────────────────────────────────────────────────────────────

function LoginBand({
  onNavigateToAuth,
}: {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
}) {
  return (
    <section className="dsk-login-band" aria-label="Sign in">
      <div className="dsk-section-inner dsk-login-band-inner">
        <div className="dsk-login-band-left">
          <h2 className="dsk-login-band-heading">Log in to see your account details</h2>
          <p className="dsk-login-band-sub">
            View active shifts, jobs, earnings, messages, and more — all in one place.
          </p>
          <div className="dsk-login-band-ctas">
            <button
              type="button"
              className="dsk-hero-cta-primary"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            >
              Log in to your account
            </button>
            <button
              type="button"
              className="dsk-hero-cta-link"
              onClick={() => onNavigateToAuth(undefined, 'sign-up')}
            >
              Create an account
            </button>
          </div>
        </div>
        <div className="dsk-login-band-visual" aria-hidden>
          <div className="dsk-login-band-stat-card">
            <span className="dsk-login-band-stat-label">Active coverage</span>
            <span className="dsk-login-band-stat-value">3 sites</span>
          </div>
          <div className="dsk-login-band-stat-card">
            <span className="dsk-login-band-stat-label">This week</span>
            <span className="dsk-login-band-stat-value">$1,240</span>
          </div>
          <div className="dsk-login-band-stat-card dsk-login-band-stat-card--dark">
            <span className="dsk-login-band-stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Live guards</span>
            <span className="dsk-login-band-stat-value" style={{ color: '#fff' }}>7 on shift</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function DesktopFooter({ onOpenLegal }: { onOpenLegal: (page: LegalPageId) => void }) {
  return (
    <footer className="dsk-footer" role="contentinfo">
      <div className="dsk-section-inner dsk-footer-inner">
        <div className="dsk-footer-brand">
          <Logo size={22} className="dsk-footer-logo" />
          <span className="dsk-footer-wordmark">Guardr</span>
        </div>
        <div className="dsk-footer-links">
          <LegalFooterLinks onOpenLegal={onOpenLegal} />
        </div>
        <p className="dsk-footer-copy">
          © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}
        </p>
      </div>
    </footer>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

/** Desktop browser landing — full Uber.com split-hero layout. */
export function DesktopLandingPage({
  onNavigateToAuth,
  onOpenLegal,
  onOpenGuide,
  companyPlacardDocuments = [],
}: DesktopLandingPageProps) {
  return (
    <div className="dsk-landing-page">
      <DesktopNav
        onNavigateToAuth={onNavigateToAuth}
        onOpenGuide={onOpenGuide}
        onOpenLegal={onOpenLegal}
      />
      <DesktopHero onNavigateToAuth={onNavigateToAuth} />
      <ExploreSection onNavigateToAuth={onNavigateToAuth} />
      <LoginBand onNavigateToAuth={onNavigateToAuth} />
      <div className="dsk-section-inner" style={{ padding: '48px 0' }}>
        <LandingAppDownloads formFactor="desktop" variant="cta" />
      </div>
      {companyPlacardDocuments.length > 0 && (
        <CompanyPublicPlacard documents={companyPlacardDocuments} />
      )}
      <DesktopFooter onOpenLegal={onOpenLegal} />
    </div>
  );
}
