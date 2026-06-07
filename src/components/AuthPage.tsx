import React, { useState } from 'react';
import { Logo } from './Logo';
import {
  Shield,
  User,
  Mail,
  Briefcase,
  Phone,
  DollarSign,
  Lock,
  Key,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SessionUser, SecurityGuard, Client, PlatformRole } from '../types';
import { resolvePlatformRole, ROLE_LABELS } from '../lib/permissions';

interface AuthPageProps {
  onSignIn: (user: SessionUser) => void;
  onSignUp: (profile: SecurityGuard | Client, role: 'guard' | 'client') => void;
  guardsList: SecurityGuard[];
  clientsList: Client[];
  onBackToHome: () => void;
  initialRole?: 'guard' | 'client';
  themeMode?: string;
}

export function AuthPage({
  onSignIn,
  onSignUp,
  guardsList,
  clientsList,
  onBackToHome,
  initialRole = 'client',
}: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [role, setRole] = useState<'guard' | 'client'>(initialRole === 'guard' ? 'guard' : 'client');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [badgeNumber, setBadgeNumber] = useState('');
  const [phone, setPhone]             = useState('');
  const [bio, setBio]                 = useState('');
  const [hourlyRate, setHourlyRate]   = useState('35');
  const [isArmed, setIsArmed]         = useState(false);

  const [clientCompanyName, setClientCompanyName] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) { setErrorMsg('Email address is required.'); return; }
    if (!password || password.length < 4) { setErrorMsg('Password must be at least 4 characters.'); return; }

    if (isSignUp) {
      if (!fullName) { setErrorMsg('Please enter your full name.'); return; }

      const randomId = `${role}-${Date.now()}`;
      const avatarMap = {
        guard: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        client: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      };

      if (role === 'client') {
        const clientProfile: Client = {
          id: randomId,
          name: fullName,
          email,
          companyName: clientCompanyName || fullName,
          phone: phone || '+1 (555) 000-0000',
          avatar: avatarMap.client,
          totalRequests: 0,
          approved: false,
        };
        onSignUp(clientProfile, 'client');
        onSignIn({
          id: randomId,
          name: fullName,
          email,
          role: 'client',
          clientName: clientCompanyName || fullName,
          avatar: avatarMap.client,
        });
        return;
      }

      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: fullName,
        email,
        badgeNumber: badgeNumber || `S-${Math.floor(10000 + Math.random() * 90000)}`,
        avatar: avatarMap.guard,
        phone: phone || '+1 (555) 000-0000',
        bio: bio || 'Licensed security professional.',
        isArmed,
        backgroundChecked: false,
        verified: false,
        rating: 0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: parseInt(hourlyRate) || 35,
        userStatus: 'active',
      };

      onSignUp(newGuardProfile, 'guard');
      onSignIn({
        id: randomId,
        name: fullName,
        email,
        role: 'guard',
        badgeNumber: newGuardProfile.badgeNumber,
        avatar: newGuardProfile.avatar,
        hourlyRate: newGuardProfile.hourlyRateRequirement,
      });
      return;
    }

    // ── SIGN IN ──────────────────────────────────────────────
    const emailLower = email.toLowerCase();

    // Director override
    if (emailLower === 'm.white@signaturesecurityspecialist.com') {
      if (password !== '#FuckinDstorm11') { setErrorMsg('Invalid password for Director account.'); return; }
      const directorId = 'staff-director';
      const matchedGuard = guardsList.find(g => g.email.toLowerCase() === emailLower);
      const directorProfile: SecurityGuard = {
        id: directorId,
        name: 'M. White',
        email: 'm.white@signaturesecurityspecialist.com',
        badgeNumber: 'DIR-00001',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 999-1111',
        bio: 'Director & Founder of Guardr. Platform master control access.',
        isArmed: true, backgroundChecked: true, verified: true,
        rating: 5.0, jobsCompleted: 150, certifications: [], experience: [],
        hourlyRateRequirement: 100, isStaff: true, staffRole: 'Director', userStatus: 'active',
      };
      if (!matchedGuard) onSignUp(directorProfile, 'guard');
      onSignIn({
        id: matchedGuard?.id || directorId,
        name: 'M. White',
        email: 'm.white@signaturesecurityspecialist.com',
        role: 'director',
        badgeNumber: 'DIR-00001',
        avatar: directorProfile.avatar,
        hourlyRate: 100,
        staffRole: 'Director',
      });
      return;
    }

    // Check clients list first (own separate table)
    const matchedClient = clientsList.find(c => c.email.toLowerCase() === emailLower);
    if (matchedClient) {
      onSignIn({
        id: matchedClient.id,
        name: matchedClient.name,
        email: matchedClient.email,
        role: 'client',
        clientName: matchedClient.companyName || matchedClient.name,
        avatar: matchedClient.avatar,
      });
      return;
    }

    const matchedGuard = guardsList.find(g => g.email.toLowerCase() === emailLower);
    if (matchedGuard) {
      if (matchedGuard.userStatus === 'blocked') { setErrorMsg('Account blocked. Contact administration.'); return; }
      const platformRole: PlatformRole = resolvePlatformRole({
        isStaff: matchedGuard.isStaff,
        staffRole: matchedGuard.staffRole,
      });
      onSignIn({
        id: matchedGuard.id,
        name: matchedGuard.name,
        email: matchedGuard.email,
        role: platformRole,
        badgeNumber: matchedGuard.badgeNumber,
        avatar: matchedGuard.avatar,
        hourlyRate: matchedGuard.hourlyRateRequirement,
        staffRole: matchedGuard.staffRole,
      });
    } else {
      setErrorMsg('Account not found. Please sign up or check your email address.');
    }
  };

  const ROLES = [
    { id: 'guard' as const, label: 'Guard', desc: 'Licensed security professional' },
    { id: 'client' as const, label: 'Client', desc: 'Business seeking security' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col" id="guardr-auth-root">
      {/* Top nav bar */}
      <header className="border-b border-brand-border bg-brand-bg-sec px-4 sm:px-6 h-14 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text transition-colors text-xs font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Logo size={22} className="text-brand-primary" />
          <span className="font-black text-sm tracking-tighter uppercase">Guardr</span>
        </div>
        <div className="w-16" /> {/* balance */}
      </header>

      <div className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-brand-primary items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-brand-text-muted text-xs font-mono mt-1">
              {isSignUp ? 'Join the Guardr marketplace' : 'Access your Guardr dashboard'}
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 border border-red-500/30 bg-red-500/8 text-red-400 text-xs font-mono px-3 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Role selector (sign up only) */}
          {isSignUp && (
            <div className="mb-6">
              <p className="uber-label mb-2">Account Type</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setRole(id); setErrorMsg(''); }}
                    className={`text-left border p-3 transition-all ${
                      role === id
                        ? 'border-brand-primary bg-brand-primary/8'
                        : 'border-brand-border hover:border-brand-primary/50 bg-brand-bg-sec'
                    }`}
                  >
                    <p className={`text-xs font-black uppercase font-mono ${role === id ? 'text-brand-primary' : 'text-brand-text'}`}>{label}</p>
                    <p className="text-[10px] text-brand-text-muted mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">

            {isSignUp && (
              <div>
                <label className="uber-label block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder={role === 'client' ? 'Your Name / Contact Person' : 'Officer Full Name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="uber-input"
                />
              </div>
            )}

            <div>
              <label className="uber-label block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="uber-input"
              />
            </div>

            <div>
              <label className="uber-label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="uber-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Guard-specific fields */}
            {isSignUp && role === 'guard' && (
              <div className="space-y-3 pt-3 border-t border-brand-border">
                <p className="uber-label">Guard Details</p>
                <div>
                  <label className="uber-label block mb-1.5">State License / Badge No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. G-22109"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="uber-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="uber-label block mb-1.5">Phone</label>
                    <input type="text" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="uber-input" />
                  </div>
                  <div>
                    <label className="uber-label block mb-1.5">Hourly Rate ($)</label>
                    <input type="number" min="15" max="300" placeholder="35" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="uber-input" />
                  </div>
                </div>
                <div>
                  <label className="uber-label block mb-1.5">Professional Bio</label>
                  <textarea
                    rows={3}
                    placeholder="Years of experience, specialties, previous roles..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="uber-input resize-none"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-colors ${isArmed ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'}`}>
                    {isArmed && <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" checked={isArmed} onChange={(e) => setIsArmed(e.target.checked)} className="sr-only" />
                  <span className="text-xs font-mono text-brand-text-muted group-hover:text-brand-text transition-colors">Armed Security Permit Holder</span>
                </label>
              </div>
            )}

            {/* Client-specific fields */}
            {isSignUp && role === 'client' && (
              <div className="pt-3 border-t border-brand-border">
                <label className="uber-label block mb-1.5">Business / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Corp / Your Name"
                  value={clientCompanyName}
                  onChange={(e) => setClientCompanyName(e.target.value)}
                  className="uber-input"
                />
              </div>
            )}

            {/* Platform staff sign in via Director-provisioned accounts */}
            {!isSignUp && (
              <p className="text-[10px] font-mono text-brand-text-muted text-center mt-4 leading-relaxed">
                Platform staff ({ROLE_LABELS.moderator}, {ROLE_LABELS.administrator}, {ROLE_LABELS.director}) sign in with credentials provisioned by your Director.
              </p>
            )}

            <button
              type="submit"
              className="uber-button-sage w-full h-12 text-sm font-black uppercase tracking-wider gap-2 mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch auth mode */}
          <div className="mt-6 text-center text-xs font-mono">
            <span className="text-brand-text-muted">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
              className="text-brand-primary hover:underline font-bold transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-center text-[10px] font-mono text-brand-text-muted leading-relaxed opacity-70">
            Guardr is an independent contractor marketplace. We do not employ or vet security professionals. All licensing is the responsibility of the individual contractor.
          </p>
        </div>
      </div>
    </div>
  );
}
