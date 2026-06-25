import type { Client, JobServiceAgreement, SecurityGuard, SecurityRequest } from '../types';
import { LEGAL_ENTITY_NAME, SITE_NAME } from './siteConfig';
import { formatShiftRange } from './dates';

export const JOB_SERVICE_AGREEMENT_VERSION = '2026-06-25';

function guardPayForJob(job: SecurityRequest): number {
  return job.guardPay ?? Math.max(0, job.hourlyRate - (job.platformFeePerHour ?? 0));
}

export function buildJobServiceAgreement(
  job: SecurityRequest,
  client: Pick<Client, 'id' | 'name' | 'companyName'>,
  guard: Pick<SecurityGuard, 'id' | 'name'>
): JobServiceAgreement {
  const generatedAt = new Date().toISOString();
  const guardPay = guardPayForJob(job);
  const schedule = formatShiftRange(job.startDate, job.endDate);
  const clientLabel = client.companyName?.trim() || client.name;
  const body = [
    'PER-JOB SECURITY SERVICES AGREEMENT',
    '',
    `This agreement is entered into through the ${SITE_NAME} technology platform operated by ${LEGAL_ENTITY_NAME} ("Platform"). ${LEGAL_ENTITY_NAME} is not a party to this agreement and does not provide security services.`,
    '',
    `Client: ${clientLabel}`,
    `Independent security professional: ${guard.name}`,
    `Assignment: ${job.title}`,
    `Location: ${job.location}`,
    `Schedule: ${schedule}`,
    `Agreed guard compensation: $${guardPay.toFixed(2)} per hour for approximately ${job.durationHours} hour(s).`,
    job.armedRequired ? 'Armed coverage required for this assignment.' : 'Unarmed coverage for this assignment.',
    '',
    '1. Independent contractor relationship',
    `The guard is an independent business or contractor, not an employee, agent, or partner of the Client or ${LEGAL_ENTITY_NAME}. The Client does not control the guard's business except for lawful site instructions for this assignment.`,
    '',
    '2. Services and licensing',
    'The guard agrees to perform security services in a professional manner and to maintain all licenses, registrations, training, and insurance required by law for this assignment.',
    '',
    '3. Client responsibilities',
    'The Client agrees to provide lawful site access, accurate instructions, and timely payment through the Platform for accepted work.',
    '',
    '4. Platform role',
    `${SITE_NAME} provides discovery, scheduling tools, messaging, and payment facilitation only. Security services are performed solely by the guard, not by ${LEGAL_ENTITY_NAME}.`,
    '',
    '5. Insurance and liability',
    'Each party remains responsible for its own insurance. The guard represents that required coverage is in force for this assignment. The Platform does not guarantee outcomes or assume guard negligence.',
    '',
    `Generated electronically on ${new Date(generatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} via ${SITE_NAME}.`,
  ].join('\n');

  return {
    id: `jsa-${job.id}-${guard.id}`,
    jobId: job.id,
    clientId: client.id,
    guardId: guard.id,
    version: JOB_SERVICE_AGREEMENT_VERSION,
    generatedAt,
    title: job.title,
    hourlyRate: job.hourlyRate,
    guardPayPerHour: guardPay,
    durationHours: job.durationHours,
    location: job.location,
    startDate: job.startDate,
    endDate: job.endDate,
    clientName: clientLabel,
    guardName: guard.name,
    body,
  };
}

export function parseJobServiceAgreement(value: unknown): JobServiceAgreement | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  if (!row.jobId || !row.guardId || !row.body) return undefined;
  return row as JobServiceAgreement;
}
