import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../lib/platform/theme';
import { SignatureSecuritySpecialistLink } from './SignatureSecuritySpecialistLink';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
}

const CLIENT_STEPS = [
  {
    title: 'Create a request',
    body: 'Open your client dashboard and post a security job offer.',
  },
  {
    title: 'Submit job details',
    body: 'Specify date, time, location, and desired hourly rate.',
  },
  {
    title: 'Staff reviews and approves',
    body: 'Guardr staff verifies and approves the offer before payment unlocks.',
  },
  {
    title: 'Qualified guards apply',
    body: 'Licensed independent security professionals apply for the job.',
  },
  {
    title: 'Coverage begins',
    body: 'Staff approves the best fit — check-ins and audits keep everyone visible.',
    highlight: true,
  },
];

const GUARD_STEPS = [
  {
    title: 'Sign up as an independent contractor',
    body: 'Register your local license details on the platform.',
  },
  {
    title: 'Upload certifications and credentials',
    body: 'Present guard cards, weapons permits, and training files.',
  },
  {
    title: 'Get access to available jobs',
    body: 'View matching coverage demands in real time.',
  },
  {
    title: 'Accept jobs that match your schedule',
    body: 'No quotas. Work whenever you decide is appropriate.',
    accent: true,
  },
  {
    title: 'Work and get paid directly',
    body: 'Get paid upon job completion through the platform.',
    highlight: true,
  },
];

const FLEXIBILITY_TAGS = [
  'Event Security',
  'Construction Sites',
  'Retail Protection',
  'Nightlife & Events',
  'Short & Recurring',
];

const PLATFORM_MANDATES = [
  'Guardr does not employ guards.',
  'Guardr does not guarantee placement.',
  'Guardr provides the system that makes connection possible.',
];

