import React, { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import {
  ShieldCheck,
  ArrowRight,
  MapPin,
  Clock,
  Briefcase,
  Users,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Lock,
  FileCheck,
  Smartphone,
  Globe,
  TrendingUp,
  Shield,
  Award,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SecurityRequest, SecurityGuard } from '../types';
import type { ThemeMode } from '../lib/platform/theme';

interface HomePageProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  guardsCount: number;
  requestsCount: number;
  availableRequests: SecurityRequest[];
  sampleGuards: SecurityGuard[];
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
}

const STATS = [
  { value: '4,200+', label: 'Licensed guards' },
  { value: '98.7%', label: 'Credential pass rate' },
  { value: '24 min', label: 'Avg. acceptance time' },
  { value: '$0', label: 'Platform vetting fee' },
];

const HOW_CLIENT = [
  { icon: Briefcase, step: '1', title: 'Post your shift', body: 'Set dates, location, job type, and required certifications. Duration and pay are calculated automatically.' },
  { icon: Users, step: '2', title: 'Browse qualified guards', body: 'Review applicants with verified licenses, experience, and ratings before you hire.' },
  { icon: CheckCircle2, step: '3', title: 'Confirm & deploy', body: 'Accept the right guard and track clock-in with GPS verification in real time.' },
];

const HOW_GUARD = [
  { icon: FileCheck, step: '1', title: 'Create your profile', body: 'Upload your state license, certifications, and experience — all stored securely on your profile.' },
  { icon: Smartphone, step: '2', title: 'Browse open shifts', body: 'See available jobs on your map or list. Filter by date, type, or rate and accept when ready.' },
  { icon: Zap, step: '3', title: 'Work & get paid', body: 'Clock in via GPS, complete digital audits, and cash out earnings after each shift.' },
];

const FEATURES = [
  { icon: Lock, title: 'Credential-gated acceptance', body: 'Guards can only accept jobs that match their verified certifications.' },
  { icon: MapPin, title: 'Real-time map dispatch', body: 'Guards see open shifts on a live map. Clients track deployed personnel.' },
  { icon: Clock, title: 'Smart scheduling', body: 'Post exact shift windows. Hours and pay are calculated automatically.' },
  { icon: ShieldCheck, title: 'Digital check-in audits', body: 'GPS clock-ins, uniform selfies, and signed end-of-shift reports.' },
  { icon: TrendingUp, title: 'Instant cashout', body: 'Receive earnings the moment a shift is confirmed complete.' },
  { icon: Globe, title: 'Direct marketplace', body: 'Clients and guards connect directly — no agency overhead.' },
];

