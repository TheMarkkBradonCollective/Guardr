import type { PlatformRole } from '../types';
import { isStaffRole, ROLE_LABELS } from './permissions';

export function shouldMaskStaffIdentity(viewerRole: PlatformRole): boolean {
  return viewerRole === 'client' || viewerRole === 'guard';
}

export function staffRoleLabel(role: PlatformRole): string {
  return ROLE_LABELS[role] ?? 'Staff';
}

/** Display name for a message sender, hiding staff personal names from clients and guards. */
export function displaySenderNameForViewer(
  viewerRole: PlatformRole,
  senderRole: PlatformRole,
  senderName: string,
  fallback = 'User'
): string {
  if (shouldMaskStaffIdentity(viewerRole) && isStaffRole(senderRole)) {
    return staffRoleLabel(senderRole);
  }
  return senderName.trim() || fallback;
}

/** Guard/client community channel bubble label. */
export function communityChatSenderLabel(
  viewerRole: PlatformRole,
  senderRole: PlatformRole,
  senderName: string,
  peerFallback: 'Guard' | 'Client'
): string {
  const roleLabel = ROLE_LABELS[senderRole] ?? senderRole;
  if (shouldMaskStaffIdentity(viewerRole) && isStaffRole(senderRole)) {
    return `Guardr · ${roleLabel}`;
  }
  const displayName = displaySenderNameForViewer(viewerRole, senderRole, senderName, peerFallback);
  return `Guardr · ${roleLabel} · ${displayName}`;
}

/** Job chat, team chat, and support thread label. */
export function chatSenderLabelForViewer(
  viewerRole: PlatformRole,
  senderRole: PlatformRole,
  senderName: string
): string {
  if (shouldMaskStaffIdentity(viewerRole) && isStaffRole(senderRole)) {
    return staffRoleLabel(senderRole);
  }
  if (isStaffRole(senderRole)) {
    return `Guardr staff (${senderName.trim() || 'Staff'})`;
  }
  return senderName.trim() || 'User';
}

export function maskReplySenderName(
  viewerRole: PlatformRole,
  replySenderName: string,
  messages: Array<{ senderName: string; senderRole: PlatformRole }>
): string {
  if (!shouldMaskStaffIdentity(viewerRole)) return replySenderName;
  if (replySenderName === 'You') return replySenderName;

  const matched = messages.find(
    (m) => isStaffRole(m.senderRole) && m.senderName.trim() === replySenderName.trim()
  );
  if (matched) return staffRoleLabel(matched.senderRole);

  if (/guardr staff/i.test(replySenderName)) return 'Staff';
  return replySenderName;
}

export function avatarInitialForSender(
  viewerRole: PlatformRole,
  senderRole: PlatformRole,
  senderName: string,
  fallback = '?'
): string {
  const display = displaySenderNameForViewer(viewerRole, senderRole, senderName, fallback);
  return display.charAt(0).toUpperCase() || fallback;
}