function StepList({
  steps,
}: {
  steps: Array<{ title: string; body: string; highlight?: boolean; accent?: boolean }>;
}) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
              step.highlight
                ? 'bg-brand-primary text-brand-bg'
                : 'border border-brand-border text-brand-text'
            }`}
          >
            {index + 1}
          </span>
          <div>
            <h4
              className={`text-sm font-semibold ${
                step.highlight ? 'text-brand-primary' : step.accent ? 'text-brand-primary' : 'text-brand-text'
              }`}
            >
              {step.title}
            </h4>
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HomePage({ onNavigateToAuth, themeMode, onChangeTheme }: HomePageProps) {
  return (
    <div className="page-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={30} className="text-brand-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-lg block leading-tight">Guardr</span>
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
              className="text-xs sm:text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors hidden md:block"
            >
              Client sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="text-xs sm:text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors hidden md:block"
            >
              Guard sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors sm:hidden"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth(undefined, 'sign-up')}
              className="uber-button-sage text-sm h-9 px-4"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="onboarding-hero relative h-[min(48vh,20rem)] bg-gradient-to-br from-brand-primary/30 via-brand-primary/12 to-brand-bg flex items-end justify-center overflow-hidden">
          <div
            className="hero-glow absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(100%,480px)] h-56 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, color-mix(in srgb, var(--brand-primary) 22%, transparent) 0%, transparent 70%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-brand-bg rounded-t-[2.5rem]" />
        </div>

        <div className="relative px-5 pt-8 pb-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-[11px] font-semibold uppercase tracking-wide mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            Verified contractor marketplace
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-none">Guardr</h1>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-brand-text-muted mt-3">
              by{' '}
              <SignatureSecuritySpecialistLink className="text-brand-text-muted hover:text-brand-primary hover:underline transition-colors uppercase tracking-[0.22em]" />
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-lg sm:text-2xl font-semibold text-brand-primary tracking-wide"
          >
            Independent Security Staffing. On Demand.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-base sm:text-lg text-brand-text-muted leading-relaxed max-w-2xl mx-auto mt-5"
          >
            Guardr connects clients with verified independent security professionals ready for assignment.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="text-sm font-medium text-brand-text mt-6 px-4 py-3 rounded-xl border border-brand-border bg-brand-bg-sec max-w-md mx-auto"
          >
            Anytime. Anywhere. Security, when you need it.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm text-brand-text-muted max-w-xl mx-auto mt-5 leading-relaxed"
          >
            We are an <span className="text-brand-text font-medium">independent contractor marketplace</span> that
            connects licensed security professionals directly with clients who need coverage — fast, flexible, and
            transparent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto"
          >
            <button
              type="button"
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="app-button-primary flex-1"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToAuth('guard', 'sign-up')}
              className="app-button-outline flex-1"
            >
              Sign up as a guard
            </button>
          </motion.div>

          <button
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="mt-4 text-sm font-semibold text-brand-primary hover:underline"
          >
            I already have an account
          </button>
        </div>
      </section>

      <section className="px-5 py-16 border-t border-brand-border">
        <div className="max-w-4xl mx-auto app-card p-8 sm:p-10 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">Direct assignment</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Get Security Coverage When You Need It</h2>
          <p className="text-base sm:text-lg text-brand-text-muted italic">
            Post a request. Get qualified guards. Confirm coverage.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-brand-border bg-brand-bg-sec px-4 py-3 text-sm font-medium text-brand-primary">
              No long hiring cycles.
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-sec px-4 py-3 text-sm font-medium text-brand-primary">
              No staffing middlemen.
            </div>
          </div>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Guardr lets you request security personnel by time, location, and job type — then independent contractors
            choose the jobs that fit them.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 bg-brand-bg-sec border-t border-brand-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">Transparent system</p>
            <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="app-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-brand-border pb-4">
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted mb-1">For clients</p>
                <h3 className="text-lg font-semibold">Request coverage</h3>
              </div>
              <StepList steps={CLIENT_STEPS} />
            </div>
            <div className="app-card p-6 sm:p-8 space-y-5">
              <div className="border-b border-brand-border pb-4">
                <p className="text-[11px] uppercase tracking-wide text-brand-text-muted mb-1">Independent contractor</p>
                <h3 className="text-lg font-semibold">For guards</h3>
              </div>
              <StepList steps={GUARD_STEPS} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 border-t border-brand-border">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">Operational diversity</p>
            <h2 className="text-2xl sm:text-3xl font-bold">Built for Flexibility</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {FLEXIBILITY_TAGS.map((tag) => (
              <div key={tag} className="app-card p-4 text-center">
                <span className="text-xs font-semibold text-brand-primary">{tag}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-brand-text-muted max-w-xl mx-auto app-card px-4 py-3">
            Guardr is designed for real-world coverage needs that change by the hour, not by the month.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-3xl mx-auto app-card p-8 sm:p-10 text-center space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-primary">Platform mandates</p>
          <h2 className="text-xl sm:text-2xl font-bold">Independent. Transparent. Fast.</h2>
          <p className="text-sm text-brand-text-muted leading-relaxed max-w-xl mx-auto">
            Every assignment is a direct agreement between clients and independent contractors.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-sm">
            {PLATFORM_MANDATES.map((line, index) => (
              <div key={line} className="rounded-xl border border-brand-border bg-brand-bg px-3 py-3 text-brand-text-muted">
                {index < 2 ? `✖ ${line}` : `✔ ${line}`}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 border-t border-brand-border">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start Using Guardr</h2>
          <p className="text-lg font-semibold text-brand-primary">Need coverage? Or ready to take jobs?</p>
          <p className="text-sm text-brand-text-muted">Join Guardr today and stay ready.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
            <button type="button" onClick={() => onNavigateToAuth('client', 'sign-up')} className="uber-button-sage flex-1">
              Get started
            </button>
            <button type="button" onClick={() => onNavigateToAuth('guard', 'sign-up')} className="uber-button-outline flex-1">
              Sign up as a guard
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-border px-5 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
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
          <div className="text-xs text-brand-text-muted max-w-xs space-y-1">
            <p>© {new Date().getFullYear()} Guardr — all data handled according to state license laws.</p>
            <p className="uppercase tracking-wide text-[10px]">
              Powered by{' '}
              <SignatureSecuritySpecialistLink className="text-brand-text-muted hover:text-brand-primary hover:underline transition-colors uppercase tracking-wide" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
