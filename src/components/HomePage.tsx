import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import {
  ArrowRight,
  Building2,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Navigation,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';
import type { FormFactor } from '../lib/platform/device';
import { SignatureSecuritySpecialistLink } from './SignatureSecuritySpecialistLink';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import { LegalInfoCards } from './legal/LegalInfoCards';
import type { LegalPageId } from '../lib/legalContent';
import { LEGAL_DISCLAIMER_SHORT } from '../lib/legalContent';
import { LEGAL_ENTITY_NAME } from '../lib/siteConfig';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
}

const CLIENT_FEATURES = [
  { icon: MapPin, title: 'Post by site', body: 'Set location, hours, and coverage type in minutes.' },
  { icon: Shield, title: 'Licensed professionals', body: 'Independent guards apply with credentials they upload to the platform.' },
  { icon: Clock, title: 'Live visibility', body: 'Track check-ins, audits, and support from one dashboard.' },
];

const GUARD_FEATURES = [
  { icon: MapPin, title: 'Jobs near you', body: 'Browse open posts on the map — you choose what fits.' },
  { icon: Shield, title: 'Your credentials', body: 'Your license, certs, and profile — owned by you.' },
  { icon: CheckCircle2, title: 'Direct pay', body: 'Complete shifts and get paid through the platform.' },
];

const COVERAGE_TYPES = [
  'Event security',
  'Construction sites',
  'Retail protection',
  'Nightlife & venues',
  'Short & recurring posts',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Navigation,
    title: 'Post or discover',
    body: 'Clients post coverage needs. Guards browse open jobs on the map.',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: 'Match & confirm',
    body: 'Review credentials, message directly, and lock in the details.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Track & complete',
    body: 'Live check-ins, shift audits, and payment through the platform.',
  },
];

const TRUST_METRICS = [
  { value: 'Map-first', label: 'Job discovery' },
  { value: 'Licensed', label: 'Independent pros' },
  { value: 'Live', label: 'Shift tracking' },
  { value: 'Direct', label: 'Platform payments' },
];

