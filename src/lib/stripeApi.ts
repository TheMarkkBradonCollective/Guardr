/** Client-side helpers for Guardr Stripe API routes (secrets stay server-side). */

export async function createCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const res = await fetch('/api/stripe/checkout/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
  return data;
}

export async function createConnectAccount(params: {
  guardId: string;
  email: string;
  name?: string;
}): Promise<{ accountId: string }> {
  const res = await fetch('/api/stripe/connect/create-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create Connect account');
  return data;
}

export async function createConnectAccountLink(accountId: string): Promise<{ url: string }> {
  const res = await fetch('/api/stripe/connect/account-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create onboarding link');
  return data;
}

export async function getConnectAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const res = await fetch(`/api/stripe/connect/status/${accountId}`);
  const data = await res.json();
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
  const res = await fetch('/api/stripe/payout/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payout release failed');
  return data;
}

export async function holdJobPayment(jobId: string): Promise<void> {
  const res = await fetch('/api/stripe/payment/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to hold payment');
  }
}

export async function refundPayment(params: {
  paymentIntentId: string;
  jobId: string;
}): Promise<void> {
  const res = await fetch('/api/stripe/payment/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Refund failed');
  }
}

export async function fetchPayments(): Promise<
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
  const res = await fetch('/api/stripe/payments');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load payments');
  return data.payments ?? [];
}

export async function isStripeConfigured(): Promise<boolean> {
  try {
    const res = await fetch('/api/stripe/health');
    const data = await res.json();
    return !!data.configured;
  } catch {
    return false;
  }
}
