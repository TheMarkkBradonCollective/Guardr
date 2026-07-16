import React, { useEffect, useMemo, useState } from 'react';
import {
  buildLegalComplianceReport,
  type LegalAcceptanceRecord,
  type LegalComplianceUserRow,
} from '../../lib/legalAcceptance';
import { legalDocumentLabel, requiredLegalDocumentsForRole } from '../../lib/legalContent';
import type { Client, SecurityGuard } from '../../types';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';
import { StaffOpsPageShell } from './StaffOpsPageShell';

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

function ComplianceDetail({ row }: { row: LegalComplianceUserRow }) {
  const required = requiredLegalDocumentsForRole(row.role);
  return (
    <div className="adm-compliance-detail space-y-4">
      <div>
        <p className="adm-card-eyebrow">{row.roleLabel}</p>
        <h3 className="adm-card-title">{row.name}</h3>
        <p className="adm-workbench-subtitle">{row.email}</p>
      </div>
      <div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}
        >
          {row.complete ? 'Complete' : 'Missing agreements'}
        </span>
      </div>
      <ul className="space-y-3 text-sm">
        {required.map((documentId) => {
          const acceptance = row.documents[documentId];
          return (
            <li
              key={documentId}
              className="rounded-lg border border-brand-border bg-brand-surface/40 px-3 py-2.5"
            >
              <p className="font-semibold">{legalDocumentLabel(documentId)}</p>
              {acceptance ? (
                <p className="text-xs text-brand-text-muted mt-1">
                  Accepted v{acceptance.version} · {formatAcceptedAt(acceptance.acceptedAt)}
                </p>
              ) : (
                <p className="text-xs text-amber-400 font-medium mt-1">Not accepted</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
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
            row.complete ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
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
  const { formFactor } = useDevice();
  const [filter, setFilter] = useState<'all' | 'missing' | 'complete'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  useEffect(() => {
    if (formFactor !== 'desktop') return;
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((row) => row.userId === selectedId)) {
      setSelectedId(filtered[0].userId);
    }
  }, [formFactor, filtered, selectedId]);

  const selectedRow = filtered.find((row) => row.userId === selectedId) ?? null;

  const filterButtons = (
    <div className="flex flex-wrap items-center gap-2">
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
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell className="adm-finance-page">
        <div className="adm-workbench-toolbar adm-finance-toolbar">
          <div>
            <p className="adm-card-eyebrow">Compliance</p>
            <p className="adm-workbench-subtitle">Agreements accepted by guards and clients.</p>
          </div>
          {filterButtons}
        </div>

        {filtered.length === 0 ? (
          <div className="adm-empty">
            <p>No users match this filter.</p>
          </div>
        ) : (
          <div className="adm-workbench-split adm-finance-split">
            <div className="adm-workbench-list">
              <table className="adm-table adm-table--list">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.userId}
                      className={`adm-table-row--click${selectedId === row.userId ? ' adm-table-row--selected' : ''}`}
                      onClick={() => setSelectedId(row.userId)}
                    >
                      <td>
                        <p className="adm-table-primary">{row.name}</p>
                        <p className="adm-table-secondary">{row.email}</p>
                      </td>
                      <td className="adm-table-secondary">{row.roleLabel}</td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.complete
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {row.complete ? 'Complete' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="adm-workbench-detail">
              {selectedRow ? (
                <div className="adm-workbench-detail-inner">
                  <ComplianceDetail row={selectedRow} />
                </div>
              ) : (
                <div className="adm-empty adm-empty--detail">
                  <p>Select a user to review agreements</p>
                </div>
              )}
            </div>
          </div>
        )}
      </StaffOpsPageShell>
    );
  }

  return (
    <AppFormSection title="Agreements">
      {filterButtons}
      <div className="rounded-xl border border-brand-border overflow-x-auto mt-4">
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
