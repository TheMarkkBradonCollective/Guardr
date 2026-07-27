/**
 * California BSIS-aligned credential catalog for Guardr.
 * Guard cards (state licenses) are separate from training certificates and permits.
 */

import type { CertCategory } from '../types';

export type { CertCategory };

export interface CertCatalogEntry {
  id: string;
  name: string;
  shortLabel: string;
  category: CertCategory;
  /** Guard card requires state (e.g. CA) */
  requiresState?: boolean;
  /** Part of baseline required to be listed for CA security jobs */
  requiredForCaListing?: boolean;
  description?: string;
}

export const CERT_CATEGORY_LABELS: Record<CertCategory, string> = {
  'guard-card': 'BSIS Guard Card',
  'bsis-required': 'BSIS Training (legacy)',
  'bsis-training': 'BSIS Training',
  'bsis-permit': 'BSIS Permits (Armed / Weapons)',
  'medical': 'Medical & Emergency',
  'fema': 'FEMA / Homeland Security',
  'security-advanced': 'Advanced Security',
  'industry': 'Industry & Professional',
};

export const CERT_CATALOG: CertCatalogEntry[] = [
  // ── Guard card (state license — separate from training certs) ──
  {
    id: 'bsis-guard-card',
    name: 'BSIS Guard Card',
    shortLabel: 'Guard Card',
    category: 'guard-card',
    requiresState: true,
    requiredForCaListing: true,
    description: 'California Bureau of Security and Investigative Services guard registration.',
  },

  // ── BSIS training (guard card is separate — see guard-card) ──
  {
    id: 'bsis-pta-uof-8hr',
    name: '8-Hour Power to Arrest & Appropriate Use of Force (2-Part)',
    shortLabel: 'PTA & UOF (8 hr)',
    category: 'bsis-training',
    description:
      'Deprecated — combined certificates are deleted. Upload Power to Arrest and Appropriate Use of Force as two separate certificates.',
  },
  {
    id: 'bsis-32-hour-completed',
    name: '32-Hour BSIS Training Completed',
    shortLabel: '32-Hr BSIS',
    category: 'bsis-training',
    description: 'Deprecated catalog entry — not used for activation. Upload all 9 Continuing Education courses individually.',
  },
  {
    id: 'bsis-40-hour-completed',
    name: '32-Hour BSIS Training Completed (deprecated)',
    shortLabel: '32-Hr BSIS',
    category: 'bsis-training',
    description: 'Deprecated catalog entry — not used for activation.',
  },
  {
    id: 'bsis-8-hour-refresher',
    name: '8-Hour BSIS Refresher Course',
    shortLabel: '8-Hr Refresher',
    category: 'bsis-training',
    description:
      'Annual 8-hour renewal — BSIS labels this Continuing Education on their site. Staff may request later for renewals. Not required for initial activation.',
  },

  // ── PTA / UOF — separate certificates only (combined uploads are deleted) ──
  {
    id: 'bsis-power-to-arrest',
    name: 'Power to Arrest',
    shortLabel: 'PTA',
    category: 'bsis-training',
    description:
      'Upload as its own certificate. Pair with Appropriate Use of Force (or WMD Awareness as the second part).',
  },
  {
    id: 'bsis-appropriate-use-of-force',
    name: 'Appropriate Use of Force',
    shortLabel: 'UOF',
    category: 'bsis-training',
    description:
      'Upload as its own certificate alongside Power to Arrest.',
  },
  // ── 32-hour mandatory course block (9 courses) ──
  {
    id: 'bsis-communication',
    name: 'Communication and Its Significance (4 hr)',
    shortLabel: 'Communication',
    category: 'bsis-training',
    description: 'Required Continuing Education course — 4-hour BSIS module on guard communication and reporting.',
  },
  {
    id: 'bsis-public-relations',
    name: 'Public Relations (4 hr)',
    shortLabel: 'Public Relations',
    category: 'bsis-training',
    description: 'Required Continuing Education course — 4-hour BSIS module on professional public contact.',
  },
  {
    id: 'bsis-observation-documentation',
    name: 'Observation and Documentation (4 hr)',
    shortLabel: 'Observation',
    category: 'bsis-training',
    description: 'Required Continuing Education course — 4-hour BSIS module on observation, notes, and reports.',
  },
  {
    id: 'bsis-liability-legal',
    name: 'Liability / Legal Aspects (4 hr)',
    shortLabel: 'Legal Aspects',
    category: 'bsis-training',
    description: 'Required Continuing Education course — 4-hour BSIS module on legal limits and liability.',
  },
  {
    id: 'bsis-officer-safety',
    name: 'Officer Safety (4 hr)',
    shortLabel: 'Officer Safety',
    category: 'bsis-training',
    description: 'Required Continuing Education course — part of the 32-hour BSIS CE package.',
  },
  {
    id: 'bsis-trespass',
    name: 'Trespass (4 hr)',
    shortLabel: 'Trespass',
    category: 'bsis-training',
    description: 'Required Continuing Education course — trespass laws and enforcement (32-hour BSIS CE package).',
  },
  {
    id: 'bsis-evacuation-procedures',
    name: 'Evacuation Procedures (2 hr)',
    shortLabel: 'Evacuation',
    category: 'bsis-training',
    description: 'Required Continuing Education course — evacuation and emergency movement (32-hour BSIS CE package).',
  },
  {
    id: 'bsis-monitoring-crowd-control',
    name: 'Monitoring Crowd Control (2 hr)',
    shortLabel: 'Crowd Control',
    category: 'bsis-training',
    description: 'Required Continuing Education course — monitoring posts and crowd control (32-hour BSIS CE package).',
  },
  {
    id: 'bsis-arrest-search-seizure',
    name: 'Arrests, Search and Seizure (4 hr)',
    shortLabel: 'Search & Seizure',
    category: 'bsis-training',
    description: 'Required Continuing Education course — citizen arrest and search authority (32-hour BSIS CE package).',
  },

  // ── Additional BSIS / security training (optional) ──
  { id: 'bsis-patrol-techniques', name: 'Patrol Techniques', shortLabel: 'Patrol', category: 'bsis-training' },
  { id: 'bsis-access-control', name: 'Access Control', shortLabel: 'Access Control', category: 'bsis-training' },
  { id: 'bsis-crowd-control', name: 'Crowd Control', shortLabel: 'Crowd Control', category: 'bsis-training' },
  { id: 'bsis-terrorism-awareness', name: 'Terrorism Awareness', shortLabel: 'Terrorism Aware', category: 'bsis-training' },
  {
    id: 'bsis-wmd-awareness',
    name: 'Weapons of Mass Destruction Awareness',
    shortLabel: 'WMD Aware',
    category: 'bsis-training',
    description:
      'May count as the second part of the 8-hour course alongside Power to Arrest when issued separately from UOF.',
  },
  { id: 'bsis-incident-command', name: 'Incident Command System (ICS)', shortLabel: 'ICS', category: 'bsis-training' },
  { id: 'bsis-fire-safety', name: 'Fire Safety', shortLabel: 'Fire Safety', category: 'bsis-training' },
  { id: 'bsis-emergency-procedures', name: 'Emergency Procedures', shortLabel: 'Emergency Proc.', category: 'bsis-training' },
  { id: 'bsis-traffic-control', name: 'Traffic Control', shortLabel: 'Traffic Control', category: 'bsis-training' },
  { id: 'bsis-driver-safety', name: 'Driver Safety', shortLabel: 'Driver Safety', category: 'bsis-training' },
  { id: 'bsis-handling-difficult-people', name: 'Handling Difficult People', shortLabel: 'Difficult People', category: 'bsis-training' },
  { id: 'bsis-conflict-resolution', name: 'Conflict Resolution', shortLabel: 'Conflict Res.', category: 'bsis-training' },
  { id: 'bsis-workplace-violence', name: 'Workplace Violence', shortLabel: 'WPV', category: 'bsis-training' },

  // ── BSIS permits (weapons) ──
  {
    id: 'bsis-exposed-firearm',
    name: 'BSIS Exposed Firearm Permit',
    shortLabel: 'Firearm',
    category: 'bsis-permit',
    description: 'Required to carry an exposed firearm on duty in California.',
  },
  {
    id: 'bsis-baton',
    name: 'BSIS Baton Permit',
    shortLabel: 'Baton',
    category: 'bsis-permit',
  },
  {
    id: 'bsis-chemical-agent',
    name: 'BSIS Chemical Agent (OC / Pepper Spray) Permit',
    shortLabel: 'OC Spray',
    category: 'bsis-permit',
  },
  {
    id: 'bsis-taser',
    name: 'BSIS Taser Certification',
    shortLabel: 'Taser',
    category: 'bsis-permit',
    description: 'When employer authorizes taser carry.',
  },

  // ── BSIS weapons training (required for profile gear listing) ──
  {
    id: 'bsis-chemical-agent-training',
    name: 'BSIS Tear Gas / Chemical Agent Training Certificate',
    shortLabel: 'OC Training',
    category: 'bsis-training',
    description: 'Penal Code 22835 — required to carry OC spray on duty.',
  },
  {
    id: 'bsis-baton-training',
    name: 'BSIS Baton Training Certificate',
    shortLabel: 'Baton Training',
    category: 'bsis-training',
  },
  {
    id: 'bsis-taser-training',
    name: 'ECD / TASER Training Certificate',
    shortLabel: 'TASER Training',
    category: 'bsis-training',
    description: 'Approved instructor or manufacturer training — required for TASER carry.',
  },
  {
    id: 'bsis-firearms-training',
    name: 'BSIS Firearms Training Certificate',
    shortLabel: 'Firearms Training',
    category: 'bsis-training',
  },
  {
    id: 'bsis-firearms-qualification',
    name: 'BSIS Firearms Qualification (Range Test)',
    shortLabel: 'Firearms Qual',
    category: 'bsis-training',
  },

  // ── Medical ──
  { id: 'cpr', name: 'CPR Certification', shortLabel: 'CPR', category: 'medical' },
  { id: 'aed', name: 'AED Certification', shortLabel: 'AED', category: 'medical' },
  { id: 'first-aid', name: 'First Aid Certification', shortLabel: 'First Aid', category: 'medical' },
  { id: 'stop-the-bleed', name: 'Stop the Bleed Certification', shortLabel: 'Stop the Bleed', category: 'medical' },
  { id: 'narcan', name: 'Narcan Administration Training', shortLabel: 'Narcan', category: 'medical' },
  { id: 'bloodborne-pathogens', name: 'Bloodborne Pathogens Certification', shortLabel: 'BBP', category: 'medical' },
  { id: 'emr', name: 'Emergency Medical Responder (EMR)', shortLabel: 'EMR', category: 'medical' },
  { id: 'emt', name: 'Emergency Medical Technician (EMT)', shortLabel: 'EMT', category: 'medical' },
  { id: 'wilderness-first-aid', name: 'Wilderness First Aid', shortLabel: 'Wilderness FA', category: 'medical' },

  // ── FEMA ──
  { id: 'fema-ics-100', name: 'FEMA ICS-100', shortLabel: 'ICS-100', category: 'fema' },
  { id: 'fema-ics-200', name: 'FEMA ICS-200', shortLabel: 'ICS-200', category: 'fema' },
  { id: 'fema-is-700', name: 'FEMA IS-700', shortLabel: 'IS-700', category: 'fema' },
  { id: 'fema-is-800', name: 'FEMA IS-800', shortLabel: 'IS-800', category: 'fema' },
  { id: 'homeland-security-awareness', name: 'Homeland Security Awareness Training', shortLabel: 'HS Aware', category: 'fema' },
  { id: 'terrorism-awareness-advanced', name: 'Terrorism Awareness Training', shortLabel: 'Terrorism', category: 'fema' },

  // ── Advanced security ──
  { id: 'active-shooter-response', name: 'Active Shooter Response Training', shortLabel: 'Active Shooter', category: 'security-advanced' },
  { id: 'de-escalation', name: 'De-escalation Certification', shortLabel: 'De-escalation', category: 'security-advanced' },
  { id: 'crowd-management', name: 'Crowd Management Certification', shortLabel: 'Crowd Mgmt', category: 'security-advanced' },
  { id: 'defensive-driving', name: 'Defensive Driving Certification', shortLabel: 'Def. Driving', category: 'security-advanced' },
  { id: 'emergency-vehicle-ops', name: 'Emergency Vehicle Operations Training', shortLabel: 'EVO', category: 'security-advanced' },
  { id: 'executive-protection', name: 'Executive Protection (EP) Training', shortLabel: 'Exec Protection', category: 'security-advanced' },
  { id: 'threat-assessment', name: 'Threat Assessment Training', shortLabel: 'Threat Assess.', category: 'security-advanced' },
  { id: 'surveillance-detection', name: 'Surveillance Detection Training', shortLabel: 'Surveillance', category: 'security-advanced' },
  { id: 'protective-intelligence', name: 'Protective Intelligence Training', shortLabel: 'Prot. Intel', category: 'security-advanced' },
  { id: 'report-writing', name: 'Report Writing Certification', shortLabel: 'Report Writing', category: 'security-advanced' },
  { id: 'interview-statements', name: 'Interview & Statement Taking Training', shortLabel: 'Interviews', category: 'security-advanced' },
  { id: 'private-investigator', name: 'Private Investigator Training', shortLabel: 'PI', category: 'security-advanced' },
  { id: 'loss-prevention', name: 'Loss Prevention Certification', shortLabel: 'Loss Prev.', category: 'security-advanced' },

  // ── Industry ──
  {
    id: 'other-credential',
    name: 'Other license, certificate, or training',
    shortLabel: 'Other',
    category: 'industry',
    description: 'Any credential not listed — you will enter the certificate name when uploading.',
  },
  { id: 'osha-10', name: 'OSHA 10-Hour General Industry', shortLabel: 'OSHA-10', category: 'industry' },
  { id: 'osha-30', name: 'OSHA 30-Hour General Industry', shortLabel: 'OSHA-30', category: 'industry' },
  { id: 'cit', name: 'Crisis Intervention Training (CIT)', shortLabel: 'CIT', category: 'industry' },
  { id: 'mental-health-first-aid', name: 'Mental Health First Aid', shortLabel: 'MH First Aid', category: 'industry' },
  { id: 'customer-service', name: 'Customer Service Training', shortLabel: 'Customer Svc', category: 'industry' },
  { id: 'fleet-safety', name: 'Fleet Safety Certification', shortLabel: 'Fleet Safety', category: 'industry' },
];

