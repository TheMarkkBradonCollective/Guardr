import type { SessionCredentials } from './accountSessionAuth';

type RequestLike = {
  method?: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
};

function readField(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

export function parseSessionCredentials(req: RequestLike): SessionCredentials | null {
  const query = (req.query ?? {}) as Record<string, string | string[] | undefined>;
  const queryUserId = query.userId;
  const queryEmail = query.email;
  const queryRole = query.role;

  const asString = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
  };

  const userIdFromQuery = asString(queryUserId);
  const emailFromQuery = asString(queryEmail);
  const roleFromQuery = asString(queryRole);

  if (userIdFromQuery && emailFromQuery && roleFromQuery) {
    return { userId: userIdFromQuery, email: emailFromQuery, role: roleFromQuery };
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const userId = readField(body, 'userId');
  const email = readField(body, 'email');
  const role = readField(body, 'role');

  if (userId && email && role) {
    return { userId, email, role };
  }

  return null;
}
