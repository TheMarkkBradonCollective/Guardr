import React, { useState } from 'react';
import type { Client, SecurityGuard, SecurityRequest, SupportTicket } from '../../types';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffAnalyticsPanel } from './StaffAnalyticsPanel';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { StaffSlaDashboard } from './StaffSlaDashboard';

type AnalyticsInsightsTab = 'sla' | 'platform';

interface StaffAnalyticsInsightsPanelProps {
  guards: SecurityGuard[];
  clients: Client[];
  requests: SecurityRequest[];
  tickets?: SupportTicket[];
  showFinancials: boolean;
}

export function StaffAnalyticsInsightsPanel({
  guards,
  clients,
  requests,
  tickets = [],
  showFinancials,
}: StaffAnalyticsInsightsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const [tab, setTab] = useState<AnalyticsInsightsTab>('sla');
  const isDesktop = formFactor === 'desktop';

  const tabBar = (
    <StaffListFilterTabs
      aria-label="Analytics views"
      activeId={tab}
      onChange={(id) => setTab(id as AnalyticsInsightsTab)}
      tabs={[
        { id: 'sla', label: 'SLA & operations' },
        { id: 'platform', label: 'Platform analytics' },
      ]}
    />
  );

  const content =
    tab === 'sla' ? (
      <StaffSlaDashboard requests={requests} guards={guards} clients={clients} tickets={tickets} />
    ) : (
      <StaffAnalyticsPanel
        guards={guards}
        clients={clients}
        requests={requests}
        showFinancials={showFinancials}
      />
    );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel"
        toolbar={<WorkbenchToolbar eyebrow="Insights" subtitle="SLA metrics and platform analytics." />}
      >
        {tabBar}
        {content}
      </StaffOpsPageShell>
    );
  }

  return (
    <StaffOpsPageShell className="staff-mgmt-panel staff-roster-panel">
      {tabBar}
      {content}
    </StaffOpsPageShell>
  );
}
