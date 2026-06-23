import type { SessionUser, SupportTicket, SupportTicketStatus } from '../types';
import { categoryLabel, priorityLabel } from './support';
import { reportPushEvent } from './pushApi';
import type { DisputeResolutionAction, OpsDispute } from './staffOps';

export function notifySupportTicketCreated(user: SessionUser, ticket: SupportTicket): void {
  const kindLabel = ticket.kind === 'report' ? 'Formal report' : 'Support request';

  void reportPushEvent(user, {
    type: 'support_ticket',
    ticketId: ticket.id,
    requestId: ticket.relatedRequestId,
    title: ticket.kind === 'report' ? 'New formal report' : 'New support ticket',
    body: `${kindLabel} from ${ticket.userName}: ${ticket.subject} (${categoryLabel(ticket.category)})`,
  });

  if (ticket.category === 'safety' && ticket.priority === 'urgent') {
    void reportPushEvent(user, {
      type: 'emergency_alert',
      ticketId: ticket.id,
      requestId: ticket.relatedRequestId,
      body: `Urgent safety report from ${ticket.userName}: ${ticket.subject}`,
    });
  }

  if (ticket.kind === 'report' && ['payment', 'job-issue'].includes(ticket.category)) {
    void reportPushEvent(user, {
      type: 'dispute_update',
      ticketId: ticket.id,
      requestId: ticket.relatedRequestId,
      title: 'New dispute report',
      body: `${ticket.userName} filed a ${categoryLabel(ticket.category)} dispute: ${ticket.subject}`,
    });
  } else if (ticket.priority === 'urgent' || ticket.priority === 'high') {
    void reportPushEvent(user, {
      type: 'support_ticket',
      ticketId: ticket.id,
      requestId: ticket.relatedRequestId,
      title: `${priorityLabel(ticket.priority)} priority ticket`,
      body: `${ticket.userName}: ${ticket.subject}`,
    });
  }
}

export function notifySupportTicketStatus(
  user: SessionUser,
  ticket: SupportTicket,
  status: SupportTicketStatus
): void {
  const title =
    status === 'resolved'
      ? ticket.kind === 'report'
        ? 'Report closed'
        : 'Support ticket closed'
      : status === 'in-progress'
        ? ticket.kind === 'report'
          ? 'Report under review'
          : 'Support ticket in review'
        : 'Support ticket updated';

  const body =
    status === 'resolved'
      ? `Your ticket "${ticket.subject}" was marked resolved.`
      : status === 'in-progress'
        ? `Guardr staff is now reviewing "${ticket.subject}".`
        : `Status updated on "${ticket.subject}".`;

  void reportPushEvent(user, {
    type: 'support_ticket_status',
    recipientUserId: ticket.userId,
    ticketId: ticket.id,
    title,
    body,
  });
}

export function notifyDisputeResolution(
  user: SessionUser,
  dispute: OpsDispute,
  action: DisputeResolutionAction
): void {
  const actionLabel: Record<DisputeResolutionAction, string> = {
    approve_payout: 'Payout approved',
    hold_funds: 'Funds held pending review',
    partial_payout: 'Partial payout issued',
    cancel_payout: 'Payout cancelled',
  };

  void reportPushEvent(user, {
    type: 'dispute_update',
    ticketId: dispute.ticketId,
    requestId: dispute.requestId,
    guardId: dispute.guardId,
    clientId: dispute.clientId,
    title: 'Dispute update',
    body: `${actionLabel[action]} for "${dispute.jobTitle}".`,
  });
}
