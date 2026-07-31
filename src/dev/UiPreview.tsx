/**
 * Dev-only visual harness for the Uber Base shell.
 *
 * Renders the signed-in chrome (icon rail, workspace header, page band,
 * sidebar, bottom nav) with static data so layout work can be reviewed on
 * every surface without a live session. Loaded only when running the dev
 * server with `?ui-preview=1`; the production bundle drops it.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CreditCard,
  FileText,
  Map,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { GuardrDrawerShell } from '../components/baseui/layout/GuardrDrawerShell';
import { UberDataTable, type UberTableColumn } from '../components/baseui/UberDataTable';
import { StatusChip } from '../components/baseui/StatusChip';
import { GuardrButton } from '../components/baseui/GuardrButton';
import {
  WorkbenchPanel,
  WorkbenchSearchRow,
  WorkbenchTabBar,
} from '../components/baseui/layout/WorkbenchLayout';

interface Row {
  id: string;
  site: string;
  guard: string;
  window: string;
  rate: string;
  status: 'On time' | 'Late' | 'In progress' | 'Completed' | 'No show';
}

const ROWS: Row[] = [
  { id: '2131256835', site: 'Portage Distribution — Dock A3', guard: 'Marcus T.', window: '08:00 – 16:00', rate: '$28.00/hr', status: 'On time' },
  { id: '4901238031', site: 'Harbor Logistics — Gate 2', guard: 'Janelle R.', window: '09:00 – 17:00', rate: '$24.00/hr', status: 'In progress' },
  { id: '0219831134', site: 'Civic Center Plaza', guard: 'Andre P.', window: '10:00 – 18:00', rate: '$31.50/hr', status: 'Late' },
  { id: '1298013254', site: 'Riverside Warehouse', guard: 'Dana K.', window: '12:00 – 20:00', rate: '$26.00/hr', status: 'Completed' },
  { id: '4890879031', site: 'Northgate Retail', guard: 'Unassigned', window: '18:00 – 02:00', rate: '$29.75/hr', status: 'No show' },
];

const STATUS_TONE = {
  'On time': 'positive',
  'In progress': 'info',
  Late: 'negative',
  Completed: 'neutral',
  'No show': 'negative',
} as const;

const COLUMNS: UberTableColumn<Row>[] = [
  { id: 'id', header: 'Job ID', render: (row) => row.id, numeric: true },
  { id: 'site', header: 'Site', render: (row) => row.site, grow: true },
  { id: 'guard', header: 'Guard', render: (row) => row.guard },
  { id: 'window', header: 'Coverage window', render: (row) => row.window, numeric: true },
  { id: 'rate', header: 'Rate', render: (row) => row.rate, numeric: true, align: 'right' },
  {
    id: 'status',
    header: 'Status',
    render: (row) => <StatusChip tone={STATUS_TONE[row.status]}>{row.status}</StatusChip>,
  },
];

const NAV_GROUPS = [
  {
    items: [
      { id: 'home', label: 'Home', icon: Shield },
      { id: 'map', label: 'Live map', icon: Map },
      { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: 3 },
      { id: 'schedule', label: 'Schedule', icon: CalendarDays },
      { id: 'guards', label: 'Guards', icon: Users },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    title: 'Messages',
    items: [{ id: 'messages', label: 'Messages', icon: MessageSquare, badge: 12 }],
  },
  {
    title: 'Management',
    items: [
      { id: 'billing', label: 'Billing', icon: CreditCard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function UiPreview() {
  const [activeNavId, setActiveNavId] = useState('jobs');
  const [tab, setTab] = useState<'scheduled' | 'unassigned' | 'past'>('scheduled');
  const [search, setSearch] = useState('');

  const rows = ROWS.filter((row) =>
    search ? `${row.site} ${row.guard} ${row.id}`.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <GuardrDrawerShell
      workspaceLabel="Bay Area Operations"
      title="Jobs"
      pageBreadcrumb="Operations"
      navGroups={NAV_GROUPS}
      activeNavId={activeNavId}
      onNavigate={setActiveNavId}
      accountMenu={<div className="uber-preview-avatar">AB</div>}
      mobileBottomNavItems={NAV_GROUPS[0].items.slice(0, 4)}
      mobileBottomNavOverflow={NAV_GROUPS[0].items.slice(4)}
      pageActions={
        <>
          <GuardrButton kind="secondary" size="compact">
            Export
          </GuardrButton>
          <GuardrButton kind="primary" size="compact">
            Post a job
          </GuardrButton>
        </>
      }
    >
      <WorkbenchTabBar<'scheduled' | 'unassigned' | 'past'>
        items={[
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'unassigned', label: 'Unassigned' },
          { id: 'past', label: 'Past' },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id)}
      />
      <WorkbenchSearchRow
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search jobs"
        actions={
          <GuardrButton kind="primary" size="compact">
            Filters
          </GuardrButton>
        }
      />
      <WorkbenchPanel padding={false}>
        <UberDataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          caption="Scheduled jobs"
          emptyMessage="No jobs match this search."
        />
      </WorkbenchPanel>
    </GuardrDrawerShell>
  );
}
