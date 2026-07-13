import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushNotificationType } from './types';
import type { VerifiedSession } from './accountSessionAuth';

const STAFF_ROLES = new Set(['moderator', 'administrator', 'director', 'owner', 'staff', 'auditor']);

export function isStaffSession(session: VerifiedSession): boolean {
  return STAFF_ROLES.has(session.platformRole) || STAFF_ROLES.has(session.role);
}

export interface PushEventContext {
  type: PushNotificationType;
  guardId?: string;
  requestId?: string;
  recipientUserId?: string;
  ticketId?: string;
}

async function isJobParticipant(
  db: SupabaseClient,
  requestId: string,
  userId: string
): Promise<boolean> {
  const { data } = await db
    .from('security_requests')
    .select('client_id, assigned_guard_id')
    .eq('id', requestId)
    .maybeSingle();

  if (!data) return false;
  return data.client_id === userId || data.assigned_guard_id === userId;
}

async function isSupportTicketParticipant(
  db: SupabaseClient,
  ticketId: string,
  userId: string
): Promise<boolean> {
  const { data } = await db
    .from('support_tickets')
    .select('user_id')
    .eq('id', ticketId)
    .maybeSingle();

  return data?.user_id === userId;
}

/**
 * Returns null when authorized, or an error message when denied.
 */
export async function authorizePushEvent(
  db: SupabaseClient,
  session: VerifiedSession,
  event: PushEventContext
): Promise<string | null> {
  const { type } = event;

  switch (type) {
    case 'test':
      return 'Test notifications must use /api/push/test';

    case 'staff_message':
      return isStaffSession(session) ? null : 'Only staff can send this notification type';

    case 'client_pending_approval':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'client') return null;
      return 'Only staff or the registering client can notify about pending approval';

    case 'guard_pending_approval':
      if (isStaffSession(session)) return null;
      if (
        session.platformRole === 'guard' &&
        (!event.guardId || event.guardId === session.userId)
      ) {
        return null;
      }
      return 'Only staff or the registering guard can notify about pending approval';

    case 'credential_pending':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard' && event.guardId === session.userId) return null;
      return 'Only staff or the submitting guard can send credential review notifications';

    case 'job_submitted':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'client') return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Only staff or the submitting client can notify about new jobs';

    case 'guard_application':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard' && event.guardId === session.userId) return null;
      return 'Only staff or the applying guard can send application notifications';

    case 'guard_message':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard') return null;
      return 'Only staff or active guards can post to guard chat';

    case 'client_message':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'client') return null;
      return 'Only staff or active clients can post to client chat';

    case 'guard_checkin':
    case 'guard_clockout':
    case 'guard_arrived':
    case 'guard_left_site':
    case 'guard_break_start':
    case 'guard_break_end':
    case 'missed_checkin':
      if (isStaffSession(session)) return null;
      if (event.guardId && event.guardId === session.userId) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to report shift events for this job';

    case 'job_open_to_guards':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'client') return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Only staff or the job client can notify guards of open positions';

    case 'client_cash_payment_requested':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'client') return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Only staff or the job client can send cash payment request notifications';

    case 'guard_cash_payout_requested':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard') return null;
      return 'Only staff or guards can send payout request notifications';

    case 'stripe_payment_complete':
      return isStaffSession(session) ? null : 'Only staff can send payment completion notifications';

    case 'payment_attention':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard') return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Only staff, guards, or job participants can send payment attention notifications';

    case 'assignment':
      if (isStaffSession(session)) return null;
      if (event.guardId && event.guardId === session.userId) return null;
      if (event.recipientUserId && event.recipientUserId === session.userId) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send assignment notifications for this job';

    case 'emergency_alert':
      if (isStaffSession(session)) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      if (event.ticketId && (await isSupportTicketParticipant(db, event.ticketId, session.userId))) {
        return null;
      }
      return 'Not authorized to send emergency alerts for this context';

    case 'support_message':
      if (isStaffSession(session)) return null;
      if (event.recipientUserId && event.recipientUserId === session.userId) return null;
      if (event.ticketId && (await isSupportTicketParticipant(db, event.ticketId, session.userId))) {
        return null;
      }
      return 'Not authorized to send support messages for this ticket';

    case 'job_chat_message':
      if (isStaffSession(session)) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send job chat messages for this job';

    case 'support_ticket':
      if (isStaffSession(session)) return null;
      if (event.ticketId && (await isSupportTicketParticipant(db, event.ticketId, session.userId))) {
        return null;
      }
      return 'Not authorized to file this support ticket';

    case 'support_ticket_status':
      return isStaffSession(session) ? null : 'Only staff can send support status updates';

    case 'dispute_update':
      if (isStaffSession(session)) return null;
      if (event.ticketId && (await isSupportTicketParticipant(db, event.ticketId, session.userId))) {
        return null;
      }
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send dispute updates for this context';

    case 'guard_trusted_status':
    case 'client_trusted_status':
      return isStaffSession(session) ? null : 'Only staff can send trusted status notifications';

    case 'job_relisted':
      if (isStaffSession(session)) return null;
      if (event.recipientUserId && event.recipientUserId === session.userId) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send job re-list notifications';

    case 'job_schedule_changed':
      if (isStaffSession(session)) return null;
      if (event.recipientUserId && event.recipientUserId === session.userId) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send schedule change notifications for this job';

    case 'team_chat_message':
      if (isStaffSession(session)) return null;
      if (event.recipientUserId && event.recipientUserId === session.userId) return null;
      if (event.requestId && (await isJobParticipant(db, event.requestId, session.userId))) {
        return null;
      }
      return 'Not authorized to send crew chat notifications for this job';

    case 'standing_crew_invite':
      if (isStaffSession(session)) return null;
      if (session.platformRole === 'guard' && event.recipientUserId) return null;
      return 'Only guards can send standing crew invitations';

    default:
      return 'Unknown notification type';
  }
}
