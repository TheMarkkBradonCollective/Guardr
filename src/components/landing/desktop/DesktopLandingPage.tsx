import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { ThemeMode } from '../../../lib/platform/theme';
import type { LegalPageId } from '../../../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../../../lib/legalContent';
import { LEGAL_ENTITY_NAME } from '../../../lib/siteConfig';
import type { CompanyPublicDocument } from '../../../lib/companyPlacard';
import { Logo } from '../../Logo';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { SignatureSecuritySpecialistLink } from '../../SignatureSecuritySpecialistLink';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { LegalInfoCards } from '../../legal/LegalInfoCards';
import { CompanyPublicPlacard } from '../../public/CompanyPublicPlacard';
import { LandingAppDownloads } from '../LandingAppDownloads';
import { DesktopLandingHeroPreview } from './DesktopLandingHeroPreview';

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

const EXEC_METRICS = [
  { value: 'Map-first', label: 'Job discovery', detail: 'Geospatial matching' },
  { value: 'Licensed', label: 'Independent pros', detail: 'Credential verified' },
  { value: 'Live', label: 'Shift tracking', detail: 'Real-time visibility' },
  { value: 'Direct', label: 'Platform pay', detail: 'Transparent earnings' },
];

const HOW_STEPS = [
  {
    step: '01',
    icon: Navigation,
    title: 'Post or discover',
    body: 'Clients publish site coverage. Guards browse open jobs on a live operations map.',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: 'Match & confirm',
    body: 'Review credentials, negotiate terms in-platform, and lock the assignment.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Execute & settle',
    body: 'Check-ins, audits, incident reports, and payment — end to end in Guardr.',
  },
];

const CLIENT_FEATURES = [
  { icon: MapPin, title: 'Post by site', body: 'Location, hours, coverage type, and special requirements in minutes.' },
  { icon: BadgeCheck, title: 'Verified credentials', body: 'Review licenses, certs, and platform-verified guard profiles.' },
  { icon: Clock, title: 'Live visibility', body: 'Track check-ins, shift audits, and guard activity in one console.' },
];

const GUARD_FEATURES = [
  { icon: MapPin, title: 'Jobs near you', body: 'Filter open posts by distance, rate, and assignment type on the map.' },
  { icon: Lock, title: 'Own your credentials', body: 'Portable license and cert vault that travels with your profile.' },
  { icon: CreditCard, title: 'Direct pay', body: 'Complete shifts and track every payout in your earnings workspace.' },
];

const PLATFORM_PILLARS = [
  { icon: Smartphone, title: 'Purpose-built workspaces', body: 'Separate client, guard, and staff consoles — each tuned to the role.' },
  { icon: FileText, title: 'Digital credentials', body: 'Upload once. Credentials follow your profile across every job.' },
  { icon: TrendingUp, title: 'Earnings intelligence', body: 'Shift history, rates, and payout analytics without spreadsheets.' },
  { icon: Users, title: 'Crew coordination', body: 'Standing teams, multi-guard posts, and coordinated communications.' },
  { icon: Zap, title: 'Real-time alerts', body: 'Jobs, shift events, check-ins, and messages — instantly.' },
  { icon: Star, title: 'Reputation system', body: 'Verified track records that compound with every completed shift.' },
];

const COVERAGE_TYPES = [
  'Event security',
  'Construction sites',
  'Retail protection',
  'Nightlife & venues',
  'Corporate campuses',
  'Hospital & healthcare',
  'Short & recurring posts',
  'Armed transport',
];

