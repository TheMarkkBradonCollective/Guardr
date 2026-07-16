import type { IntegrationHealth } from './integrationProviders';
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

export async function fetchIntegrationHealth(): Promise<IntegrationHealth> {
  const res = await fetch(apiUrl('/api/integrations/health'));
  const data = await parseApiResponse<IntegrationHealth>(res);
  if (!res.ok) {
    throw new Error('Failed to load integration status');
  }
  return {
    twilio: { configured: !!data.twilio?.configured },
    checkr: { configured: !!data.checkr?.configured },
    insuranceApi: { configured: !!data.insuranceApi?.configured },
  };
}
