/**
 * Fixtures for the tablet QA harness.
 *
 * Rows use the Supabase column names the app maps from, so the intercepted REST
 * responses hydrate the same domain objects production data would. The point is
 * to review tablet information density against realistic volume rather than
 * against empty states.
 */

const now = Date.now();
const hours = (n) => new Date(now + n * 3600_000).toISOString();
const days = (n) => new Date(now + n * 86400_000).toISOString();

const CITIES = [
  ['Los Angeles', 34.0522, -118.2437],
  ['San Diego', 32.7157, -117.1611],
  ['San Francisco', 37.7749, -122.4194],
  ['Sacramento', 38.5816, -121.4944],
  ['Long Beach', 33.7701, -118.1937],
  ['Oakland', 37.8044, -122.2712],
  ['Fresno', 36.7378, -119.7871],
  ['Pasadena', 34.1478, -118.1445],
];

const GUARD_NAMES = [
  ['Miles', 'Okafor'], ['Sofia', 'Marchetti'], ['Andre', 'Whitfield'], ['Priya', 'Raghunathan'],
  ['Terrence', 'Boyd'], ['Lena', 'Kowalczyk'], ['Diego', 'Salazar'], ['Nia', 'Abernathy'],
  ['Rafael', 'Nkemelu'], ['Hannah', 'Lindqvist'], ['Omar', 'Haddad'], ['Grace', 'Ferreira'],
  ['Victor', 'Petrenko'], ['Amara', 'Osei'], ['Jonas', 'Bergström'], ['Camille', 'Duplessis'],
  ['Isaiah', 'Whitmore'], ['Yuki', 'Nakamura'], ['Marcus', 'Delacroix'], ['Elena', 'Vasquez'],
];

const CLIENT_ORGS = [
  ['Northgate Properties', 'Ava Lindqvist'], ['Harborview Events', 'Cole Bennett'],
  ['Cedar & Vine Hospitality', 'Marisol Vega'], ['Ironworks Logistics', 'Dwight Farrow'],
  ['Meridian Health Group', 'Tessa Nakamura'], ['Bellweather Retail', 'Rowan Priest'],
  ['Stonebridge Campus', 'Imani Clarke'], ['Pacific Freight Terminal', 'Hugo Marchetti'],
];

const JOB_TITLES = [
  'Overnight site patrol', 'Corporate lobby post', 'Concert perimeter detail',
  'Construction yard watch', 'Executive escort', 'Retail loss prevention',
  'Hospital entrance screening', 'Warehouse gate control', 'Campus night rounds',
  'Private event access control', 'Distribution dock security', 'Film set standby',
];

