import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { OneRoleCase } from '../../lib/oneRolePolicy';
import {
  ONE_ROLE_POLICY_TITLE,
  canReviewOneRoleHolds,
  describeOneRolePair,
  matchKindLabel,
  oneRoleKindLabel,
} from '../../lib/oneRolePolicy';
import { AppButton } from '../ui/AppButton';
import { clientDisplayName } from '../../lib/clientType';
import type { Client, SecurityGuard, SessionUser } from '../../types';

interface StaffOneRoleHoldsProps {
  currentUser: SessionUser;
  cases: OneRoleCase[];
  guards: SecurityGuard[];
  clients: Client[];
  onIgnore: (caseId: string) => void;
  onBlock: (caseId: string) => void;
}

function displayName(
  kind: OneRoleCase['accounts'][number]['kind'],
  id: string,
  fallback: string,
  guards: SecurityGuard[],
  clients: Client[],
): string {
  if (kind === 'client') {
    const client = clients.find((item) => item.id === id);
    return client ? clientDisplayName(client) : fallback;
  }
  const member = guards.find((item) => item.id === id);
  if (!member) return fallback;
  const full = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
  return full || member.name || fallback;
}

export function StaffOneRoleHolds({
  currentUser,
  cases,
  guards,
  clients,
  onIgnore,
  onBlock,
}: StaffOneRoleHoldsProps) {
  const openCases = cases.filter((item) => item.status === 'open');
  if (openCases.length === 0) return null;
  const canReview = canReviewOneRoleHolds(currentUser.role);

  return (
    <section className="staff-one-role-holds" aria-label={ONE_ROLE_POLICY_TITLE}>
      <div className="staff-one-role-holds-head">
        <ShieldAlert className="w-4 h-4" aria-hidden />
        <div>
          <h2>{ONE_ROLE_POLICY_TITLE} holds</h2>
          <p>
            These people signed into more than one Guardr role. Both accounts stay locked until a
            manager clears the hold or blocks both.
          </p>
        </div>
      </div>
      <ul>
        {openCases.map((item) => (
          <li key={item.id} className="staff-one-role-hold">
            <p className="staff-one-role-hold-title">
              {describeOneRolePair(item.accounts)} — {matchKindLabel(item.matchKind)}
            </p>
            <ul className="staff-one-role-hold-accounts">
              {item.accounts.map((account) => (
                <li key={`${account.kind}:${account.id}`}>
                  {oneRoleKindLabel(account.kind)}:{' '}
                  {displayName(account.kind, account.id, account.name, guards, clients)}
                </li>
              ))}
            </ul>
            <p className="staff-one-role-hold-reason">{item.reason}</p>
            {canReview ? (
              <div className="staff-one-role-hold-actions">
                <AppButton variant="outline" size="sm" onClick={() => onIgnore(item.id)}>
                  Ignore hold
                </AppButton>
                <AppButton variant="danger" size="sm" onClick={() => onBlock(item.id)}>
                  Block both accounts
                </AppButton>
              </div>
            ) : (
              <p className="staff-one-role-hold-wait">A manager or director has to review this.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
