/**
 * Apply push_subscriptions.app_channel on the configured database, then
 * verify the column via PostgREST.
 *
 * Usage:
 *   node scripts/apply-app-channel.mjs
 *   SUPABASE_CONFIG=/tmp/supabase-prod.json node scripts/apply-app-channel.mjs
 *   GUARDR_BASE_URL=https://www.guardr.co node scripts/apply-app-channel.mjs
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  applyPushSubscriptionsAppChannelSql,
  inspectPushAppChannelColumn,
} from '../lib/schemaApply.ts';

const CONFIG_PATH = process.env.SUPABASE_CONFIG || '/tmp/supabase-prod.json';
const BASE = process.env.GUARDR_BASE_URL || 'https://www.guardr.co';

function loadConfig() {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
    return {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    };
  }
  if (fs.existsSync(CONFIG_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return { url: parsed.url, key: parsed.serviceRole || parsed.anon };
  }
  return {
    url: 'https://opgzwurnjkrqkjujqokh.supabase.co',
    key: 'sb_publishable_j_GdBcVETxGoktiT6pdTZg_Rz4Fm82R',
  };
}

async function applyViaLiveApi() {
  const staffEmail = process.env.FIELD_TEST_STAFF_EMAIL || 'staff@guardr.co';
  const { url, key } = loadConfig();
  const db = createClient(url, key);
  const { data: staff, error } = await db
    .from('staff')
    .select('id,email,staff_role')
    .eq('email', staffEmail)
    .maybeSingle();
  if (error || !staff) {
    return { skipped: true, reason: `staff lookup failed: ${error?.message || 'not found'}` };
  }
  const res = await fetch(`${BASE.replace(/\/$/, '')}/api/admin/apply-schema`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: staff.id,
      email: staff.email,
      role: 'director',
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { skipped: false, status: res.status, json };
}

async function main() {
  const { url, key } = loadConfig();
  const before = await inspectPushAppChannelColumn({ url, key });
  console.log('before', before);

  if (before.present) {
    console.log('app_channel already present — nothing to apply.');
    return;
  }

  const local = await applyPushSubscriptionsAppChannelSql();
  console.log('local-apply', {
    applied: local.applied,
    backend: local.backend,
    attempts: local.attempts,
  });

  let after = await inspectPushAppChannelColumn({ url, key });
  if (after.present) {
    console.log('after', after);
    return;
  }

  console.log('local apply did not land the column; trying live /api/admin/apply-schema');
  const remote = await applyViaLiveApi();
  console.log('remote-apply', remote);
  after = await inspectPushAppChannelColumn({ url, key });
  console.log('after', after);
  if (!after.present) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
