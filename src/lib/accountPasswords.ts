/** Default password assigned when staff manually creates guard, client, or staff accounts */
export const STAFF_PROVISIONED_DEFAULT_PASSWORD = '#Qwerty12345';

const STORAGE_KEY = 'guardr_account_passwords';

export interface StoredAccountPassword {
  password: string;
  mustChangePassword: boolean;
  role: 'guard' | 'client';
}

export function isDefaultProvisionedPassword(password: string | null | undefined): boolean {
  return password === STAFF_PROVISIONED_DEFAULT_PASSWORD;
}

export function shouldPromptPasswordChange(password: string | null | undefined): boolean {
  return isDefaultProvisionedPassword(password);
}

/** Legacy rows without a stored password still allow sign-in (any password ≥ 4 chars). */
export function verifyAccountPassword(stored: string | null | undefined, entered: string): boolean {
  if (!stored) return entered.length >= 4;
  return stored === entered;
}

export function loadPasswordStore(): Record<string, StoredAccountPassword> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function savePasswordStore(store: Record<string, StoredAccountPassword>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getStoredPassword(email: string): StoredAccountPassword | undefined {
  return loadPasswordStore()[email.toLowerCase()];
}

export function setStoredPassword(email: string, entry: StoredAccountPassword): void {
  const store = loadPasswordStore();
  store[email.toLowerCase()] = entry;
  savePasswordStore(store);
}

export function provisionedPasswordFields() {
  return {
    password: STAFF_PROVISIONED_DEFAULT_PASSWORD,
    mustChangePassword: true,
  };
}
