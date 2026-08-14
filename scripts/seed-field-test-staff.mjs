/**
 * Seed the field-test staff operator account (setup only — not part of /fieldtest).
 *
 * Creates staff@guardr.co with Director-level ops access for automated QA.
 * Platform login path: staff. Display name: Guardr (branded in Staff chat — not Founder).
 *
 * Usage:
 *   node scripts/seed-field-test-staff.mjs
 *   SUPABASE_CONFIG=/tmp/supabase-prod.json node scripts/seed-field-test-staff.mjs
 */
import fs from 'node:fs';

const CONFIG_PATH = process.env.SUPABASE_CONFIG || '/tmp/supabase-prod.json';
const STAFF_ID = 'staff-field-test-guardr';
const STAFF_EMAIL = 'staff@guardr.co';
const STAFF_PASSWORD = process.env.FIELD_TEST_STAFF_PASSWORD || '#FieldTestStaff2026';

const { url: SUPABASE_URL, anon: KEY } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

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

const row = {
  id: STAFF_ID,
  name: 'Guardr',
  first_name: 'Guardr',
  last_name: '',
  email: STAFF_EMAIL,
  badge_number: 'STF-FIELD01',
  avatar: '',
  phone: '(555) 010-2026',
  bio: 'Automated field-test operator — Director-level ops access for QA.',
  summary: 'Field test automation account (branded Guardr in Staff chat).',
  staff_role: 'Director',
  user_status: 'active',
  password: STAFF_PASSWORD,
  must_change_password: false,
  id_verification_status: 'verified',
};

const existing = await db(`staff?email=eq.${encodeURIComponent(STAFF_EMAIL)}&select=id,email,staff_role,user_status`);
if (Array.isArray(existing.data) && existing.data.length > 0) {
  const { ok, status, data } = await db(`staff?id=eq.${existing.data[0].id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!ok) {
    console.error('PATCH failed', status, data);
    process.exit(1);
  }
  console.log(`Updated field-test staff: ${STAFF_EMAIL} (${STAFF_ID})`);
} else {
  const { ok, status, data } = await db('staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!ok) {
    console.error('INSERT failed', status, data);
    process.exit(1);
  }
  console.log(`Created field-test staff: ${STAFF_EMAIL} (${STAFF_ID})`);
}

console.log(`Password: ${STAFF_PASSWORD}`);
console.log('Sign in at /?auth=sign-in&ar=staff');
