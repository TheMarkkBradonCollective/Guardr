/** Client-side helpers for Guardr Stripe API routes (secrets stay server-side). */

import { apiUrl } from './api/guardrClient';
import type { ClientEmbeddedPaymentKind } from './stripe/stripeEmbeddedTypes';

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Empty server response' : `Server error (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ');
    if (preview.toLowerCase().includes('server error')) {
      throw new Error(
        'API server is down. Check Worker secrets (STRIPE_SECRET_KEY, DATABASE_URL) and redeploy.'
      );
    }
    throw new Error(`Server returned invalid response: ${preview}`);
  }
}

/** Embedded Payment Element flow (preferred). */
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof localStorage === 'undefined') return headers;
  const token = localStorage.getItem('guardr_api_jwt');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function createClientPaymentIntent(params: {
  kind: ClientEmbeddedPaymentKind;
  jobId: string;
  clientEmail: string;
  jobTitle?: string;
  amountCents: number;
  testMode?: boolean;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const res = await fetch(apiUrl('/api/stripe/payment-intent/create'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ clientSecret: string; paymentIntentId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create payment');
  return data;
}

/** @deprecated Redirect Checkout — kept for compatibility; UI uses PaymentIntents. */
export async function createCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch(apiUrl('/api/stripe/checkout/create-session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ url: string; sessionId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
  return data;
}

/** @deprecated */
export async function createOvertimeCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch(apiUrl('/api/stripe/checkout/overtime-charge'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ url: string; sessionId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create overtime checkout session');
  return data;
}

/** @deprecated */
export async function createScheduleChangeCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch(apiUrl('/api/stripe/checkout/schedule-change-charge'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ url: string; sessionId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create schedule change checkout session');
  return data;
}

/** @deprecated */
export async function createTipCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch(apiUrl('/api/stripe/checkout/tip-charge'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ url: string; sessionId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create tip checkout session');
  return data;
}

export async function createCashDepositCheckoutSession(_params: {
  jobId: string;
  directorEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  throw new Error(
    'Cash deposits are no longer supported. Client payments and guard payouts use Stripe only.'
  );
}

export async function createConnectAccount(params: {
  guardId?: string;
  staffId?: string;
  email: string;
  name?: string;
}): Promise<{ accountId: string }> {
  const res = await fetch(apiUrl('/api/stripe/connect/create-account'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ accountId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create Connect account');
  return data;
}

export async function createConnectAccountSession(
  accountId: string,
  component: 'account_onboarding' | 'account_management' = 'account_onboarding'
): Promise<{ clientSecret: string }> {
  const res = await fetch(apiUrl('/api/stripe/connect/account-session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, component }),
  });
  const data = await parseApiResponse<{ clientSecret: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to start Connect onboarding');
  return data;
}

/** @deprecated Hosted Connect onboarding link — UI uses embedded Connect. */
export async function createConnectAccountLink(accountId: string): Promise<{ url: string }> {
  const res = await fetch(apiUrl('/api/stripe/connect/account-link'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const data = await parseApiResponse<{ url: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create onboarding link');
  return data;
}

export async function getConnectAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const res = await fetch(apiUrl(`/api/stripe/connect/status/${accountId}`));
  const data = await parseApiResponse<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to fetch Connect status');
  return data;
}

export async function releasePayout(params: {
  jobId: string;
  guardConnectAccountId: string;
  hourlyRate: number;
  durationHours: number;
  force?: boolean;
}): Promise<{ transferId: string; amountCents: number }> {
  const res = await fetch(apiUrl('/api/stripe/payout/release'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ transferId: string; amountCents: number; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Payout release failed');
  return data;
}

export async function holdJobPayment(jobId: string): Promise<void> {
  const res = await fetch(apiUrl('/api/stripe/payment/hold'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) {
    const data = await parseApiResponse<{ error?: string }>(res);
    throw new Error(data.error || 'Failed to hold payment');
  }
}

export async function refundPayment(params: {
  paymentIntentId: string;
  jobId: string;
}): Promise<void> {
  const res = await fetch(apiUrl('/api/stripe/payment/refund'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await parseApiResponse<{ error?: string }>(res);
    throw new Error(data.error || 'Refund failed');
  }
}

export async function fetchPayments(session: {
  userId: string;
  email: string;
  role: string;
}): Promise<
  Array<{
    id: string;
    job_id: string;
    amount: number;
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
    stripe_transfer_id?: string;
    status: string;
    created_at?: string;
  }>
> {
  const params = new URLSearchParams({
    userId: session.userId,
    email: session.email,
    role: session.role,
  });
  const res = await fetch(apiUrl(`/api/stripe/payments?${params.toString()}`));
  const data = await parseApiResponse<{ payments?: unknown[]; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to load payments');
  return (data.payments ?? []) as Array<{
    id: string;
    job_id: string;
    amount: number;
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
    stripe_transfer_id?: string;
    status: string;
    created_at?: string;
  }>;
}

export async function isStripeConfigured(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/stripe/health'));
    const data = await parseApiResponse<{ configured?: boolean }>(res);
    return !!data.configured;
  } catch {
    return false;
  }
}
