import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { AppSettingsHead, AppSettingsSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { appVersionLabel } from '../../lib/appVersion';
import { fetchAppUpdateStatus, installLatestApk } from '../../lib/platform/apkUpdate';
import { showAppAlert } from '../ui/AppConfirm';

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
            </p>

            {checking ? (
              <p className="text-sm text-brand-text-muted inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Checking for updates…
              </p>
            ) : updateAvailable && latestVersion ? (
              <div className="space-y-3">
                <p className="text-sm text-brand-text">
                  A newer APK is available
                  {' '}
                  <span className="font-semibold">v{latestVersion}</span>.
                  Tap install and confirm when Android prompts you.
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
                You are on the latest APK
                {latestVersion ? ` (v${latestVersion})` : ''}.
              </p>
            )}

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => void refreshStatus()}
                disabled={checking || installing}
                className="app-button-outline app-btn-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden />
                Check again
              </button>
              {onOpenDownload ? (
                <button
                  type="button"
                  onClick={onOpenDownload}
                  className="app-button-outline app-btn-sm text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  Install options
                </button>
              ) : null}
            </div>
          </div>
        </AppSettingsSection>
      </>
    );
  }

  return (
    <>
      <AppSettingsHead>App install</AppSettingsHead>
      <AppSettingsSection>
        <div className="space-y-3">
          <p className="text-sm text-brand-text-muted">
            {appVersionLabel()}
            {' · '}
            {shellKind === 'pwa' ? 'Installed web app (auto-updates)' : 'Web browser'}
          </p>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {shellKind === 'pwa'
              ? 'Your home-screen shortcut updates automatically when guardr.co updates. Open Install options to compare with the Android APK.'
              : 'Install Guardr as an Android APK or add it to your home screen from Install options.'}
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