export function HomePage({
  onNavigateToAuth,
  availableRequests,
  sampleGuards,
  themeMode,
  onChangeTheme,
}: HomePageProps) {
  const [activeHow, setActiveHow] = useState<'client' | 'guard'>('client');

  return (
    <div className={`theme-${themeMode} bg-brand-bg text-brand-text min-h-screen font-sans`}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={32} className="text-brand-primary shrink-0" />
            <span className="font-bold text-lg tracking-tight text-brand-text">Guardr</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onNavigateToAuth('client', 'sign-in')}
              className="text-brand-text-muted hover:text-brand-text transition-colors text-sm font-medium"
            >
              For clients
            </button>
            <button
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="text-brand-text-muted hover:text-brand-text transition-colors text-sm font-medium"
            >
              For guards
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="hidden sm:flex" />
            <button
              onClick={() => onNavigateToAuth(undefined, 'sign-in')}
              className="uber-button-sage h-10 px-5 text-sm"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(ellipse at center, var(--brand-primary) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            Security staffing marketplace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Security when you need it.
            <br />
            <span className="text-brand-primary">Anytime, anywhere.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-brand-text-muted text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Connect with licensed security professionals for events, properties, construction sites, and long-term contracts.
          </motion.p>

          {/* Role cards — Uber-style */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10"
          >
            <button
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="app-card app-card-interactive text-left p-6 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                <Shield className="w-6 h-6 text-brand-primary group-hover:text-brand-accent-text transition-colors" />
              </div>
              <p className="font-semibold text-lg mb-1">I need security</p>
              <p className="text-sm text-brand-text-muted mb-4">Post shifts and hire licensed guards</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                Get started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="app-card app-card-interactive text-left p-6 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                <Briefcase className="w-6 h-6 text-brand-primary group-hover:text-brand-accent-text transition-colors" />
              </div>
              <p className="font-semibold text-lg mb-1">I'm a guard</p>
              <p className="text-sm text-brand-text-muted mb-4">Browse shifts and earn on your schedule</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary">
                Sign in <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="app-card text-center py-5 px-4">
              <p className="text-2xl font-bold text-brand-primary">{value}</p>
              <p className="text-xs text-brand-text-muted mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Marketplace notice */}
      <section className="border-y border-brand-border bg-brand-bg-sec">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-brand-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-accent-text" />
          </div>
          <div>
            <p className="font-semibold">Independent contractor marketplace</p>
            <p className="text-brand-text-muted text-sm mt-1 leading-relaxed max-w-2xl">
              Guardr connects clients and licensed security professionals directly. We do not employ or vet guards — credential verification is displayed on each guard's public profile.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="uber-label mb-2">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight">Simple. Fast. Transparent.</h2>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 rounded-full bg-brand-surface border border-brand-border">
              {(['client', 'guard'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveHow(t)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeHow === t
                      ? 'bg-brand-text text-brand-bg shadow-sm'
                      : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  {t === 'client' ? 'I need a guard' : "I'm a guard"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(activeHow === 'client' ? HOW_CLIENT : HOW_GUARD).map(({ icon: Icon, step, title, body }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="app-card"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-primary/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-primary" />
                </div>
                <p className="text-xs font-semibold text-brand-primary mb-2">Step {step}</p>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => onNavigateToAuth(activeHow, activeHow === 'client' ? 'sign-up' : 'sign-in')}
              className="uber-button-sage px-8"
            >
              {activeHow === 'client' ? 'Create client account' : 'Guard sign in'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 bg-brand-bg-sec">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="uber-label mb-2">Platform capabilities</p>
            <h2 className="text-3xl font-bold tracking-tight">Built for the field</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="app-card group hover:border-brand-primary/30">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-4 group-hover:bg-brand-primary transition-colors">
                  <Icon className="w-5 h-5 text-brand-primary group-hover:text-brand-accent-text transition-colors" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-brand-text-muted text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live jobs */}
      {availableRequests.length > 0 && (
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="uber-label mb-1">Live now</p>
                <h2 className="text-2xl font-bold tracking-tight">Open shifts</h2>
              </div>
              <button
                onClick={() => onNavigateToAuth('guard', 'sign-in')}
                className="uber-button-outline h-10 px-4 text-sm"
              >
                See all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {availableRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="app-card flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-brand-accent-text text-xs font-bold">
                      {req.type === 'event' ? 'EV' : req.type === 'patrol' ? 'PT' : req.type === 'bodyguard' ? 'VIP' : 'GD'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{req.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-brand-text-muted">
                          <MapPin className="w-3 h-3" />{req.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-brand-text-muted">
                          <Clock className="w-3 h-3" />
                          {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-primary">${req.estimatedPayout}</p>
                      <p className="text-xs text-brand-text-muted">${req.hourlyRate}/hr</p>
                    </div>
                    <button
                      onClick={() => onNavigateToAuth('guard', 'sign-in')}
                      className="uber-button-sage h-9 px-4 text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guard profiles */}
      {sampleGuards.length > 0 && (
        <section className="py-20 px-4 sm:px-6 bg-brand-bg-sec">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="uber-label mb-2">On the platform</p>
              <h2 className="text-2xl font-bold tracking-tight">Licensed & ready to deploy</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sampleGuards.slice(0, 3).map((guard) => (
                <div key={guard.id} className="app-card text-center">
                  <img
                    src={guard.avatar}
                    alt={guard.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover ring-2 ring-brand-border"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-semibold">{guard.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                    <span className="text-sm font-semibold text-brand-primary">{guard.rating}</span>
                    <span className="text-xs text-brand-text-muted">· {guard.jobsCompleted} jobs</span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {guard.isArmed && (
                      <span className="text-xs font-medium bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">Armed</span>
                    )}
                    {guard.verified && (
                      <span className="text-xs font-medium bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-primary/25 text-brand-primary text-sm font-medium mb-8">
            <Award className="w-4 h-4" />
            Join 4,200+ verified contractors
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-brand-text-muted mb-10 leading-relaxed">
            Whether you need security for tonight's event or you're a licensed guard looking for your next shift — Guardr is the fastest way to connect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigateToAuth('client', 'sign-up')}
              className="uber-button-sage px-10"
            >
              Find security <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToAuth('guard', 'sign-in')}
              className="uber-button-outline px-10"
            >
              Guard sign in <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo size={28} className="text-brand-primary" />
              <div>
                <p className="font-bold">Guardr</p>
                <p className="text-xs text-brand-text-muted">Security staffing marketplace</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <button onClick={() => onNavigateToAuth('client', 'sign-in')} className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">For clients</button>
              <button onClick={() => onNavigateToAuth('guard', 'sign-in')} className="text-sm text-brand-text-muted hover:text-brand-text transition-colors">For guards</button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-xs text-brand-text-muted">© {new Date().getFullYear()} Guardr — Independent contractor marketplace</span>
            <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
          </div>
        </div>
      </footer>
    </div>
  );
}