export function DesktopLandingPage({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  onOpenGuide,
  ownerMessage,
  directorMessage,
  companyPlacardDocuments = [],
}: DesktopLandingPageProps) {
  return (
    <div className="desktop-landing page-shell min-h-screen" data-landing-factor="desktop">
      <div className="desktop-landing-ambient" aria-hidden>
        <div className="desktop-landing-ambient-orb desktop-landing-ambient-orb--a" />
        <div className="desktop-landing-ambient-orb desktop-landing-ambient-orb--b" />
        <div className="desktop-landing-ambient-grid" />
      </div>

      <header className="desktop-landing-header">
        <div className="desktop-landing-container desktop-landing-header-inner">
          <div className="desktop-landing-brand">
            <Logo size={30} className="text-brand-primary shrink-0" />
            <div>
              <span className="desktop-landing-wordmark">
                Guard<span className="text-brand-primary">r</span>
              </span>
              <span className="desktop-landing-wordmark-sub">Security operations platform</span>
            </div>
          </div>

          <nav className="desktop-landing-header-nav" aria-label="Primary">
            <a href="#platform" className="desktop-landing-header-link">Platform</a>
            <a href="#workspaces" className="desktop-landing-header-link">Workspaces</a>
            <a href="#coverage" className="desktop-landing-header-link">Coverage</a>
            {onOpenGuide ? (
              <button type="button" onClick={onOpenGuide} className="desktop-landing-header-link">
                Guide
              </button>
            ) : null}
          </nav>

          <div className="desktop-landing-header-actions">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-in')}
              className="desktop-landing-header-ghost"
            >
              Client sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="desktop-landing-header-ghost"
            >
              Guard sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="desktop-landing-header-cta"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <section className="desktop-landing-hero">
        <div className="desktop-landing-container desktop-landing-hero-grid">
          <div className="desktop-landing-hero-copy">
            <motion.p
              className="desktop-landing-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Independent security marketplace
            </motion.p>

            <motion.h1
              className="desktop-landing-hero-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              The executive console
              <span className="desktop-landing-hero-accent"> for security operations.</span>
            </motion.h1>

            <motion.p
              className="desktop-landing-hero-lead"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              Clients command coverage. Guards run their business. Staff orchestrate the field.
              One platform — three purpose-built desktop workspaces with maps, messaging, and payments.
            </motion.p>

            {(ownerMessage?.trim() || directorMessage?.trim()) && (
              <motion.div
                className="desktop-landing-leadership"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.14 }}
              >
                {ownerMessage?.trim() ? (
                  <blockquote className="desktop-landing-leadership-card">
                    <p className="desktop-landing-leadership-name">Markeith White · Founder</p>
                    <p className="desktop-landing-leadership-quote">{ownerMessage}</p>
                  </blockquote>
                ) : null}
                {directorMessage?.trim() ? (
                  <blockquote className="desktop-landing-leadership-card">
                    <p className="desktop-landing-leadership-name">Tyrone Johnson · Director</p>
                    <p className="desktop-landing-leadership-quote">{directorMessage}</p>
                  </blockquote>
                ) : null}
              </motion.div>
            )}

            <motion.div
              className="desktop-landing-hero-ctas"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
            >
              <button
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--primary"
              >
                <Building2 className="w-4 h-4" />
                I need security
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--secondary"
              >
                <Shield className="w-4 h-4" />
                I&apos;m a guard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.24 }}
            >
              <LandingAppDownloads formFactor="desktop" variant="hero" id="get-app" />
            </motion.div>
          </div>

          <DesktopLandingHeroPreview />
        </div>
      </section>

      <section className="desktop-landing-metrics" aria-label="Platform metrics">
        <div className="desktop-landing-container">
          <div className="desktop-landing-metrics-grid">
            {EXEC_METRICS.map(({ value, label, detail }, index) => (
              <motion.div
                key={label}
                className="desktop-landing-metric"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
              >
                <span className="desktop-landing-metric-value">{value}</span>
                <span className="desktop-landing-metric-label">{label}</span>
                <span className="desktop-landing-metric-detail">{detail}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {companyPlacardDocuments.length > 0 ? (
        <CompanyPublicPlacard documents={companyPlacardDocuments} />
      ) : null}

      <section id="platform" className="desktop-landing-section">
        <div className="desktop-landing-container">
          <div className="desktop-landing-section-head">
            <p className="desktop-landing-section-eyebrow">How it works</p>
            <h2 className="desktop-landing-section-title">From post to paid shift</h2>
            <p className="desktop-landing-section-lead">
              A direct marketplace — clients and guards arrange each job, with Guardr powering the operations layer.
            </p>
          </div>

          <div className="desktop-landing-timeline">
            {HOW_STEPS.map(({ step, icon: Icon, title, body }, index) => (
              <motion.article
                key={step}
                className="desktop-landing-timeline-step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="desktop-landing-timeline-marker">
                  <span className="desktop-landing-timeline-step-num">{step}</span>
                  <span className="desktop-landing-timeline-icon">
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="desktop-landing-timeline-title">{title}</h3>
                <p className="desktop-landing-timeline-body">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="workspaces" className="desktop-landing-section desktop-landing-section--alt">
        <div className="desktop-landing-container">
          <div className="desktop-landing-workspaces-grid">
            <article className="desktop-landing-workspace-card desktop-landing-workspace-card--client">
              <p className="desktop-landing-section-eyebrow">Client workspace</p>
              <h2 className="desktop-landing-workspace-title">Command coverage at your sites</h2>
              <p className="desktop-landing-workspace-lead">
                Post jobs with full site details, review licensed guards, and monitor active coverage
                from a dedicated desktop console.
              </p>
              <ul className="desktop-landing-feature-list">
                {CLIENT_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="desktop-landing-feature-item">
                    <span className="desktop-landing-feature-icon">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="desktop-landing-feature-title">{title}</p>
                      <p className="desktop-landing-feature-body">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--primary"
              >
                Get started as a client
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>

            <article className="desktop-landing-workspace-card desktop-landing-workspace-card--guard">
              <p className="desktop-landing-section-eyebrow">Guard workspace</p>
              <h2 className="desktop-landing-workspace-title">Run your guard business</h2>
              <p className="desktop-landing-workspace-lead">
                Map-first discovery, earnings intelligence, digital credentials, and full shift tools.
                You contract per assignment — not an employee of Guardr or the client.
              </p>
              <ul className="desktop-landing-feature-list">
                {GUARD_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="desktop-landing-feature-item">
                    <span className="desktop-landing-feature-icon desktop-landing-feature-icon--guard">
                      <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="desktop-landing-feature-title">{title}</p>
                      <p className="desktop-landing-feature-body">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--secondary"
              >
                Create guard account
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="desktop-landing-section">
        <div className="desktop-landing-container">
          <div className="desktop-landing-section-head desktop-landing-section-head--center">
            <p className="desktop-landing-section-eyebrow">Everything included</p>
            <h2 className="desktop-landing-section-title">Built for the job, not around it</h2>
            <p className="desktop-landing-section-lead">
              Every capability on Guardr is designed for how security work actually happens in the field.
            </p>
          </div>

          <div className="desktop-landing-pillars-grid">
            {PLATFORM_PILLARS.map(({ icon: Icon, title, body }, index) => (
              <motion.div
                key={title}
                className="desktop-landing-pillar"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <span className="desktop-landing-pillar-icon">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <p className="desktop-landing-pillar-title">{title}</p>
                <p className="desktop-landing-pillar-body">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="coverage" className="desktop-landing-section desktop-landing-section--alt">
        <div className="desktop-landing-container">
          <div className="desktop-landing-section-head desktop-landing-section-head--center">
            <p className="desktop-landing-section-eyebrow">Coverage types</p>
            <h2 className="desktop-landing-section-title">Built for real-world coverage</h2>
            <p className="desktop-landing-section-lead">
              Any site, any shift length, any requirement. Post what you need — guards apply with credentials to match.
            </p>
          </div>
          <div className="desktop-landing-coverage-mosaic">
            {COVERAGE_TYPES.map((tag) => (
              <span key={tag} className="desktop-landing-coverage-chip">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="desktop-landing-section">
        <div className="desktop-landing-container">
          <div className="desktop-landing-rules-card">
            <p className="desktop-landing-section-eyebrow desktop-landing-section-eyebrow--center">
              Marketplace rules
            </p>
            <h2 className="desktop-landing-section-title desktop-landing-section-title--sm">
              Transparent by design
            </h2>
            <p className="desktop-landing-rules-copy">
              {LEGAL_DISCLAIMER_SHORT} Each job is a direct arrangement between the client and the
              independent guard they select.
            </p>
            <div className="desktop-landing-rules-pills">
              <span className="desktop-landing-rules-pill">Clients contract per job</span>
              <span className="desktop-landing-rules-pill">Guards choose assignments</span>
              <span className="desktop-landing-rules-pill">Platform tools &amp; support</span>
            </div>
          </div>
        </div>
      </section>

      <section className="desktop-landing-section desktop-landing-section--alt">
        <div className="desktop-landing-container">
          <div className="desktop-landing-section-head desktop-landing-section-head--center">
            <h2 className="desktop-landing-section-title desktop-landing-section-title--sm">
              Policies &amp; data
            </h2>
            <p className="desktop-landing-section-lead">
              Read how Guardr handles your data and the marketplace rules for clients and guards.
            </p>
          </div>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </div>
      </section>

      <section className="desktop-landing-final">
        <div className="desktop-landing-container desktop-landing-final-inner">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="desktop-landing-section-eyebrow desktop-landing-section-eyebrow--center">
              Get started
            </p>
            <h2 className="desktop-landing-final-title">Ready when you are.</h2>
            <p className="desktop-landing-final-lead">
              Choose your path — each experience is a purpose-built desktop workspace.
            </p>
            <div className="desktop-landing-final-actions">
              <button
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--primary desktop-landing-cta--lg"
              >
                I need security
              </button>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                className="desktop-landing-cta desktop-landing-cta--outline desktop-landing-cta--lg"
              >
                I&apos;m a guard
              </button>
            </div>
            <LandingAppDownloads formFactor="desktop" variant="cta" />
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="desktop-landing-final-signin"
            >
              Sign in to your account →
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="desktop-landing-footer">
        <div className="desktop-landing-container desktop-landing-footer-inner">
          <div className="desktop-landing-footer-brand">
            <Logo size={24} className="text-brand-primary" />
            <div>
              <span className="desktop-landing-footer-name">Guardr</span>
              <span className="desktop-landing-footer-by">
                by{' '}
                <SignatureSecuritySpecialistLink className="hover:text-brand-primary hover:underline transition-colors" />
              </span>
            </div>
          </div>
          <div className="desktop-landing-footer-links">
            {onOpenGuide ? (
              <button type="button" onClick={onOpenGuide} className="desktop-landing-footer-link">
                <BookOpen className="w-4 h-4" />
                Guide
              </button>
            ) : null}
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
          </div>
          <div className="desktop-landing-footer-meta">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
            <p className="desktop-landing-footer-copy">
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}. Independent contractor marketplace.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
