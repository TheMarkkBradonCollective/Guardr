import React, { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import type { LegalPageId } from '../lib/legalContent';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';
import { Building2, Shield, ArrowRight, MapPin, Radio } from 'lucide-react';

interface AppHomeScreenProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  authSheetOpen?: boolean;
}

function AppWelcomeBackdrop() {
  return (
    <div className="app-welcome-backdrop" aria-hidden="true">
      <div className="app-welcome-backdrop-grid" />
      <div className="app-welcome-backdrop-glow" />
      <div className="app-welcome-backdrop-pins">
        <span className="app-welcome-pin app-welcome-pin--a">
          <MapPin className="w-3.5 h-3.5" />
        </span>
        <span className="app-welcome-pin app-welcome-pin--b">
          <Radio className="w-3 h-3" />
        </span>
        <span className="app-welcome-pin app-welcome-pin--c">
          <Shield className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

function AppWelcomeSignInDock({
  signInRole,
  setSignInRole,
  onNavigateToAuth,
  onOpenLegal,
}: {
  signInRole: 'guard' | 'client';
  setSignInRole: (role: 'guard' | 'client') => void;
  onNavigateToAuth: AppHomeScreenProps['onNavigateToAuth'];
  onOpenLegal: (page: LegalPageId) => void;
}) {
  return (
    <div className="app-welcome-dock shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <p className="app-welcome-role-label">Sign in as</p>
      <div className="app-welcome-role-toggle" role="group" aria-label="Account type">
        <button
          type="button"
          onClick={() => setSignInRole('guard')}
          className={`app-welcome-role-btn ${signInRole === 'guard' ? 'app-welcome-role-btn--active' : ''}`}
          aria-pressed={signInRole === 'guard'}
        >
          <Shield className="w-4 h-4 shrink-0" />
          Guard
        </button>
        <button
          type="button"
          onClick={() => setSignInRole('client')}
          className={`app-welcome-role-btn ${signInRole === 'client' ? 'app-welcome-role-btn--active' : ''}`}
          aria-pressed={signInRole === 'client'}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          Client
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigateToAuth(signInRole, 'sign-in')}
        className="app-button-primary app-welcome-signin-btn w-full mt-4"
      >
        Sign in
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="app-welcome-signup-row mt-3 text-center">
        <span className="text-xs text-brand-text-muted">New here?</span>
        <button
          type="button"
          onClick={() => onNavigateToAuth(signInRole, 'sign-up')}
          className="app-welcome-signup-link text-xs font-semibold text-brand-primary ml-1.5"
        >
          Create {signInRole === 'guard' ? 'guard' : 'client'} account
        </button>
      </div>

      <div className="app-welcome-legal mt-4 pt-3 border-t border-brand-border/50">
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
      </div>
    </div>
  );
}

export function AppHomeScreen({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  authSheetOpen = false,
}: AppHomeScreenProps) {
  const [signInRole, setSignInRole] = useState<'guard' | 'client'>('guard');
  const { formFactor, shellKind, viewSurface } = useDevice();
  const isTablet = formFactor === 'tablet';

  return (
    <div
      className={`app-welcome page-shell h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden text-brand-text app-welcome--${shellKind} ${
        isTablet ? 'app-welcome--tablet' : 'app-welcome--mobile'
      } ${authSheetOpen ? 'app-welcome--dimmed' : ''}`}
      data-view-surface={viewSurface}
    >
      <AppWelcomeBackdrop />

      <header className="app-welcome-header shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 relative z-[2]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={26} className="text-brand-primary shrink-0" />
          <span className="font-black text-lg tracking-[-0.05em] leading-none text-brand-text">
            Guard<span className="text-brand-primary">r</span>
          </span>
          {shellKind === 'native' ? (
            <span className="app-welcome-shell-badge app-welcome-shell-badge--native">App</span>
          ) : shellKind === 'pwa' ? (
            <span className="app-welcome-shell-badge app-welcome-shell-badge--pwa">Installed</span>
          ) : null}
        </div>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
      </header>

      <main
        className={`app-welcome-main relative z-[1] flex-1 min-h-0 ${
          isTablet ? 'app-welcome-main--tablet' : 'flex flex-col justify-between px-5'
        }`}
      >
        <div className={`app-welcome-hero ${isTablet ? 'app-welcome-hero--tablet' : 'pt-2 sm:pt-6'}`}>
          <p className="app-welcome-eyebrow">California security marketplace</p>
          <h1 className="app-welcome-headline">
            Coverage on demand.
            <span className="block text-brand-primary">Professionals on your schedule.</span>
          </h1>
          <p className="app-welcome-sub mt-3 max-w-sm text-sm text-brand-text-muted leading-relaxed">
            Sign in to post jobs, accept shifts, and track live coverage — all in one place.
          </p>
        </div>

        <AppWelcomeSignInDock
          signInRole={signInRole}
          setSignInRole={setSignInRole}
          onNavigateToAuth={onNavigateToAuth}
          onOpenLegal={onOpenLegal}
        />
      </main>
    </div>
  );
}
