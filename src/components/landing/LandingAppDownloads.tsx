import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Download, Smartphone, ArrowRight } from 'lucide-react';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from './PwaInstallGuide';
import type { FormFactor } from '../../lib/platform/device';

const APK_DOWNLOAD_URL = '/download/guardr.apk';
const DOWNLOAD_PAGE_URL = '/download';

interface LandingAppDownloadsProps {
  formFactor: FormFactor;
  variant?: 'hero' | 'cta';
  id?: string;
}

export function LandingAppDownloads({
  formFactor,
  variant = 'hero',
  id,
}: LandingAppDownloadsProps) {
  const { hideAppDownloads, isIOS, showGuide, setShowGuide, promptInstall, hasDeferredPrompt } =
    usePwaInstallPrompt();

  if (hideAppDownloads) {
    return null;
  }

  const pwaLabel = hasDeferredPrompt
    ? 'Install web app'
    : isIOS
      ? 'Add to Home Screen'
      : 'Install web app';

  return (
    <div
      id={id}
      className={`landing-app-downloads landing-app-downloads--${variant} landing-app-downloads--${formFactor}`}
    >
      <div className="landing-app-downloads-head">
        <p className="landing-app-downloads-eyebrow">Get the app</p>
        <p className="landing-app-downloads-lead">
          Android APK for field work, or save the web app to your home screen — same account either way.
        </p>
      </div>

      <div className="landing-app-downloads-actions">
        <a
          href={APK_DOWNLOAD_URL}
          download="guardr.apk"
          className="landing-app-download-btn landing-app-download-btn--apk"
        >
          <span className="landing-app-download-btn-icon" aria-hidden="true">
            <Download className="w-4 h-4" />
          </span>
          <span className="landing-app-download-btn-copy">
            <span className="landing-app-download-btn-title">Download Android APK</span>
            <span className="landing-app-download-btn-sub">Native app · best notifications</span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => void promptInstall()}
          className="landing-app-download-btn landing-app-download-btn--pwa"
        >
          <span className="landing-app-download-btn-icon" aria-hidden="true">
            <Smartphone className="w-4 h-4" />
          </span>
          <span className="landing-app-download-btn-copy">
            <span className="landing-app-download-btn-title">{pwaLabel}</span>
            <span className="landing-app-download-btn-sub">Auto-updates · no reinstall</span>
          </span>
        </button>
      </div>

      <a href={DOWNLOAD_PAGE_URL} className="landing-app-downloads-more">
        Compare APK vs home screen
        <ArrowRight className="w-3.5 h-3.5" />
      </a>

      <AnimatePresence>
        {showGuide && (
          <PwaInstallGuide
            isIOS={isIOS}
            onClose={() => setShowGuide(false)}
            className="landing-app-downloads-guide"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
