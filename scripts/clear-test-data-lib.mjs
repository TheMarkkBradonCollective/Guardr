/**
 * Shared test-data cleanup for fieldtest pre/post runs and manual scripts.
 * Targets *@guardr.test plus legacy demo emails (test@test.com, etc.).
 */
import fs from 'node:fs';

const CONFIG_PATH = process.env.SUPABASE_CONFIG || '/tmp/supabase-prod.json';

/** Fake credential numbers issued during fieldtest guard activation uploads. */
const FIELD_TEST_CERT_OR_FILTER = [
  'number.eq.FT-DOE-guard-card',
  'number.eq.PTA-DOE-2026',
  'number.eq.CE-DOE-2026',
  'number.eq.COI-DOE-2026',
  'number.eq.D1234567',
  'number.ilike.*-DOE-*',
  'name.ilike.*Field Test*',
  'issuer.ilike.*Field Test*',
].join(',');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function db(url, key, pathQs, init = {}) {
  const r = await fetch(`${url}/rest/v1/${pathQs}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
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

async function select(url, key, table, filter, columns = 'id,email') {
  const { ok, data } = await db(url, key, `${table}?${filter}&select=${columns}`);
  if (!ok || !Array.isArray(data)) {
    throw new Error(`select ${table}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function del(url, key, table, filter, dryRun) {
  if (dryRun) {
    const rows = await select(url, key, table, filter);
    return { ok: true, count: rows.length, dryRun: true };
  }
  const { ok, status, data } = await db(url, key, `${table}?${filter}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  const count = Array.isArray(data) ? data.length : 0;
  if (!ok) throw new Error(`delete ${table}: ${JSON.stringify(data)}`);
  return { ok, count, status };
}

async function collectTestProfiles(url, key) {
  const guards = [];
  const clients = [];
  const staff = [];

  for (const email of ['test@test.com', 'testg@test.com', 'testc@test.com', 'tests@test.com']) {
    guards.push(...(await select(url, key, 'guards', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
    clients.push(...(await select(url, key, 'clients', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
    staff.push(...(await select(url, key, 'staff', `email=eq.${encodeURIComponent(email)}`).catch(() => [])));
  }

  guards.push(...(await select(url, key, 'guards', 'email=like.*@guardr.test')));
  clients.push(...(await select(url, key, 'clients', 'email=like.*@guardr.test')));
  staff.push(...(await select(url, key, 'staff', 'email=like.*@guardr.test')));

  const uniq = (rows) => [...new Map(rows.map((r) => [r.id, r])).values()];
  return {
    guards: uniq(guards),
    clients: uniq(clients),
    staff: uniq(staff),
  };
}

async function collectFieldtestCertifications(url, key) {
  const byPattern = await select(
    url,
    key,
    'certifications',
    `or=(${FIELD_TEST_CERT_OR_FILTER})`,
    'id,guard_id,number,name'
  ).catch(() => []);
  const guardIds = new Set();
  for (const row of await collectTestProfiles(url, key).then((p) => p.guards)) {
    guardIds.add(row.id);
  }
  const byGuard = [];
  for (const guardId of guardIds) {
    byGuard.push(
      ...(await select(url, key, 'certifications', `guard_id=eq.${guardId}`, 'id,guard_id,number,name').catch(
        () => []
      ))
    );
  }
  return [...new Map([...byPattern, ...byGuard].map((c) => [c.id, c])).values()];
}

async function deleteJobsForClient(url, key, clientId, dryRun) {
  const jobs = await select(url, key, 'security_requests', `client_id=eq.${clientId}`, 'id,title');
  for (const job of jobs) {
    await del(url, key, 'payments', `job_id=eq.${job.id}`, dryRun).catch(() => ({ count: 0 }));
    await del(url, key, 'job_guard_slots', `job_id=eq.${job.id}`, dryRun).catch(() => ({ count: 0 }));
    await del(url, key, 'job_chat_threads', `request_id=eq.${job.id}`, dryRun).catch(() => ({ count: 0 }));
    await del(url, key, 'security_requests', `id=eq.${job.id}`, dryRun);
  }
  await del(url, key, 'job_chat_threads', `client_id=eq.${clientId}`, dryRun).catch(() => ({ count: 0 }));
  return jobs.length;
}

async function deleteGuardData(url, key, guardId, dryRun) {
  const tables = [
    ['job_guard_slots', `guard_id=eq.${guardId}`],
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
    await del(url, key, table, filter, dryRun).catch(() => ({ count: 0 }));
  }
}

async function deleteClientData(url, key, clientId, dryRun) {
  await deleteJobsForClient(url, key, clientId, dryRun);
  const tables = [
    ['support_tickets', `user_id=eq.${clientId}`],
    ['client_locations', `client_id=eq.${clientId}`],
    ['push_subscriptions', `user_id=eq.${clientId}`],
    ['message_reactions', `user_id=eq.${clientId}`],
    ['chat_read_receipts', `user_id=eq.${clientId}`],
    ['notification_preferences', `user_id=eq.${clientId}`],
  ];
  for (const [table, filter] of tables) {
    await del(url, key, table, filter, dryRun).catch(() => ({ count: 0 }));
  }
}

async function deleteStaffData(url, key, staffId, dryRun) {
  const tables = [
    ['staff_compensation_payouts', `staff_id=eq.${staffId}`],
    ['staff_time_entries', `staff_id=eq.${staffId}`],
    ['push_subscriptions', `user_id=eq.${staffId}`],
    ['notification_preferences', `user_id=eq.${staffId}`],
  ];
  for (const [table, filter] of tables) {
    await del(url, key, table, filter, dryRun).catch(() => ({ count: 0 }));
  }
}

async function verifyClean(url, key) {
  const guards = await select(url, key, 'guards', 'email=like.*@guardr.test').catch(() => []);
  const clients = await select(url, key, 'clients', 'email=like.*@guardr.test').catch(() => []);
  const staff = await select(url, key, 'staff', 'email=like.*@guardr.test').catch(() => []);
  const demoGuards = await select(url, key, 'guards', 'or=(email.eq.testg@test.com,email.eq.test@test.com)').catch(() => []);
  const demoClients = await select(url, key, 'clients', 'email=eq.testc@test.com').catch(() => []);
  const demoStaff = await select(url, key, 'staff', 'email=eq.tests@test.com').catch(() => []);
  const jobs = await select(url, key, 'security_requests', 'limit=20', 'id,title,client_id').catch(() => []);

  const remaining = {
    guards: [...guards, ...demoGuards],
    clients: [...clients, ...demoClients],
    staff: [...staff, ...demoStaff],
    jobs,
  };

  const testClientIds = new Set(remaining.clients.map((c) => c.id));
  const testJobs = jobs.filter((j) => testClientIds.has(j.client_id));
  const fieldtestCerts = await collectFieldtestCertifications(url, key).catch(() => []);

  return {
    remaining,
    testJobs,
    fieldtestCerts,
    clean:
      remaining.guards.length === 0 &&
      remaining.clients.length === 0 &&
      remaining.staff.length === 0 &&
      testJobs.length === 0 &&
      fieldtestCerts.length === 0,
  };
}

/**
 * @param {{ dryRun?: boolean, label?: string }} [options]
 * @returns {Promise<{ ok: boolean, label: string, dryRun: boolean, found: object, removed: object, verify: object, emails: string[] }>}
 */
export async function clearTestData(options = {}) {
  const dryRun = options.dryRun === true || process.env.DRY_RUN === '1';
  const label = options.label || 'cleanup';
  const { url, anon: key } = loadConfig();

  const profiles = await collectTestProfiles(url, key);
  const fieldtestCerts = await collectFieldtestCertifications(url, key);
  const emails = [
    ...profiles.guards.map((g) => g.email),
    ...profiles.clients.map((c) => c.email),
    ...profiles.staff.map((s) => s.email),
  ];

  for (const client of profiles.clients) {
    await deleteClientData(url, key, client.id, dryRun);
  }
  for (const guard of profiles.guards) {
    await deleteGuardData(url, key, guard.id, dryRun);
  }
  for (const staffMember of profiles.staff) {
    await deleteStaffData(url, key, staffMember.id, dryRun);
  }

  const removedCerts = { count: 0 };
  if (!dryRun) {
    for (const cert of fieldtestCerts) {
      const r = await del(url, key, 'certifications', `id=eq.${cert.id}`, false).catch(() => ({ count: 0 }));
      removedCerts.count += r.count || 0;
    }
  } else {
    removedCerts.count = fieldtestCerts.length;
  }

  const removed = { guards: 0, clients: 0, staff: 0, certifications: removedCerts.count };
  if (!dryRun) {
    for (const guard of profiles.guards) {
      const r = await del(url, key, 'guards', `id=eq.${guard.id}`, false);
      removed.guards += r.count;
    }
    for (const client of profiles.clients) {
      const r = await del(url, key, 'clients', `id=eq.${client.id}`, false);
      removed.clients += r.count;
    }
    for (const staffMember of profiles.staff) {
      const r = await del(url, key, 'staff', `id=eq.${staffMember.id}`, false);
      removed.staff += r.count;
    }
  }

  let verifyPayload;
  if (dryRun) {
    verifyPayload = {
      clean:
        profiles.guards.length + profiles.clients.length + profiles.staff.length + fieldtestCerts.length === 0,
      remaining: {
        guards: profiles.guards.length,
        clients: profiles.clients.length,
        staff: profiles.staff.length,
        testJobs: 0,
        certifications: fieldtestCerts.length,
      },
    };
  } else {
    const v = await verifyClean(url, key);
    verifyPayload = {
      clean: v.clean,
      remaining: {
        guards: v.remaining.guards.length,
        clients: v.remaining.clients.length,
        staff: v.remaining.staff.length,
        testJobs: v.testJobs.length,
        certifications: v.fieldtestCerts.length,
      },
    };
  }

  return {
    ok: verifyPayload.clean,
    label,
    dryRun,
    supabaseUrl: url,
    found: {
      guards: profiles.guards.length,
      clients: profiles.clients.length,
      staff: profiles.staff.length,
      certifications: fieldtestCerts.length,
    },
    removed,
    verify: verifyPayload,
    emails,
  };
}
