import { apiUrl } from './siteConfig';
import type { ClientMessage, SessionUser } from '../types';
import { parseApiResponse, sessionBody } from './pushApi';

export async function fetchClientMessagesFromApi(user: SessionUser): Promise<ClientMessage[]> {
  const params = new URLSearchParams({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const res = await fetch(apiUrl(`/api/messages/clients?${params.toString()}`));
  const data = await parseApiResponse<{ messages?: ClientMessage[] }>(res);
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Failed to load client messages (${res.status})`);
  }
  return Array.isArray(data.messages) ? data.messages : [];
}

export async function postClientMessageToApi(
  user: SessionUser,
  message: ClientMessage
): Promise<void> {
  const res = await fetch(apiUrl('/api/messages/clients'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...sessionBody(user),
      message,
    }),
  });
  const data = await parseApiResponse<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to send client message (${res.status})`);
  }
}
