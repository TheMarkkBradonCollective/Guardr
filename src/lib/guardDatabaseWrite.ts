import type { SupabaseClient } from '@supabase/supabase-js';
import { guardAccountDatabaseErrorMessage } from './accountStatus';

type GuardRow = Record<string, unknown>;

const OPTIONAL_GUARD_COLUMNS = [
  'credential_grace_deadline',
  'credential_grace_missing',
  'credential_grace_hours',
] as const;

function parseMissingColumn(message?: string): string | null {
  if (!message) return null;
  const quoted = message.match(/'([^']+)'\s+column/i);
  if (quoted?.[1]) return quoted[1];
  const bare = message.match(/column\s+["']?(\w+)["']?\s+of/i);
  return bare?.[1] ?? null;
}

function isMissingColumnError(error: { code?: string; message?: string }): boolean {
  return error.code === 'PGRST204' || Boolean(error.message?.toLowerCase().includes('column'));
}

function isUserStatusConstraintError(error: { message?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  return msg.includes('user_status') || msg.includes('guards_user_status_check');
}

async function writeGuardRowWithFallback(
  write: (row: GuardRow) => Promise<{ error: { code?: string; message?: string } | null }>,
  row: GuardRow
): Promise<{ error: { code?: string; message?: string } | null }> {
  let current: GuardRow = { ...row };

  for (let attempt = 0; attempt < OPTIONAL_GUARD_COLUMNS.length + 2; attempt += 1) {
    const { error } = await write(current);
    if (!error) return { error: null };
    if (isUserStatusConstraintError(error)) return { error };
    if (!isMissingColumnError(error)) return { error };

    const missing = parseMissingColumn(error.message);
    if (
      missing &&
      missing in current &&
      OPTIONAL_GUARD_COLUMNS.includes(missing as (typeof OPTIONAL_GUARD_COLUMNS)[number])
    ) {
      const next = { ...current };
      delete next[missing];
      current = next;
      continue;
    }

    return { error };
  }

  return {
    error: {
      code: 'PGRST204',
      message: 'Could not save guard account — database schema is out of date.',
    },
  };
}

export async function updateGuardAccountRow(
  supabase: SupabaseClient,
  guardId: string,
  row: GuardRow,
  action: 'approve' | 'activate'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await writeGuardRowWithFallback(
    async (payload) => supabase.from('guards').update(payload).eq('id', guardId),
    row
  );
  if (error) {
    console.error(`Guard ${action} error:`, error);
    return { ok: false, error: guardAccountDatabaseErrorMessage(error, action) };
  }
  return { ok: true };
}
