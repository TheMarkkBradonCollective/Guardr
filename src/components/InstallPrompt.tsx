import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { 
  Download, 
  X, 
  Share, 
  PlusSquare, 
  Smartphone, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 1. Detect if the app is already running as an installed standalone app
    const runningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(runningStandalone);

    // 2. Identify iOS user-agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIphoneOrIpad);

    // If already installed, don't show the prompt
    if (runningStandalone) {
      return;
    }

    // 3. Keep track of user dismiss session
    const isDismissed = localStorage.getItem('guardr_install_prompt_dismissed');
    if (isDismissed === 'true') {
      return;
    }

    // 4. Capture native chromium "beforeinstallprompt" event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Automatically show install banner on Android / Desktop Chrome
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Fallback timer for iOS users to see visual prompt after 4 seconds of reading page
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
      // Trigger native Android install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation decision outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      // No native prompt available (or iOS/Safari), toggle detailed visual guide
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
        
        {/* Main Installation Callout Widget */}
        {!showGuide ? (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-black border border-brand-border p-5 relative shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden"
            id="pwa-install-banner"
          >
            {/* Ambient decorative glowing green line on top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-primary" />
            
            <button 
              onClick={dismissPrompt}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
              aria-label="Dismiss and Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <Logo size={36} className="text-brand-primary animate-pulse shrink-0 mt-0.5" />

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-brand-primary uppercase">MOBILE COMPATIBLE</span>
                  <div className="flex items-center gap-0.5 text-brand-primary">
                    <Sparkles size={8} />
                  </div>
                </div>
                <h4 className="text-sm font-sans font-black uppercase text-white tracking-tight">
                  Install Guardr App
                </h4>
                <p className="text-xs text-neutral-400 leading-snug">
                  Get faster dispatch updates, active field-tracking tools &amp; instant local notification coverage from your home screen.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 bg-brand-primary text-black font-sans font-extrabold text-[11px] tracking-wider uppercase transition-colors hover:bg-brand-primary/90 flex items-center justify-center gap-1.5"
              >
                <Download size={13} />
                <span>{isIOS ? 'Show iOS Guide' : 'Download App'}</span>
              </button>
              <button
                onClick={dismissPrompt}
                className="px-3.5 py-2.5 bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white font-mono text-[10px] uppercase tracking-wider transition-colors"
              >
                Later
              </button>
            </div>
          </motion.div>
        ) : (
          /* Custom Step-by-Step Mobile Add To Home Screen Instructions (Safari / Chrome) */
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-black border border-brand-border p-6 relative shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
            id="pwa-guide-banner"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-primary" />
            
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-4">
              <div className="border-b border-neutral-900 pb-3">
                <h4 className="text-sm font-sans font-black uppercase text-white tracking-tight flex items-center gap-2">
                  <span>📥 Install on Your Device</span>
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Follow these simple setup instructions to run Guardr as an app:
                </p>
              </div>

              {isIOS ? (
                /* Tailored iOS instructions */
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <div className="text-neutral-300">
                      Open <strong className="text-white">Safari Browser</strong> and visit our URL.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div className="text-neutral-300 flex items-center gap-1.5 flex-wrap">
                      Tap the <strong className="text-white flex items-center gap-0.5 border border-neutral-800 px-1.5 py-0.5 bg-neutral-950 rounded"><Share size={11} className="text-blue-400" /> Share button</strong> at the bottom of Safari.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                    <div className="text-neutral-300 flex items-center gap-1.5 flex-wrap">
                      Scroll down and select <strong className="text-white flex items-center gap-0.5 border border-neutral-800 px-1.5 py-0.5 bg-neutral-950 rounded"><PlusSquare size={11} /> Add to Home Screen</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                /* Tailored Android/Chrome/Generic instructions */
                <div className="space-y-3 font-mono text-[11px]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                    <div className="text-neutral-300">
                      Open the browser menu (tap the <strong className="text-white">3 dots icon</strong> at top right).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 bg-neutral-900 border border-neutral-800 text-brand-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                    <div className="text-neutral-300">
                      Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    setShowGuide(false);
                    dismissPrompt();
                  }}
                  className="flex-1 py-2 bg-white text-black font-sans font-black text-[10px] tracking-wider uppercase hover:bg-neutral-200 transition-colors"
                >
                  I've Done It
                </button>
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-900 text-neutral-400 font-mono text-[9px] uppercase tracking-wider"
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
