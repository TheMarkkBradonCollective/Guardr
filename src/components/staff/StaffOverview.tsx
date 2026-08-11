import React from 'react';
import {
  OpsActivityItem,
  OverviewActionItem,
  OverviewLiveJob,
  OverviewNavigationSelection,
  PlatformStats,
  StaffSection,
} from '../../lib/staffOps';
import { PlatformRole, Client, SecurityGuard, SecurityRequest } from '../../types';
import { StaffOverviewDesktop } from './StaffOverviewDesktop';

interface StaffOverviewProps {
  stats: PlatformStats;
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  clients: Client[];
  activityFeed: OpsActivityItem[];
  actionItems: OverviewActionItem[];
  liveJobs: OverviewLiveJob[];
  weeklyTrend: number[];
  onNavigate: (section: StaffSection, selection?: OverviewNavigationSelection) => void;
  onOpenJob?: (jobId: string) => void;
  canUpdateJobs?: boolean;
  staffName: string;
  staffRole: PlatformRole;
}

/** Staff overview — responsive Guardr Direct (desktop) + Guardr mobile (PWA/APK). */
export function StaffOverview(props: StaffOverviewProps) {
  return (
    <StaffOverviewDesktop
      stats={props.stats}
      requests={props.requests}
      guards={props.guards}
      clients={props.clients}
      activityFeed={props.activityFeed}
      actionItems={props.actionItems}
      liveJobs={props.liveJobs}
      onNavigate={props.onNavigate}
      onOpenJob={props.onOpenJob}
      canUpdateJobs={props.canUpdateJobs}
      staffRole={props.staffRole}
    />
  );
}
