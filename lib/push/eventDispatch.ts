import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushSendPayload, PushNotificationType } from './types';

export interface PushEventInput {
  type: PushNotificationType;
  title?: string;
  body?: string;
  guardId?: string;
  requestId?: string;
  siteId?: string;
  guardName?: string;
  location?: string;
  recipientUserId?: string;
  ticketId?: string;
  excludeUserId?: string;
  clientId?: string;
  priority?: 'normal' | 'high';
  checkinEscalationTier?: 'alert' | 'staff' | 'escalate';
  checkinDueBucket?: number;
  url?: string;
}

const EVENT_DEFAULTS: Record<string, (event: PushEventInput) => { title: string; body: string }> = {
  guard_checkin: (event) => ({
    title: 'Guard check-in',
    body: event.guardName
      ? `${event.guardName} checked in${event.location ? ` at ${event.location}` : ''}`
      : 'A guard completed a check-in',
  }),
  guard_clockout: (event) => ({
    title: 'Guard clock-out',
    body: event.guardName
      ? `${event.guardName} clocked out${event.location ? ` at ${event.location}` : ''}`
      : 'A guard clocked out',
  }),
  guard_arrived: (event) => ({
    title: 'Guard arrived on site',
    body: event.guardName
      ? `${event.guardName} arrived${event.location ? ` at ${event.location}` : ''}`
      : 'Your guard arrived on site',
  }),
  guard_left_site: (event) => ({
    title: 'Guard left job site',
    body: event.guardName
      ? `${event.guardName} left the job site${event.location ? ` at ${event.location}` : ''}`
      : 'A guard left the job site during an active shift',
  }),
  guard_break_start: (event) => ({
    title: 'Guard on break',
    body: event.guardName
      ? `${event.guardName} started a break${event.location ? ` at ${event.location}` : ''}`
      : 'A guard started a break',
  }),
  guard_break_end: (event) => ({
    title: 'Guard back on duty',
    body: event.guardName
      ? `${event.guardName} ended break and is back on duty${event.location ? ` at ${event.location}` : ''}`
      : 'A guard ended a break',
  }),
  missed_checkin: (event) => ({
    title: 'Missed check-in',
    body: event.guardName
      ? `${event.guardName} missed an hourly check-in`
      : 'A guard missed an hourly check-in',
  }),
  assignment: (event) => ({
    title: 'New assignment',
    body: event.body
      ?? (event.location
        ? `You have a new assignment at ${event.location}`
        : 'You have a new assignment update'),
  }),
  emergency_alert: (event) => ({
    title: 'Emergency alert',
    body: event.body || 'Immediate attention required on an active shift',
  }),
  support_message: (event) => ({
    title: 'Support message',
    body: event.body || 'You have a new support message',
  }),
  job_chat_message: (event) => ({
    title: 'Job chat',
    body: event.body || 'New message on an active job',
  }),
  staff_message: (event) => ({
    title: 'Staff chat',
    body: event.body || 'New message from the Guardr team',
  }),
  guard_message: (event) => ({
    title: 'Guard chat',
    body: event.body || 'New message from another guard',
  }),
  client_message: (event) => ({
    title: 'Client chat',
    body: event.body || 'New message from another client',
  }),
  job_submitted: (event) => ({
    title: 'New job request',
    body: event.body || 'A client submitted a job awaiting staff review',
  }),
  guard_application: (event) => ({
    title: 'Guard application',
    body: event.body || 'A guard applied to an open job offer',
  }),
  guard_pending_approval: (event) => ({
    title: 'Guard pending approval',
    body: event.body || 'A guard account needs staff review',
  }),
  client_pending_approval: (event) => ({
    title: 'Client pending approval',
    body: event.body || 'A client account needs staff review',
  }),
  credential_pending: (event) => ({
    title: 'Credential review',
    body: event.body || 'A guard submitted credentials for review',
  }),
  payment_attention: (event) => ({
    title: 'Payment attention',
    body: event.body || 'A payment or payout needs staff action',
  }),
  client_cash_payment_requested: (event) => ({
    title: 'Client cash payment request',
    body: event.body || 'A client requested to pay in cash',
  }),
  guard_cash_payout_requested: (event) => ({
    title: 'Guard cash payout request',
    body: event.body || 'A guard requested cash payout',
  }),
  stripe_payment_complete: (event) => ({
    title: 'Stripe payment received',
    body: event.body || 'A card payment completed successfully',
  }),
  job_open_to_guards: (event) => ({
    title: 'New job on the map',
    body: event.body || 'A paid job is now open for guards',
  }),
  support_ticket: (event) => ({
    title: 'Support ticket',
    body: event.body || 'A new support ticket needs staff attention',
  }),
  support_ticket_status: (event) => ({
    title: 'Support update',
    body: event.body || 'Your support ticket status changed',
  }),
  dispute_update: (event) => ({
    title: 'Dispute update',
    body: event.body || 'A dispute needs your attention',
  }),
  guard_trusted_status: (event) => ({
    title: event.title ?? 'Trusted guard update',
    body: event.body || 'Your trusted guard status changed',
  }),
  client_trusted_status: (event) => ({
    title: event.title ?? 'Trusted client update',
    body: event.body || 'Your trusted client status changed',
  }),
  job_relisted: (event) => ({
    title: 'Job back on marketplace',
    body: event.body || 'A job was re-listed and is open for guards again',
  }),
  job_schedule_changed: (event) => ({
    title: 'Shift time changed',
    body: event.body || 'Your job schedule was updated',
  }),
  team_chat_message: (event) => ({
    title: 'Crew chat',
    body: event.body || 'New message in crew chat',
  }),
  account_update: (event) => ({
    title: event.title ?? 'Account update',
    body: event.body || 'Your Guardr account was updated',
  }),
  job_status_update: (event) => ({
    title: event.title ?? 'Job update',
    body: event.body || 'A job you are involved with was updated',
  }),
  payout_ready: (event) => ({
    title: event.title ?? 'Payout ready',
    body: event.body || 'Earnings are ready to collect in Pay',
  }),
  company_placard_expiry: (event) => ({
    title: event.title ?? 'Company placard reminder',
    body: event.body || 'A company credential needs attention in Staff Settings',
  }),
  pre_shift_briefing: (event) => ({
    title: event.title ?? 'Shift briefing',
    body: event.body || 'Review your pre-shift briefing before heading to site',
  }),
};

