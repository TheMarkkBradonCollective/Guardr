import React, { useState } from 'react';
import { Logo } from './Logo';
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

type ThemeMode = 'dark' | 'light' | 'grey';

interface HomePageProps {
  onNavigateToAuth: (initialRole?: 'guard' | 'client') => void;
  guardsCount: number;
  requestsCount: number;
  availableRequests: SecurityRequest[];
  sampleGuards: SecurityGuard[];
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
}

const THEME_LABELS: Record<ThemeMode, string> = {
  'dark':  'Dark',
  'light': 'Light',
  'grey':  'Grey',
};

const STATS = [
  { value: '4,200+', label: 'Licensed Guards' },
  { value: '98.7%',  label: 'Credential Pass Rate' },
  { value: '24 min', label: 'Avg. Job Acceptance' },
  { value: '$0',     label: 'Platform Vetting Fee' },
];

const HOW_CLIENT = [
  { icon: Briefcase, step: '01', title: 'Post Your Shift', body: 'Set exact start & end dates/times, location, job type, and required certifications. Duration is auto-calculated.' },
  { icon: Users,     step: '02', title: 'Browse Qualified Guards', body: 'Reviewed applicants are licensed professionals. View certs, experience, and ratings before you hire.' },
  { icon: CheckCircle2, step: '03', title: 'Confirm & Deploy', body: 'Accept the right guard, confirm the deployment, and let them clock in digitally with GPS verification.' },
];

const HOW_GUARD = [
  { icon: FileCheck, step: '01', title: 'Create Your Profile', body: 'Upload your state license, certifications, and past experience. Everything is stored securely on your profile.' },
  { icon: Smartphone, step: '02', title: 'Browse Open Shifts', body: 'See available jobs on your map or list. Filter by date, job type, or rate — accept when ready.' },
  { icon: Zap,       step: '03', title: 'Work & Get Paid', body: 'Clock in via GPS, complete digital audits, and cash out earnings instantly after each shift.' },
];

const FEATURES = [
  { icon: Lock,        title: 'Credential-Gated Acceptance',    body: 'Guards can only accept jobs that match their verified certifications — no exceptions.' },
  { icon: MapPin,      title: 'Real-Time Map Dispatch',         body: 'Guards see open shifts on a live map. Clients track deployed personnel in real time.' },
  { icon: Clock,       title: 'Date & Time-Based Scheduling',   body: 'Post exact shift windows. The platform auto-tallies hours and calculates pay.' },
  { icon: ShieldCheck, title: 'Digital Check-In Audits',        body: 'GPS-verified clock-ins, uniform selfie audits, and signed end-of-shift reports for every job.' },
  { icon: TrendingUp,  title: 'Instant Cashout Wallet',         body: 'Guards receive earnings the moment a shift is confirmed complete — no wait, no bank delay.' },
  { icon: Globe,       title: 'Independent Contractor Market',  body: 'We are a direct-connect marketplace. Clients and guards transact directly. No agency overhead.' },
];

