type PlatformRole =
  | 'client'
  | 'guard'
  | 'support'
  | 'moderator'
  | 'administrator'
  | 'manager'
  | 'director'
  | 'owner';

const STAFF_ROLE_RANK: Record<string, number> = {
  support: 1,
  moderator: 2,
  administrator: 3,
  manager: 4,
  director: 5,
  owner: 6,
};

export function platformStaffRank(role: PlatformRole): number | null {
  return STAFF_ROLE_RANK[role] ?? null;
}

export function isStaffPlatformRole(role: PlatformRole): boolean {
  return platformStaffRank(role) !== null;
}

export function canDeleteGroupChatMessage(input: {
  actorUserId: string;
  actorRole: PlatformRole;
  senderId: string;
  senderRole: string;
}): boolean {
  if (input.senderId === input.actorUserId) return true;
  if (!isStaffPlatformRole(input.actorRole)) return false;

  const actorRank = platformStaffRank(input.actorRole);
  if (actorRank === null) return false;

  const senderRank = platformStaffRank(input.senderRole as PlatformRole);
  if (senderRank === null) return true;

  return actorRank > senderRank;
}

export function canDeleteSupportMessage(input: {
  actorUserId: string;
  senderId: string;
}): boolean {
  return input.senderId === input.actorUserId;
}
