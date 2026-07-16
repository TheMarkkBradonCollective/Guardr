import type { SecurityRequest, SessionUser } from '../types';
import { reportPushEvent } from './pushApi';
import { guardsToNotifyForScheduleChange } from './jobScheduleChange';

/** Notify every assigned / pending / crew guard on a job. */
export function notifyAssignedGuards(
  actor: SessionUser,
  job: Pick<SecurityRequest, 'id' | 'title' | 'location'>,
  title: string,
  body: string
): void {
  for (const guardId of guardsToNotifyForScheduleChange(job as SecurityRequest)) {
    void reportPushEvent(actor, {
      type: 'assignment',
      recipientUserId: guardId,
      requestId: job.id,
      location: job.location,
      title,
      body,
    });
  }
}

/** Account, credential, and profile updates for guards and clients. */
export function notifyAccountUpdate(
  actor: SessionUser,
  recipientUserId: string,
  title: string,
  body: string
): void {
  void reportPushEvent(actor, {
    type: 'account_update',
    recipientUserId,
    title,
    body,
  });
}

/** Job cancelled, completed, declined, or other status changes — staff, client, and assigned guard. */
export function notifyJobStatusUpdate(
  actor: SessionUser,
  job: Pick<SecurityRequest, 'id' | 'title' | 'clientId' | 'assignedGuardId' | 'location'>,
  title: string,
  body: string,
  options?: { guardId?: string; notifyStaff?: boolean }
): void {
  void reportPushEvent(actor, {
    type: 'job_status_update',
    requestId: job.id,
    clientId: job.clientId,
    guardId: options?.guardId ?? job.assignedGuardId,
    location: job.location,
    title,
    body,
  });
}

/** Guard can collect pay for a completed job. */
export function notifyPayoutReady(
  actor: SessionUser,
  guardId: string,
  requestId: string,
  amount: number,
  jobTitle: string
): void {
  void reportPushEvent(actor, {
    type: 'payout_ready',
    recipientUserId: guardId,
    guardId,
    requestId,
    title: 'Payout ready',
    body: `$${amount.toFixed(2)} is ready to collect for "${jobTitle}". Open Pay to send to your bank.`,
  });
}

/** Staff operational queue alert. */
export function notifyStaffAttention(
  actor: SessionUser,
  body: string,
  options?: { requestId?: string; title?: string }
): void {
  void reportPushEvent(actor, {
    type: 'payment_attention',
    requestId: options?.requestId,
    title: options?.title ?? 'Action needed',
    body,
  });
}

/** Notify staff and client when a guard applies to a marketplace job. */
export function notifyGuardAppliedToJob(
  actor: SessionUser,
  job: Pick<SecurityRequest, 'id' | 'title' | 'clientId' | 'location'>,
  guard: { id: string; name: string }
): void {
  void reportPushEvent(actor, {
    type: 'guard_application',
    requestId: job.id,
    guardId: guard.id,
    guardName: guard.name,
    clientId: job.clientId,
    location: job.location,
    body: `${guard.name} applied for "${job.title}".`,
  });
  void reportPushEvent(actor, {
    type: 'assignment',
    recipientUserId: job.clientId,
    requestId: job.id,
    guardId: guard.id,
    guardName: guard.name,
    title: 'Guard application',
    body: `${guard.name} applied for "${job.title}". Approve or decline in Jobs.`,
  });
}
