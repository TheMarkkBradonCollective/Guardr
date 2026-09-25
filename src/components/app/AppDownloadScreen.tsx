import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Camera,
  Download,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../Logo';
import { SITE_NAME, SITE_URL } from '../../lib/siteConfig';
import { useAppDownloadStatus, canInstallApkInApp } from '../../hooks/useAppDownloadStatus';
import { installLatestApk } from '../../lib/platform/apkUpdate';
import { showAppAlert } from '../ui/AppConfirm';
import {
  INSTALL_APK_SHORT,
  downloadLiveContextMessage,
  downloadScreenIntro,
  downloadScreenTitle,
} from '../../lib/installSurfaceCopy';
import { formatAppVersion } from '../../lib/appVersion';
import { GITHUB_ALL_APKS_ZIP, GITHUB_MESSENGER_APP, GITHUB_ROLE_APKS } from '../../lib/githubApkRelease';
import { productAppHasGreyLauncher, productAppHasLightLauncher } from '../../lib/productApps';
import { userFacingError } from '../../lib/userFacingError';

interface AppDownloadScreenProps {
  onBack?: () => void;
  headerRight?: React.ReactNode;
  /** Account Downloads tab — APK cards only, no public overlay chrome. */
  embedded?: boolean;
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

export function AppDownloadScreen({ onBack, headerRight, embedded = false }: AppDownloadScreenProps) {
  const {
    loading,
    error,
    manifest,
    installedApkVersion,
    liveContext,
    apkNeedsUpdate,
    refresh,
  } = useAppDownloadStatus();
  const [installing, setInstalling] = useState(false);

  const isNativeView = liveContext === 'apk';

  const handleApkAction = async () => {
    if (canInstallApkInApp()) {
      setInstalling(true);
      try {
        await installLatestApk(manifest ?? undefined);
      } catch (installError) {
        void showAppAlert({
          title: isNativeView ? 'Update failed' : 'Install failed',
          message:
            userFacingError(installError, 'Could not start the APK install.'),
          tone: 'warning',
        });
      } finally {
        setInstalling(false);
      }
      return;
    }

    if (!manifest?.apkUrl) return;

    const href = manifest.apkUrl.startsWith('http')
      ? manifest.apkUrl
      : `${window.location.origin}${manifest.apkUrl}`;
    window.location.assign(href);
  };

  const apkInstalled = Boolean(installedApkVersion);
  const apkStatus: ProductStatus = loading
    ? 'checking'
    : apkInstalled
      ? apkNeedsUpdate
        ? 'update'
        : 'installed'
      : 'available';

  const apkDescription = loading
    ? 'Checking your installed version…'
    : !apkInstalled
      ? 'Guard, Customer, and Staff are separate Android apps — native notifications, GPS, and camera.'
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
        : 'Get Android app';

  const apkActionHint = manifest?.apkVersion ? formatAppVersion(manifest.apkVersion) : undefined;

  const apkStack = (
        <div className="install-screen-stack">
          {isNativeView ? (
            <article className="install-product-card install-product-card--full install-product-card--highlight">
              <div className="install-product-card-top">
                <div className="install-product-card-icon" aria-hidden>
                  <Shield className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="install-product-card-head">
                  <div className="install-product-card-title-row">
                    <h2 className="install-product-card-title">This app</h2>
                    <ProductStatusPill status={apkStatus} />
                  </div>
                  <p className="install-product-card-subtitle">{INSTALL_APK_SHORT}</p>
                </div>
              </div>

              <p className="install-product-card-copy">{apkDescription}</p>

              <ul className="install-product-features">
                <FeatureRow icon={Bell}>Native push alerts (FCM)</FeatureRow>
                <FeatureRow icon={MapPin}>GPS check-in and live location</FeatureRow>
                <FeatureRow icon={Camera}>Camera and photo uploads</FeatureRow>
              </ul>

              <div className="install-product-card-actions">
                <button
                  type="button"
                  onClick={() => void handleApkAction()}
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
              </div>

              <div className="install-product-card-footer">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={loading || installing}
                  className="install-cta install-cta--ghost"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden />
                  Check again
                </button>
              </div>
            </article>
          ) : (
            <>
              {GITHUB_ROLE_APKS.map((app) => (
                <article key={app.id} className="install-product-card install-product-card--full">
                  <div className="install-product-card-top">
                    <img
                      src={`/icons/${app.id}-192.png`}
                      width={40}
                      height={40}
                      alt=""
                      className={`install-product-card-icon${
                        productAppHasGreyLauncher(app.id)
                          ? ' install-product-card-icon--staff'
                          : productAppHasLightLauncher(app.id)
                            ? ' install-product-card-icon--light'
                            : ''
                      }`}
                      style={{ objectFit: 'cover', borderRadius: 10 }}
                    />
                    <div className="install-product-card-head">
                      <div className="install-product-card-title-row">
                        <h2 className="install-product-card-title">{app.label}</h2>
                      </div>
                      <p className="install-product-card-subtitle">{app.tagline}</p>
                    </div>
                  </div>
                  <div className="install-product-card-actions">
                    <a href={app.url} className="install-cta install-cta--primary" style={{ textDecoration: 'none' }}>
                      <span className="install-cta-icon" aria-hidden>
                        <Download className="w-4 h-4" />
                      </span>
                      <span className="install-cta-copy">
                        <span className="install-cta-title">Download {app.label}</span>
                        <span className="install-cta-sub">{app.file}</span>
                      </span>
                    </a>
                  </div>
                </article>
              ))}
              <a href={GITHUB_ALL_APKS_ZIP} className="install-cta install-cta--ghost" style={{ textDecoration: 'none' }}>
                Download all APKs (GitHub zip)
              </a>
              <a href={GITHUB_MESSENGER_APP.url} download={GITHUB_MESSENGER_APP.file} className="install-cta install-cta--ghost" style={{ textDecoration: 'none' }}>
                Download Messenger
              </a>
              {!embedded ? (
                <div className="install-qr-block">
                  <img
                    src="/download/apk-qr.png"
                    alt="QR code to the Guardr download page"
                    className="install-qr-image"
                  />
                  <p className="install-qr-caption">
                    <QrCode className="w-3.5 h-3.5" aria-hidden />
                    Scan on another device
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
  );

  if (embedded) {
    return (
      <div className="install-screen install-screen--embedded">
        {manifest ? (
          <p className="install-screen-versions" style={{ marginBottom: 16 }}>
            Latest {INSTALL_APK_SHORT} {formatAppVersion(manifest.apkVersion)}
          </p>
        ) : null}
        {apkStack}
        {error ? (
          <div className="install-screen-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refresh()} className="install-screen-error-retry">
              Try again
            </button>
          </div>
        ) : null}
      </div>
    );
  }

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
            Android apps
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
              Latest {INSTALL_APK_SHORT} {formatAppVersion(manifest.apkVersion)}
            </p>
          ) : null}
        </section>

        {apkStack}

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
    </div>
  );
}