function basePayload(event: PushEventInput): PushSendPayload {
  const fallbackFn = EVENT_DEFAULTS[event.type];
  const fallback = fallbackFn
    ? fallbackFn(event)
    : { title: 'Guardr alert', body: event.body || 'Operational update' };

  return {
    title: event.title ?? fallback.title,
    body: event.body ?? fallback.body,
    type: event.type,
    guardId: event.guardId,
    requestId: event.requestId,
    ticketId: event.ticketId,
    siteId: event.siteId,
    url: event.url,
    priority: event.type === 'emergency_alert' ? 'high' : event.priority ?? 'normal',
    excludeUserId: event.excludeUserId,
  };
}

async function loadJobParticipants(
  db: SupabaseClient,
  requestId: string
): Promise<{ clientId: string | null; guardId: string | null }> {
  const { data } = await db
    .from('security_requests')
    .select('client_id, assigned_guard_id')
    .eq('id', requestId)
    .maybeSingle();

  return {
    clientId: data?.client_id ?? null,
    guardId: data?.assigned_guard_id ?? null,
  };
}

/**
 * Build one or more dispatch payloads for a push event.
 */
export async function buildEventDispatchPayloads(
  db: SupabaseClient,
  event: PushEventInput
): Promise<PushSendPayload[]> {
  const payload = basePayload(event);

  if (event.type === 'assignment') {
    if (event.recipientUserId) {
      return [{ ...payload, userId: event.recipientUserId }];
    }
    if (event.guardId) {
      return [{ ...payload, userId: event.guardId }];
    }
    return [{ ...payload, role: 'guard' }];
  }

  if (event.type === 'support_message' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'job_chat_message' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'emergency_alert' && event.requestId) {
    const { clientId, guardId } = await loadJobParticipants(db, event.requestId);
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (guardId) payloads.push({ ...payload, userId: guardId });
    if (clientId) payloads.push({ ...payload, userId: clientId });
    return payloads;
  }

  if (event.type === 'missed_checkin' && event.requestId) {
    const tier = event.checkinEscalationTier ?? 'legacy';
    const { clientId, guardId } = await loadJobParticipants(db, event.requestId);

    if (tier === 'alert') {
      const payloads: PushSendPayload[] = [];
      if (guardId) {
        payloads.push({
          ...payload,
          userId: guardId,
          title: 'Hourly check-in overdue',
          body: event.location
            ? `Check in now — you are 5+ minutes past due at ${event.location}`
            : 'Check in now — you are 5+ minutes past your hourly check-in',
          priority: 'high',
        });
      }
      if (clientId) {
        payloads.push({
          ...payload,
          userId: clientId,
          title: 'Guard check-in overdue',
          body: event.guardName
            ? `${event.guardName} is 5+ minutes past due for an hourly check-in${event.location ? ` at ${event.location}` : ''}`
            : 'Your guard is overdue for an hourly check-in',
        });
      }
      return payloads;
    }

    if (tier === 'staff') {
      return [
        {
          ...payload,
          role: 'dispatch',
          title: 'Check-in overdue — staff alert',
          body: event.guardName
            ? `${event.guardName} is 10+ minutes past due for hourly check-in${event.location ? ` at ${event.location}` : ''}`
            : 'A guard is 10+ minutes past due for hourly check-in',
        },
      ];
    }

    if (tier === 'escalate') {
      const payloads: PushSendPayload[] = [
        {
          ...payload,
          role: 'dispatch',
          title: 'Check-in escalation',
          body: event.guardName
            ? `ESCALATION: ${event.guardName} missed hourly check-in for 15+ minutes${event.location ? ` at ${event.location}` : ''}`
            : 'ESCALATION: guard missed hourly check-in for 15+ minutes',
          priority: 'high',
        },
      ];
      if (clientId) {
        payloads.push({
          ...payload,
          userId: clientId,
          title: 'Check-in escalation',
          body: 'Your guard has not completed a required hourly check-in. Guardr staff has been escalated.',
          priority: 'high',
        });
      }
      return payloads;
    }

    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (guardId) {
      payloads.push({
        ...payload,
        userId: guardId,
        title: 'Missed check-in reminder',
        body: event.location
          ? `You missed your hourly check-in at ${event.location}`
          : 'You missed your hourly check-in — please check in now',
      });
    }
    return payloads;
  }

  if (event.type === 'support_ticket_status' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'account_update' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'payout_ready') {
    if (event.recipientUserId) {
      return [{ ...payload, userId: event.recipientUserId }];
    }
    if (event.guardId) {
      return [{ ...payload, userId: event.guardId }];
    }
    return [];
  }

  if (event.type === 'company_placard_expiry' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'pre_shift_briefing') {
    const userId = event.recipientUserId ?? event.guardId;
    if (!userId) return [];
    return [{ ...payload, userId }];
  }

  if (event.type === 'job_status_update') {
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (event.clientId) payloads.push({ ...payload, userId: event.clientId });
    if (event.guardId) payloads.push({ ...payload, userId: event.guardId });
    else if (event.recipientUserId) payloads.push({ ...payload, userId: event.recipientUserId });
    return payloads;
  }

  if (
    (event.type === 'guard_trusted_status' ||
      event.type === 'client_trusted_status' ||
      event.type === 'job_relisted' ||
      event.type === 'job_schedule_changed') &&
    event.recipientUserId
  ) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'team_chat_message') {
    if (event.recipientUserId) {
      return [{ ...payload, userId: event.recipientUserId }];
    }
    return [{ ...payload, role: 'dispatch' }];
  }

  if (event.type === 'job_submitted' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'job_open_to_guards') {
    if (event.guardId || event.recipientUserId) {
      const userId = event.recipientUserId ?? event.guardId;
      if (!userId) return [];
      return [
        {
          ...payload,
          userId,
          priority: event.priority ?? 'high',
          title: event.title ?? 'Priority job for your crew',
          body:
            event.body ??
            'A new job matches your standing crew size — browse and apply early.',
        },
      ];
    }
    return [{ ...payload, role: 'guard' }];
  }

  if (event.type === 'guard_application') {
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (event.recipientUserId) {
      payloads.push({ ...payload, userId: event.recipientUserId });
    } else if (event.clientId) {
      payloads.push({ ...payload, userId: event.clientId });
    }
    return payloads;
  }

  if (event.type === 'stripe_payment_complete' || event.type === 'client_cash_payment_requested' || event.type === 'guard_cash_payout_requested') {
    return [{ ...payload, role: 'dispatch' }];
  }

  if (event.type === 'support_ticket') {
    return [{ ...payload, role: 'dispatch' }];
  }

  if (event.type === 'dispute_update') {
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (event.guardId) payloads.push({ ...payload, userId: event.guardId });
    if (event.clientId) payloads.push({ ...payload, userId: event.clientId });
    else if (event.recipientUserId) payloads.push({ ...payload, userId: event.recipientUserId });
    return payloads;
  }

  if (
    event.type === 'staff_message' ||
    event.type === 'job_submitted' ||
    event.type === 'guard_pending_approval' ||
    event.type === 'client_pending_approval' ||
    event.type === 'credential_pending' ||
    event.type === 'payment_attention' ||
    (event.type === 'support_message' && !event.recipientUserId) ||
    (event.type === 'job_chat_message' && !event.recipientUserId)
  ) {
    return [{ ...payload, role: 'dispatch' }];
  }

  if (event.type === 'guard_message') {
    return [{ ...payload, role: 'guard' }];
  }

  if (event.type === 'client_message') {
    return [{ ...payload, role: 'client' }];
  }

  if (
    event.type === 'guard_checkin' ||
    event.type === 'guard_clockout' ||
    event.type === 'guard_arrived' ||
    event.type === 'guard_break_start' ||
    event.type === 'guard_break_end' ||
    event.type === 'guard_left_site'
  ) {
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (event.requestId) {
      const { clientId, guardId } = await loadJobParticipants(db, event.requestId);
      if (clientId) payloads.push({ ...payload, userId: clientId });
      if (event.type === 'guard_left_site' && guardId) {
        payloads.push({
          ...payload,
          userId: guardId,
          title: 'You left the job site',
          body: event.location
            ? `You moved away from ${event.location} during your shift`
            : 'You left the job site during your active shift',
        });
      }
    } else if (event.recipientUserId) {
      payloads.push({ ...payload, userId: event.recipientUserId });
    }
    return payloads;
  }

  return [payload];
}
