import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const runningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(runningStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIphoneOrIpad);

    if (runningStandalone) {
      return;
    }

    const isDismissed = localStorage.getItem('guardr_install_prompt_dismissed');
    if (isDismissed === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIphoneOrIpad) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation decision outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      setShowGuide(true);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('guardr_install_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (isStandalone || !isVisible) {
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand-primary">Install app</span>
                  <Sparkles size={11} className="text-brand-primary" />
                </div>
                <h4 className="text-base font-black tracking-tight text-brand-text">
                  Add Guardr to your home screen
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="app-button-primary app-btn-md flex-1 gap-1.5"
              >
                <Download size={14} />
                <span>{isIOS ? 'Show iOS guide' : 'Download app'}</span>
              </button>
              <button
                onClick={dismissPrompt}
                className="app-button-outline app-btn-md"
              >
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
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-4">
              <div className="border-b border-brand-border pb-3">
                <h4 className="text-sm font-semibold text-brand-text">
                  Install on your device
                </h4>
                <p className="text-xs text-brand-text-muted mt-1">
                  Follow these simple setup instructions to run Guardr as an app:
                </p>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-sm">
                  <GuideStep n={1}>
                    Open <strong>Safari Browser</strong> and visit our URL.
                  </GuideStep>
                  <GuideStep n={2}>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg"><Share size={12} className="text-blue-400" /> Share button</strong> at the bottom of Safari.
                    </span>
                  </GuideStep>
                  <GuideStep n={3}>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Scroll down and select <strong className="inline-flex items-center gap-0.5 border border-brand-border px-1.5 py-0.5 rounded-lg"><PlusSquare size={12} /> Add to Home Screen</strong>.
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
                  onClick={() => {
                    setShowGuide(false);
                    dismissPrompt();
                  }}
                  className="app-button-primary app-btn-md flex-1"
                >
                  I&apos;ve done it
                </button>
                <button
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
