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
  'bsis-required': 'Required to Work (CA)',
  'bsis-training': 'BSIS Training Courses',
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

  // ── Required to work in CA (beyond the card itself) ──
  {
    id: 'bsis-power-to-arrest',
    name: 'Power to Arrest Training',
    shortLabel: 'Power to Arrest',
    category: 'bsis-required',
    requiredForCaListing: true,
    description: '8-hour BSIS-required course before guard card issuance.',
  },
  {
    id: 'bsis-appropriate-use-of-force',
    name: 'Appropriate Use of Force Training',
    shortLabel: 'Use of Force',
    category: 'bsis-required',
    requiredForCaListing: true,
    description: '8-hour BSIS-required course before guard card issuance.',
  },
  {
    id: 'bsis-40-hour-completed',
    name: '40-Hour BSIS Training Completed',
    shortLabel: '40-Hr BSIS',
    category: 'bsis-required',
    requiredForCaListing: true,
    description: 'Completion of all required BSIS training hours within mandated timeframes.',
  },

  // ── BSIS training course certificates (40-hour pathway) ──
  { id: 'bsis-public-relations', name: 'Public Relations (Community & Customer)', shortLabel: 'Public Relations', category: 'bsis-training' },
  { id: 'bsis-observation-documentation', name: 'Observation & Documentation', shortLabel: 'Observation', category: 'bsis-training' },
  { id: 'bsis-communication', name: 'Communication & Its Significance', shortLabel: 'Communication', category: 'bsis-training' },
  { id: 'bsis-liability-legal', name: 'Liability & Legal Aspects', shortLabel: 'Legal Aspects', category: 'bsis-training' },
  { id: 'bsis-officer-safety', name: 'Officer Safety', shortLabel: 'Officer Safety', category: 'bsis-training' },
  { id: 'bsis-patrol-techniques', name: 'Patrol Techniques', shortLabel: 'Patrol', category: 'bsis-training' },
  { id: 'bsis-arrest-search-seizure', name: 'Arrest, Search & Seizure', shortLabel: 'Search & Seizure', category: 'bsis-training' },
  { id: 'bsis-access-control', name: 'Access Control', shortLabel: 'Access Control', category: 'bsis-training' },
  { id: 'bsis-terrorism-awareness', name: 'Terrorism Awareness', shortLabel: 'Terrorism Aware', category: 'bsis-training' },
  { id: 'bsis-wmd-awareness', name: 'Weapons of Mass Destruction Awareness', shortLabel: 'WMD Aware', category: 'bsis-training' },
  { id: 'bsis-crowd-control', name: 'Crowd Control', shortLabel: 'Crowd Control', category: 'bsis-training' },
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
  { id: 'osha-10', name: 'OSHA 10-Hour General Industry', shortLabel: 'OSHA-10', category: 'industry' },
  { id: 'osha-30', name: 'OSHA 30-Hour General Industry', shortLabel: 'OSHA-30', category: 'industry' },
  { id: 'cit', name: 'Crisis Intervention Training (CIT)', shortLabel: 'CIT', category: 'industry' },
  { id: 'mental-health-first-aid', name: 'Mental Health First Aid', shortLabel: 'MH First Aid', category: 'industry' },
  { id: 'customer-service', name: 'Customer Service Training', shortLabel: 'Customer Svc', category: 'industry' },
  { id: 'fleet-safety', name: 'Fleet Safety Certification', shortLabel: 'Fleet Safety', category: 'industry' },
];

const CATALOG_BY_ID = new Map(CERT_CATALOG.map((e) => [e.id, e]));

/** Client job-posting quick filters */
export const JOB_CERT_FILTER_OPTIONS: { id: string; label: string; description: string }[] = [
  { id: 'bsis-guard-card', label: 'Guard Card', description: 'Always required — valid BSIS guard card for job state' },
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

export function resolveCertCatalogId(cert: { catalogId?: string; name: string }): string | undefined {
  if (cert.catalogId && CATALOG_BY_ID.has(cert.catalogId)) return cert.catalogId;
  const byName = CERT_CATALOG.find(
    (e) => e.name.toLowerCase() === cert.name.toLowerCase() || cert.name.toLowerCase().includes(e.id.replace(/-/g, ' '))
  );
  if (byName) return byName.id;
  // Legacy name patterns
  if (/guard card/i.test(cert.name)) return 'bsis-guard-card';
  if (/firearm|armed/i.test(cert.name) && /permit|bsis/i.test(cert.name)) return 'bsis-exposed-firearm';
  if (/baton/i.test(cert.name)) return 'bsis-baton';
  if (/pepper|chemical|oc spray/i.test(cert.name)) return 'bsis-chemical-agent';
  if (/cpr/i.test(cert.name)) return 'cpr';
  if (/first aid/i.test(cert.name)) return 'first-aid';
  if (/aed/i.test(cert.name)) return 'aed';
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

/** Profile badge candidates — verified optional certs worth showing */
export const PROFILE_BADGE_CATEGORIES: CertCategory[] = [
  'medical',
  'bsis-permit',
  'fema',
  'security-advanced',
  'industry',
];
