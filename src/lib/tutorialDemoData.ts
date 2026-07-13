import type { SecurityRequest } from '../types';

export const TUTORIAL_DEMO_PREFIX = 'tutorial-demo-';

export function isTutorialDemoId(id: string): boolean {
  return id.startsWith(TUTORIAL_DEMO_PREFIX);
}

export interface TutorialDemoSnapshot {
  requests: SecurityRequest[];
  createdAt: string;
  updatedAt: string;
}

function demoTimestamp(offsetHours = 24): string {
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString();
}

function baseDemoRequest(
  id: string,
  partial: Partial<SecurityRequest> & Pick<SecurityRequest, 'title' | 'clientId' | 'clientName' | 'status'>
): SecurityRequest {
  const start = demoTimestamp(48);
  const end = demoTimestamp(56);
  return {
    id,
    title: partial.title,
    description:
      partial.description ??
      'Tutorial example only — not visible to other users. Safe to explore; removed when you end the tutorial.',
    clientId: partial.clientId,
    clientName: partial.clientName,
    clientLogo: '',
    location: partial.location ?? 'Tutorial Site — Private practice data',
    siteName: partial.siteName ?? 'Tutorial venue',
    address: partial.address ?? '100 Tutorial Lane',
    state: 'California',
    latitude: 34.0522,
    longitude: -118.2437,
    type: partial.type ?? 'event',
    armedRequired: false,
    guardsNeeded: 1,
    startDate: partial.startDate ?? start,
    endDate: partial.endDate ?? end,
    durationHours: partial.durationHours ?? 8,
    hourlyRate: partial.hourlyRate ?? 45,
    estimatedPayout: partial.estimatedPayout ?? 360,
    status: partial.status,
    assignedGuardId: partial.assignedGuardId ?? null,
    applicants: partial.applicants ?? [],
    requiredCertifications: partial.requiredCertifications ?? [],
    paymentStatus: partial.paymentStatus ?? 'unpaid',
    ...partial,
  } as SecurityRequest;
}

export function createInitialTutorialDemoData(
  role: 'guard' | 'client' | 'staff',
  userId: string
): TutorialDemoSnapshot {
  const now = new Date().toISOString();
  const requests: SecurityRequest[] = [];

  if (role === 'guard') {
    requests.push(
      baseDemoRequest(`${TUTORIAL_DEMO_PREFIX}guard-job-${userId}`, {
        title: 'Tutorial: Retail grand opening',
        clientId: `${TUTORIAL_DEMO_PREFIX}client`,
        clientName: 'Tutorial Client Co.',
        status: 'open',
        location: 'Downtown tutorial plaza',
        hourlyRate: 42,
        estimatedPayout: 336,
      })
    );
  }

  if (role === 'client') {
    requests.push(
      baseDemoRequest(`${TUTORIAL_DEMO_PREFIX}client-request-${userId}`, {
        title: 'Tutorial: Weekend festival coverage',
        clientId: userId,
        clientName: 'Your company (practice)',
        status: 'pending-review',
        location: 'Tutorial festival grounds',
        description:
          'Practice posting flow — this draft is stored locally and never goes live until you post a real job.',
      })
    );
  }

  if (role === 'staff') {
    requests.push(
      baseDemoRequest(`${TUTORIAL_DEMO_PREFIX}staff-approval-${userId}`, {
        title: 'Tutorial: Pending job offer review',
        clientId: `${TUTORIAL_DEMO_PREFIX}client`,
        clientName: 'Tutorial Client Co.',
        status: 'pending-review',
        location: 'Tutorial corporate campus',
        description: 'Practice approval — only you see this while the tutorial or practice mode is active.',
      })
    );
  }

  return { requests, createdAt: now, updatedAt: now };
}

export function addPracticeDemoRequest(
  snapshot: TutorialDemoSnapshot,
  role: 'guard' | 'client' | 'staff',
  userId: string
): TutorialDemoSnapshot {
  const index = snapshot.requests.length + 1;
  const id = `${TUTORIAL_DEMO_PREFIX}practice-${role}-${userId}-${index}`;
  let request: SecurityRequest;

  if (role === 'guard') {
    request = baseDemoRequest(id, {
      title: `Practice job #${index}: Overnight patrol`,
      clientId: `${TUTORIAL_DEMO_PREFIX}client`,
      clientName: 'Practice Client',
      status: 'open',
      location: `Practice site ${index}`,
      hourlyRate: 40 + index,
    });
  } else if (role === 'client') {
    request = baseDemoRequest(id, {
      title: `Practice request #${index}: Store opening`,
      clientId: userId,
      clientName: 'Your company (practice)',
      status: 'draft',
      location: `Practice location ${index}`,
    });
  } else {
    request = baseDemoRequest(id, {
      title: `Practice approval #${index}: New client offer`,
      clientId: `${TUTORIAL_DEMO_PREFIX}client-${index}`,
      clientName: `Practice Client ${index}`,
      status: 'pending-review',
      location: `Practice venue ${index}`,
    });
  }

  return {
    ...snapshot,
    requests: [...snapshot.requests, request],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeTutorialRequests(
  live: SecurityRequest[],
  demo: SecurityRequest[]
): SecurityRequest[] {
  const withoutDemo = live.filter((r) => !isTutorialDemoId(r.id));
  return [...demo, ...withoutDemo];
}

export function stripTutorialRequests(requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter((r) => !isTutorialDemoId(r.id));
}