const CATALOG_BY_ID = new Map(CERT_CATALOG.map((e) => [e.id, e]));

/** Legacy / import handles → canonical catalog IDs (PTA, UOF, AUF, WMD, combined 8-hr). */
export const CATALOG_ID_ALIASES: Record<string, string> = {
  'pta-uof-8hr': 'bsis-pta-uof-8hr',
  'pta-uof': 'bsis-pta-uof-8hr',
  'bsis-pta-uof': 'bsis-pta-uof-8hr',
  'pta': 'bsis-power-to-arrest',
  'bsis-pta': 'bsis-power-to-arrest',
  'power-to-arrest': 'bsis-power-to-arrest',
  'uof': 'bsis-appropriate-use-of-force',
  'auf': 'bsis-appropriate-use-of-force',
  'bsis-uof': 'bsis-appropriate-use-of-force',
  'appropriate-use-of-force': 'bsis-appropriate-use-of-force',
  'wmd': 'bsis-wmd-awareness',
  'bsis-wmd': 'bsis-wmd-awareness',
  'wmd-awareness': 'bsis-wmd-awareness',
};

export function canonicalCatalogId(catalogId: string | undefined): string | undefined {
  if (!catalogId) return undefined;
  const trimmed = catalogId.trim();
  if (!trimmed) return undefined;
  return CATALOG_ID_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export const BSIS_REFRESHER_CATALOG_ID = 'bsis-8-hour-refresher';

/** Client job-posting quick filters */
export const JOB_CERT_FILTER_OPTIONS: { id: string; label: string; description: string }[] = [
  { id: 'bsis-guard-card', label: 'Guard Card', description: 'Always required — valid California BSIS guard card on file' },
  { id: 'bsis-baton', label: 'Baton Required', description: 'BSIS baton permit on file (if applicable)' },
  { id: 'bsis-chemical-agent', label: 'OC / Pepper Spray', description: 'BSIS chemical agent permit on file (if applicable)' },
  { id: 'bsis-exposed-firearm', label: 'Firearm Required', description: 'BSIS exposed firearm permit on file (armed jobs)' },
  { id: 'bsis-taser', label: 'Taser', description: 'BSIS taser certification' },
  { id: 'cpr', label: 'CPR Required', description: 'Current CPR certification' },
  { id: 'first-aid', label: 'First Aid', description: 'First aid certification' },
  { id: 'aed', label: 'AED', description: 'AED operator certification' },
  { id: 'narcan', label: 'Narcan', description: 'Narcan administration trained' },
  { id: 'stop-the-bleed', label: 'Stop the Bleed', description: 'Stop the Bleed certified' },
  { id: 'executive-protection', label: 'Executive Protection', description: 'EP training required' },
  { id: 'active-shooter-response', label: 'Active Shooter Response', description: 'Active shooter training' },
  { id: 'de-escalation', label: 'De-escalation', description: 'De-escalation certification' },
  { id: 'defensive-driving', label: 'Defensive Driving', description: 'For patrol / vehicle posts' },
  { id: 'fema-ics-100', label: 'FEMA ICS-100', description: 'Incident command baseline' },
  { id: 'fema-ics-200', label: 'FEMA ICS-200', description: 'Incident command intermediate' },
];

export const CA_REQUIRED_LISTING_IDS = CERT_CATALOG.filter((e) => e.requiredForCaListing).map((e) => e.id);

export function getCertCatalogEntry(id: string): CertCatalogEntry | undefined {
  return CATALOG_BY_ID.get(id);
}

export function getCertsByCategory(category: CertCategory): CertCatalogEntry[] {
  return CERT_CATALOG.filter((e) => e.category === category);
}

/** Match certs to catalog IDs by stored catalog_id, exact name, or training-provider aliases. */
export function resolveCertCatalogId(cert: { catalogId?: string; name: string }): string | undefined {
  const storedCanonical = canonicalCatalogId(cert.catalogId);
  if (storedCanonical && CATALOG_BY_ID.has(storedCanonical)) return storedCanonical;

  const name = cert.name.trim();
  const normalized = name.toLowerCase();

  const exactName = CERT_CATALOG.find((e) => e.name.toLowerCase() === normalized);
  if (exactName) return exactName.id;

  const aliases: [RegExp, string][] = [
    [/power to arrest.*(wmd|weapons of mass destruction|mass destruction)/i, 'bsis-pta-uof-8hr'],
    [/power to arrest.*(use of force|appropriate use of force|\buof\b|\bauf\b)/i, 'bsis-pta-uof-8hr'],
    [/(use of force|appropriate use of force).*power to arrest/i, 'bsis-pta-uof-8hr'],
    [/^pta$/i, 'bsis-power-to-arrest'],
    [/power to arrest training/i, 'bsis-power-to-arrest'],
    [/^uof$/i, 'bsis-appropriate-use-of-force'],
    [/^auf$/i, 'bsis-appropriate-use-of-force'],
    [/appropriate use of force training/i, 'bsis-appropriate-use-of-force'],
    [/^wmd$/i, 'bsis-wmd-awareness'],
    [/weapons of mass destruction/i, 'bsis-wmd-awareness'],
    [/communication/i, 'bsis-communication'],
    [/public relations/i, 'bsis-public-relations'],
    [/observation.*documentation|documentation.*observation/i, 'bsis-observation-documentation'],
    [/liability|legal aspects/i, 'bsis-liability-legal'],
    [/officer safety/i, 'bsis-officer-safety'],
    [/trespass/i, 'bsis-trespass'],
    [/evacuation/i, 'bsis-evacuation-procedures'],
    [/crowd control|monitoring crowd/i, 'bsis-monitoring-crowd-control'],
    [/arrest.*search|search.*seizure/i, 'bsis-arrest-search-seizure'],
    [/parking.*traffic|traffic control/i, 'bsis-traffic-control'],
    [/chemical agents/i, 'bsis-chemical-agent'],
    [/annual refresher|bsis refresher|8[- ]?hr.*refresher/i, 'bsis-8-hour-refresher'],
    [/guard card/i, 'bsis-guard-card'],
  ];

  for (const [pattern, id] of aliases) {
    if (pattern.test(name)) return id;
  }

  const byShortLabel = CERT_CATALOG.find(
    (e) => normalized.includes(e.shortLabel.toLowerCase()) && e.shortLabel.length >= 5
  );
  if (byShortLabel) return byShortLabel.id;

  if (
    /power to arrest/i.test(name) &&
    /(use of force|appropriate use of force|\buof\b|\bauf\b|wmd|weapons of mass destruction)/i.test(name)
  ) {
    return 'bsis-pta-uof-8hr';
  }

  if (/firearm|armed/i.test(name) && /permit|bsis/i.test(name)) return 'bsis-exposed-firearm';
  if (/baton/i.test(name)) return 'bsis-baton';
  if (/pepper|chemical|oc spray/i.test(name)) return 'bsis-chemical-agent';
  if (/cpr/i.test(name)) return 'cpr';
  if (/first aid/i.test(name)) return 'first-aid';
  if (/aed/i.test(name)) return 'aed';
  if (/32.?hour|32.?hr/i.test(name) && /bsis|training/i.test(name)) return 'bsis-32-hour-completed';
  if (/40.?hour|40.?hr/i.test(name) && /bsis|training/i.test(name)) return 'bsis-40-hour-completed';
  if (/power to arrest/i.test(name)) return 'bsis-power-to-arrest';
  if (/use of force|appropriate use of force|\buof\b|\bauf\b/i.test(name)) {
    return 'bsis-appropriate-use-of-force';
  }

  if (storedCanonical && CATALOG_BY_ID.has(storedCanonical)) return storedCanonical;

  return undefined;
}

export function certDisplayName(cert: { catalogId?: string; name: string }): string {
  const id = resolveCertCatalogId(cert);
  return id ? (getCertCatalogEntry(id)?.name ?? cert.name) : cert.name;
}

export function certShortLabel(cert: { catalogId?: string; name: string }): string {
  const id = resolveCertCatalogId(cert);
  return id ? (getCertCatalogEntry(id)?.shortLabel ?? cert.name) : cert.name;
}

export function requirementLabel(catalogIdOrLegacy: string): string {
  const entry = getCertCatalogEntry(catalogIdOrLegacy);
  return entry?.name ?? catalogIdOrLegacy;
}

/** Guard cards and BSIS weapons permits require staff verification for job matching; all credentials may be verified for clients. */
export function credentialExpectsStaffVerification(
  certOrCatalogId: { catalogId?: string; name: string } | string
): boolean {
  const catalogId =
    typeof certOrCatalogId === 'string' ? certOrCatalogId : resolveCertCatalogId(certOrCatalogId);
  if (!catalogId) return false;
  if (catalogId === 'bsis-guard-card') return true;
  return getCertCatalogEntry(catalogId)?.category === 'bsis-permit';
}

/** BSIS weapons permits expire; training certificates and one-time course completions do not. */
export function credentialRequiresExpiry(
  certOrCatalogId: { catalogId?: string; name: string } | string
): boolean {
  const catalogId =
    typeof certOrCatalogId === 'string' ? certOrCatalogId : resolveCertCatalogId(certOrCatalogId);
  if (!catalogId) return false;
  return getCertCatalogEntry(catalogId)?.category === 'bsis-permit';
}

/** Profile badge candidates — verified optional certs worth showing */
export const PROFILE_BADGE_CATEGORIES: CertCategory[] = [
  'medical',
  'bsis-permit',
  'fema',
  'security-advanced',
  'industry',
];
