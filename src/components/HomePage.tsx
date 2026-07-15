import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import {
  ArrowRight,
  BookOpen,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
  CreditCard,
  Navigation,
  BadgeCheck,
  Zap,
  Lock,
  Star,
  FileText,
  Users,
  TrendingUp,
  Smartphone,
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
import { CompanyPublicPlacard } from './public/CompanyPublicPlacard';
import type { CompanyPublicDocument } from '../lib/companyPlacard';
import { LandingAppDownloads } from './landing/LandingAppDownloads';
import { LandingPathCards } from './landing/LandingPathCards';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  ownerMessage?: string;
  directorMessage?: string;
  companyPlacardDocuments?: CompanyPublicDocument[];
}

const CLIENT_FEATURES = [
  { icon: MapPin, title: 'Post by site', body: 'Set location, hours, and coverage type in minutes. Add special requirements and let guards apply.' },
  { icon: BadgeCheck, title: 'Verified credentials', body: 'Independent guards apply with state licenses, certifications, and profile verified by the platform.' },
  { icon: Clock, title: 'Live visibility', body: 'Track check-ins, shift audits, and guard activity from one real-time dashboard.' },
];

const GUARD_FEATURES = [
  { icon: MapPin, title: 'Jobs near you', body: 'Browse open posts on the map filtered by distance, rate, and type. You choose what fits.' },
  { icon: Lock, title: 'Own your credentials', body: 'Your license, certs, and professional profile — stored on the platform and portable.' },
  { icon: CreditCard, title: 'Direct pay', body: 'Complete shifts and receive earnings through the platform. Track every payment in your dashboard.' },
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

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Navigation,
    title: 'Post or discover',
    body: 'Clients post coverage needs with full site details. Guards browse open jobs on the map in real time.',
  },
  {
    step: '02',
    icon: MessageSquare,
    title: 'Match & confirm',
    body: 'Review credentials, message directly through the platform, and lock in the job details.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Track & complete',
    body: 'Live check-ins, shift audits, incident reports, and payment — all handled through Guardr.',
  },
];

const TRUST_METRICS = [
  { value: 'Map-first', label: 'Job discovery' },
  { value: 'Licensed', label: 'Independent pros' },
  { value: 'Live', label: 'Shift tracking' },
  { value: 'Direct', label: 'Platform payments' },
];

