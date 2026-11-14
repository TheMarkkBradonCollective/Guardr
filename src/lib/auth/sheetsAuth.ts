/** Client side of Guardr's own auth (bcrypt + JWT via /api/auth/*). */
const TOKEN_KEY = 'guardr.session.token';

export type SheetsRole = 'guard' | 'client' | 'staff' | 'admin';
export interface SheetsClaims { sub: string; email: string; role: SheetsRole; table: 'guards' | 'clients' | 'staff'; staffRole?: string | null }
export interface SheetsAuthResponse { token: string; claims: SheetsClaims; profile: Record<string, unknown> }

function storage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
export const getSessionToken = (): string | null => storage()?.getItem(TOKEN_KEY) ?? null;
const setSessionToken = (t: string | null) => { const s = storage(); if (!s) return; if (t) s.setItem(TOKEN_KEY, t); else s.removeItem(TOKEN_KEY); };

async function post<T>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; json: T & { error?: string } }> {
  const token = getSessionToken();
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, json: (await res.json().catch(() => ({}))) as T & { error?: string } };
}

export type SheetsLoginResult =
  | { status: 'ok'; data: SheetsAuthResponse }
  | { status: 'invalid_credentials' | 'blocked' | 'error'; message?: string };

export async function sheetsLogin(email: string, password: string): Promise<SheetsLoginResult> {
  const r = await post<SheetsAuthResponse>('/api/auth/login', { email, password });
  if (r.ok) { setSessionToken(r.json.token); return { status: 'ok', data: r.json }; }
  if (r.status === 401) return { status: 'invalid_credentials' };
  if (r.status === 403) return { status: 'blocked' };
  return { status: 'error', message: r.json.error };
}

export async function sheetsSignup(email: string, password: string, role: 'guard' | 'client', profile: Record<string, unknown> = {}) {
  const r = await post<SheetsAuthResponse>('/api/auth/signup', { email, password, role, profile });
  if (!r.ok) throw new Error(r.json.error ?? `Signup failed (${r.status})`);
  setSessionToken(r.json.token);
  return r.json;
}

export async function sheetsMe(): Promise<{ claims: SheetsClaims; profile: Record<string, unknown> } | null> {
  if (!getSessionToken()) return null;
  const r = await post<{ claims: SheetsClaims; profile: Record<string, unknown> }>('/api/auth/me');
  if (!r.ok) { if (r.status === 401) setSessionToken(null); return null; }
  return r.json;
}

export async function sheetsLogout(): Promise<void> {
  try { await post('/api/auth/logout', {}); } finally { setSessionToken(null); }
}
