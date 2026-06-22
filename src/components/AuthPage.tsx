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
import { PersonNameFields } from './profile/PersonNameFields';
import { personNameFromPayload } from '../lib/personName';
import { SessionUser, SecurityGuard, Client, PlatformRole } from '../types';
import { resolvePlatformRole, ROLE_LABELS } from '../lib/permissions';
import type { LegalPageId } from '../lib/legalContent';
import { LEGAL_ENTITY_NAME, SITE_NAME } from '../lib/siteConfig';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import {
  getStoredPassword,
  shouldPromptPasswordChange,
  verifyAccountPassword,
} from '../lib/accountPasswords';

const OWNER_BOOTSTRAP_ACCOUNTS: Record<
  string,
  { password: string; defaultName: string; badgeNumber: string; id: string }
> = {
  'owner@signaturesecurityspecialist.com': {
    password: '#GuardrOwner2026',
    defaultName: 'Platform Owner',
    badgeNumber: 'OWN-00001',
    id: 'staff-owner',
  },
};

const DIRECTOR_BOOTSTRAP_ACCOUNTS: Record<
  string,
  { password: string; defaultName: string; badgeNumber: string; id: string }
> = {
  'm.white@signaturesecurityspecialist.com': {
    password: '#FuckinDstorm11',
    defaultName: 'M. White',
    badgeNumber: 'DIR-00001',
    id: 'staff-director',
  },
  't.johnson@signaturesecurityspecialist.com': {
    password: '#Qwerty12345',
    defaultName: 'Tyrone Johnson',
    badgeNumber: 'DIR-00002',
    id: 'staff-director-tyrone',
  },
};

interface AuthPageProps {
  onSignIn: (user: SessionUser, options?: { passwordChangeRecommended?: boolean }) => void;
  onSignUp: (
    profile: SecurityGuard | Client,
    role: 'guard' | 'client',
    password: string
  ) => void | Promise<void>;
  guardsList: SecurityGuard[];
  clientsList: Client[];
  onBackToHome: () => void;
  onOpenLegal?: (page: LegalPageId) => void;
  initialRole?: 'guard' | 'client';
  initialMode?: 'sign-in' | 'sign-up';
  themeMode?: string;
}

function resolveStoredPassword(
  emailLower: string,
  account?: SecurityGuard | Client | null
): string | undefined {
  return account?.password ?? getStoredPassword(emailLower)?.password;
}

function signInOptionsForPassword(stored: string | undefined) {
  return { passwordChangeRecommended: shouldPromptPasswordChange(stored) };
}

