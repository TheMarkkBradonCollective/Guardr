import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, Loader2, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { Logo } from '../Logo';
import { SITE_NAME, SITE_URL } from '../../lib/siteConfig';
import { useAppDownloadStatus, canInstallApkInApp } from '../../hooks/useAppDownloadStatus';
import { installLatestApk } from '../../lib/platform/apkUpdate';
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt';
import { PwaInstallGuide } from '../landing/PwaInstallGuide';
import { showAppAlert } from '../ui/AppConfirm';
import {
  INSTALL_APK_TITLE,
  INSTALL_PWA_TITLE,
  downloadLiveContextMessage,
  downloadScreenIntro,
  downloadScreenTitle,
} from '../../lib/installSurfaceCopy';

interface AppDownloadScreenProps {
  onBack: () => void;
  headerRight?: React.ReactNode;
}

function StatusBadge({ kind, children }: { kind: 'ok' | 'warn' | 'muted'; children: React.ReactNode }) {
  const classes =
    kind === 'ok'
      ? 'bg-emerald-500/15 text-emerald-400'
      : kind === 'warn'
        ? 'bg-amber-500/15 text-amber-300'
        : 'bg-brand-border/40 text-brand-text-muted';

  return (
    <span className={`text-[0.72rem] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${classes}`}>
      {children}
    </span>
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

  const isNativeView = liveContext === 'apk';
  const isPwaView = liveContext === 'pwa';
  const isBrowserView = liveContext === 'browser';

  const handleApkAction = async () => {
    if (canInstallApkInApp()) {
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

    if (!manifest?.apkUrl) {
      return;
    }

    const href = manifest.apkUrl.startsWith('http')
      ? manifest.apkUrl
      : `${window.location.origin}${manifest.apkUrl}`;
    window.location.assign(href);
  };

  const apkInstalled = Boolean(installedApkVersion);
  const apkButtonLabel = installing
    ? 'Preparing install…'
    : isNativeView
      ? apkNeedsUpdate
        ? `Install update (v${manifest?.apkVersion ?? ''})`
        : `Reinstall (v${manifest?.apkVersion ?? ''})`
      : apkNeedsUpdate
        ? `Download update (v${manifest?.apkVersion ?? ''})`
        : `Get ${INSTALL_APK_TITLE} (v${manifest?.apkVersion ?? ''})`;

  return (
    <div className="page-shell min-h-screen bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-50 border-b border-brand-border/80 bg-brand-bg/95 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back
          </button>
          <div className="flex items-center gap-3">
            {headerRight}
            <div className="flex items-center gap-2">
              <Logo size={24} className="text-brand-primary" />
              <span className="font-semibold text-brand-primary">{SITE_NAME}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 pb-16 space-y-4">
        <section className="wf-list-card p-5 space-y-3">
          <Logo size={48} className="text-brand-primary" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">{downloadScreenTitle(liveContext)}</h1>
            <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">
              {downloadScreenIntro(liveContext)}
            </p>
          </div>
          <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-3 py-2.5 text-sm text-brand-text">
            {loading ? 'Checking your device…' : downloadLiveContextMessage(liveContext)}
          </div>
          {manifest ? (
            <p className="text-xs text-brand-text-muted">
              Latest {INSTALL_APK_TITLE}: v{manifest.apkVersion} (build {manifest.apkVersionCode}) ·{' '}
              {INSTALL_PWA_TITLE}: v{manifest.webVersion}
            </p>
          ) : null}
        </section>

        <section className="wf-list-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">{INSTALL_APK_TITLE}</h2>
              <p className="text-xs text-brand-text-muted mt-1">
                {isNativeView
                  ? 'Full Android app with native notifications and permissions'
                  : 'Recommended for guards in the field'}
              </p>
            </div>
            {!loading && (
              <StatusBadge kind={apkInstalled ? (apkNeedsUpdate ? 'warn' : 'ok') : 'muted'}>
                {apkInstalled ? (apkNeedsUpdate ? 'Update available' : 'Up to date') : 'Not installed'}
              </StatusBadge>
            )}
          </div>

          <p className="text-sm text-brand-text-muted leading-relaxed">
            {loading
              ? 'Checking your installed version…'
              : !apkInstalled
                ? isNativeView
                  ? 'Open Guardr while online so we can read your installed version.'
                  : 'Download the full Android app for the best field experience.'
                : apkNeedsUpdate
                  ? `Installed v${installedApkVersion} · Latest v${manifest?.apkVersion}. Tap install and confirm when Android prompts you.`
                  : `Installed v${installedApkVersion} matches the latest release.`}
          </p>

          <button
            type="button"
            onClick={() => void handleApkAction()}
            disabled={loading || installing || !manifest}
            className="app-button-primary app-btn-md w-full inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500 disabled:opacity-60"
          >
            {installing ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : (
              <Download className="w-4 h-4" aria-hidden />
            )}
            <span>{apkButtonLabel}</span>
          </button>

          {isNativeView ? (
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading || installing}
              className="app-button-outline app-btn-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Check again
            </button>
          ) : null}

          {!isNativeView && manifest?.apkDirectUrl ? (
            <p className="text-xs text-brand-text-muted break-all">
              Direct link:{' '}
              <a href={manifest.apkDirectUrl} className="text-emerald-500 font-medium">
                {manifest.apkDirectUrl.replace(/\?v=\d+$/, '')}
              </a>
            </p>
          ) : null}

          {!isNativeView ? (
            <div className="rounded-xl border border-brand-border bg-brand-bg-sec/50 p-4 flex flex-col items-center gap-3">
              <img
                src="/download/apk-qr.png"
                alt={`Scan to download ${INSTALL_APK_TITLE}`}
                className="w-44 h-44 rounded-xl bg-white p-2"
              />
              <p className="text-xs text-brand-text-muted text-center inline-flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" aria-hidden />
                Scan to download on another device
              </p>
            </div>
          ) : null}
        </section>

        {isBrowserView ? (
          <section className="wf-list-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">{INSTALL_PWA_TITLE}</h2>
                <p className="text-xs text-brand-text-muted mt-1">Home-screen shortcut · auto-updates</p>
              </div>
              {!loading && (
                <StatusBadge kind={pwaActive ? 'ok' : 'muted'}>
                  {pwaActive ? 'Installed' : 'Not installed'}
                </StatusBadge>
              )}
            </div>

            <p className="text-sm text-brand-text-muted leading-relaxed">
              {pwaActive
                ? 'Your lite home-screen version updates automatically when guardr.co updates.'
                : 'Open guardr.co in Chrome, then use Add to Home screen / Install app for quick lite access.'}
            </p>

            <button
              type="button"
              onClick={() => void promptInstall()}
              className="app-button-outline app-btn-md w-full inline-flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" aria-hidden />
              <span>
                {hasDeferredPrompt
                  ? `Install ${INSTALL_PWA_TITLE}`
                  : isIOS
                    ? 'Show iOS install guide'
                    : `Install ${INSTALL_PWA_TITLE}`}
              </span>
            </button>
          </section>
        ) : null}

        {isBrowserView ? (
          <section className="wf-list-card p-5 space-y-3">
            <h2 className="text-base font-bold">Lite vs full</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-brand-text-muted border-b border-brand-border">
                    <th className="py-2 pr-3 font-semibold">Feature</th>
                    <th className="py-2 pr-3 font-semibold">{INSTALL_APK_TITLE}</th>
                    <th className="py-2 font-semibold">{INSTALL_PWA_TITLE}</th>
                  </tr>
                </thead>
                <tbody className="text-brand-text-muted">
                  <tr className="border-b border-brand-border/70">
                    <td className="py-2 pr-3">Updates</td>
                    <td className="py-2 pr-3">Manual reinstall</td>
                    <td className="py-2">Automatic</td>
                  </tr>
                  <tr className="border-b border-brand-border/70">
                    <td className="py-2 pr-3">Push alerts</td>
                    <td className="py-2 pr-3">Strongest (FCM)</td>
                    <td className="py-2">Web push</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3">Best for</td>
                    <td className="py-2 pr-3">Guards in the field</td>
                    <td className="py-2">Quick access, clients, staff</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button
              type="button"
              onClick={() => void refresh()}
              className="ml-3 underline font-medium"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!isNativeView ? (
          <a href={SITE_URL} className="inline-flex text-sm text-brand-primary font-medium">
            Open Guardr in browser
          </a>
        ) : null}
      </main>

      <AnimatePresence>
        {showGuide ? (
          <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-4 bg-black/50">
            <PwaInstallGuide isIOS={isIOS} onClose={() => setShowGuide(false)} />
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
