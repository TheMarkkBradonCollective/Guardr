/** Shared copy and row builders for the self-serve forgot-password request. */
export const FORGOT_PASSWORD_RESPONSE =
  'If an account exists for that email, Guardr support will contact you to verify your identity and send a temporary password.';

export const PASSWORD_RESET_SUBJECT = 'Password reset request';

export function buildPasswordResetTicket(input: {
  profileId: string;
  kind: 'guard' | 'client' | 'staff';
  name: string;
  email: string;
  ticketId: string;
  messageId: string;
  now: string;
}) {
  const ticket = {
    id: input.ticketId,
    user_id: input.profileId,
    user_name: input.name || input.email,
    user_email: input.email,
    user_role: input.kind,
    kind: 'chat',
    subject: PASSWORD_RESET_SUBJECT,
    category: 'account',
    priority: 'high',
    status: 'open',
    created_at: input.now,
    updated_at: input.now,
  };
  const message = {
    id: input.messageId,
    ticket_id: input.ticketId,
    sender_id: input.profileId,
    sender_name: input.name || input.email,
    sender_role: input.kind,
    body:
      'Forgot password request from the sign-in screen. Verify this person (phone or ID on file) before resetting, ' +
      'then use "Reset password" on their profile and share the temporary password privately.',
    created_at: input.now,
  };
  return { ticket, message };
}
