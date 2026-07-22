/** App version injected at build time from package.json. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '—';

/** Numeric version without prerelease suffix (e.g. "1.0.89"). */
export function baseAppVersion(version = APP_VERSION): string {
  return String(version).replace(/-beta$/i, '');
}

/** User-facing version string (e.g. "beta v1.0.89"). */
export function formatAppVersion(version = APP_VERSION): string {
  const base = baseAppVersion(version);
  if (/-beta$/i.test(String(version))) {
    return `beta v${base}`;
  }
  return `v${base}`;
}

export function appVersionLabel(): string {
  return `Guardr ${formatAppVersion()}`;
}
