import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { ArrowRight, Zap, Users, Bell, Shield, Clock, BadgeCheck, DollarSign, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import type { ThemeMode } from '../lib/platform/theme';
import { SecurityRequest, SecurityGuard } from '../types';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  guardsCount: number;
  requestsCount: number;
  availableRequests: SecurityRequest[];
  sampleGuards: SecurityGuard[];
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
}

const HOW_IT_WORKS = [
  {
    icon: Shield,
    title: 'Request coverage',
    body: 'Post your security needs in minutes.',
  },
  {
    icon: Users,
    title: 'Match with guards',
    body: 'Qualified professionals accept assignments.',
  },
  {
    icon: Bell,
    title: 'Stay informed',
    body: 'Track coverage, reports, and activity from one platform.',
  },
];

const WHY_GUARDR = [
  { icon: Zap, title: 'Fast staffing', body: 'Fill shifts quickly with on-demand professionals.' },
  { icon: BadgeCheck, title: 'Verified professionals', body: 'Licensed guards with credentials on every profile.' },
  { icon: DollarSign, title: 'Transparent pricing', body: 'Clear rates and estimated totals before you commit.' },
  { icon: Radio, title: 'Real-time operations', body: 'Live coverage status, reports, and shift activity.' },
];

export function HomePage({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
}: HomePageProps) {
  return (
    <div className="page-shell min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={30} className="text-brand-primary" />
            <span className="font-bold text-lg">Guardr</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="hidden sm:flex" />
            <button
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors hidden sm:block"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-20 pb-24">
        <div
          className="hero-glow absolute top-0 left-1/2 w-[min(100%,640px)] h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--brand-primary) 18%, transparent) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6"
          >
            Security staffing.
            <br />
            On demand.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-lg sm:text-xl text-brand-text-muted leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Connect with licensed security professionals for events, properties, construction sites, and long-term coverage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="uber-button-sage w-full sm:w-auto min-w-[200px]"
            >
              Request security
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="uber-button-outline w-full sm:w-auto min-w-[200px]"
            >
              Become a guard
            </button>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-20 border-t border-brand-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="app-card p-8 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/12 flex items-center justify-center mx-auto mb-5">
                  <Icon className="w-6 h-6 text-brand-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-brand-text-muted leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Guardr */}
      <section className="px-5 py-20 bg-brand-bg-sec">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why Guardr</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_GUARDR.map(({ icon: Icon, title, body }) => (
              <div key={title} className="app-card flex gap-4 p-6">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-primary/12 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">{title}</h3>
                  <p className="text-sm text-brand-text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-brand-text-muted mb-8">
            Whether you need coverage tonight or want to pick up your next shift.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigateToAuth('client', 'sign-up')} className="uber-button-sage">
              Request security
            </button>
            <button onClick={() => onNavigateToAuth('guard', 'sign-in')} className="uber-button-outline">
              Become a guard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border px-5 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size={24} className="text-brand-primary" />
            <span className="font-semibold">Guardr</span>
          </div>
          <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          <p className="text-xs text-brand-text-muted">© {new Date().getFullYear()} Guardr</p>
        </div>
      </footer>
    </div>
  );
}
