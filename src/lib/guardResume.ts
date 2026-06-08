import { Certification, SecurityGuard } from '../types';
import { isGuardCardCert } from './guardLicenses';
import { formatStateName } from './states';

/** State guard card licenses — separate from training certifications */
export function getGuardLicenses(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((c) => isGuardCardCert(c.name));
}

/** CPR, armed specialty, medical, etc. — not state guard cards */
export function getGuardCertifications(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((c) => !isGuardCardCert(c.name));
}

export function getGuardDisplaySummary(guard: SecurityGuard): string {
  return (
    guard.summary?.trim() ||
    guard.bio?.trim() ||
    guard.about?.trim().slice(0, 160) ||
    'Licensed security professional.'
  );
}

export function getGuardDisplayHeadline(guard: SecurityGuard): string {
  return guard.headline?.trim() || 'Security Professional';
}

export function formatSkillList(skills: string[] | undefined): string {
  if (!skills?.length) return '';
  return skills.join(' · ');
}

export function formatServiceAreas(areas: string[] | undefined): string {
  if (!areas?.length) return '';
  return areas.map((code) => formatStateName(code)).join(', ');
}

export const LICENSE_CERT_OPTIONS = [
  'State Unarmed Guard Card License',
  'State Armed Security Officer Guard Card',
] as const;

export const TRAINING_CERT_OPTIONS = [
  'First Aid & CPR / AED',
  'Vessel / Event Security Officer (VSO)',
  'Tactical Combat Casualty Care (TCCC)',
  'Executive Close Protection Certified (ECP)',
  'NRA Professional Range Safety Guard License',
  'Crisis De-escalation & Mental Health First Responder',
] as const;

export function parseTagInput(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinTagInput(tags: string[] | undefined): string {
  return tags?.join(', ') ?? '';
}