export function AuthPage({
  onSignIn,
  onSignUp,
  guardsList,
  clientsList,
  onBackToHome,
  onOpenLegal,
  initialRole = 'client',
  initialMode = 'sign-in',
}: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'sign-up');
  const [role, setRole] = useState<'guard' | 'client'>(initialRole === 'guard' ? 'guard' : 'client');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');

  const [clientCompanyName, setClientCompanyName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    setRole(initialRole === 'guard' ? 'guard' : 'client');
    setIsSignUp(initialMode === 'sign-up');
    setErrorMsg('');
  }, [initialRole, initialMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (isSignUp) {
      if (!acceptedTerms) {
        setErrorMsg('Please accept the Terms of Service and Privacy Policy to create an account.');
        return;
      }
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Please enter your first and last name.');
        return;
      }

      const emailLower = email.trim().toLowerCase();
      if (
        clientsList.some((c) => c.email.toLowerCase() === emailLower) ||
        guardsList.some((g) => g.email.toLowerCase() === emailLower)
      ) {
        setErrorMsg('An account with this email already exists. Sign in instead.');
        return;
      }

      const normalized = personNameFromPayload({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
      });
      const randomId = `${role}-${Date.now()}`;

      if (role === 'client') {
        const company = clientCompanyName.trim();
        const clientProfile: Client = {
          id: randomId,
          name: normalized.name,
          firstName: normalized.firstName,
          middleName: normalized.middleName,
          lastName: normalized.lastName,
          email,
          companyName: company,
          phone: phone || '',
          avatar: '',
          totalRequests: 0,
          approved: false,
          accountStatus: 'pending',
        };
        try {
          await onSignUp(clientProfile, 'client', password);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
          return;
        }
        onSignIn(
          {
            id: randomId,
            name: normalized.name,
            email,
            role: 'client',
            clientName: company || normalized.name,
            avatar: '',
          },
          signInOptionsForPassword(password)
        );
        return;
      }

      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: normalized.name,
        firstName: normalized.firstName,
        middleName: normalized.middleName,
        lastName: normalized.lastName,
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
        userStatus: 'pending',
      };

      try {
        await onSignUp(newGuardProfile, 'guard', password);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
        return;
      }
      onSignIn(
        {
          id: randomId,
          name: normalized.name,
          email,
          role: 'guard',
          badgeNumber: newGuardProfile.badgeNumber,
          avatar: newGuardProfile.avatar,
          hourlyRate: newGuardProfile.hourlyRateRequirement,
        },
        signInOptionsForPassword(password)
      );
      return;
    }

    const emailLower = email.toLowerCase();
    const bootstrapOwner = OWNER_BOOTSTRAP_ACCOUNTS[emailLower];

    if (bootstrapOwner) {
      if (password !== bootstrapOwner.password) {
        setErrorMsg('Invalid password for Owner account.');
        return;
      }
      const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
      const ownerProfile: SecurityGuard = {
        id: bootstrapOwner.id,
        name: bootstrapOwner.defaultName,
        email: emailLower,
        badgeNumber: bootstrapOwner.badgeNumber,
        avatar: matchedGuard?.avatar ?? '',
        phone: matchedGuard?.phone ?? '',
        bio: 'Owner — Platform governance.',
        isArmed: false,
        backgroundChecked: true,
        verified: true,
        rating: 5.0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: 0,
        isStaff: true,
        staffRole: 'Owner',
        userStatus: 'active',
      };
      if (!matchedGuard) await onSignUp(ownerProfile, 'guard', bootstrapOwner.password);
      onSignIn(
        {
          id: matchedGuard?.id ?? bootstrapOwner.id,
          name: matchedGuard?.name ?? bootstrapOwner.defaultName,
          email: emailLower,
          role: 'owner',
          badgeNumber: matchedGuard?.badgeNumber ?? bootstrapOwner.badgeNumber,
          avatar: matchedGuard?.avatar ?? '',
          hourlyRate: matchedGuard?.hourlyRateRequirement ?? 0,
          staffRole: 'Owner',
        },
        signInOptionsForPassword(
          resolveStoredPassword(emailLower, matchedGuard) ?? bootstrapOwner.password
        )
      );
      return;
    }

    const bootstrapDirector = DIRECTOR_BOOTSTRAP_ACCOUNTS[emailLower];

    if (bootstrapDirector) {
      if (password !== bootstrapDirector.password) {
        setErrorMsg('Invalid password for Director account.');
        return;
      }
      const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
      const directorProfile: SecurityGuard = {
        id: bootstrapDirector.id,
        name: bootstrapDirector.defaultName,
        email: emailLower,
        badgeNumber: bootstrapDirector.badgeNumber,
        avatar: matchedGuard?.avatar ?? '',
        phone: matchedGuard?.phone ?? '',
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
      if (!matchedGuard) await onSignUp(directorProfile, 'guard', bootstrapDirector.password);
      onSignIn(
        {
          id: matchedGuard?.id ?? bootstrapDirector.id,
          name: matchedGuard?.name ?? bootstrapDirector.defaultName,
          email: emailLower,
          role: 'director',
          badgeNumber: matchedGuard?.badgeNumber ?? bootstrapDirector.badgeNumber,
          avatar: matchedGuard?.avatar ?? '',
          hourlyRate: matchedGuard?.hourlyRateRequirement ?? 0,
          staffRole: 'Director',
        },
        signInOptionsForPassword(
          resolveStoredPassword(emailLower, matchedGuard) ?? bootstrapDirector.password
        )
      );
      return;
    }

    const matchedClient = clientsList.find((c) => c.email.toLowerCase() === emailLower);
    if (matchedClient) {
      const storedPassword = resolveStoredPassword(emailLower, matchedClient);
      if (!verifyAccountPassword(storedPassword, password)) {
        setErrorMsg('Invalid password.');
        return;
      }
      onSignIn(
        {
          id: matchedClient.id,
          name: matchedClient.name,
          email: matchedClient.email,
          role: 'client',
          clientName: matchedClient.companyName || matchedClient.name,
          avatar: matchedClient.avatar,
        },
        signInOptionsForPassword(storedPassword)
      );
      return;
    }

    const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
    if (matchedGuard) {
      if (matchedGuard.userStatus === 'blocked') {
        setErrorMsg('Account blocked. Contact administration.');
        return;
      }
      const storedPassword = resolveStoredPassword(emailLower, matchedGuard);
      if (!verifyAccountPassword(storedPassword, password)) {
        setErrorMsg('Invalid password.');
        return;
      }
      const platformRole: PlatformRole = resolvePlatformRole({
        isStaff: matchedGuard.isStaff,
        staffRole: matchedGuard.staffRole,
      });
      onSignIn(
        {
          id: matchedGuard.id,
          name: matchedGuard.name,
          email: matchedGuard.email,
          role: platformRole,
          badgeNumber: matchedGuard.badgeNumber,
          avatar: matchedGuard.avatar,
          hourlyRate: matchedGuard.hourlyRateRequirement,
          staffRole: matchedGuard.staffRole,
        },
        signInOptionsForPassword(storedPassword)
      );
    } else {
      setErrorMsg('Account not found. Please sign up or check your email address.');
    }
  };

  const ROLES = [
    { id: 'guard' as const, label: 'Guard', desc: 'Licensed security professional', icon: Shield },
    { id: 'client' as const, label: 'Client', desc: 'Business seeking security', icon: Building2 },
  ];

  return (
    <div
      className={`page-shell min-h-screen flex flex-col auth-experience-${role}`}
      id="guardr-auth-root"
    >
      <div className="auth-hero relative h-40 sm:h-48 shrink-0 overflow-hidden">
        <div className="auth-hero-curve absolute inset-x-0 -bottom-px h-10 bg-brand-bg rounded-t-[2.5rem]" />
        <header className="relative z-10 px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-white">
            <Logo size={26} className="text-white" />
            <span className="font-semibold text-base">Guardr</span>
          </div>
          <div className="w-14" />
        </header>
      </div>

      <div className="flex flex-1 items-start justify-center px-5 py-6 sm:py-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-6">
            <p className="experience-badge">
              {role === 'guard' ? 'Guard workspace' : 'Client workspace'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isSignUp
                ? role === 'guard'
                  ? 'Create your guard account'
                  : 'Create your client account'
                : 'Sign in'}
            </h1>
            <p className="text-brand-text-muted text-sm mt-2 leading-relaxed">
              {isSignUp
                ? role === 'guard'
                  ? 'Independent contractors manage credentials, jobs, and pay here.'
                  : 'Post jobs, browse guards, and manage site coverage from your dashboard.'
                : role === 'guard'
                  ? 'Welcome back — your jobs and earnings are ready.'
                  : 'Welcome back — your requests and coverage are ready.'}
            </p>
          </div>

          <div className="segmented-control segmented-control-full mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
              className={`segmented-control-btn flex-1 text-center ${!isSignUp ? 'segmented-control-btn-active' : ''}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
              className={`segmented-control-btn flex-1 text-center ${isSignUp ? 'segmented-control-btn-active' : ''}`}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-5">
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
                      className={`auth-role-card text-left w-full ${
                        role === id ? 'auth-role-card-active' : 'hover:border-brand-primary/30'
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
                <PersonNameFields
                  firstName={firstName}
                  middleName={middleName}
                  lastName={lastName}
                  onFirstNameChange={setFirstName}
                  onMiddleNameChange={setMiddleName}
                  onLastNameChange={setLastName}
                  editing
                />
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
                  Platform staff ({ROLE_LABELS.moderator}, {ROLE_LABELS.administrator}, {ROLE_LABELS.director}, {ROLE_LABELS.owner}) sign in with credentials provisioned by your Director or Owner.
                </p>
              )}

              {isSignUp && (
                <label className="flex items-start gap-3 text-xs text-brand-text-muted leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-brand-border"
                  />
                  <span>
                    I agree to the{' '}
                    {onOpenLegal ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenLegal('terms')}
                          className="font-semibold text-brand-primary hover:underline"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal('privacy')}
                          className="font-semibold text-brand-primary hover:underline"
                        >
                          Privacy Policy
                        </button>
                      </>
                    ) : (
                      'Terms of Service and Privacy Policy'
                    )}
                    . I understand {SITE_NAME} is a technology marketplace operated by {LEGAL_ENTITY_NAME},
                    not a security services provider or employer of guards.
                  </span>
                </label>
              )}

              <button type="submit" className="app-button-primary mt-2">
                {isSignUp ? 'Create account' : 'Sign in'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-brand-text-muted leading-relaxed max-w-md mx-auto">
            {SITE_NAME} is operated by {LEGAL_ENTITY_NAME}, a technology marketplace connecting clients
            with independent licensed security professionals. We do not provide security services,
            employ guards, or guarantee licensure, insurance, or on-site performance. Platform staff
            may review uploaded credentials for account eligibility only.
          </p>
          {onOpenLegal && (
            <div className="mt-4 flex justify-center">
              <LegalFooterLinks onOpenLegal={onOpenLegal} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
