import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Download,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  Shield,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Logo } from '../Logo';
import { SITE_NAME, SITE_URL } from '../../lib/siteConfig';
import { useAppDownloadStatus, canInstallApkInApp } from '../../hooks/useAppDownloadStatus';
import { installLatestApk } from '../../lib/platform/apkUpdate';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from '../landing/PwaInstallGuide';
import { showAppAlert } from '../ui/AppConfirm';
import {
  INSTALL_APK_SHORT,
  INSTALL_APK_TITLE,
  INSTALL_PWA_SHORT,
  INSTALL_PWA_TITLE,
  downloadLiveContextMessage,
  downloadScreenIntro,
  downloadScreenTitle,
} from '../../lib/installSurfaceCopy';
import { formatAppVersion } from '../../lib/appVersion';
import { resolveApkDownloadUrl } from '../../lib/apkDownloadUrl';
import {
  bakedProductApp,
  parseProductAppRole,
  PRODUCT_APP_LAUNCHER_NAMES,
  PRODUCT_APP_TAGLINES,
  type ProductApp,
} from '../../lib/productApps';

interface AppDownloadScreenProps {
  onBack: () => void;
  headerRight?: React.ReactNode;
}

type ProductStatus = 'installed' | 'update' | 'available' | 'current' | 'checking';

function ProductStatusPill({ status }: { status: ProductStatus }) {
  const label =
    status === 'installed'
      ? 'Installed'
      : status === 'update'
        ? 'Update available'
        : status === 'current'
          ? 'Current'
          : status === 'checking'
            ? 'Checking…'
            : 'Not installed';

  return (
    <span className={`install-product-status install-product-status--${status}`}>{label}</span>
  );
}

function FeatureRow({ icon: Icon, children }: { icon: typeof Bell; children: React.ReactNode }) {
  return (
    <li className="install-product-feature">
      <span className="install-product-feature-icon" aria-hidden>
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
      <span>{children}</span>
    </li>
  );
}

interface ProductCardProps {
  variant: 'full' | 'lite';
  title: string;
  subtitle: string;
  status: ProductStatus;
  description: string;
  features: React.ReactNode;
  action: React.ReactNode;
  footer?: React.ReactNode;
  highlighted?: boolean;
}

function ProductCard({
  variant,
  title,
  subtitle,
  status,
  description,
  features,
  action,
  footer,
  highlighted = false,
}: ProductCardProps) {
  const Icon = variant === 'full' ? Shield : Smartphone;

  return (
    <article
      className={`install-product-card install-product-card--${variant}${highlighted ? ' install-product-card--highlight' : ''}`}
    >
      <div className="install-product-card-top">
        <div className="install-product-card-icon" aria-hidden>
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="install-product-card-head">
          <div className="install-product-card-title-row">
            <h2 className="install-product-card-title">{title}</h2>
            <ProductStatusPill status={status} />
          </div>
          <p className="install-product-card-subtitle">{subtitle}</p>
        </div>
      </div>

      <p className="install-product-card-copy">{description}</p>

      <ul className="install-product-features">{features}</ul>

      <div className="install-product-card-actions">{action}</div>

      {footer ? <div className="install-product-card-footer">{footer}</div> : null}
    </article>
  );
}

function CompareRow({
  label,
  full,
  lite,
}: {
  label: string;
  full: string;
  lite: string;
}) {
  return (
    <div className="install-compare-row">
      <span className="install-compare-label">{label}</span>
      <div className="install-compare-values">
        <span className="install-compare-value install-compare-value--full">{full}</span>
        <span className="install-compare-value install-compare-value--lite">{lite}</span>
      </div>
    </div>
  );
}

