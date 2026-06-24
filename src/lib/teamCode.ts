import type { SecurityRequest } from '../types';
import { isMultiGuardJob } from './guardTeams';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeTeamCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateTeamCode(): string {
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `CREW-${suffix}`;
}

export function generateUniqueTeamCode(
  jobs: Pick<SecurityRequest, 'teamCode' | 'status'>[]
): string {
  const taken = new Set(
    jobs
      .map((job) => normalizeTeamCode(job.teamCode ?? ''))
      .filter(Boolean)
  );
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const code = generateTeamCode();
    if (!taken.has(normalizeTeamCode(code))) return code;
  }
  return `${generateTeamCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}

export function findOpenTeamJobByCode(
  rawCode: string,
  jobs: SecurityRequest[]
): SecurityRequest | undefined {
  const code = normalizeTeamCode(rawCode);
  if (!code) return undefined;
  return jobs.find(
    (job) =>
      job.status === 'open' &&
      isMultiGuardJob(job) &&
      !!job.teamLeadId &&
      normalizeTeamCode(job.teamCode ?? '') === code
  );
}

export function formatTeamCodeDisplay(code: string | null | undefined): string {
  const normalized = normalizeTeamCode(code ?? '');
  return normalized || '—';
}