export function HomePage({
  onNavigateToAuth,
  guardsCount,
  requestsCount,
  availableRequests,
  sampleGuards,
  themeMode,
  onChangeTheme,
}: HomePageProps) {
  const [activeHow, setActiveHow] = useState<'client' | 'guard'>('client');

  return (
    <div className={`theme-${themeMode} bg-brand-bg text-brand-text min-h-screen font-sans selection:bg-brand-primary selection:text-black`}>

      {/* ── NAVIGATION ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={30} className="text-brand-primary shrink-0" />
            <span className="font-black text-xl tracking-tighter uppercase text-brand-text">Guardr</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigateToAuth('client')}
              className="text-brand-text-muted hover:text-brand-text transition-colors font-mono text-[11px] uppercase tracking-wider"
            >
              Client Portal
            </button>
            <button
              onClick={() => onNavigateToAuth('guard')}
              className="text-brand-text-muted hover:text-brand-text transition-colors font-mono text-[11px] uppercase tracking-wider"
            >
              Guard Portal
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme selector */}
            <div className="hidden sm:flex items-center gap-0.5 border border-brand-border p-0.5">
              {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onChangeTheme(m)}
                  title={THEME_LABELS[m]}
                  className={`px-2 py-1 text-[9px] font-mono font-bold uppercase transition-colors ${
                    themeMode === m ? 'bg-brand-primary text-black' : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  {m === 'dark' ? '●' : m === 'light' ? '○' : '◑'}
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigateToAuth('client')}
              className="uber-button-sage px-4 h-9 text-[11px] font-black uppercase tracking-wider"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse at center, var(--brand-primary) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-primary/30 bg-brand-primary/8 text-brand-primary text-[10px] font-mono uppercase tracking-wider mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            Independent Security Contractor Marketplace
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-brand-primary text-sm sm:text-base font-mono tracking-wide mb-4"
          >
            Anytime. Anywhere. Security, When You Need It.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-6"
          >
            Security Staffing,
            <br />
            <span className="text-brand-primary">On Demand.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-brand-text-muted text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Connect with licensed security professionals for events, properties, construction sites, businesses, and long-term contracts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={() => onNavigateToAuth('client')}
              className="uber-button-sage w-full sm:w-auto px-8 h-12 text-sm font-black uppercase tracking-wider gap-2"
            >
              Find Security
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToAuth('guard')}
              className="uber-button-outline w-full sm:w-auto px-8 h-12 text-sm font-black uppercase tracking-wider gap-2"
            >
              Become a Guard
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-border"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-brand-bg-sec px-6 py-5 text-center">
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-primary">{value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── NOT A VETTING AGENCY CALLOUT ───────────────── */}
      <section className="border-y border-brand-border bg-brand-primary/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="shrink-0 w-10 h-10 bg-brand-primary flex items-center justify-center text-black">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">Independent Contractor Marketplace — Not a Vetting Agency</p>
            <p className="text-brand-text-muted text-xs mt-1 leading-relaxed max-w-2xl">
              Guardr is a direct-connect platform. We do not vet, employ, or represent any security professional. Clients post and manage their own requests. Licensed security contractors browse and accept work independently. All credential verification is performed by the guard and displayed on their public profile.
            </p>
          </div>
        </div>
      </section>

      {/* ── ABOUT GUARDR ───────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-brand-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="uber-label mb-3">About Guardr</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter mb-4">
            The Uber of Security
          </h2>
          <p className="text-brand-text-muted text-sm sm:text-base leading-relaxed">
            Guardr is an independent contractor marketplace connecting licensed security professionals with clients who need security services.
            Clients post requests. Guards choose the work they want. Fast, simple, and built for modern security operations.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="uber-label mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Simple. Fast. Transparent.</h2>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex border border-brand-border p-0.5">
              {(['client', 'guard'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveHow(t)}
                  className={`px-6 py-2 text-xs font-black font-mono uppercase tracking-wider transition-colors ${
                    activeHow === t
                      ? 'bg-brand-primary text-black'
                      : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  {t === 'client' ? 'I need a guard' : 'I am a guard'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(activeHow === 'client' ? HOW_CLIENT : HOW_GUARD).map(({ icon: Icon, step, title, body }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="uber-card group cursor-default"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 bg-brand-primary flex items-center justify-center text-black group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-brand-primary font-black uppercase tracking-widest mb-1">Step {step}</p>
                    <h3 className="font-black text-sm uppercase tracking-tight mb-2">{title}</h3>
                    <p className="text-brand-text-muted text-xs leading-relaxed">{body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigateToAuth(activeHow)}
              className="uber-button-sage px-8 h-11 text-xs font-black uppercase tracking-wider gap-2"
            >
              {activeHow === 'client' ? 'Post Your First Shift' : 'Join as a Guard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="uber-label mb-3">Platform Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter">Built for the field.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-brand-bg-sec p-6 hover:bg-brand-surface transition-colors group">
                <div className="w-8 h-8 bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center mb-4 group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
                  <Icon className="w-4 h-4 text-brand-primary group-hover:text-black transition-colors" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-tight mb-2">{title}</h3>
                <p className="text-brand-text-muted text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE JOB PREVIEW ───────────────────────────── */}
      {availableRequests.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-brand-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="uber-label mb-1">Live on the Platform</p>
                <h2 className="text-2xl font-black tracking-tighter">Open Shifts Right Now</h2>
              </div>
              <button
                onClick={() => onNavigateToAuth('guard')}
                className="uber-button-outline h-9 px-4 text-[11px] font-black uppercase gap-1.5"
              >
                See All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {availableRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="uber-card flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 bg-brand-primary flex items-center justify-center text-black text-[10px] font-black font-mono">
                      {req.type === 'event' ? 'EV' : req.type === 'patrol' ? 'PT' : req.type === 'bodyguard' ? 'VIP' : req.type === 'armed-escort' ? 'ARM' : 'GD'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{req.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted">
                          <MapPin className="w-3 h-3" />{req.location}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-brand-text-muted">
                          <Clock className="w-3 h-3" />
                          {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-black font-mono text-brand-primary">${req.estimatedPayout}</p>
                      <p className="text-[10px] font-mono text-brand-text-muted">${req.hourlyRate}/hr</p>
                    </div>
                    <button
                      onClick={() => onNavigateToAuth('guard')}
                      className="uber-button-sage h-8 px-3 text-[10px] font-black uppercase gap-1"
                    >
                      Apply <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GUARD PROFILES PREVIEW ─────────────────────── */}
      {sampleGuards.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-brand-border bg-brand-bg-sec">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="uber-label mb-3">On the Platform</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter">
                Licensed & Ready to Deploy
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleGuards.slice(0, 3).map((guard) => (
                <div key={guard.id} className="uber-card text-center group">
                  <img
                    src={guard.avatar}
                    alt={guard.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-brand-border group-hover:border-brand-primary transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <h3 className="font-bold text-sm">{guard.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-brand-primary text-brand-primary" />
                    <span className="text-xs font-mono font-bold text-brand-primary">{guard.rating}</span>
                    <span className="text-[10px] text-brand-text-muted font-mono">• {guard.jobsCompleted} jobs</span>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {guard.isArmed && (
                      <span className="text-[9px] font-mono font-bold bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-1.5 py-0.5">ARMED</span>
                    )}
                    {guard.verified && (
                      <span className="text-[9px] font-mono font-bold bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-1.5 py-0.5">VERIFIED</span>
                    )}
                    {guard.certifications.slice(0, 1).map((c) => (
                      <span key={c.id} className="text-[9px] font-mono text-brand-text-muted bg-brand-border/30 px-1.5 py-0.5 truncate max-w-[120px]">{c.name.split(' ').slice(0, 3).join(' ')}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA SECTION ────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-brand-border">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-primary/30 text-brand-primary text-[10px] font-mono uppercase tracking-wider mb-8">
            <Award className="w-3.5 h-3.5" />
            Join 4,200+ Verified Contractors
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight mb-6">
            Ready to connect?
          </h2>
          <p className="text-brand-text-muted mb-10 leading-relaxed">
            Whether you need security coverage for tonight's event or you're a licensed guard looking for your next shift — Guardr is the fastest way to connect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigateToAuth('client')}
              className="uber-button-sage px-10 h-12 text-sm font-black uppercase tracking-wider gap-2"
            >
              Find Security
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToAuth('guard')}
              className="uber-button-outline px-10 h-12 text-sm font-black uppercase tracking-wider gap-2"
            >
              Become a Guard
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="border-t border-brand-border bg-brand-bg-sec">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Logo size={24} className="text-brand-primary" />
              <div>
                <p className="font-black text-sm tracking-tighter uppercase">Guardr</p>
                <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Independent Contractor Marketplace</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <button onClick={() => onNavigateToAuth('client')} className="text-[11px] font-mono text-brand-text-muted hover:text-brand-text uppercase tracking-wider transition-colors">Client Portal</button>
              <button onClick={() => onNavigateToAuth('guard')}  className="text-[11px] font-mono text-brand-text-muted hover:text-brand-text uppercase tracking-wider transition-colors">Guard Portal</button>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] font-mono text-brand-text-muted uppercase tracking-wide">
            <span>© {new Date().getFullYear()} Guardr — Not a vetting agency. Not an employer. A marketplace.</span>
            <div className="flex items-center gap-1">
              <span>Theme:</span>
              {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => onChangeTheme(m)}
                  title={THEME_LABELS[m]}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${
                    themeMode === m ? 'bg-brand-primary text-black' : 'hover:text-brand-text'
                  }`}
                >
                  {THEME_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
