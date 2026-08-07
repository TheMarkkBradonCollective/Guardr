import React, { useMemo, useState } from 'react';
import { Bell, Check, MapPin, Navigation, Plus, Search, X } from 'lucide-react';
import {
  MobileButton,
  MobileCard,
  MobileEmpty,
  MobileFab,
  MobileListRow,
  MobilePullToRefresh,
  MobileScreen,
  MobileSection,
  MobileSegmented,
  MobileSheet,
  MobileSkeletonRows,
  MobileStat,
  MobileSwipeRow,
} from '../../surfaces/mobile/kit';
import {
  PREVIEW_SHIFTS,
  SHIFT_STATUS_LABEL,
  SHIFT_STATUS_TONE,
  type PreviewShift,
} from '../surfacePreviewData';

type Filter = 'live' | 'open' | 'scheduled' | 'closed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'open', label: 'Open' },
  { value: 'scheduled', label: 'Next' },
  { value: 'closed', label: 'Past' },
];

/**
 * Guard shifts — mobile.
 *
 * One scrolling column with a collapsing hero title, a pill segmented filter,
 * pull-to-refresh, swipe-to-act rows, a floating action button, and a bottom
 * sheet for detail. Nothing is presented in a second column because there is no
 * room for one, and every target clears 48px.
 *
 * Compare with `TabletShiftsScreen` and `DesktopShiftsScreen`: same feature, same
 * data, three unrelated structures.
 */
export function MobileShiftsScreen() {
  const [filter, setFilter] = useState<Filter>('live');
  const [selected, setSelected] = useState<PreviewShift | null>(null);
  const [loading, setLoading] = useState(false);

  const shifts = useMemo(
    () => PREVIEW_SHIFTS.filter((shift) => shift.columnId === filter),
    [filter],
  );

  const refresh = async () => {
    setLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setLoading(false);
  };

  const live = PREVIEW_SHIFTS.find((shift) => shift.status === 'in-progress');

  return (
    <>
      <MobileScreen
        title="Shifts"
        subtitle={`Sacramento · ${PREVIEW_SHIFTS.filter((shift) => shift.columnId === 'live').length} live now`}
        actions={
          <>
            <button type="button" className="sfm-icon-btn" aria-label="Search shifts">
              <Search size={22} strokeWidth={2.25} aria-hidden />
            </button>
            <button type="button" className="sfm-icon-btn" aria-label="Notifications">
              <Bell size={22} strokeWidth={2.25} aria-hidden />
            </button>
          </>
        }
        toolbar={<MobileSegmented<Filter> options={FILTERS} value={filter} onChange={setFilter} ariaLabel="Shift filter" />}
        actionBar={<MobileButton icon={Navigation}>Start next shift</MobileButton>}
        fab={<MobileFab label="Post availability" icon={Plus} onClick={() => undefined} />}
      >
        <MobilePullToRefresh onRefresh={refresh}>
          {live ? (
            <MobileSection>
              <MobileCard accent onClick={() => setSelected(live)}>
                <p className="sfp-live-label">On shift now</p>
                <p className="sfp-live-site">{live.site}</p>
                <p className="sfp-live-window">{live.window}</p>
                <div className="sfp-live-stats">
                  <MobileStat label="Elapsed" value="4h 12m" />
                  <MobileStat label="Earned" value="$117.60" />
                </div>
              </MobileCard>
            </MobileSection>
          ) : null}

          <MobileSection>
            {loading ? (
              <MobileSkeletonRows rows={5} />
            ) : shifts.length === 0 ? (
              <MobileEmpty
                title="Nothing here"
                message="Open shifts near you appear on the map first. Pull to refresh."
                icon={MapPin}
              />
            ) : (
              shifts.map((shift) => (
                <MobileSwipeRow
                  key={shift.id}
                  actions={[
                    { label: 'Accept', icon: Check, tone: 'positive', onAction: () => setSelected(shift) },
                    { label: 'Hide', icon: X, tone: 'danger', onAction: () => undefined },
                  ]}
                >
                  <MobileListRow
                    title={shift.site}
                    subtitle={`${shift.window} · ${shift.rate}`}
                    meta={shift.payout}
                    onClick={() => setSelected(shift)}
                    status={
                      <span className="sfp-pill" data-tone={SHIFT_STATUS_TONE[shift.status]}>
                        {SHIFT_STATUS_LABEL[shift.status]}
                      </span>
                    }
                  />
                </MobileSwipeRow>
              ))
            )}
          </MobileSection>
        </MobilePullToRefresh>

      </MobileScreen>

      <MobileSheet
        open={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.site ?? ''}
        subtitle={selected ? `${selected.city} · Job ${selected.id}` : undefined}
        snapPoints={['half', 'full']}
        footer={<MobileButton icon={Navigation}>Navigate to site</MobileButton>}
      >
        {selected ? (
          <div className="sfp-sheet-detail">
            <div className="sfp-sheet-stats">
              <MobileStat label="Window" value={selected.window.split(' ').slice(-3).join(' ')} />
              <MobileStat label="Rate" value={selected.rate} />
              <MobileStat label="Payout" value={selected.payout} />
            </div>
            <MobileListRow title="Guard" subtitle={selected.guard} chevron={false} />
            <MobileListRow
              title="Armed post"
              subtitle={selected.armed ? 'Exposed firearm permit required' : 'Unarmed'}
              chevron={false}
            />
            <MobileListRow title="Post orders" subtitle="4 sections · acknowledge on arrival" onClick={() => undefined} />
            <MobileListRow title="Site contact" subtitle="Dispatch — (916) 555-0142" onClick={() => undefined} />
          </div>
        ) : null}
      </MobileSheet>
    </>
  );
}