const PLATFORM_HIGHLIGHTS = [
  {
    icon: Smartphone,
    title: 'Mobile-first design',
    body: 'Built for guards on the move. Full functionality on any device, installable as a PWA.',
  },
  {
    icon: FileText,
    title: 'Digital credentials',
    body: 'Upload licenses and certs once. They travel with your profile across every job.',
  },
  {
    icon: TrendingUp,
    title: 'Earnings tracking',
    body: 'Full history of shifts, rates, and payouts. No spreadsheets required.',
  },
  {
    icon: Users,
    title: 'Team coordination',
    body: 'Form standing crews, coordinate multi-guard posts, and manage team communications.',
  },
  {
    icon: Zap,
    title: 'Instant notifications',
    body: 'Real-time alerts for new jobs, shift updates, check-ins, and platform messages.',
  },
  {
    icon: Star,
    title: 'Reputation system',
    body: 'Build a verified track record. Clients rate completed shifts; guards build their profile.',
  },
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

export function HomePage({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  onOpenGuide,
  ownerMessage,
  directorMessage,
  companyPlacardDocuments = [],
}: HomePageProps) {
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
            <span className="landing-wordmark font-black text-xl tracking-[-0.05em] leading-none">
              Guard<span className="landing-wordmark-accent">r</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="landing-header-theme" />
            {isMobile && onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="landing-header-link p-2"
                aria-label="Open guide"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}
            <a href="#get-app" className="landing-header-link inline-flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {isMobile ? <span className="sr-only">Get app</span> : 'Get app'}
            </a>
            {!isMobile && (
              <>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="landing-header-link inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Guide
                </button>
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
              className="landing-hero-title font-black"
            >
              {isMobile ? (
                <>
                  Security,
                  <span className="landing-hero-accent"> when you need it.</span>
                </>
              ) : (
                <>
                  Security,
                  <br />
                  <span className="landing-hero-accent">when you need it.</span>
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

            {(ownerMessage?.trim() || directorMessage?.trim()) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="landing-leadership-messages space-y-3 mb-6 max-w-xl"
              >
                {ownerMessage?.trim() && (
                  <blockquote className="landing-leadership-card">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary mb-1.5">
                      Markeith White · Founder
                    </p>
                    <p className="text-sm leading-relaxed text-brand-text whitespace-pre-wrap">{ownerMessage}</p>
                  </blockquote>
                )}
                {directorMessage?.trim() && (
                  <blockquote className="landing-leadership-card">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-primary mb-1.5">
                      Tyrone Johnson · Director
                    </p>
                    <p className="text-sm leading-relaxed text-brand-text whitespace-pre-wrap">{directorMessage}</p>
                  </blockquote>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="landing-hero-actions"
            >
              <LandingPathCards onNavigateToAuth={onNavigateToAuth} layout={formFactor} />
              <LandingAppDownloads formFactor={formFactor} variant="hero" id="get-app" />
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

      {companyPlacardDocuments.length > 0 && (
        <CompanyPublicPlacard documents={companyPlacardDocuments} />
      )}

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
                Post jobs with full site details, review licensed guards, and monitor active
                coverage — with dedicated messaging and support when you need it.
              </p>
              <ul className="landing-feature-list">
                {CLIENT_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="landing-feature-item">
                    <span className="landing-feature-icon landing-feature-icon--client">
                      <Icon className="w-5 h-5 text-brand-text" strokeWidth={1.75} />
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
                Map-first job discovery, earnings tracking, digital credentials, and full shift tools.
                You contract per assignment — not an employee of Guardr or the client.
              </p>
              <ul className="landing-feature-list">
                {GUARD_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="landing-feature-item">
                    <span className="landing-feature-icon landing-feature-icon--guard">
                      <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.75} />
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
                className="app-button-primary landing-feature-cta"
              >
                Create guard account
                <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* Platform highlights section */}
      <section className="landing-section border-t border-brand-border bg-brand-bg-sec">
        <div className="landing-container">
          <div className="landing-section-head landing-section-head--center">
            <p className="experience-badge">Everything included</p>
            <h2 className="landing-section-title">Built for the job, not around it</h2>
            <p className="landing-section-lead">
              Every feature on Guardr is designed for how security work actually happens.
            </p>
          </div>
          <motion.div
            className="landing-highlights-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {PLATFORM_HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <motion.div
                key={title}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className="landing-highlight-card"
              >
                <span className="landing-highlight-icon">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="landing-highlight-title">{title}</p>
                  <p className="landing-highlight-body">{body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="landing-section landing-coverage-section border-t border-brand-border bg-brand-bg">
        <div className="landing-container landing-coverage-inner">
          <div className="landing-section-head landing-section-head--center">
            <p className="experience-badge">Coverage types</p>
            <h2 className="landing-section-title">Built for real-world coverage</h2>
            <p className="landing-section-lead">
              Any site, any shift length, any requirement. Post what you need — guards apply with
              the credentials to match.
            </p>
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

      <section className="landing-section border-t border-brand-border bg-brand-bg-sec">
        <div className="landing-container landing-rules-inner">
          <div className="app-card-elevated landing-rules-card text-center space-y-4">
            <p className="experience-badge experience-badge--center">Marketplace rules</p>
            <h2 className="text-xl font-black tracking-tight">Transparent by design</h2>
            <p className="text-sm text-brand-text-muted leading-relaxed max-w-sm mx-auto">
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

      <section className="landing-section border-t border-brand-border bg-brand-bg">
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

      <section className="landing-section landing-final-cta border-t border-brand-border bg-brand-bg-sec">
        <div className="landing-container landing-final-cta-inner">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45 }}
          >
            <p className="experience-badge experience-badge--center">Get started</p>
            <h2 className="landing-final-title font-black tracking-[-0.04em]">Ready when you are</h2>
            <p className="landing-final-lead">
              Choose your path — each experience is purpose-built for how you use Guardr.
            </p>
            <div className={`landing-final-actions landing-final-actions--${formFactor}`}>
              <button type="button" onClick={() => onNavigateToAuth('client', 'sign-up')} className="app-cta-dark">
                I need security
              </button>
              <button type="button" onClick={() => onNavigateToAuth('guard', 'sign-up')} className="app-cta-outline-dark">
                I&apos;m a guard
              </button>
            </div>
            <LandingAppDownloads formFactor={formFactor} variant="cta" />
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="landing-final-signin"
            >
              Sign in to your account
            </button>
          </motion.div>
        </div>
      </section>

      <footer className="landing-footer border-t border-brand-border bg-brand-bg">
        <div className="landing-container landing-footer-inner">
          <div className="flex items-center gap-2.5">
            <Logo size={22} className="text-brand-primary" />
            <div>
              <span className="font-black text-sm tracking-[-0.04em] block leading-none">Guardr</span>
              <span className="text-[10px] uppercase tracking-wider text-brand-text-muted mt-0.5 block">
                by{' '}
                <SignatureSecuritySpecialistLink className="text-brand-text-muted hover:text-brand-primary hover:underline transition-colors uppercase tracking-wider" />
              </span>
            </div>
          </div>
          {!isMobile && <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />}
          <div className="flex flex-col items-center sm:items-end gap-3">
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-sm font-semibold text-brand-primary hover:underline inline-flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Guide
              </button>
            )}
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
            <p className="text-xs text-brand-text-muted max-w-xs text-center sm:text-right leading-relaxed">
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}<br className="hidden sm:block" />
              Independent contractor marketplace. State licensing rules apply.
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
