import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { isNativeShell } from '../lib/platform/device';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DISMISS_KEY = 'guardr_install_prompt_dismissed_at';
/** Re-show the install prompt after this many days if the user tapped Later. */
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function isDismissCooldownActive(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) {
    if (localStorage.getItem('guardr_install_prompt_dismissed') === 'true') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      localStorage.removeItem('guardr_install_prompt_dismissed');
      return true;
    }
    return false;
  }
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (isNativeShell()) {
      return;
    }

    const runningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(runningStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIphoneOrIpad);

    if (runningStandalone) {
      return;
    }

    if (isDismissCooldownActive()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIphoneOrIpad) {
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      setShowGuide(true);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    localStorage.removeItem('guardr_install_prompt_dismissed');
    setIsVisible(false);
  };

  if (isNativeShell() || isStandalone || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        {!showGuide ? (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="wf-list-card flex-col items-stretch !flex !flex-col gap-4 relative shadow-[var(--shadow-float)] overflow-hidden p-5"
            id="pwa-install-banner"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-primary" />

            <button
              type="button"
              onClick={dismissPrompt}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text transition-colors"
              aria-label="Dismiss and Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <Logo size={40} className="text-brand-primary shrink-0 mt-0.5" />

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-primary">
                    Home screen
                  </span>
                  <Sparkles size={11} className="text-brand-primary" />
                </div>
                <h4 className="text-base font-black tracking-tight text-brand-text">
                  Add Guardr to your home screen
                </h4>
                <p className="text-xs leading-relaxed text-brand-text-muted">
                  Guard, Customer, and Staff in one app. Same sign-in as the website. For iPhone,
                  no space, or if an APK will not install.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleInstallClick()}
                className="app-button-primary app-btn-md flex-1 gap-1.5"
              >
                <Download size={14} />
                <span>{isIOS ? 'Show iOS guide' : 'Install'}</span>
              </button>
              <button type="button" onClick={dismissPrompt} className="app-button-outline app-btn-md">
                Later
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="wf-list-card flex-col items-stretch !flex !flex-col gap-4 relative shadow-[var(--shadow-float)] p-6"
            id="pwa-guide-banner"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-primary" />

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              aria-label="Close install guide"
              className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-4">
              <div className="border-b border-brand-border pb-3">
                <h4 className="text-sm font-semibold text-brand-text">Install on your device</h4>
                <p className="text-xs text-brand-text-muted mt-1">
                  Add Guardr to your home screen. Sign in as Guard, Customer, or Staff — the same
                  steps as the website.
                </p>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-sm">
                  <GuideStep n={1}>
                    Open <strong>Safari</strong> and visit guardr.co.
                  </GuideStep>
                  <GuideStep n={2}>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the{' '}
                      <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg">
                        <Share size={12} className="text-blue-400" /> Share
                      </strong>{' '}
                      button at the bottom of Safari.
                    </span>
                  </GuideStep>
                  <GuideStep n={3}>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Scroll down and select{' '}
                      <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg">
                        <PlusSquare size={12} /> Add to Home Screen
                      </strong>
                      .
                    </span>
                  </GuideStep>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <GuideStep n={1}>
                    Open the browser menu (tap the <strong>3 dots icon</strong> at top right).
                  </GuideStep>
                  <GuideStep n={2}>
                    Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </GuideStep>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGuide(false);
                    dismissPrompt();
                  }}
                  className="app-button-primary app-btn-md flex-1"
                >
                  I&apos;ve done it
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="app-button-outline app-btn-md"
                >
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

function GuideStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-6 h-6 bg-brand-bg-sec border border-brand-border text-brand-primary flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 rounded-full">
        {n}
      </span>
      <div className="text-brand-text-muted">{children}</div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
