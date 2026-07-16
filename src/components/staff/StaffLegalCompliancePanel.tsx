import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  buildLegalComplianceReport,
  type LegalAcceptanceRecord,
  type LegalComplianceUserRow,
} from '../../lib/legalAcceptance';
import { legalDocumentLabel, requiredLegalDocumentsForRole } from '../../lib/legalContent';
import type { Client, SecurityGuard } from '../../types';
import { AppEmptyState, AppFormSection } from '../ui/app/AppPrimitives';
import { ListDetailLayout } from '../ui/app/ListDetailLayout';
import { WfBadge, WfListCard } from '../ui/wireframe';
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

function ComplianceDetail({ row, onBack }: { row: LegalComplianceUserRow; onBack?: () => void }) {
  const required = requiredLegalDocumentsForRole(row.role);
  return (
    <div className="adm-compliance-detail space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-brand-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to agreements
        </button>
      )}
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
      <div className="space-y-4">
        {filterButtons}
        {filtered.length === 0 ? (
          <AppEmptyState title="No users match this filter." />
        ) : (
          <ListDetailLayout
            items={filtered}
            selectedId={selectedId}
            onSelectId={setSelectedId}
            getItemId={(row) => row.userId}
            autoSelectFirst={false}
            renderItem={(row, isActive, onSelect) => (
              <WfListCard
                title={row.name}
                subtitle={row.email}
                meta={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-brand-text-muted">{row.roleLabel}</span>
                    <WfBadge tone={row.complete ? 'success' : 'warning'}>
                      {row.complete ? 'Complete' : 'Missing'}
                    </WfBadge>
                  </div>
                }
                onClick={onSelect}
                className={isActive ? 'app-item-card-selected' : ''}
              />
            )}
            renderDetail={(row, options) => <ComplianceDetail row={row} onBack={options?.onBack} />}
            mobilePresentation="page"
          />
        )}
      </div>
    </AppFormSection>
  );
}
