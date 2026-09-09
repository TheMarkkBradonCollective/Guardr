import React from 'react';
import { ArrowUpRight, Smartphone } from 'lucide-react';
import { AppButton } from '../ui/AppButton';
import {
  installPathForApp,
  isNativePlatform,
  nativeDeepLinkForRole,
  openAppCtaCopy,
  productAppForRole,
  webAppPathForRole,
  type ProductRole,
} from '../../lib/productApps';
import { isAppExperience } from '../../lib/platform/appExperience';

interface OpenAppCtaProps {
  role: ProductRole;
  /** Optional in-app destination once the role app opens. */
  destination?: string;
  compact?: boolean;
  className?: string;
  onOpenWebApp?: () => void;
}

/**
 * Website → app transition. Opens the dedicated role app (web or native)
 * instead of performing operational work on the marketing/account website.
 */
export function OpenAppCta({
  role,
  destination,
  compact = false,
  className = '',
  onOpenWebApp,
}: OpenAppCtaProps) {
  const copy = openAppCtaCopy(role);
  const app = productAppForRole(role);
  const webPath = webAppPathForRole(role, destination);
  const installed = isAppExperience() || isNativePlatform();

  const openWebApp = () => {
    if (onOpenWebApp) {
      onOpenWebApp();
      return;
    }
    window.history.pushState({ appRoute: { role } }, '', webPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const openNativeOrWeb = () => {
    if (installed) {
      openWebApp();
      return;
    }
    const deepLink = nativeDeepLinkForRole(role, webPath);
    const started = Date.now();
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.remove();
      if (Date.now() - started < 1800 && document.visibilityState === 'visible') {
        openWebApp();
      }
    }, 700);
  };

  if (compact) {
    return (
      <div className={`open-app-cta open-app-cta--compact ${className}`.trim()}>
        <AppButton variant="primary" size="md" onClick={openNativeOrWeb}>
          {copy.action}
        </AppButton>
        {!installed ? (
          <a className="open-app-cta-install" href={installPathForApp(app)}>
            Install {copy.action.replace(/^Open /, '')}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <section className={`open-app-cta ${className}`.trim()} aria-label={copy.action}>
      <div className="open-app-cta-icon" aria-hidden>
        <Smartphone size={22} strokeWidth={2} />
      </div>
      <div className="open-app-cta-copy">
        <h2 className="open-app-cta-title">{copy.title}</h2>
        <p className="open-app-cta-body">{copy.body}</p>
        <div className="open-app-cta-actions">
          <AppButton variant="primary" size="md" onClick={openNativeOrWeb}>
            {copy.action}
            <ArrowUpRight size={16} strokeWidth={2.25} aria-hidden />
          </AppButton>
          {!installed ? (
            <a className="open-app-cta-install" href={installPathForApp(app)}>
              Download {copy.action.replace(/^Open /, '')}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
