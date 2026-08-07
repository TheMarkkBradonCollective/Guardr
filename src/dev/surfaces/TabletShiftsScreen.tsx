import React, { useMemo, useState } from 'react';
import { Filter, Navigation, Radio } from 'lucide-react';
import {
  TabletButton,
  TabletCard,
  TabletCardGrid,
  TabletEmpty,
  TabletMasterList,
  TabletMetric,
  TabletScreen,
  TabletSidePanel,
  TabletSplitView,
  TabletTabs,
  TabletToolbar,
} from '../../surfaces/tablet/kit';
import {
  PREVIEW_SHIFTS,
  SHIFT_STATUS_LABEL,
  SHIFT_STATUS_TONE,
  type PreviewShift,
} from '../surfacePreviewData';

type Tab = 'live' | 'open' | 'scheduled' | 'closed';

function countIn(columnId: string): number {
  return PREVIEW_SHIFTS.filter((shift) => shift.columnId === columnId).length;
}

const TABS: { value: Tab; label: string; badge?: number }[] = [
  { value: 'live', label: 'Live', badge: countIn('live') },
  { value: 'open', label: 'Open', badge: countIn('open') },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'closed', label: 'Past' },
];

/**
 * Guard shifts — tablet.
 *
 * A master/detail split view: the list stays visible beside the detail so the
 * selected row keeps its context, with an underlined tab strip instead of the
 * mobile pill control and a docked side panel instead of a bottom sheet.
 *
 * This is not the mobile screen widened. There is no collapsing hero, no
 * pull-to-refresh, no floating action button, and no full-screen push — the
 * detail lives in a second column, so none of those affordances make sense here.
 */
export function TabletShiftsScreen() {
  const [tab, setTab] = useState<Tab>('live');
  const [selectedId, setSelectedId] = useState<string | null>(PREVIEW_SHIFTS[0].id);
  const [panelOpen, setPanelOpen] = useState(false);

  const shifts = useMemo(() => PREVIEW_SHIFTS.filter((shift) => shift.columnId === tab), [tab]);
  const selected = useMemo(
    () => shifts.find((shift) => shift.id === selectedId) ?? null,
    [shifts, selectedId],
  );

  return (
    <>
      <TabletScreen
        title="Shifts"
        subtitle={`Sacramento region · ${countIn('live')} live, ${countIn('open')} open`}
        actions={
          <TabletButton variant="secondary" icon={Filter} onClick={() => setPanelOpen(true)}>
            Filters
          </TabletButton>
        }
        toolbar={
          <TabletToolbar trailing={<TabletButton variant="ghost" icon={Radio}>Live map</TabletButton>}>
            <TabletTabs<Tab> tabs={TABS} value={tab} onChange={setTab} />
          </TabletToolbar>
        }
      >
        <TabletSplitView
          hasSelection={selected != null}
          onCloseDetail={() => setSelectedId(null)}
          detailTitle={selected?.site}
          listWidth={340}
          list={
            <TabletMasterList
              items={shifts.map((shift) => ({
                id: shift.id,
                title: shift.site,
                subtitle: `${shift.window} · ${shift.rate}`,
                meta: shift.payout,
                leading: <span className="sfp-avatar">{shift.guardInitials}</span>,
              }))}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyMessage="No shifts in this tab"
            />
          }
          placeholder={
            <TabletEmpty
              title="Select a shift"
              message="Pick a shift on the left to see its post orders, site contact, and payout breakdown here."
            />
          }
          detail={selected ? <ShiftDetail shift={selected} /> : null}
        />
      </TabletScreen>

      <TabletSidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Filters"
        subtitle="Narrow the shift list"
        width={400}
        footer={
          <>
            <TabletButton variant="ghost" onClick={() => setPanelOpen(false)}>
              Reset
            </TabletButton>
            <TabletButton onClick={() => setPanelOpen(false)}>Apply</TabletButton>
          </>
        }
      >
        <div className="sfp-panel-fields">
          <label className="sfp-field">
            <span>City</span>
            <select defaultValue="sacramento">
              <option value="sacramento">Sacramento</option>
              <option value="elk-grove">Elk Grove</option>
              <option value="folsom">Folsom</option>
            </select>
          </label>
          <label className="sfp-field">
            <span>Minimum rate</span>
            <input type="text" defaultValue="$24.00" />
          </label>
          <label className="sfp-field">
            <span>Post type</span>
            <select defaultValue="any">
              <option value="any">Any</option>
              <option value="armed">Armed only</option>
              <option value="unarmed">Unarmed only</option>
            </select>
          </label>
        </div>
      </TabletSidePanel>
    </>
  );
}

function ShiftDetail({ shift }: { shift: PreviewShift }) {
  return (
    <div className="sfp-tablet-detail">
      <header className="sfp-tablet-detail-head">
        <div>
          <h2>{shift.site}</h2>
          <p>
            {shift.city} · Job {shift.id}
          </p>
        </div>
        <span className="sfp-pill" data-tone={SHIFT_STATUS_TONE[shift.status]}>
          {SHIFT_STATUS_LABEL[shift.status]}
        </span>
      </header>

      <TabletCardGrid min={180}>
        <TabletMetric label="Window" value={shift.window.split(' ').slice(-3).join(' ')} />
        <TabletMetric label="Rate" value={shift.rate} />
        <TabletMetric label="Payout" value={shift.payout} tone="positive" delta="Net of platform fee" />
        <TabletMetric label="Post type" value={shift.armed ? 'Armed' : 'Unarmed'} />
      </TabletCardGrid>

      <TabletCardGrid min={280}>
        <TabletCard title="Assigned guard" meta={<span className="sfp-avatar">{shift.guardInitials}</span>}>
          <p className="sfp-muted">{shift.guard}</p>
          <p className="sfp-muted">BSIS 1284410 · verified 12 Mar</p>
        </TabletCard>
        <TabletCard title="Site contact">
          <p className="sfp-muted">Dispatch — (916) 555-0142</p>
          <p className="sfp-muted">Gate code 4417 · Dock A3</p>
        </TabletCard>
        <TabletCard
          title="Post orders"
          footer={<TabletButton variant="secondary" icon={Navigation}>Open orders</TabletButton>}
        >
          <p className="sfp-muted">4 sections · acknowledgement required on arrival.</p>
        </TabletCard>
      </TabletCardGrid>
    </div>
  );
}
