import type { SecurityGuard, SessionUser } from '../types';
import { canModifyStaffMember } from './permissions';
import { getGuardUserStatus } from './accountStatus';
import { getGuardActivationChecklist } from './guardAccountActivation';

/** Tracks independent-contractor guard compliance items staff must verify (#1046). */
export type GuardContractorComplianceItem =
  | 'government_id'
  | 'guard_card'
  | 'coi'
  | 'background_check'
  | 'active_status';

export function listGuardContractorComplianceGaps(guard: SecurityGuard): GuardContractorComplianceItem[] {
  const checklist = getGuardActivationChecklist(guard);
  const gaps: GuardContractorComplianceItem[] = [];
  if (!checklist.idVerified) gaps.push('government_id');
  if (!checklist.guardCardVerified) gaps.push('guard_card');
  if (!checklist.insuranceVerified) gaps.push('coi');
  if (!guard.backgroundChecked) gaps.push('background_check');
  if (getGuardUserStatus(guard) !== 'active') gaps.push('active_status');
  return gaps;
}

/** HR role separation: actor may not modify same-or-higher ladder peers (#1046). */
export function staffRoleSeparationAllowsManage(
  actor: Pick<SessionUser, 'role'>,
  member: Pick<SecurityGuard, 'staffRole' | 'sideRole'>,
): boolean {
  return canModifyStaffMember(actor.role, member.staffRole, member.sideRole);
}
