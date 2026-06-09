import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SessionUser, SecurityGuard, Client, PlatformRole } from '../types';
import { resolvePlatformRole } from '../lib/permissions';

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

type AuthMethod = 'email' | 'phone';

export function AuthPage({
  onSignIn,
  onSignUp,
  guardsList,
  clientsList,
  onBackToHome,
  initialMode = 'sign-in',
}: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'sign-up');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    setIsSignUp(initialMode === 'sign-up');
    setErrorMsg('');
  }, [initialMode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const identifier = authMethod === 'email' ? email : phone;
    if (!identifier) {
      setErrorMsg(authMethod === 'email' ? 'Email address is required.' : 'Phone number is required.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (isSignUp) {
      if (!firstName || !lastName) {
        setErrorMsg('Please enter your first and last name.');
        return;
      }

      const randomId = `client-${Date.now()}`;
      const fullName = `${firstName} ${lastName}`;
      const clientProfile: Client = {
        id: randomId,
        name: fullName,
        email: authMethod === 'email' ? email : `${phone}@health.app`,
        companyName: '',
        phone: authMethod === 'phone' ? phone : '',
        avatar: '',
        totalRequests: 0,
        approved: true,
      };
      await onSignUp(clientProfile, 'client');
      onSignIn({
        id: randomId,
        name: fullName,
        email: clientProfile.email,
        role: 'client',
        clientName: fullName,
        avatar: '',
      });
      return;
    }

    const emailLower = (authMethod === 'email' ? email : `${phone}@health.app`).toLowerCase();

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

    const matchedClient = clientsList.find((c) => c.email.toLowerCase() === emailLower);
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

    const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
    if (matchedGuard) {
      if (matchedGuard.userStatus === 'blocked') {
        setErrorMsg('Account blocked. Contact administration.');
        return;
      }
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
      setErrorMsg('Account not found. Please register or check your credentials.');
    }
  };

  const passwordHints = [
    { label: 'min 8 letters', met: password.length >= 8 },
    { label: '1 capital letter', met: /[A-Z]/.test(password) },
    { label: '1 number', met: /\d/.test(password) },
  ];

  return (
    <div className="page-shell min-h-screen flex flex-col">
      <header className="shrink-0 px-4 h-14 flex items-center">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-text transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <div className="flex flex-1 items-start justify-center px-5 py-4 sm:py-8">
        <div className="w-full max-w-md animate-fade-in">
          <h1 className="auth-screen-title mb-8">
            {isSignUp ? 'Registration' : 'Sign in'}
          </h1>

          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/8 text-red-500 text-sm px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {errorMsg}
            </div>
          )}

          {isSignUp && (
            <div className="segmented-control w-full mb-6">
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setErrorMsg(''); }}
                className={`segmented-control-btn flex-1 text-center ${authMethod === 'phone' ? 'segmented-control-btn-active' : ''}`}
              >
                Phone number
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setErrorMsg(''); }}
                className={`segmented-control-btn flex-1 text-center ${authMethod === 'email' ? 'segmented-control-btn-active' : ''}`}
              >
                Email
              </button>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp ? (
              <>
                {authMethod === 'email' ? (
                  <div>
                    <label className="uber-label block mb-2">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="uber-label block mb-2">Phone number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                )}

                <div>
                  <label className="uber-label block mb-2">First name</label>
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="uber-input"
                  />
                </div>

                <div>
                  <label className="uber-label block mb-2">Last name</label>
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="uber-input"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="uber-label block mb-2">Email / Phone number</label>
                <input
                  type="text"
                  required
                  placeholder="Email or phone"
                  value={email || phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('@')) {
                      setEmail(val);
                      setPhone('');
                    } else {
                      setPhone(val);
                      setEmail('');
                    }
                  }}
                  className="uber-input"
                />
              </div>
            )}

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
              {isSignUp && (
                <div className="password-hint mt-2 space-y-0.5">
                  {passwordHints.map((hint) => (
                    <p key={hint.label} className={hint.met ? 'text-brand-text' : ''}>
                      {hint.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-border accent-brand-primary"
                  />
                  <span className="text-brand-text-muted">Remember me</span>
                </label>
                <button type="button" className="text-brand-text-muted hover:text-brand-text font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="app-button-primary mt-2">
              {isSignUp ? 'Next' : 'Sign in'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-text-muted">
            {isSignUp ? (
              <>
                Do you have already account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                  className="font-semibold text-brand-text hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Are you new?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                  className="font-semibold text-brand-text hover:underline"
                >
                  Register
                </button>
              </>
            )}
          </p>

          <div className="mt-8 text-center">
            <p className="text-sm text-brand-text-muted mb-4">Sign in with</p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" className="social-auth-btn" aria-label="Sign in with Google">G</button>
              <button type="button" className="social-auth-btn" aria-label="Sign in with Facebook">f</button>
              <button type="button" className="social-auth-btn" aria-label="Sign in with Apple">
                <span className="text-base">&#63743;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
