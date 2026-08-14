import type { PlatformRole, SessionUser } from '../types';
import { isStaffRole, platformStaffRank } from './permissions';

export type ChatMessageChannel = 'staff' | 'guard' | 'client' | 'job_chat' | 'support';

const GROUP_CHAT_CHANNELS: ChatMessageChannel[] = ['staff', 'guard', 'client', 'job_chat'];

export interface ChatMessageActorRef {
  senderId: string;
  senderRole: PlatformRole;
}

/** Users may delete their own messages. Higher staff may delete lower-ranked senders in group chats. */
export function canDeleteChatMessage(
  actor: Pick<SessionUser, 'id' | 'role'>,
  message: ChatMessageActorRef,
  channel: ChatMessageChannel
): boolean {
  if (message.senderId === actor.id) return true;

  if (!GROUP_CHAT_CHANNELS.includes(channel)) return false;
  if (!isStaffRole(actor.role)) return false;

  const actorRank = platformStaffRank(actor.role);
  if (actorRank === null) return false;

  const senderRank = platformStaffRank(message.senderRole);
  if (senderRank === null) return true;

  return actorRank > senderRank;
}
