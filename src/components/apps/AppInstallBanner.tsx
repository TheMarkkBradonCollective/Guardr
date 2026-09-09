import React from 'react';
import { Download, X } from 'lucide-react';
import { isAppExperience } from '../../lib/platform/appExperience';
import { installPathForApp, PRODUCT_APP_LABELS, type ProductApp } from '../../lib/productApps';

const DISMISS_KEY = 'guardr_app_install_banner_dismissed';

interface AppInstallBannerProps {
  productApp: ProductApp;
}

/**
 * Shown only when an operational app is running in a browser tab.
 * Installed PWA / APK shells already *are* the app.
 */
export function AppInstallBanner({ productApp }: AppInstallBannerProps) {
  const [dismissed, setDismissed] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (productApp === 'website') return null;
  if (isAppExperience()) return null;
  if (dismissed) return null;

  const label = PRODUCT_APP_LABELS[productApp];
  const copy =
    productApp === 'staff'
      ? 'You are using Staff in your browser — that is the full system. The Android app is optional for notifications, camera, and GPS.'
      : `You are using the ${label} in your browser.`;

  return (
    <div className="app-install-banner" role="status">
      <p className="app-install-banner-copy">
        {copy}{' '}
        <a href={installPathForApp(productApp)}>
          {productApp === 'staff' ? 'Optional install' : 'Install the app'}
        </a>
        .
      </p>
      <a className="app-install-banner-action" href={installPathForApp(productApp)}>
        <Download size={14} strokeWidth={2.25} aria-hidden />
        Install
      </a>
      <button
        type="button"
        className="app-install-banner-dismiss"
        aria-label="Dismiss install suggestion"
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, '1');
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
      >
        <X size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
