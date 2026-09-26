import React from 'react';
import { Download, PlusSquare, Share, X } from 'lucide-react';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from './landing/PwaInstallGuide';
import { useProductApp } from '../lib/ProductAppProvider';
import { applyPwaManifestForLocation, pwaInstallCopy } from '../lib/pwaManifests';
import { AppButton } from './ui/AppButton';

/**
 * Home-screen install prompt for PWAs. Hidden in APK / already-standalone.
 */
export function InstallPrompt() {
  const { productApp } = useProductApp();
  const { hideAppDownloads, showGuide, setShowGuide, promptInstall, hasDeferredPrompt, isIOS } =
    usePwaInstallPrompt();
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem('guardr_pwa_install_dismissed') === '1';
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    applyPwaManifestForLocation(window.location.pathname + window.location.search, productApp);
  }, [productApp]);

  if (hideAppDownloads || dismissed) return null;

  const copy = pwaInstallCopy('website');

  return (
    <>
      <div className="pwa-install-prompt" role="status">
        <p className="pwa-install-prompt-copy">
          <strong>{copy.title}</strong>
          <span>{copy.body}</span>
        </p>
        <AppButton
          variant="primary"
          size="sm"
          onClick={() => {
            void promptInstall();
          }}
        >
          {isIOS ? (
            <>
              <Share size={14} strokeWidth={2.25} aria-hidden />
              Add to Home Screen
            </>
          ) : (
            <>
              {hasDeferredPrompt ? <Download size={14} strokeWidth={2.25} aria-hidden /> : <PlusSquare size={14} strokeWidth={2.25} aria-hidden />}
              Install
            </>
          )}
        </AppButton>
        <button
          type="button"
          className="pwa-install-prompt-dismiss"
          aria-label="Dismiss install prompt"
          onClick={() => {
            try {
              sessionStorage.setItem('guardr_pwa_install_dismissed', '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      </div>
      {showGuide ? (
        <PwaInstallGuide isIOS={isIOS} onClose={() => setShowGuide(false)} onDone={() => setShowGuide(false)} />
      ) : null}
    </>
  );
}
