import type { PaymentProcessorHealth } from './paymentProcessors';
import { apiUrl } from './siteConfig';

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Empty server response' : `Server error (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`Server returned invalid response: ${preview}`);
  }
}

export async function fetchPaymentProcessorHealth(): Promise<PaymentProcessorHealth> {
  const res = await fetch(apiUrl('/api/payments/health'));
  const data = await parseApiResponse<PaymentProcessorHealth>(res);
  if (!res.ok) {
    throw new Error('Failed to load payment processor status');
  }
  return {
    stripe: {
      configured: !!data.stripe?.configured,
      publishableKey: data.stripe?.publishableKey ?? null,
    },
    square: {
      configured: !!data.square?.configured,
      applicationId: data.square?.applicationId ?? null,
      locationId: data.square?.locationId ?? null,
    },
  };
}

export async function createSquareCheckoutSession(params: {
  jobId: string;
  clientEmail: string;
  jobTitle: string;
  amountCents: number;
}): Promise<{ url: string; paymentLinkId: string }> {
  const res = await fetch(apiUrl('/api/square/checkout/create-payment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await parseApiResponse<{ url: string; paymentLinkId: string; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to create Square checkout');
  return data;
}
