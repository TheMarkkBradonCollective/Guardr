/** App version injected at build time from package.json. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '—';

/** User-facing version string (e.g. "1.0.89 Beta"). */
export function formatAppVersion(version = APP_VERSION): string {
  const raw = String(version);
  if (/-beta$/i.test(raw)) {
    return `${raw.replace(/-beta$/i, '')} Beta`;
  }
  return raw;
}

export function appVersionLabel(): string {
  return `Guardr v${formatAppVersion()}`;
}
