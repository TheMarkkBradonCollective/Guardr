import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardArmedDisplayLevel,
  guardArmedDisplayLevelIndicator,
  guardArmedDisplayLevelLabel,
  guardArmedDisplayLevelTone,
  shouldShowGuardArmedDisplayLevel,
} from '../../lib/guardWeaponGear';
import { WfBadge } from '../ui/wireframe';

interface GuardArmedLevelBadgeProps {
  guard: SecurityGuard;
  jobState?: string;
  className?: string;
}

export function GuardArmedLevelBadge({ guard, jobState = 'CA', className = '' }: GuardArmedLevelBadgeProps) {
  if (!shouldShowGuardArmedDisplayLevel(guard, jobState)) return null;

  const level = getGuardArmedDisplayLevel(guard, jobState);

  return (
    <WfBadge tone={guardArmedDisplayLevelTone(level)} className={className}>
      {guardArmedDisplayLevelIndicator(level)} {guardArmedDisplayLevelLabel(level)}
    </WfBadge>
  );
}