function guardRow(i) {
  const [first, last] = GUARD_NAMES[i % GUARD_NAMES.length];
  const [city, lat, lng] = CITIES[i % CITIES.length];
  const armed = i % 3 === 0;
  return {
    id: `guard-${i + 1}`,
    first_name: first,
    last_name: last,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@guardr.co`,
    phone: `+1310555${String(1000 + i).slice(-4)}`,
    badge_number: `IC-${4200 + i}`,
    is_armed: armed,
    armed_preference: armed ? 'armed' : 'unarmed',
    guard_card_status: 'active',
    rating: Number((4.2 + (i % 8) * 0.1).toFixed(1)),
    completed_jobs: 12 + i * 7,
    hourly_rate: 28 + (i % 6) * 3,
    years_experience: 2 + (i % 12),
    city,
    state: 'California',
    latitude: lat + (i % 5) * 0.01,
    longitude: lng + (i % 5) * 0.01,
    service_areas: JSON.stringify([city]),
    skills: JSON.stringify(['Access control', 'Report writing', 'De-escalation']),
    languages: JSON.stringify(i % 4 === 0 ? ['English', 'Spanish'] : ['English']),
    specialties: JSON.stringify(['Event security', 'Patrol']),
    headline: armed ? 'Armed patrol officer' : 'Unarmed site officer',
    bio: 'Licensed California security professional with verified BSIS credentials.',
    is_active: i % 9 !== 0,
    is_approved: i % 11 !== 0,
    status: i % 9 === 0 ? 'inactive' : 'active',
    availability_status: ['available', 'on_shift', 'off_duty'][i % 3],
    created_at: days(-120 + i),
    tier: ['standard', 'preferred', 'elite'][i % 3],
    has_reliable_transportation: true,
    listed_weapon_gear: JSON.stringify(armed ? ['firearm', 'handcuffs', 'flashlight'] : ['flashlight']),
    listed_equipment_gear: JSON.stringify(['body-cam', 'walkie-talkie']),
    job_type_preferences: JSON.stringify(['event', 'patrol', 'corporate']),
  };
}

function staffRow(i) {
  const roles = ['Support', 'Moderator', 'Administrator', 'Manager', 'Director', 'Founder'];
  const names = [
    ['Dana', 'Reyes'], ['Kwame', 'Adjei'], ['Bianca', 'Ferrante'], ['Sean', 'Mulvaney'],
    ['Rina', 'Takahashi'], ['Oscar', 'Bermudez'],
  ];
  const [first, last] = names[i % names.length];
  return {
    id: i === 0 ? 'qa-staff' : `staff-${i + 1}`,
    first_name: first,
    last_name: last,
    name: `${first} ${last}`,
    email: i === 0 ? 'dana@guardr.co' : `${first.toLowerCase()}@guardr.co`,
    staff_role: roles[(roles.length - 1 - i) % roles.length],
    side_role: i === 3 ? 'Finance' : null,
    badge_number: `S-${1001 + i}`,
    phone: `+1213555${String(2000 + i).slice(-4)}`,
    is_staff: true,
    is_active: true,
    is_approved: true,
    status: 'active',
    created_at: days(-300 + i * 10),
    city: CITIES[i % CITIES.length][0],
  };
}

function clientRow(i) {
  const [org, contact] = CLIENT_ORGS[i % CLIENT_ORGS.length];
  const [city, lat, lng] = CITIES[(i + 2) % CITIES.length];
  const [firstName, lastName] = contact.split(' ');
  return {
    id: i === 0 ? 'qa-client' : `client-${i + 1}`,
    name: contact,
    first_name: firstName,
    last_name: lastName,
    email: i === 0 ? 'ava@northgate.com' : `${firstName.toLowerCase()}@${org.split(' ')[0].toLowerCase()}.com`,
    company_name: org,
    organization: org,
    phone: `+1424555${String(3000 + i).slice(-4)}`,
    city,
    state: 'California',
    latitude: lat,
    longitude: lng,
    address: `${100 + i * 15} Harbor Blvd`,
    account_kind: i % 3 === 0 ? 'business' : 'individual',
    is_active: true,
    is_approved: true,
    status: 'active',
    created_at: days(-200 + i * 12),
    total_jobs: 4 + i * 3,
  };
}

function requestRow(i) {
  const [city, lat, lng] = CITIES[i % CITIES.length];
  const [org] = CLIENT_ORGS[i % CLIENT_ORGS.length];
  const statuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'pending_approval'];
  const status = statuses[i % statuses.length];
  const start = i % 2 === 0 ? hours(6 + i * 3) : days(1 + (i % 9));
  const rate = 34 + (i % 7) * 4;
  const duration = 6 + (i % 4) * 2;
  return {
    id: `req-${i + 1}`,
    title: JOB_TITLES[i % JOB_TITLES.length],
    description:
      'Uniformed officer required for access control, incident logging, and hourly perimeter checks. Report to the site supervisor on arrival.',
    client_id: `client-${(i % CLIENT_ORGS.length) + 1}`,
    client_name: org,
    site_name: `${city} ${['Tower', 'Yard', 'Pavilion', 'Depot'][i % 4]}`,
    location: `${city}, CA`,
    address: `${200 + i * 21} Industrial Way`,
    city,
    state: 'California',
    latitude: lat + (i % 4) * 0.02,
    longitude: lng - (i % 4) * 0.02,
    type: ['event', 'patrol', 'corporate', 'construction', 'retail'][i % 5],
    armed_required: i % 4 === 0,
    guards_needed: 1 + (i % 3),
    start_date: start,
    end_date: new Date(new Date(start).getTime() + duration * 3600_000).toISOString(),
    duration_hours: duration,
    hourly_rate: rate,
    estimated_payout: rate * duration,
    status,
    assigned_guard_id: status === 'open' ? null : `guard-${(i % 12) + 1}`,
    applicants: JSON.stringify(status === 'open' ? [`guard-${(i % 9) + 1}`, `guard-${(i % 7) + 2}`] : []),
    created_at: days(-(i % 20) - 1),
    assignment_mode: i % 3 === 0 ? 'direct' : 'marketplace',
  };
}

function paymentRow(i) {
  return {
    id: `pay-${i + 1}`,
    request_id: `req-${(i % 12) + 1}`,
    guard_id: `guard-${(i % 14) + 1}`,
    client_id: `client-${(i % 8) + 1}`,
    amount: 280 + i * 37,
    platform_fee: Math.round((280 + i * 37) * 0.18),
    guard_payout: Math.round((280 + i * 37) * 0.82),
    status: ['pending', 'paid', 'processing', 'failed', 'refunded'][i % 5],
    created_at: days(-(i % 30)),
    paid_at: i % 5 === 1 ? days(-(i % 30) + 1) : null,
    method: 'card',
  };
}

function clientInvoiceRow(i) {
  return {
    id: `inv-${1000 + i}`,
    client_id: `client-${(i % 8) + 1}`,
    request_id: `req-${(i % 12) + 1}`,
    invoice_number: `GR-${2026}-${1000 + i}`,
    amount_due: 640 + i * 55,
    amount_paid: i % 3 === 0 ? 0 : 640 + i * 55,
    status: ['paid', 'open', 'overdue', 'draft'][i % 4],
    issued_at: days(-(i % 40) - 2),
    due_at: days(14 - (i % 40)),
    created_at: days(-(i % 40) - 2),
  };
}

function payoutInvoiceRow(i) {
  return {
    id: `payout-${1000 + i}`,
    guard_id: `guard-${(i % 14) + 1}`,
    request_id: `req-${(i % 12) + 1}`,
    invoice_number: `PO-${2026}-${1000 + i}`,
    amount: 320 + i * 41,
    status: ['paid', 'pending', 'processing'][i % 3],
    period_start: days(-(i % 28) - 7),
    period_end: days(-(i % 28)),
    created_at: days(-(i % 28)),
  };
}

function certificationRow(i) {
  const names = [
    'BSIS Guard Card', 'BSIS Exposed Firearm Permit', 'CPR Certification',
    'First Aid Certification', 'BSIS Baton Permit', 'Power to Arrest Training',
  ];
  return {
    id: `cert-${i + 1}`,
    guard_id: `guard-${(i % 16) + 1}`,
    name: names[i % names.length],
    issuer: 'California BSIS',
    number: `BSIS-${900000 + i}`,
    issue_date: days(-400 + i * 3),
    expiry_date: days(180 - (i % 240)),
    status: ['verified', 'pending', 'rejected', 'expired'][i % 4],
    verified: i % 4 === 0,
    created_at: days(-400 + i * 3),
  };
}

function supportTicketRow(i) {
  const isGuard = i % 2 === 0;
  const [first, last] = GUARD_NAMES[i % GUARD_NAMES.length];
  const clientContact = CLIENT_ORGS[i % CLIENT_ORGS.length][1];
  return {
    id: `tkt-${i + 1}`,
    subject: [
      'Cannot upload guard card', 'Payout missing for last shift', 'Client cancelled after check-in',
      'Badge number incorrect', 'App crashes on shift start',
    ][i % 5],
    user_id: isGuard ? `guard-${(i % 12) + 1}` : `client-${(i % 8) + 1}`,
    user_role: isGuard ? 'guard' : 'client',
    user_name: isGuard ? `${first} ${last}` : clientContact,
    user_email: isGuard
      ? `${first.toLowerCase()}.${last.toLowerCase()}@guardr.co`
      : `${clientContact.split(' ')[0].toLowerCase()}@client.com`,
    kind: i % 3 === 0 ? 'chat' : 'ticket',
    category: ['account', 'payments', 'jobs', 'technical'][i % 4],
    status: ['open', 'pending', 'resolved', 'closed'][i % 4],
    priority: ['low', 'normal', 'high', 'urgent'][i % 4],
    created_at: days(-(i % 14)),
    updated_at: hours(-(i % 40)),
  };
}

function messageRow(prefix, i, extra = {}) {
  return {
    id: `${prefix}-${i + 1}`,
    body: [
      'Officer arrived on site and completed the first perimeter check.',
      'Client requested an extra hour of coverage tonight.',
      'Guard card verification cleared — activating the account now.',
      'Invoice was sent to accounts payable this morning.',
      'Confirming the shift change for tomorrow at 18:00.',
    ][i % 5],
    sender_id: i % 2 === 0 ? 'qa-staff' : `guard-${(i % 10) + 1}`,
    sender_name: i % 2 === 0 ? 'Dana Reyes' : GUARD_NAMES[i % GUARD_NAMES.length].join(' '),
    sender_role: i % 2 === 0 ? 'staff' : 'guard',
    created_at: hours(-(i * 2)),
    read: i % 3 !== 0,
    ...extra,
  };
}

function locationRow(i) {
  const [city, lat, lng] = CITIES[i % CITIES.length];
  const [org] = CLIENT_ORGS[i % CLIENT_ORGS.length];
  return {
    id: `loc-${i + 1}`,
    client_id: `client-${(i % 8) + 1}`,
    name: `${org} — ${['Main Gate', 'North Dock', 'Lobby', 'Annex'][i % 4]}`,
    address: `${300 + i * 11} Commerce St`,
    city,
    state: 'California',
    zip: `9${String(1000 + i).slice(-4)}`,
    latitude: lat,
    longitude: lng,
    notes: 'Report to the security desk. Parking available on level P2.',
    created_at: days(-90 + i),
  };
}

const TABLES = {
  guards: Array.from({ length: 20 }, (_, i) => guardRow(i)),
  staff: Array.from({ length: 6 }, (_, i) => staffRow(i)),
  clients: Array.from({ length: 8 }, (_, i) => clientRow(i)),
  security_requests: Array.from({ length: 18 }, (_, i) => requestRow(i)),
  payments: Array.from({ length: 16 }, (_, i) => paymentRow(i)),
  client_invoices: Array.from({ length: 12 }, (_, i) => clientInvoiceRow(i)),
  guard_payout_invoices: Array.from({ length: 12 }, (_, i) => payoutInvoiceRow(i)),
  certifications: Array.from({ length: 24 }, (_, i) => certificationRow(i)),
  support_tickets: Array.from({ length: 10 }, (_, i) => supportTicketRow(i)),
  support_messages: Array.from({ length: 12 }, (_, i) =>
    messageRow('sup', i, { ticket_id: `tkt-${(i % 10) + 1}` }),
  ),
  staff_messages: Array.from({ length: 12 }, (_, i) => messageRow('sm', i)),
  guard_messages: Array.from({ length: 12 }, (_, i) =>
    messageRow('gm', i, { guard_id: `guard-${(i % 10) + 1}` }),
  ),
  client_messages: Array.from({ length: 12 }, (_, i) =>
    messageRow('cm', i, { client_id: `client-${(i % 8) + 1}` }),
  ),
  job_chat_threads: Array.from({ length: 8 }, (_, i) => ({
    id: `thr-${i + 1}`,
    request_id: `req-${i + 1}`,
    title: JOB_TITLES[i % JOB_TITLES.length],
    created_at: days(-(i % 10)),
    updated_at: hours(-(i * 3)),
  })),
  job_chat_messages: Array.from({ length: 16 }, (_, i) =>
    messageRow('jcm', i, { thread_id: `thr-${(i % 8) + 1}`, request_id: `req-${(i % 8) + 1}` }),
  ),
  client_locations: Array.from({ length: 10 }, (_, i) => locationRow(i)),
  job_locations: Array.from({ length: 10 }, (_, i) => locationRow(i)),
  job_guard_slots: Array.from({ length: 14 }, (_, i) => ({
    id: `slot-${i + 1}`,
    request_id: `req-${(i % 12) + 1}`,
    guard_id: `guard-${(i % 14) + 1}`,
    status: ['assigned', 'confirmed', 'checked_in', 'completed'][i % 4],
    created_at: days(-(i % 12)),
  })),
  experience: Array.from({ length: 12 }, (_, i) => ({
    id: `exp-${i + 1}`,
    guard_id: `guard-${(i % 16) + 1}`,
    title: 'Security Officer',
    company: ['Allied Universal', 'Securitas', 'Independent contract'][i % 3],
    start_date: days(-1200 + i * 30),
    end_date: i % 3 === 0 ? null : days(-200 + i * 10),
    description: 'Access control, patrol, and incident reporting for commercial sites.',
  })),
  education: Array.from({ length: 8 }, (_, i) => ({
    id: `edu-${i + 1}`,
    guard_id: `guard-${(i % 16) + 1}`,
    school: ['Cal State Long Beach', 'Santa Monica College', 'UCLA Extension'][i % 3],
    degree: 'Criminal Justice',
    start_date: days(-2200 + i * 60),
    end_date: days(-1400 + i * 60),
  })),
  platform_cities: CITIES.map(([city, lat, lng], i) => ({
    id: `city-${i + 1}`,
    name: city,
    state: 'California',
    slug: city.toLowerCase().replace(/\s+/g, '-'),
    latitude: lat,
    longitude: lng,
    is_active: i % 7 !== 0,
    sort_order: i,
    launched_at: days(-500 + i * 20),
    guard_count: 8 + i * 3,
    manager_staff_id: i % 2 === 0 ? 'qa-staff' : null,
  })),
  platform_settings: {
    id: 'default',
    platform_fee_percent: 18,
    guard_payout_percent: 82,
    staff_commission_percent: 5,
    minimum_hourly_rate: 24,
    maximum_hourly_rate: 95,
    updated_at: days(-3),
  },
  guard_insurance_policies: [],
  guard_vehicle_insurance_policies: [],
  guard_vehicle_profiles: [],
  // Pre-accepted for every QA identity so the legal gate does not sit in front
  // of the screens being reviewed.
  user_legal_acceptances: [
    ['qa-staff', 'staff'], ['guard-1', 'guard'], ['client-1', 'client'],
  ].flatMap(([userId, role]) =>
    Object.entries({
      terms: '2026-06-22',
      privacy: '2026-06-22',
      ica: '2026-06-25',
      'client-agreement': '2026-06-25',
      'guard-conduct': '2026-06-25',
    }).map(([documentId, version], i) => ({
      id: `legal-${userId}-${i}`,
      user_id: userId,
      user_role: role,
      document_id: documentId,
      document_version: version,
      accepted_at: days(-30),
    })),
  ),
  company_public_documents: [],
};

export function fixtureFor(table) {
  return Object.prototype.hasOwnProperty.call(TABLES, table) ? TABLES[table] : [];
}

export const FIXTURE_TABLES = TABLES;
