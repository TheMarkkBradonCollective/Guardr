import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { ArrowRight, Building2, Shield, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../lib/platform/theme';
import { SignatureSecuritySpecialistLink } from './SignatureSecuritySpecialistLink';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
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

export function HomePage({ onNavigateToAuth, themeMode, onChangeTheme, onOpenLegal }: HomePageProps) {
  return (
    <div className="page-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-bg/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={30} className="text-brand-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-lg block leading-tight tracking-tight">Guardr</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-brand-text-muted hidden sm:block truncate">
                by{' '}
                <SignatureSecuritySpecialistLink className="text-brand-text-muted hover:text-brand-primary hover:underline transition-colors" />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-in')}
              className="text-xs sm:text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors hidden md:block"
            >
              Client sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="text-xs sm:text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors hidden md:block"
            >
              Guard sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="text-sm font-semibold text-brand-text-muted hover:text-brand-text transition-colors sm:hidden"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[min(80vw,520px)] h-[min(80vw,520px)] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(94,123,97,0.35) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="landing-stat-pill mb-8"
          >
            Independent security marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] max-w-3xl text-white"
          >
            Security coverage, on your terms.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg sm:text-xl text-white/75 max-w-2xl leading-relaxed"
          >
            Clients post jobs. Licensed guards choose assignments. {LEGAL_ENTITY_NAME} operates the
            technology that connects both sides — maps, messaging, payments, and support — without
            providing security services or employing guards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
          >
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="landing-path-card landing-path-card-client group w-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">
                    For businesses & sites
                  </p>
                  <p className="text-xl font-bold text-brand-text">I need security</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                    Post coverage by time and location. Review qualified guards. Manage live shifts.
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-brand-text shrink-0 opacity-80 group-hover:scale-105 transition-transform" />
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-text">
                Get started <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-up')}
              className="landing-path-card landing-path-card-guard group w-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary mb-2">
                    Independent contractor
                  </p>
                  <p className="text-xl font-bold text-brand-text">I&apos;m a licensed guard</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                    Browse jobs on the map, set your rate, and work when you want — you run your business.
                  </p>
                </div>
                <Shield className="w-8 h-8 text-brand-primary shrink-0 group-hover:scale-105 transition-transform" />
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
                Create guard account <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="mt-6 text-sm font-semibold text-white/70 hover:text-white underline-offset-4 hover:underline"
          >
            I already have an account
          </motion.button>
        </div>
      </section>

      <section className="px-5 py-20 border-t border-brand-border bg-brand-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="experience-badge">Client workspace</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Request coverage at your site
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-8">
                Your dashboard is built for posting jobs, reviewing guards, and monitoring active coverage —
                separate from the guard experience, with dedicated support when you need it.
              </p>
              <ul className="space-y-5">
                {CLIENT_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="w-10 h-10 rounded-xl bg-brand-bg-sec border border-brand-border flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-text" />
                    </span>
                    <div>
                      <p className="font-semibold text-brand-text">{title}</p>
                      <p className="text-sm text-brand-text-muted mt-0.5">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('client', 'sign-up')}
                className="app-cta-dark mt-8 w-full sm:w-auto"
              >
                Open client dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="experience-badge">Guard workspace</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Work independently, get paid directly
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-8">
                Guards use their own app shell — map-first job discovery, earnings, credentials, and shift tools.
                You are not an employee of Guardr or the client; you contract per assignment.
              </p>
              <ul className="space-y-5">
                {GUARD_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-primary" />
                    </span>
                    <div>
                      <p className="font-semibold text-brand-text">{title}</p>
                      <p className="text-sm text-brand-text-muted mt-0.5">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigateToAuth('guard', 'sign-up')}
                className="uber-button-sage mt-8 w-full sm:w-auto"
              >
                Open guard dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 bg-brand-bg-sec border-t border-brand-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Built for real-world coverage</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {COVERAGE_TYPES.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full text-sm font-semibold bg-brand-bg border border-brand-border text-brand-text"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 border-t border-brand-border">
        <div className="max-w-3xl mx-auto app-card-elevated p-8 sm:p-10 text-center space-y-4">
          <h2 className="text-xl font-bold">Transparent marketplace rules</h2>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {LEGAL_DISCLAIMER_SHORT} Each job is a direct arrangement between the client and the
            independent guard they select. We do not guarantee placement, outcomes, or on-site performance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-brand-text-muted">
            <div className="rounded-xl border border-brand-border px-3 py-3">Clients contract per job</div>
            <div className="rounded-xl border border-brand-border px-3 py-3">Guards choose assignments</div>
            <div className="rounded-xl border border-brand-border px-3 py-3">Platform tools &amp; support</div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready when you are</h2>
          <p className="text-brand-text-muted">Choose your path — each experience is tailored to how you use Guardr.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={() => onNavigateToAuth('client', 'sign-up')} className="app-cta-dark flex-1">
              I need security
            </button>
            <button type="button" onClick={() => onNavigateToAuth('guard', 'sign-up')} className="app-cta-outline-dark flex-1">
              I&apos;m a guard
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-border px-5 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
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
          <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          <div className="flex flex-col items-center sm:items-end gap-3">
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
            <p className="text-xs text-brand-text-muted max-w-xs text-center sm:text-right">
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME} — independent contractor marketplace.
              Credential handling follows applicable state licensing rules.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
