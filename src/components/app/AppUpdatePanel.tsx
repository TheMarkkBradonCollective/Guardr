import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { AppSettingsHead, AppSettingsSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { appVersionLabel } from '../../lib/appVersion';
import { fetchAppUpdateStatus, installLatestApk } from '../../lib/platform/apkUpdate';
import { showAppAlert } from '../ui/AppConfirm';
import { INSTALL_APK_TITLE, INSTALL_PWA_TITLE } from '../../lib/installSurfaceCopy';

interface AppUpdatePanelProps {
  onOpenDownload?: () => void;
}

export function AppUpdatePanel({ onOpenDownload }: AppUpdatePanelProps) {
  const { shellKind } = useDevice();
  const [checking, setChecking] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const status = await fetchAppUpdateStatus();
      setInstalledVersion(status.installed?.version ?? null);
      setLatestVersion(status.manifest.apkVersion);
      setUpdateAvailable(status.updateAvailable);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not check for updates.');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const handleInstallUpdate = async () => {
    setInstalling(true);
    setError(null);
    try {
      await installLatestApk();
    } catch (installError) {
      const message =
        installError instanceof Error ? installError.message : 'Could not start the update install.';
      setError(message);
      void showAppAlert({
        title: 'Update failed',
        message,
        tone: 'warning',
      });
    } finally {
      setInstalling(false);
    }
  };

  if (shellKind === 'native') {
    return (
      <>
        <AppSettingsHead>App update</AppSettingsHead>
        <AppSettingsSection>
          <div className="space-y-3">
            <p className="text-sm text-brand-text-muted">
              {appVersionLabel()}
              {installedVersion ? ` · Installed v${installedVersion}` : ''}
              {' · '}
              {INSTALL_APK_TITLE}
            </p>

            {checking ? (
              <p className="text-sm text-brand-text-muted inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Checking for updates…
              </p>
            ) : updateAvailable && latestVersion ? (
              <div className="space-y-3">
                <p className="text-sm text-brand-text">
                  A newer version is available:{' '}
                  <span className="font-semibold">v{latestVersion}</span>. Tap install and confirm when
                  Android prompts you.
                </p>
                <button
                  type="button"
                  onClick={() => void handleInstallUpdate()}
                  disabled={installing}
                  className="app-button-primary app-btn-md w-full sm:w-auto inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500 disabled:opacity-60"
                >
                  {installing ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="w-4 h-4" aria-hidden />
                  )}
                  <span>{installing ? 'Preparing update…' : `Install update (v${latestVersion})`}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-brand-text-muted">
                You are on the latest version
                {latestVersion ? ` (v${latestVersion})` : ''}.
              </p>
            )}

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={checking || installing}
              className="app-button-outline app-btn-sm inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Check again
            </button>
          </div>
        </AppSettingsSection>
      </>
    );
  }

  if (shellKind === 'pwa') {
    return (
      <>
        <AppSettingsHead>{INSTALL_APK_TITLE}</AppSettingsHead>
        <AppSettingsSection>
          <div className="space-y-3">
            <p className="text-sm text-brand-text-muted">
              {appVersionLabel()}
              {' · '}
              {INSTALL_PWA_TITLE} (auto-updates)
            </p>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              You are on the lite home-screen version. Upgrade to {INSTALL_APK_TITLE} for stronger
              notifications, GPS, and camera permissions.
            </p>
            {onOpenDownload ? (
              <button
                type="button"
                onClick={onOpenDownload}
                className="app-button-primary app-btn-md w-full sm:w-auto inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500"
              >
                <Download className="w-4 h-4" aria-hidden />
                Get {INSTALL_APK_TITLE}
              </button>
            ) : null}
          </div>
        </AppSettingsSection>
      </>
    );
  }

  return (
    <>
      <AppSettingsHead>Install Guardr</AppSettingsHead>
      <AppSettingsSection>
        <div className="space-y-3">
          <p className="text-sm text-brand-text-muted">
            {appVersionLabel()}
            {' · '}
            Web browser
          </p>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Install {INSTALL_PWA_TITLE} for quick access, or {INSTALL_APK_TITLE} for guards in the
            field.
          </p>
          {onOpenDownload ? (
            <button
              type="button"
              onClick={onOpenDownload}
              className="app-button-primary app-btn-md w-full sm:w-auto inline-flex items-center justify-center gap-2 !bg-emerald-600 hover:!bg-emerald-500"
            >
              <Download className="w-4 h-4" aria-hidden />
              Install options
            </button>
          ) : null}
        </div>
      </AppSettingsSection>
    </>
  );
}
