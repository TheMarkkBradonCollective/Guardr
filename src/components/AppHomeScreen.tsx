import React, { useState } from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import type { LegalPageId } from '../lib/legalContent';
import type { ThemeMode } from '../lib/platform/theme';
import { Building2, Shield, ArrowRight, MapPin, Radio } from 'lucide-react';

interface AppHomeScreenProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  authSheetOpen?: boolean;
}

export function AppHomeScreen({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
  authSheetOpen = false,
}: AppHomeScreenProps) {
  const [signInRole, setSignInRole] = useState<'guard' | 'client'>('guard');

  return (
    <div
      className={`app-welcome page-shell min-h-[100dvh] flex flex-col overflow-hidden bg-brand-bg text-brand-text ${
        authSheetOpen ? 'app-welcome--dimmed' : ''
      }`}
    >
      <header className="app-welcome-header shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={26} className="text-brand-primary shrink-0" />
          <span className="font-black text-lg tracking-[-0.05em] leading-none text-brand-text">
            Guard<span className="text-brand-primary">r</span>
          </span>
        </div>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
      </header>

      <main className="app-welcome-main flex-1 min-h-0 flex flex-col relative">
        <div className="app-welcome-visual" aria-hidden="true">
          <div className="app-welcome-visual-grid" />
          <div className="app-welcome-visual-glow" />
          <div className="app-welcome-visual-pins">
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

        <div className="app-welcome-copy relative z-[1] flex-1 flex flex-col justify-end px-5 pb-4">
          <p className="app-welcome-eyebrow">California security marketplace</p>
          <h1 className="app-welcome-headline">
            Coverage on demand.
            <span className="block text-brand-primary">Professionals on your schedule.</span>
          </h1>
          <p className="app-welcome-sub mt-3 max-w-sm text-sm text-brand-text-muted leading-relaxed">
            Sign in to post jobs, accept shifts, and track live coverage — all in one place.
          </p>
        </div>

        <div className="app-welcome-dock relative z-[1] shrink-0 px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
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

          <div className="app-welcome-signup-row mt-4 text-center">
            <span className="text-xs text-brand-text-muted">New here?</span>
            <button
              type="button"
              onClick={() => onNavigateToAuth(signInRole, 'sign-up')}
              className="app-welcome-signup-link text-xs font-semibold text-brand-primary ml-1.5"
            >
              Create {signInRole === 'guard' ? 'guard' : 'client'} account
            </button>
          </div>
        </div>
      </main>

      <footer className="app-welcome-footer shrink-0 px-5 pb-3 pt-1 border-t border-brand-border/40 relative z-10">
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
      </footer>
    </div>
  );
}
