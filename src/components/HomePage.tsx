import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { ArrowRight, Building2, Shield, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../lib/platform/theme';
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

export function HomePage({ onNavigateToAuth, themeMode, onChangeTheme, onOpenLegal }: HomePageProps) {
  return (
    <div className="page-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-brand-border/60 bg-brand-bg/96 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={28} className="text-brand-primary shrink-0" />
            <span className="font-black text-xl tracking-[-0.04em] leading-none">Guardr</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-in')}
              className="text-sm font-bold text-brand-text-muted hover:text-brand-text transition-colors hidden md:block tracking-tight"
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="text-sm font-bold text-brand-text-muted hover:text-brand-text transition-colors hidden md:block tracking-tight"
            >
              Guard
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="text-sm font-bold px-4 py-2 rounded-full border border-brand-border text-brand-text hover:border-brand-text transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <section className="landing-hero-dark relative overflow-hidden">
        {/* Ambient green glow — Uber-style background accent */}
        <div className="absolute inset-0 opacity-45 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[min(70vw,480px)] h-[min(70vw,480px)] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(107,143,110,0.28) 0%, transparent 68%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-[min(50vw,320px)] h-[min(50vw,320px)] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(107,143,110,0.14) 0%, transparent 65%)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="landing-stat-pill mb-10"
          >
            Independent security marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.04 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.92] max-w-4xl text-white"
          >
            Security,<br className="hidden sm:block" /> when you need it.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-7 text-lg sm:text-xl text-white/72 max-w-xl leading-relaxed font-medium"
          >
            Clients post jobs. Licensed guards choose assignments.
            Maps, messaging, and payments — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl"
          >
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="landing-path-card landing-path-card-client group w-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-text-muted mb-2.5">
                    For businesses &amp; sites
                  </p>
                  <p className="text-xl font-black tracking-tight text-brand-text">I need security</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                    Post coverage, review guards, monitor live shifts.
                  </p>
                </div>
                <Building2 className="w-7 h-7 text-brand-text shrink-0 opacity-75 mt-0.5 group-hover:scale-105 transition-transform" />
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-text">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary mb-2.5">
                    Independent contractor
                  </p>
                  <p className="text-xl font-black tracking-tight text-brand-text">I&apos;m a guard</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
                    Browse jobs on the map, set your rate, work on your terms.
                  </p>
                </div>
                <Shield className="w-7 h-7 text-brand-primary shrink-0 mt-0.5 group-hover:scale-105 transition-transform" />
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary">
                Create account <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="mt-7 text-sm font-semibold text-white/65 hover:text-white underline-offset-4 hover:underline transition-colors"
          >
            Already have an account? Sign in →
          </motion.button>
        </div>
      </section>

      <section className="px-5 py-20 border-t border-brand-border bg-brand-bg">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <p className="experience-badge">Client workspace</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.035em] leading-tight mb-4">
                Request coverage<br className="hidden sm:block" /> at your site
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-8 text-base">
                Post jobs, review licensed guards, and monitor active coverage —
                with dedicated messaging and support when you need it.
              </p>
              <ul className="space-y-5">
                {CLIENT_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4 items-start">
                    <span className="w-10 h-10 bg-brand-bg-sec border border-brand-border flex items-center justify-center shrink-0 rounded-lg">
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
                className="app-cta-dark mt-8 w-full sm:w-auto"
              >
                Get started as a client
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="experience-badge">Guard workspace</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.035em] leading-tight mb-4">
                Work independently,<br className="hidden sm:block" /> get paid directly
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-8 text-base">
                Map-first job discovery, earnings tracking, credentials, and shift tools.
                You contract per assignment — not an employee of Guardr or the client.
              </p>
              <ul className="space-y-5">
                {GUARD_FEATURES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4 items-start">
                    <span className="w-10 h-10 bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0 rounded-lg">
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
                className="uber-button-sage mt-8 w-full sm:w-auto"
              >
                Create guard account
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 bg-brand-bg-sec border-t border-brand-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] mb-3">Built for real-world coverage</h2>
          <p className="text-sm text-brand-text-muted mb-8 font-medium">Any site, any shift length, any requirement.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COVERAGE_TYPES.map((tag) => (
              <span
                key={tag}
                className="px-5 py-2.5 rounded-full text-sm font-bold bg-brand-bg border border-brand-border text-brand-text tracking-tight"
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

      <section className="px-5 py-16 border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold">Policies &amp; data</h2>
            <p className="text-sm text-brand-text-muted mt-2 max-w-xl mx-auto">
              Read how Guardr handles your data and the marketplace rules for clients and guards.
            </p>
          </div>
          <LegalInfoCards onOpenLegal={onOpenLegal} />
        </div>
      </section>

      <section className="px-5 py-24 border-t border-brand-border bg-brand-bg">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-tight">Ready when you are</h2>
          <p className="text-brand-text-muted font-medium">Choose your path — each experience is built for how you use Guardr.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button type="button" onClick={() => onNavigateToAuth('client', 'sign-up')} className="app-cta-dark flex-1">
              I need security
            </button>
            <button type="button" onClick={() => onNavigateToAuth('guard', 'sign-up')} className="app-cta-outline-dark flex-1">
              I&apos;m a guard
            </button>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="text-sm font-semibold text-brand-text-muted hover:text-brand-primary transition-colors underline-offset-4 hover:underline"
          >
            Sign in to your account
          </button>
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
