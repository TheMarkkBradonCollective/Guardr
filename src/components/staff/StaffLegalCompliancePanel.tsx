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
import { StatusChip } from '../baseui/StatusChip';
import { UberDataTable, type UberTableColumn } from '../baseui/UberDataTable';
import { useDevice } from '../../lib/platform';
import {
  WorkbenchEmpty,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';
import { StaffListFilterTabs } from './StaffListFilterTabs';
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
        <div className="app-subscreen-header app-subscreen-header--back-only">
          <button type="button" onClick={onBack} className="app-subscreen-back">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Agreements
          </button>
        </div>
      )}
      <div>
        <p className="adm-card-eyebrow">{row.roleLabel}</p>
        <h3 className="adm-card-title">{row.name}</h3>
        <p className="uber-workbench-subtitle">{row.email}</p>
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
              className="staff-mgmt-detail-row px-0 py-2.5"
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

  const complianceColumns: UberTableColumn<(typeof report)[number]>[] = [
    {
      id: 'user',
      header: 'User',
      grow: true,
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <>
          <p className="uber-workbench-table-primary">{row.name}</p>
          <p className="uber-workbench-table-secondary">{row.email}</p>
        </>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (row) => row.roleLabel,
      render: (row) => row.roleLabel,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => (row.complete ? 1 : 0),
      render: (row) => (
        <StatusChip tone={row.complete ? 'positive' : 'warning'}>
          {row.complete ? 'Complete' : 'Missing'}
        </StatusChip>
      ),
    },
  ];

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

  const completeCount = report.length - missingCount;

  const filterTabsControl = (
    <StaffListFilterTabs
      aria-label="Agreement status"
      activeId={filter}
      onChange={(id) => setFilter(id as 'all' | 'missing' | 'complete')}
      tabs={[
        { id: 'all', label: 'All', count: report.length },
        { id: 'missing', label: 'Missing', count: missingCount },
        { id: 'complete', label: 'Complete', count: completeCount },
      ]}
    />
  );

  if (formFactor === 'desktop') {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-finance-page"
        toolbar={
          <WorkbenchToolbar
            eyebrow="Compliance"
            subtitle="Agreements accepted by guards and clients."
          />
        }
      >
        {filterTabsControl}
        {filtered.length === 0 ? (
          <WorkbenchEmpty message="No users match this filter." />
        ) : (
          <WorkbenchSplit
            className="adm-finance-split"
            list={
              <UberDataTable
                columns={complianceColumns}
                rows={filtered}
                rowKey={(row) => row.userId}
                selectedKey={selectedId ?? undefined}
                onRowClick={(row) => setSelectedId(row.userId)}
                caption="Legal acceptance"
                cardLayout={{ title: 'user', subtitle: 'role', trailing: 'status' }}
              />
            }
            detail={
              selectedRow ? (
                <ComplianceDetail row={selectedRow} />
              ) : (
                <WorkbenchEmpty message="Select a user to review agreements" variant="detail" />
              )
            }
          />
        )}
      </StaffOpsPageShell>
    );
  }

  return (
    <AppFormSection title="Agreements">
      <div className="space-y-4">
        {filterTabsControl}
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
