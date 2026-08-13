/**
 * Delete all E2E / demo test accounts and associated production data.
 *
 * Targets emails:
 *   *@guardr.test
 *   test@test.com, testg@test.com, testc@test.com, tests@test.com
 *
 * Usage:
 *   node scripts/prod-clear-test-data.mjs
 *   SUPABASE_CONFIG=/tmp/supabase-prod.json node scripts/prod-clear-test-data.mjs
 *   DRY_RUN=1 node scripts/prod-clear-test-data.mjs
 */
import fs from 'node:fs';

const CONFIG_PATH = process.env.SUPABASE_CONFIG || '/tmp/supabase-prod.json';
const DRY_RUN = process.env.DRY_RUN === '1';

const TEST_EMAIL_PATTERNS = [
  '%@guardr.test',
  'test@test.com',
  'testg@test.com',
  'testc@test.com',
  'tests@test.com',
];

const { url: SUPABASE_URL, anon: KEY } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

const log = (section, ok, detail) => {
  console.log(`${ok ? 'OK' : 'FAIL'} | ${section} | ${detail}`);
};

async function db(pathQs, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathQs}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      ...(init.headers || {}),
    },
  });
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: r.ok, status: r.status, data };
}

async function select(table, filter, columns = 'id,email') {
  const { ok, data } = await db(`${table}?${filter}&select=${columns}`);
  if (!ok || !Array.isArray(data)) {
    throw new Error(`select ${table}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function del(table, filter) {
  if (DRY_RUN) {
    const rows = await select(table, filter);
    log(`dry-run delete ${table}`, true, `${rows.length} row(s) via ${filter}`);
    return rows.length;
  }
  const { ok, status, data } = await db(`${table}?${filter}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  const count = Array.isArray(data) ? data.length : 0;
  log(`delete ${table}`, ok, `${count} row(s) [${status}] ${filter}`);
  if (!ok) throw new Error(`delete ${table}: ${JSON.stringify(data)}`);
  return count;
}

async function collectTestProfiles() {
  const guards = [];
  const clients = [];
  const staff = [];

  for (const email of ['test@test.com', 'testg@test.com', 'testc@test.com', 'tests@test.com']) {
    guards.push(...(await select('guards', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
    clients.push(...(await select('clients', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
    staff.push(...(await select('staff', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
  }

  guards.push(...(await select('guards', 'email=like.*@guardr.test')));
  clients.push(...(await select('clients', 'email=like.*@guardr.test')));
  staff.push(...(await select('staff', 'email=like.*@guardr.test')));

  const uniq = (rows) => [...new Map(rows.map((r) => [r.id, r])).values()];
  return {
    guards: uniq(guards),
    clients: uniq(clients),
    staff: uniq(staff),
  };
}

async function deleteJobsForClient(clientId) {
  const jobs = await select('security_requests', `client_id=eq.${clientId}`, 'id,title');
  for (const job of jobs) {
    await del('payments', `job_id=eq.${job.id}`).catch(() => 0);
    await del('job_guard_slots', `job_id=eq.${job.id}`).catch(() => 0);
    await del('job_chat_threads', `request_id=eq.${job.id}`).catch(() => 0);
    await del('security_requests', `id=eq.${job.id}`);
  }
  await del('job_chat_threads', `client_id=eq.${clientId}`).catch(() => 0);
}

async function deleteGuardData(guardId) {
  const tables = [
    ['certifications', `guard_id=eq.${guardId}`],
    ['experience', `guard_id=eq.${guardId}`],
    ['education', `guard_id=eq.${guardId}`],
    ['guard_payout_invoices', `guard_id=eq.${guardId}`],
    ['guard_availability', `guard_id=eq.${guardId}`],
    ['guard_insurance_policies', `guard_id=eq.${guardId}`],
    ['push_subscriptions', `user_id=eq.${guardId}`],
    ['message_reactions', `user_id=eq.${guardId}`],
    ['chat_read_receipts', `user_id=eq.${guardId}`],
    ['notification_preferences', `user_id=eq.${guardId}`],
  ];
  for (const [table, filter] of tables) {
    await del(table, filter).catch(() => 0);
  }
}

async function deleteClientData(clientId) {
  await deleteJobsForClient(clientId);
  const tables = [
    ['support_tickets', `user_id=eq.${clientId}`],
    ['client_locations', `client_id=eq.${clientId}`],
    ['push_subscriptions', `user_id=eq.${clientId}`],
    ['message_reactions', `user_id=eq.${clientId}`],
    ['chat_read_receipts', `user_id=eq.${clientId}`],
    ['notification_preferences', `user_id=eq.${clientId}`],
  ];
  for (const [table, filter] of tables) {
    await del(table, filter).catch(() => 0);
  }
}

async function deleteStaffData(staffId) {
  const tables = [
    ['staff_compensation_payouts', `staff_id=eq.${staffId}`],
    ['staff_time_entries', `staff_id=eq.${staffId}`],
    ['push_subscriptions', `user_id=eq.${staffId}`],
    ['notification_preferences', `user_id=eq.${staffId}`],
  ];
  for (const [table, filter] of tables) {
    await del(table, filter).catch(() => 0);
  }
}

async function verifyClean() {
  const guards = await select('guards', 'email=like.*@guardr.test').catch(() => []);
  const clients = await select('clients', 'email=like.*@guardr.test').catch(() => []);
  const staff = await select('staff', 'email=like.*@guardr.test').catch(() => []);
  const demoGuards = await select('guards', 'or=(email.eq.testg@test.com,email.eq.test@test.com)').catch(() => []);
  const demoClients = await select('clients', 'email=eq.testc@test.com').catch(() => []);
  const demoStaff = await select('staff', 'email=eq.tests@test.com').catch(() => []);
  const jobs = await select('security_requests', 'limit=20', 'id,title,client_id').catch(() => []);

  const remaining = {
    guards: [...guards, ...demoGuards],
    clients: [...clients, ...demoClients],
    staff: [...staff, ...demoStaff],
    jobs,
  };

  const testClientIds = new Set(remaining.clients.map((c) => c.id));
  const testJobs = jobs.filter((j) => testClientIds.has(j.client_id));

  return { remaining, testJobs };
}

async function main() {
  console.log(`Guardr test-data cleanup${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Patterns: ${TEST_EMAIL_PATTERNS.join(', ')}`);

  const profiles = await collectTestProfiles();
  console.log(
    `Found ${profiles.guards.length} guard(s), ${profiles.clients.length} client(s), ${profiles.staff.length} staff`
  );
  for (const g of profiles.guards) console.log(`  guard  ${g.email} (${g.id})`);
  for (const c of profiles.clients) console.log(`  client ${c.email} (${c.id})`);
  for (const s of profiles.staff) console.log(`  staff  ${s.email} (${s.id})`);

  for (const client of profiles.clients) {
    await deleteClientData(client.id);
  }

  for (const guard of profiles.guards) {
    await deleteGuardData(guard.id);
  }

  for (const staffMember of profiles.staff) {
    await deleteStaffData(staffMember.id);
  }

  for (const guard of profiles.guards) {
    await del('guards', `id=eq.${guard.id}`);
  }
  for (const client of profiles.clients) {
    await del('clients', `id=eq.${client.id}`);
  }
  for (const staffMember of profiles.staff) {
    await del('staff', `id=eq.${staffMember.id}`);
  }

  if (!DRY_RUN) {
    const { remaining, testJobs } = await verifyClean();
    const clean =
      remaining.guards.length === 0 &&
      remaining.clients.length === 0 &&
      remaining.staff.length === 0 &&
      testJobs.length === 0;

    log('verify', clean, JSON.stringify({
      guards: remaining.guards.length,
      clients: remaining.clients.length,
      staff: remaining.staff.length,
      testJobs: testJobs.length,
      allJobs: remaining.jobs.length,
    }));

    if (!clean) {
      console.error('Cleanup incomplete — remaining rows listed above.');
      process.exit(1);
    }
    console.log('Test data cleared 100%.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
