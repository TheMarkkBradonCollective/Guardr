/** App release version injected at build time from package.json. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '—';

export function appVersionLabel(): string {
  return `Guardr v${APP_VERSION}`;
}
