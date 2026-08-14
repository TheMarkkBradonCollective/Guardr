import { apiUrl } from './siteConfig';
import type { StaffMessage, SessionUser } from '../types';
import { parseApiResponse, sessionBody } from './pushApi';

export async function fetchStaffMessagesFromApi(user: SessionUser): Promise<StaffMessage[]> {
  const params = new URLSearchParams({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const res = await fetch(apiUrl(`/api/messages/staff?${params.toString()}`));
  const data = await parseApiResponse<{ messages?: StaffMessage[] }>(res);
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Failed to load staff messages (${res.status})`);
  }
  return Array.isArray(data.messages) ? data.messages : [];
}

export async function postStaffMessageToApi(
  user: SessionUser,
  message: StaffMessage
): Promise<void> {
  const res = await fetch(apiUrl('/api/messages/staff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...sessionBody(user),
      message,
    }),
  });
  const data = await parseApiResponse<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to send staff message (${res.status})`);
  }
}

export async function deleteStaffMessageFromApi(
  user: SessionUser,
  messageId: string
): Promise<void> {
  const res = await fetch(apiUrl('/api/messages/staff'), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...sessionBody(user),
      messageId,
    }),
  });
  const data = await parseApiResponse<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error ?? `Failed to delete staff message (${res.status})`);
  }
}
