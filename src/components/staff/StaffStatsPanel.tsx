import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { SecurityGuard, SecurityRequest } from '../../types';
import { buildStaffShiftViolations } from '../../lib/staffOps';
import {
  STAFF_GUARD_STAT_SORT_OPTIONS,
  buildStaffGuardStatRows,
  buildStaffStatsPlatformSummary,
  compareStaffGuardStatRows,
  formatStaffStatPercent,
  sortStaffGuardStatRows,
  staffGuardStatSortLabel,
  type StaffGuardStatRow,
  type StaffGuardStatSortKey,
} from '../../lib/staffStats';
import { AppSegmentedControl } from '../ui/app/AppPrimitives';
import { useDevice } from '../../lib/platform';

type StatsTab = 'overview' | 'guards' | 'compare' | 'violations';

interface StaffStatsPanelProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  onOpenGuard?: (guardId: string) => void;
  onOpenViolations?: () => void;
}

const MAX_COMPARE = 4;

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <article className="staff-stats-metric-card">
      <p className="staff-stats-metric-label">{label}</p>
      <p className="staff-stats-metric-value">{value}</p>
      {sub ? <p className="staff-stats-metric-sub">{sub}</p> : null}
    </article>
  );
}

function BucketList({
  title,
  buckets,
  emptyLabel,
}: {
  title: string;
  buckets: Array<{ label: string; count: number }>;
  emptyLabel: string;
}) {
  const max = buckets[0]?.count ?? 1;
  return (
    <section className="staff-stats-bucket-card">
      <h3 className="staff-stats-section-title">{title}</h3>
      {buckets.length === 0 ? (
        <p className="staff-stats-empty-copy">{emptyLabel}</p>
      ) : (
        <ul className="staff-stats-bucket-list">
          {buckets.map((bucket) => (
            <li key={bucket.label} className="staff-stats-bucket-row">
              <div className="staff-stats-bucket-row-head">
                <span>{bucket.label}</span>
                <strong>{bucket.count}</strong>
              </div>
              <div className="staff-stats-bucket-bar" aria-hidden>
                <div
                  className="staff-stats-bucket-bar-fill"
                  style={{ width: `${Math.max(8, (bucket.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GuardTable({
  rows,
  selectedIds,
  onToggleSelect,
  onOpenGuard,
  showSelect,
}: {
  rows: StaffGuardStatRow[];
  selectedIds: Set<string>;
  onToggleSelect?: (guardId: string) => void;
  onOpenGuard?: (guardId: string) => void;
  showSelect?: boolean;
}) {
  const { formFactor } = useDevice();

  if (formFactor === 'desktop') {
    return (
      <table className="adm-table adm-table--list staff-stats-guard-table">
        <thead>
          <tr>
            {showSelect ? <th /> : null}
            <th>Guard</th>
            <th>Tier</th>
            <th>Rating</th>
            <th>On-time</th>
            <th>Jobs</th>
            <th>Open violations</th>
            <th>Total violations</th>
            <th>Disputes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.guardId}
              className="adm-table-row--click"
              onClick={() => onOpenGuard?.(row.guardId)}
            >
              {showSelect ? (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.guardId)}
                    onChange={() => onToggleSelect?.(row.guardId)}
                    aria-label={`Compare ${row.guardName}`}
                  />
                </td>
              ) : null}
              <td>
                <p className="adm-table-primary">{row.guardName}</p>
                <p className="adm-table-secondary">{row.badgeNumber}</p>
              </td>
              <td>{row.tier.name}</td>
              <td>{row.overallRating > 0 ? row.overallRating : '—'}</td>
              <td>{formatStaffStatPercent(row.onTimeRate)}</td>
              <td>{row.jobsCompleted}</td>
              <td className={row.openViolations > 0 ? 'staff-stats-cell-warn' : undefined}>
                {row.openViolations}
              </td>
              <td>{row.totalViolations}</td>
              <td>{row.disputesOpen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="staff-stats-guard-cards">
      {rows.map((row) => (
        <button
          key={row.guardId}
          type="button"
          className="staff-stats-guard-card"
          onClick={() => onOpenGuard?.(row.guardId)}
        >
          <div className="staff-stats-guard-card-head">
            {showSelect ? (
              <input
                type="checkbox"
                checked={selectedIds.has(row.guardId)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(row.guardId);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Compare ${row.guardName}`}
              />
            ) : null}
            <div>
              <p className="staff-stats-guard-card-name">{row.guardName}</p>
              <p className="staff-stats-guard-card-meta">
                {row.tier.name} · Rating {row.overallRating > 0 ? row.overallRating : '—'}
              </p>
            </div>
            <span className={row.openViolations > 0 ? 'staff-stats-pill-warn' : 'staff-stats-pill'}>
              {row.openViolations} open
            </span>
          </div>
          <div className="staff-stats-guard-card-grid">
            <span>On-time {formatStaffStatPercent(row.onTimeRate)}</span>
            <span>{row.jobsCompleted} jobs</span>
            <span>{row.totalViolations} violations</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function CompareTable({ rows }: { rows: StaffGuardStatRow[] }) {
  if (rows.length < 2) {
    return (
      <p className="staff-stats-empty-copy">
        Select at least two guards from the Guards tab or checkboxes below to compare side by side.
      </p>
    );
  }

  const metrics: Array<{ label: string; value: (row: StaffGuardStatRow) => string }> = [
    { label: 'Tier', value: (r) => r.tier.name },
    { label: 'Overall rating', value: (r) => (r.overallRating > 0 ? String(r.overallRating) : '—') },
    { label: 'Security score', value: (r) => (r.overallScore > 0 ? r.overallScore.toFixed(1) : '—') },
    { label: 'On-time rate', value: (r) => formatStaffStatPercent(r.onTimeRate) },
    { label: 'Jobs completed', value: (r) => String(r.jobsCompleted) },
    { label: 'Shifts sampled', value: (r) => String(r.shiftsSampled) },
    { label: 'Acceptance pts', value: (r) => String(r.acceptancePoints) },
    { label: 'Completion pts', value: (r) => String(r.completionPoints) },
    { label: 'On-time pts', value: (r) => String(r.onTimePoints) },
    { label: 'Quality pts', value: (r) => String(r.qualityPoints) },
    { label: 'Client rating pts', value: (r) => String(r.clientRatingPoints) },
    { label: 'Open violations', value: (r) => String(r.openViolations) },
    { label: 'Total violations', value: (r) => String(r.totalViolations) },
    { label: 'Shift audit flags', value: (r) => String(r.shiftAuditViolations) },
    { label: 'Client reports', value: (r) => String(r.clientReports) },
    { label: 'No-shows', value: (r) => String(r.noShows) },
    { label: 'Failed audits', value: (r) => String(r.failedAudits) },
    { label: 'Open disputes', value: (r) => String(r.disputesOpen) },
  ];

  return (
    <div className="staff-stats-compare-wrap">
      <table className="staff-stats-compare-table">
        <thead>
          <tr>
            <th>Metric</th>
            {rows.map((row) => (
              <th key={row.guardId}>{row.guardName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label}>
              <th scope="row">{metric.label}</th>
              {rows.map((row) => (
                <td key={`${metric.label}-${row.guardId}`}>{metric.value(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StaffStatsPanel({
  guards,
  requests,
  onOpenGuard,
  onOpenViolations,
}: StaffStatsPanelProps) {
  const { formFactor } = useDevice();
  const [tab, setTab] = useState<StatsTab>('overview');
  const [sortKey, setSortKey] = useState<StaffGuardStatSortKey>('rating-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fieldGuards = useMemo(() => guards.filter((g) => !g.isStaff), [guards]);
  const statRows = useMemo(() => buildStaffGuardStatRows(guards, requests), [guards, requests]);
  const sortedRows = useMemo(() => sortStaffGuardStatRows(statRows, sortKey), [statRows, sortKey]);
  const shiftViolations = useMemo(
    () => buildStaffShiftViolations(requests, fieldGuards),
    [requests, fieldGuards]
  );
  const summary = useMemo(
    () => buildStaffStatsPlatformSummary(statRows, shiftViolations),
    [statRows, shiftViolations]
  );
  const compareRows = useMemo(
    () => compareStaffGuardStatRows(statRows, [...selectedIds]),
    [statRows, selectedIds]
  );

  const toggleSelect = (guardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(guardId)) next.delete(guardId);
      else if (next.size < MAX_COMPARE) next.add(guardId);
      return next;
    });
  };

  const tabBar = (
    <AppSegmentedControl<StatsTab>
      value={tab}
      onChange={setTab}
      options={[
        { id: 'overview', label: 'Overview' },
        { id: 'guards', label: 'Guards' },
        { id: 'compare', label: 'Compare' },
        { id: 'violations', label: 'Violations' },
      ]}
    />
  );

  const overview = (
    <div className="staff-stats-panel-body">
      <div className="staff-stats-metric-grid">
        <MetricCard label="Field guards" value={String(summary.guardCount)} sub={`${summary.activeGuardCount} active`} />
        <MetricCard label="Avg overall rating" value={summary.avgOverallRating > 0 ? String(summary.avgOverallRating) : '—'} />
        <MetricCard label="Avg on-time rate" value={`${summary.avgOnTimeRate}%`} />
        <MetricCard label="Open violations" value={String(summary.totalOpenViolations)} sub={`${summary.guardsWithViolations} guards affected`} />
      </div>

      <div className="staff-stats-two-col">
        <BucketList
          title="Tier distribution"
          buckets={summary.tierDistribution.map((b) => ({ label: b.tierName, count: b.count }))}
          emptyLabel="No guard performance tiers yet."
        />
        <BucketList
          title="Violations by checkpoint"
          buckets={summary.violationsByCheckpoint}
          emptyLabel="No shift audit violations logged."
        />
      </div>

      <section className="staff-stats-leaderboard">
        <div className="staff-stats-section-head">
          <h3 className="staff-stats-section-title">Highest-rated guards</h3>
          <p className="staff-stats-section-sub">Tap a guard to open their profile and performance tab.</p>
        </div>
        <GuardTable
          rows={sortStaffGuardStatRows(statRows, 'rating-desc').slice(0, 5)}
          selectedIds={selectedIds}
          onOpenGuard={onOpenGuard}
        />
      </section>

      <section className="staff-stats-leaderboard">
        <div className="staff-stats-section-head">
          <h3 className="staff-stats-section-title">Most open violations</h3>
        </div>
        <GuardTable
          rows={sortStaffGuardStatRows(statRows, 'violations-desc').filter((r) => r.openViolations > 0).slice(0, 5)}
          selectedIds={selectedIds}
          onOpenGuard={onOpenGuard}
        />
      </section>
    </div>
  );

  const guardsView = (
    <div className="staff-stats-panel-body">
      <div className="staff-stats-toolbar">
        <label className="staff-stats-sort">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as StaffGuardStatSortKey)}
            className="uber-input"
          >
            {STAFF_GUARD_STAT_SORT_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {staffGuardStatSortLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <p className="staff-stats-toolbar-hint">
          {selectedIds.size > 0
            ? `${selectedIds.size} selected for compare`
            : 'Select guards to compare metrics side by side'}
        </p>
      </div>
      <GuardTable
        rows={sortedRows}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onOpenGuard={onOpenGuard}
        showSelect
      />
    </div>
  );

  const compareView = (
    <div className="staff-stats-panel-body">
      <div className="staff-stats-toolbar">
        <p className="staff-stats-toolbar-hint">
          Compare up to {MAX_COMPARE} guards across ratings, factor points, and violations.
        </p>
        {selectedIds.size > 0 ? (
          <button type="button" className="app-button-outline app-btn-sm" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </button>
        ) : null}
      </div>
      <CompareTable rows={compareRows} />
      <GuardTable
        rows={sortedRows}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        showSelect
      />
    </div>
  );

  const violationsView = (
    <div className="staff-stats-panel-body">
      <div className="staff-stats-metric-grid">
        <MetricCard label="Total violations" value={String(summary.totalViolations)} />
        <MetricCard label="Open violations" value={String(summary.totalOpenViolations)} />
        <MetricCard label="Guards with violations" value={String(summary.guardsWithViolations)} />
        <MetricCard
          label="Shift audit flags"
          value={String(shiftViolations.length)}
          sub={onOpenViolations ? 'Open violations inbox' : undefined}
        />
      </div>
      {onOpenViolations ? (
        <button type="button" className="app-button-outline app-btn-sm" onClick={onOpenViolations}>
          Open violations inbox
        </button>
      ) : null}
      <div className="staff-stats-two-col">
        <BucketList
          title="By source"
          buckets={summary.violationsBySource}
          emptyLabel="No violations by source."
        />
        <BucketList
          title="By category"
          buckets={summary.violationsByCategory}
          emptyLabel="No violations by category."
        />
      </div>
      <section className="staff-stats-leaderboard">
        <h3 className="staff-stats-section-title">Guards ranked by total violations</h3>
        <GuardTable
          rows={sortStaffGuardStatRows(statRows, 'violations-desc').filter((r) => r.totalViolations > 0)}
          selectedIds={selectedIds}
          onOpenGuard={onOpenGuard}
        />
      </section>
    </div>
  );

  const content =
    tab === 'overview'
      ? overview
      : tab === 'guards'
        ? guardsView
        : tab === 'compare'
          ? compareView
          : violationsView;

  if (formFactor === 'desktop') {
    return (
      <div className="adm-workbench staff-stats-workbench">
        <div className="adm-workbench-toolbar">
          <div>
            <p className="adm-card-eyebrow">Accountability</p>
            <p className="adm-card-title">Stats</p>
            <p className="adm-workbench-subtitle">
              Performance, violations, and guard comparisons across the platform.
            </p>
          </div>
        </div>
        <div className="staff-stats-tabbar">{tabBar}</div>
        {content}
      </div>
    );
  }

  return (
    <div className="staff-stats-mobile animate-fade-in -mx-4 sm:-mx-5 px-4 sm:px-5">
      <div className="staff-stats-mobile-head">
        <div className="staff-stats-mobile-title-row">
          <BarChart3 className="w-5 h-5 text-brand-primary" aria-hidden />
          <div>
            <h2 className="staff-stats-mobile-title">Stats</h2>
            <p className="staff-stats-mobile-sub">Performance, violations, and guard comparisons</p>
          </div>
        </div>
      </div>
      <div className="staff-stats-tabbar">{tabBar}</div>
      {content}
    </div>
  );
}
