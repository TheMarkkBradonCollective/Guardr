import type { AssignmentMode, Client, SecurityRequest } from '../types';

export type { AssignmentMode };

export function resolveAssignmentMode(
  job: Pick<SecurityRequest, 'assignmentMode'>,
  client?: Pick<Client, 'defaultAssignmentMode'> | null
): AssignmentMode {
  return job.assignmentMode ?? client?.defaultAssignmentMode ?? 'client-approve';
}

export function jobUsesFirstToAccept(
  job: Pick<SecurityRequest, 'assignmentMode'>,
  client?: Pick<Client, 'defaultAssignmentMode'> | null
): boolean {
  return resolveAssignmentMode(job, client) === 'first-to-accept';
}

export const ASSIGNMENT_MODE_OPTIONS: {
  id: AssignmentMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'client-approve',
    label: 'I approve guards',
    description: 'Guards apply — you review and confirm each hire.',
  },
  {
    id: 'first-to-accept',
    label: 'First qualified guard',
    description: 'The first guard who meets your requirements is assigned automatically.',
  },
];