function LandingProductPreview({ formFactor }: { formFactor: FormFactor }) {
  if (formFactor === 'mobile') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="landing-preview"
      aria-hidden="true"
    >
      <div className="landing-preview-frame">
        <div className="landing-preview-chrome">
          <span className="landing-preview-dot" />
          <span className="landing-preview-dot" />
          <span className="landing-preview-dot" />
          <span className="landing-preview-title">Guardr</span>
        </div>
        <div className="landing-preview-map">
          <div className="landing-preview-grid" />
          <span className="landing-preview-pin landing-preview-pin-a" />
          <span className="landing-preview-pin landing-preview-pin-b" />
          <span className="landing-preview-pin landing-preview-pin-c" />
          <span className="landing-preview-pin landing-preview-pin-active" />
        </div>
        <div className="landing-preview-sheet">
          <div className="landing-preview-handle" />
          <div className="landing-preview-job">
            <div>
              <p className="landing-preview-job-title">Retail patrol</p>
              <p className="landing-preview-job-meta">Tonight · 8 hrs · 2.4 mi</p>
            </div>
            <span className="landing-preview-job-rate">$28/hr</span>
          </div>
          <div className="landing-preview-job landing-preview-job-muted">
            <div>
              <p className="landing-preview-job-title">Event security</p>
              <p className="landing-preview-job-meta">Sat · 6 hrs · 5.1 mi</p>
            </div>
            <span className="landing-preview-job-rate">$32/hr</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LandingPathCards({
  onNavigateToAuth,
  layout,
}: {
  onNavigateToAuth: HomePageProps['onNavigateToAuth'];
  layout: FormFactor;
}) {
  return (
    <div className={`landing-path-grid landing-path-grid--${layout}`}>
      <button
        type="button"
        onClick={() => onNavigateToAuth('client', 'sign-up')}
        className="landing-path-card landing-path-card-client group w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="landing-path-card-eyebrow landing-path-card-eyebrow--accent">
              For businesses &amp; sites
            </p>
            <p className="landing-path-card-title">I need security</p>
            <p className="landing-path-card-body">
              Post coverage, review guards, monitor live shifts.
            </p>
          </div>
          <Building2 className="landing-path-card-icon landing-path-card-icon--accent shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
        </div>
        <span className="landing-path-card-action landing-path-card-action--accent">
          Get started <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>

      <button
        type="button"
        onClick={() => onNavigateToAuth('guard', 'sign-up')}
        className="landing-path-card landing-path-card-guard group w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="landing-path-card-eyebrow">Independent contractor</p>
            <p className="landing-path-card-title">I&apos;m a guard</p>
            <p className="landing-path-card-body">
              Browse jobs on the map, set your rate, work on your terms.
            </p>
          </div>
          <Shield className="landing-path-card-icon shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
        </div>
        <span className="landing-path-card-action">
          Create account <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>
    </div>
  );
}

export function HomePage({ onNavigateToAuth, themeMode, onChangeTheme, onOpenLegal }: HomePageProps) {
  const { formFactor } = useDevice();
  const isMobile = formFactor === 'mobile';
  const isTablet = formFactor === 'tablet';
  const isDesktop = formFactor === 'desktop';

  return (
    <div
      className={`landing-page page-shell min-h-screen ${isMobile ? 'landing-page--mobile' : ''} ${isTablet ? 'landing-page--tablet' : ''} ${isDesktop ? 'landing-page--desktop' : ''}`}
      data-landing-factor={formFactor}
    >
      <header className="landing-header sticky top-0 z-50 border-b border-brand-border/60 bg-brand-bg/96 backdrop-blur-xl">
        <div className="landing-container landing-header-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={isMobile ? 26 : 28} className="text-brand-primary shrink-0" />
            <span className="font-black text-xl tracking-[-0.04em] leading-none">Guardr</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="landing-header-theme" />
            {!isMobile && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('client', 'sign-in')}
                  className="landing-header-link"
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('guard', 'sign-in')}
                  className="landing-header-link"
                >
                  Guard
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="landing-header-signin"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero relative overflow-hidden">
        <div className="landing-hero-glow" aria-hidden="true">
          <div className="landing-hero-glow-a" />
          <div className="landing-hero-glow-b" />
        </div>

        <div className="landing-container landing-hero-inner">
          <div className="landing-hero-copy">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="landing-stat-pill mb-8 sm:mb-10"
            >
              Independent security marketplace
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04 }}
              className="landing-hero-title font-black tracking-[-0.04em]"
            >
              {isMobile ? (
                <>Security, when you need it.</>
              ) : (
                <>
                  Security,
                  <br />
                  when you need it.
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="landing-hero-subcopy font-medium"
            >
              Clients post jobs. Licensed guards choose assignments.
              Maps, messaging, and payments — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="landing-hero-actions"
            >
              <LandingPathCards onNavigateToAuth={onNavigateToAuth} layout={formFactor} />
              <button
                type="button"
                onClick={() => onNavigateToAuth(undefined, 'sign-in')}
                className="landing-hero-signin-link"
              >
                Already have an account? Sign in →
              </button>
            </motion.div>
          </div>

          <LandingProductPreview formFactor={formFactor} />
        </div>
      </section>

      {!isMobile && (
        <section className="landing-trust-strip" aria-label="Platform highlights">
          <div className="landing-container">
            <div className="landing-trust-grid">
              {TRUST_METRICS.map(({ value, label }) => (
                <div key={label} className="landing-trust-item">
                  <span className="landing-trust-value">{value}</span>
                  <span className="landing-trust-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="landing-section landing-how-section">
        <div className="landing-container">
          <div className="landing-section-head">
            <p className="experience-badge">How it works</p>
            <h2 className="landing-section-title">From post to paid shift</h2>
            <p className="landing-section-lead">
              A direct marketplace — clients and guards arrange each job, with Guardr handling the tools.
            </p>
          </div>
          <div className={`landing-how-grid landing-how-grid--${formFactor}`}>
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, body }, index) => (
              <motion.article
                key={step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="landing-how-card"
              >
                <div className="landing-how-card-top">
                  <span className="landing-how-step">{step}</span>
                  <span className="landing-how-icon">
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <h3 className="landing-how-title">{title}</h3>
                <p className="landing-how-body">{body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-features-section border-t border-brand-border bg-brand-bg">
        <div className="landing-container">
          <div className={`landing-features-grid landing-features-grid--${formFactor}`}>
            <article className="landing-feature-column">
              <p className="experience-badge">Client workspace</p>
              <h2 className="landing-feature-headline">
                Request coverage at your site
              </h2>
              <p className="landing-feature-lead">
                Post jobs, review licensed guards, and monitor active coverage —
                with dedicated messaging and support when you need it.
              </p>
              <ul className="landing-feature-list">
                {CLIENT_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="landing-feature-item">
                    <span className="landing-feature-icon landing-feature-icon--client">
                      <Icon className="w-5 h-5 text-brand-text" />
                    </span>
                    <div>
                      <p className="font-bold text-brand-text tracking-tight">{title}</p>
                      <p className="text-sm text-brand-text-muted mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                className="app-cta-dark landing-feature-cta"
              >
                Get started as a client
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>

            <article className="landing-feature-column landing-feature-column--guard">
              <p className="experience-badge">Guard workspace</p>
              <h2 className="landing-feature-headline">
                Work independently, get paid directly
              </h2>
              <p className="landing-feature-lead">
                Map-first job discovery, earnings tracking, credentials, and shift tools.
                You contract per assignment — not an employee of Guardr or the client.
              </p>
              <ul className="landing-feature-list">
                {GUARD_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="landing-feature-item">
                    <span className="landing-feature-icon landing-feature-icon--guard">
                      <Icon className="w-5 h-5 text-brand-primary" />
                    </span>
                    <div>
                      <p className="font-bold text-brand-text tracking-tight">{title}</p>
                      <p className="text-sm text-brand-text-muted mt-0.5 leading-relaxed">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                className="uber-button-sage landing-feature-cta"
              >
                Create guard account
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-coverage-section bg-brand-bg-sec border-t border-brand-border">
        <div className="landing-container landing-coverage-inner">
          <div className="landing-section-head landing-section-head--center">
            <h2 className="landing-section-title">Built for real-world coverage</h2>
            <p className="landing-section-lead">Any site, any shift length, any requirement.</p>
          </div>
          <div className={`landing-coverage-grid landing-coverage-grid--${formFactor}`}>
            {COVERAGE_TYPES.map((tag) => (
              <span key={tag} className="landing-coverage-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section border-t border-brand-border">
        <div className="landing-container landing-rules-inner">
          <div className="app-card-elevated landing-rules-card text-center space-y-4">
            <h2 className="text-xl font-bold">Transparent marketplace rules</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              {LEGAL_DISCLAIMER_SHORT} Each job is a direct arrangement between the client and the
              independent guard they select. We do not guarantee placement, outcomes, or on-site performance.
            </p>
            <div className={`landing-rules-pills landing-rules-pills--${formFactor}`}>
              <div className="landing-rules-pill">Clients contract per job</div>
              <div className="landing-rules-pill">Guards choose assignments</div>
              <div className="landing-rules-pill">Platform tools &amp; support</div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section border-t border-brand-border bg-brand-bg-sec">
        <div className="landing-container landing-legal-inner">
          <div className="landing-section-head landing-section-head--center">
            <h2 className="landing-section-title landing-section-title--sm">Policies &amp; data</h2>
            <p className="landing-section-lead">
              Read how Guardr handles your data and the marketplace rules for clients and guards.
            </p>
          </div>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </div>
      </section>

      <section className="landing-section landing-final-cta border-t border-brand-border bg-brand-bg">
        <div className="landing-container landing-final-cta-inner">
          <h2 className="landing-final-title font-black tracking-[-0.04em]">Ready when you are</h2>
          <p className="landing-final-lead">
            Choose your path — each experience is built for how you use Guardr.
          </p>
          <div className={`landing-final-actions landing-final-actions--${formFactor}`}>
            <button type="button" onClick={() => onNavigateToAuth('client', 'sign-up')} className="app-cta-dark">
              I need security
            </button>
            <button type="button" onClick={() => onNavigateToAuth('guard', 'sign-up')} className="app-cta-outline-dark">
              I&apos;m a guard
            </button>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="landing-final-signin"
          >
            Sign in to your account
          </button>
        </div>
      </section>

      <footer className="landing-footer border-t border-brand-border">
        <div className="landing-container landing-footer-inner">
          <div className="flex items-center gap-2">
            <Logo size={24} className="text-brand-primary" />
            <div>
              <span className="font-semibold block">Guardr</span>
              <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">
                by{' '}
                <SignatureSecuritySpecialistLink className="text-brand-text-muted hover:text-brand-primary hover:underline transition-colors uppercase tracking-wider" />
              </span>
            </div>
          </div>
          {!isMobile && <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
            <p className="text-xs text-brand-text-muted max-w-xs text-center sm:text-right">
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME} — independent contractor marketplace.
              Credential handling follows applicable state licensing rules.
            </p>
          </div>
        </div>
        {isMobile && (
          <div className="landing-footer-theme-mobile">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          </div>
        )}
      </footer>

      {isMobile && (
        <div className="landing-mobile-cta-bar" role="region" aria-label="Get started">
          <button
            type="button"
            onClick={() => onNavigateToAuth('client', 'sign-up')}
            className="landing-mobile-cta landing-mobile-cta--client"
          >
            I need security
          </button>
          <button
            type="button"
            onClick={() => onNavigateToAuth('guard', 'sign-up')}
            className="landing-mobile-cta landing-mobile-cta--guard"
          >
            I&apos;m a guard
          </button>
        </div>
      )}
    </div>
  );
}
