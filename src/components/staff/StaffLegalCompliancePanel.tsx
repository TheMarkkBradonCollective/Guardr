import React, { useMemo, useState } from 'react';
import {
  buildLegalComplianceReport,
  type LegalAcceptanceRecord,
  type LegalComplianceUserRow,
} from '../../lib/legalAcceptance';
import { legalDocumentLabel, requiredLegalDocumentsForRole } from '../../lib/legalContent';
import type { Client, SecurityGuard } from '../../types';
import { AppFormSection } from '../ui/app/AppPrimitives';

interface StaffLegalCompliancePanelProps {
  guards: SecurityGuard[];
  clients: Client[];
  legalAcceptances: LegalAcceptanceRecord[];
}

function formatAcceptedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ComplianceRow({ row }: { row: LegalComplianceUserRow }) {
  const required = requiredLegalDocumentsForRole(row.role);
  return (
    <tr className="border-t border-brand-border align-top">
      <td className="px-3 py-3">
        <p className="font-semibold text-sm">{row.name}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{row.email}</p>
      </td>
      <td className="px-3 py-3 text-sm">{row.roleLabel}</td>
      <td className="px-3 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.complete
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {row.complete ? 'Complete' : 'Missing'}
        </span>
      </td>
      <td className="px-3 py-3 text-xs text-brand-text-muted">
        <ul className="space-y-1.5">
          {required.map((documentId) => {
            const acceptance = row.documents[documentId];
            return (
              <li key={documentId}>
                <span className="font-medium text-brand-text">{legalDocumentLabel(documentId)}:</span>{' '}
                {acceptance ? (
                  <>
                    accepted v{acceptance.version} · {formatAcceptedAt(acceptance.acceptedAt)}
                  </>
                ) : (
                  <span className="text-amber-400 font-medium">Not accepted</span>
                )}
              </li>
            );
          })}
        </ul>
      </td>
    </tr>
  );
}

export function StaffLegalCompliancePanel({
  guards,
  clients,
  legalAcceptances,
}: StaffLegalCompliancePanelProps) {
  const [filter, setFilter] = useState<'all' | 'missing' | 'complete'>('all');
  const report = useMemo(
    () => buildLegalComplianceReport(guards, clients, legalAcceptances),
    [guards, clients, legalAcceptances]
  );
  const filtered = useMemo(() => {
    if (filter === 'missing') return report.filter((row) => !row.complete);
    if (filter === 'complete') return report.filter((row) => row.complete);
    return report;
  }, [filter, report]);

  const missingCount = report.filter((row) => !row.complete).length;

  return (
    <AppFormSection title="Marketplace agreements">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'missing', 'complete'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
              filter === value
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-brand-border text-brand-text-muted hover:text-brand-text'
            }`}
          >
            {value === 'all' ? `All (${report.length})` : value === 'missing' ? `Missing (${missingCount})` : 'Complete'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="bg-brand-surface-elevated text-xs uppercase tracking-wide text-brand-text-muted">
              <th className="px-3 py-2 font-semibold">User</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Documents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-sm text-brand-text-muted">
                  No users match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((row) => <ComplianceRow key={row.userId} row={row} />)
            )}
          </tbody>
        </table>
      </div>
    </AppFormSection>
  );
}
