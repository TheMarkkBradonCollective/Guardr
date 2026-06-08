import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import {
  Shield,
  Mail,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  User,
  Building2,
} from 'lucide-react';
import { SessionUser, SecurityGuard, Client, PlatformRole } from '../types';
import { resolvePlatformRole, ROLE_LABELS } from '../lib/permissions';

interface AuthPageProps {
  onSignIn: (user: SessionUser) => void;
  onSignUp: (profile: SecurityGuard | Client, role: 'guard' | 'client') => void | Promise<void>;
  guardsList: SecurityGuard[];
  clientsList: Client[];
  onBackToHome: () => void;
  initialRole?: 'guard' | 'client';
  initialMode?: 'sign-in' | 'sign-up';
  themeMode?: string;
}

export function AuthPage({
  onSignIn,
  onSignUp,
  guardsList,
  clientsList,
  onBackToHome,
  initialRole = 'client',
  initialMode = 'sign-in',
}: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'sign-up');
  const [role, setRole] = useState<'guard' | 'client'>(initialRole === 'guard' ? 'guard' : 'client');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');

  const [clientCompanyName, setClientCompanyName] = useState('');

  useEffect(() => {
    setRole(initialRole === 'guard' ? 'guard' : 'client');
    setIsSignUp(initialMode === 'sign-up');
    setErrorMsg('');
  }, [initialRole, initialMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) { setErrorMsg('Email address is required.'); return; }
    if (!password || password.length < 4) { setErrorMsg('Password must be at least 4 characters.'); return; }

    if (isSignUp) {
      if (!fullName) { setErrorMsg('Please enter your full name.'); return; }

      const randomId = `${role}-${Date.now()}`;

      if (role === 'client') {
        const company = clientCompanyName.trim();
        const clientProfile: Client = {
          id: randomId,
          name: fullName,
          email,
          companyName: company,
          phone: phone || '',
          avatar: '',
          totalRequests: 0,
          approved: false,
        };
        onSignUp(clientProfile, 'client');
        onSignIn({
          id: randomId,
          name: fullName,
          email,
          role: 'client',
          clientName: company || fullName,
          avatar: '',
        });
        return;
      }

      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: fullName,
        email,
        badgeNumber: `GR-${Math.floor(10000 + Math.random() * 90000)}`,
        avatar: '',
        phone: phone || '',
        bio: bio || 'Licensed security professional.',
        isArmed: false,
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

    const emailLower = email.toLowerCase();

    if (emailLower === 'm.white@signaturesecurityspecialist.com') {
      if (password !== '#FuckinDstorm11') {
        setErrorMsg('Invalid password for Director account.');
        return;
      }
      const directorId = 'staff-director';
      const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
      const directorProfile: SecurityGuard = {
        id: directorId,
        name: 'M. White',
        email: 'm.white@signaturesecurityspecialist.com',
        badgeNumber: 'DIR-00001',
        avatar: '',
        phone: '',
        bio: 'Director — Platform operations.',
        isArmed: false,
        backgroundChecked: true,
        verified: true,
        rating: 5.0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: 0,
        isStaff: true,
        staffRole: 'Director',
        userStatus: 'active',
      };
      if (!matchedGuard) await onSignUp(directorProfile, 'guard');
      onSignIn({
        id: matchedGuard?.id ?? directorId,
        name: 'M. White',
        email: 'm.white@signaturesecurityspecialist.com',
        role: 'director',
        badgeNumber: 'DIR-00001',
        avatar: matchedGuard?.avatar ?? '',
        hourlyRate: matchedGuard?.hourlyRateRequirement ?? 0,
        staffRole: 'Director',
      });
      return;
    }

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
    { id: 'guard' as const, label: 'Guard', desc: 'Licensed security professional', icon: Shield },
    { id: 'client' as const, label: 'Client', desc: 'Business seeking security', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col" id="guardr-auth-root">
      <header className="px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Logo size={28} className="text-brand-primary" />
          <span className="font-bold text-base">Guardr</span>
        </div>
        <div className="w-16" />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="app-card p-8">
            <div className="text-center mb-8">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-primary items-center justify-center mb-4">
                <Shield className="w-7 h-7 text-brand-accent-text" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-brand-text-muted text-sm mt-2">
                {isSignUp ? 'Join the Guardr marketplace' : 'Sign in to your dashboard'}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 text-red-400 text-sm px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                {errorMsg}
              </div>
            )}

            {isSignUp && (
              <div className="mb-6">
                <p className="uber-label mb-3">Account type</p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setRole(id); setErrorMsg(''); }}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        role === id
                          ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/20'
                          : 'border-brand-border hover:border-brand-primary/40 bg-brand-bg-sec'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${role === id ? 'text-brand-primary' : 'text-brand-text-muted'}`} />
                      <p className={`text-sm font-semibold ${role === id ? 'text-brand-primary' : 'text-brand-text'}`}>{label}</p>
                      <p className="text-xs text-brand-text-muted mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="uber-label block mb-2">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                    <input
                      type="text"
                      required
                      placeholder={role === 'client' ? 'Your name' : 'Officer full name'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="uber-input pl-10"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="uber-label block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="uber-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="uber-label block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uber-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && role === 'guard' && (
                <div className="space-y-4 pt-4 border-t border-brand-border">
                  <p className="uber-label">Guard details</p>
                  <p className="text-xs text-brand-text-muted">
                    Add your guard card and credentials from your profile after signing up.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Phone</label>
                      <input type="text" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="uber-input" />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Hourly rate ($)</label>
                      <input type="number" min="15" max="300" placeholder="35" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="uber-input" />
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Bio</label>
                    <textarea
                      rows={3}
                      placeholder="Experience, specialties, previous roles..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>
                </div>
              )}

              {isSignUp && role === 'client' && (
                <div className="pt-4 border-t border-brand-border">
                  <label className="uber-label block mb-2">Company name <span className="font-normal">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    className="uber-input"
                  />
                </div>
              )}

              {!isSignUp && (
                <p className="text-xs text-brand-text-muted text-center leading-relaxed">
                  Platform staff ({ROLE_LABELS.moderator}, {ROLE_LABELS.administrator}, {ROLE_LABELS.director}) sign in with credentials provisioned by your Director.
                </p>
              )}

              <button type="submit" className="uber-button-sage w-full mt-2">
                {isSignUp ? 'Create account' : 'Sign in'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-brand-text-muted">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>{' '}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
                className="text-brand-primary hover:underline font-semibold"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-brand-text-muted leading-relaxed px-4">
            Guardr is an independent contractor marketplace. We do not employ or vet security professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