export function AppDownloadScreen({ onBack, headerRight }: AppDownloadScreenProps) {
  const {
    loading,
    error,
    manifest,
    installedApkVersion,
    liveContext,
    apkNeedsUpdate,
    pwaActive,
    refresh,
  } = useAppDownloadStatus();
  const { isIOS, promptInstall, hasDeferredPrompt, showGuide, setShowGuide } = usePwaInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const highlightedApp =
    parseProductAppRole(
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('app') : null,
    ) ?? bakedProductApp();

  const isNativeView = liveContext === 'apk';
  const isPwaView = liveContext === 'pwa';
  const isBrowserView = liveContext === 'browser';

  const handleApkAction = async (app?: Exclude<ProductApp, 'website'> | 'zip') => {
    const role = app === 'zip' ? null : app ?? bakedProductApp();
    if (canInstallApkInApp() && app !== 'zip') {
      setInstalling(true);
      try {
        await installLatestApk(manifest ?? undefined);
      } catch (installError) {
        void showAppAlert({
          title: isNativeView ? 'Update failed' : 'Install failed',
          message:
            installError instanceof Error ? installError.message : 'Could not start the APK install.',
          tone: 'warning',
        });
      } finally {
        setInstalling(false);
      }
      return;
    }

    if (!manifest) return;
    const href = resolveApkDownloadUrl(manifest, role);
    const absolute = href.startsWith('http') ? href : `${window.location.origin}${href}`;
    window.location.assign(absolute);
  };

  const apkInstalled = Boolean(installedApkVersion);
  const apkStatus: ProductStatus = loading
    ? 'checking'
    : apkInstalled
      ? apkNeedsUpdate
        ? 'update'
        : 'installed'
      : 'available';

  const pwaStatus: ProductStatus = loading ? 'checking' : pwaActive ? 'current' : 'available';

  const apkDescription = loading
    ? 'Checking your installed version…'
    : !apkInstalled
      ? 'Best for guards in the field — native notifications, GPS, and camera permissions.'
      : apkNeedsUpdate
        ? `Installed ${formatAppVersion(installedApkVersion!)}. Latest is ${formatAppVersion(manifest!.apkVersion)}.`
        : `Up to date on ${formatAppVersion(installedApkVersion!)}.`;

  const apkActionLabel = installing
    ? 'Preparing…'
    : isNativeView
      ? apkNeedsUpdate
        ? 'Install update'
        : 'Reinstall app'
      : apkNeedsUpdate
        ? 'Download update'
        : 'Get full app';

  const apkActionHint = manifest?.apkVersion ? formatAppVersion(manifest.apkVersion) : undefined;

  const pwaDescription = pwaActive
    ? 'Your lite shortcut updates automatically whenever guardr.co updates.'
    : 'Quick access from your home screen — no APK download required.';

  return (
    <div className="install-screen page-shell min-h-screen bg-brand-bg text-brand-text">
      <header className="install-screen-header">
        <div className="install-screen-header-inner">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </button>
          <div className="install-screen-header-end">
            {headerRight}
            <div className="install-screen-brand">
              <Logo size={22} className="text-brand-primary" />
              <span>{SITE_NAME}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="install-screen-main">
        <section className="install-screen-hero">
          <p className="install-screen-eyebrow">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Install &amp; updates
          </p>
          <h1 className="install-screen-title">{downloadScreenTitle(liveContext)}</h1>
          <p className="install-screen-lead">{downloadScreenIntro(liveContext)}</p>

          <div className="install-screen-context">
            <span className="install-screen-context-label">You are here</span>
            <span className="install-screen-context-value">
              {loading ? 'Checking…' : downloadLiveContextMessage(liveContext)}
            </span>
          </div>

          {manifest ? (
            <p className="install-screen-versions">
              Latest full app {formatAppVersion(manifest.apkVersion)}
              <span className="install-screen-versions-dot" aria-hidden>
                ·
              </span>
              Lite web {formatAppVersion(manifest.webVersion)}
            </p>
          ) : null}
        </section>

        <div className="install-screen-stack">
          <ProductCard
            variant="full"
            title={INSTALL_APK_TITLE}
            subtitle={INSTALL_APK_SHORT}
            status={apkStatus}
            description={apkDescription}
            highlighted
            features={
              <>
                <FeatureRow icon={Bell}>Strongest push alerts (FCM)</FeatureRow>
                <FeatureRow icon={MapPin}>GPS check-in and live location</FeatureRow>
                <FeatureRow icon={Camera}>Camera and photo uploads</FeatureRow>
              </>
            }
            action={
              <button
                type="button"
                onClick={() => void handleApkAction(highlightedApp ?? 'zip')}
                disabled={loading || installing || !manifest}
                className="install-cta install-cta--primary"
              >
                <span className="install-cta-icon" aria-hidden>
                  {installing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </span>
                <span className="install-cta-copy">
                  <span className="install-cta-title">{apkActionLabel}</span>
                  {apkActionHint ? <span className="install-cta-sub">{apkActionHint}</span> : null}
                </span>
              </button>
            }
            footer={
              <>
                {isNativeView ? (
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading || installing}
                    className="install-cta install-cta--ghost"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden />
                    Check again
                  </button>
                ) : null}
                {!isNativeView ? (
                  <div className="install-qr-block">
                    <img
                      src="/download/apk-qr.png"
                      alt="QR code to download Guardr Client, Guard, and Staff Android apps"
                      className="install-qr-image"
                    />
                    <p className="install-qr-caption">
                      <QrCode className="w-3.5 h-3.5" aria-hidden />
                      Scan on another device
                    </p>
                  </div>
                ) : null}
              </>
            }
          />

          {!isNativeView ? (
            <section className="install-role-apps" aria-label="Individual Android apps">
              <h2 className="install-compare-title">Install one app</h2>
              <p className="install-product-card-copy">
                Each APK has its own icon and can sit next to the others on your phone.
              </p>
              <div className="install-product-card-actions">
                {(['client', 'guard', 'staff'] as const).map((role) => {
                  const links = manifest?.apps?.[role];
                  const href = links?.apkUrl ?? `/download/guardr-${role}.apk`;
                  const highlighted = highlightedApp === role;
                  return (
                    <a
                      key={role}
                      href={href}
                      download={`guardr-${role}.apk`}
                      className={`install-cta ${highlighted ? 'install-cta--primary' : 'install-cta--secondary'}`}
                    >
                      <span className="install-cta-copy">
                        <span className="install-cta-title">{PRODUCT_APP_LAUNCHER_NAMES[role]}</span>
                        <span className="install-cta-sub">{PRODUCT_APP_TAGLINES[role]}</span>
                      </span>
                    </a>
                  );
                })}
                <a
                  href={manifest?.zipUrl ?? '/download/guardr-apps.zip'}
                  download="guardr-apps.zip"
                  className="install-cta install-cta--ghost"
                >
                  <span className="install-cta-copy">
                    <span className="install-cta-title">Download all three (zip)</span>
                    <span className="install-cta-sub">Client + Guard + Staff</span>
                  </span>
                </a>
              </div>
            </section>
          ) : null}

          {isPwaView ? (
            <div className="install-lite-note">
              <Check className="w-4 h-4 shrink-0 text-brand-primary" aria-hidden />
              <p>
                Staying on <strong>{INSTALL_PWA_TITLE}</strong> is fine for quick access — upgrade
                anytime when you need the full field experience.
              </p>
            </div>
          ) : null}

          {isBrowserView ? (
            <ProductCard
              variant="lite"
              title={INSTALL_PWA_TITLE}
              subtitle={INSTALL_PWA_SHORT}
              status={pwaStatus}
              description={pwaDescription}
              features={
                <>
                  <FeatureRow icon={Zap}>Auto-updates when you open the app</FeatureRow>
                  <FeatureRow icon={Smartphone}>Add to home screen in one tap</FeatureRow>
                  <FeatureRow icon={Bell}>Web push notifications</FeatureRow>
                </>
              }
              action={
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  className="install-cta install-cta--secondary"
                >
                  <span className="install-cta-icon" aria-hidden>
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <span className="install-cta-copy">
                    <span className="install-cta-title">
                      {hasDeferredPrompt
                        ? 'Install lite app'
                        : isIOS
                          ? 'Show install guide'
                          : 'Install lite app'}
                    </span>
                    <span className="install-cta-sub">Home-screen shortcut</span>
                  </span>
                </button>
              }
            />
          ) : null}

          {isBrowserView ? (
            <section className="install-compare">
              <h2 className="install-compare-title">Lite vs full</h2>
              <div className="install-compare-grid">
                <div className="install-compare-head">
                  <span />
                  <span>{INSTALL_APK_SHORT}</span>
                  <span>{INSTALL_PWA_SHORT}</span>
                </div>
                <CompareRow label="Updates" full="Manual install" lite="Automatic" />
                <CompareRow label="Alerts" full="Native FCM" lite="Web push" />
                <CompareRow label="Best for" full="Guards on shift" lite="Quick access" />
              </div>
            </section>
          ) : null}
        </div>

        {error ? (
          <div className="install-screen-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refresh()} className="install-screen-error-retry">
              Try again
            </button>
          </div>
        ) : null}

        {!isNativeView ? (
          <a href={SITE_URL} className="install-screen-browser-link">
            Open Guardr in browser
          </a>
        ) : null}
      </main>

      <AnimatePresence>
        {showGuide ? (
          <div className="install-screen-guide-backdrop">
            <PwaInstallGuide isIOS={isIOS} onClose={() => setShowGuide(false)} />
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
