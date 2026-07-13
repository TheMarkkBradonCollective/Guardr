const PUSH_ENABLED_KEY = 'guardr_push_enabled';

export function isPushEnabledLocally(): boolean {
  try {
    return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPushEnabledLocally(enabled: boolean): void {
  try {
    localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}
