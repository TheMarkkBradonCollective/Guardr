import type { GuardMessage, SessionUser } from '../types';
import { parseApiResponse, sessionBody } from './pushApi';

export async function fetchGuardMessagesFromApi(user: SessionUser): Promise<GuardMessage[]> {
  const params = new URLSearchParams({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const res = await fetch(`/api/messages/guards?${params.toString()}`);
  const data = await parseApiResponse<{ messages?: GuardMessage[] }>(res);
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Failed to load guard messages (${res.status})`);
  }
  return Array.isArray(data.messages) ? data.messages : [];
}

export async function postGuardMessageToApi(
  user: SessionUser,
  message: GuardMessage
): Promise<void> {
  const res = await fetch('/api/messages/guards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...sessionBody(user),
      message,
    }),
  });
  const data = await parseApiResponse<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to send guard message (${res.status})`);
  }
}
