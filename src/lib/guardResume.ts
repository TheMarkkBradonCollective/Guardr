import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId, getCertCatalogEntry } from './certCatalog';
import { isGuardCardCert } from './guardLicenses';
import { formatStateName } from './states';

/** BSIS guard cards only */
export function getGuardLicenses(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((c) => isGuardCardCert(c));
}

/** All training certs, permits, and credentials except guard cards */
export function getGuardCertifications(guard: SecurityGuard): Certification[] {
  return guard.certifications.filter((c) => !isGuardCardCert(c));
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

export function parseTagInput(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinTagInput(tags: string[] | undefined): string {
  return tags?.join(', ') ?? '';
}

export function certDisplayName(cert: Certification): string {
  const id = resolveCertCatalogId(cert);
  return id ? (getCertCatalogEntry(id)?.name ?? cert.name) : cert.name;
}
