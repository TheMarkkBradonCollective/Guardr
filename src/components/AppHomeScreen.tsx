import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { LandingPathCards } from './landing/LandingPathCards';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import type { LegalPageId } from '../lib/legalContent';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';

interface AppHomeScreenProps {
  onNavigateToAuth: (role?: 'guard' | 'client', mode?: 'sign-in' | 'sign-up') => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onOpenLegal: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
}

export function AppHomeScreen({
  onNavigateToAuth,
  themeMode,
  onChangeTheme,
  onOpenLegal,
}: AppHomeScreenProps) {
  const { formFactor } = useDevice();

  return (
    <div className="app-home-screen page-shell min-h-[100dvh] flex flex-col bg-brand-bg text-brand-text">
      <header className="app-home-screen-header shrink-0 flex items-center justify-between gap-3 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size={28} className="text-brand-primary shrink-0" />
          <span className="font-black text-xl tracking-[-0.05em] leading-none">
            Guard<span className="text-brand-primary">r</span>
          </span>
        </div>
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
      </header>

      <main className="app-home-screen-main flex-1 min-h-0 flex flex-col justify-center px-5 pb-6">
        <div className="app-home-screen-copy mx-auto w-full max-w-md text-center">
          <h1 className="text-2xl font-black tracking-[-0.04em] leading-tight">
            Security, <span className="text-brand-primary">when you need it.</span>
          </h1>
          <p className="mt-3 text-sm text-brand-text-muted leading-relaxed">
            Sign in or create an account to post jobs, find work, and manage shifts.
          </p>
        </div>

        <div className="app-home-screen-actions mx-auto w-full max-w-md mt-8 space-y-4">
          <LandingPathCards onNavigateToAuth={onNavigateToAuth} layout={formFactor} />
          <button
            type="button"
            onClick={() => onNavigateToAuth(undefined, 'sign-in')}
            className="app-home-screen-signin w-full text-center text-sm font-semibold text-brand-primary"
          >
            Already have an account? Sign in
          </button>
        </div>
      </main>

      <footer className="app-home-screen-footer shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 border-t border-brand-border/60">
        <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
      </footer>
    </div>
  );
}
