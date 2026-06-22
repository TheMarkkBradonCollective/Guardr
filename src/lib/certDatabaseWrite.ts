import type { SupabaseClient } from '@supabase/supabase-js';
import { certDatabaseErrorMessage } from './certImagePolicy';

type CertRow = Record<string, unknown>;

const OPTIONAL_CERT_COLUMNS = ['submitted_by_role', 'rejection_reason'] as const;

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

async function writeWithOptionalColumnFallback(
  write: (row: CertRow) => Promise<{ error: { code?: string; message?: string } | null }>,
  row: CertRow
): Promise<{ error: { code?: string; message?: string } | null }> {
  let current: CertRow = { ...row };
  const dropped = new Set<string>();

  for (let attempt = 0; attempt < OPTIONAL_CERT_COLUMNS.length + 2; attempt += 1) {
    const { error } = await write(current);
    if (!error) return { error: null };
    if (!isMissingColumnError(error)) return { error };

    const missing = parseMissingColumn(error.message);
    if (missing === 'image_url') {
      return { error };
    }
    if (
      missing &&
      missing in current &&
      OPTIONAL_CERT_COLUMNS.includes(missing as (typeof OPTIONAL_CERT_COLUMNS)[number])
    ) {
      const next = { ...current };
      delete next[missing];
      current = next;
      dropped.add(missing);
      continue;
    }

    return { error };
  }

  return {
    error: {
      code: 'PGRST204',
      message: 'Could not save credential — database schema is out of date.',
    },
  };
}

export async function insertCertificationRow(
  supabase: SupabaseClient,
  row: CertRow
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await writeWithOptionalColumnFallback(
    (payload) => supabase.from('certifications').insert(payload),
    row
  );
  if (error) {
    console.error('Cert insert error:', error);
    return { ok: false, error: certDatabaseErrorMessage(error) };
  }
  return { ok: true };
}

export async function updateCertificationRow(
  supabase: SupabaseClient,
  certId: string,
  row: CertRow
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await writeWithOptionalColumnFallback(
    (payload) => supabase.from('certifications').update(payload).eq('id', certId),
    row
  );
  if (error) {
    console.error('Cert update error:', error);
    return { ok: false, error: certDatabaseErrorMessage(error) };
  }
  return { ok: true };
}
