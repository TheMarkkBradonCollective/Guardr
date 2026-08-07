import React from 'react';

/**
 * Tablet skeletons.
 *
 * These mirror the tablet's split-view silhouette rather than the mobile stack:
 * a master column of rows next to a detail column of blocks, so the loading state
 * already shows the page's two-column shape.
 */

export function TabletSkeletonBlock({
  height = 16,
  width = '100%',
  radius = 6,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="sft-skel"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        borderRadius: `${radius}px`,
      }}
      aria-hidden
    />
  );
}

export function TabletSkeletonMaster({ rows = 8 }: { rows?: number }) {
  return (
    <div className="sft-skel-master" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div className="sft-skel-master-row" key={index}>
          <TabletSkeletonBlock height={36} width={36} radius={999} />
          <span className="sft-skel-master-text">
            <TabletSkeletonBlock height={13} width={`${70 - (index % 3) * 10}%`} />
            <TabletSkeletonBlock height={11} width={`${50 - (index % 2) * 12}%`} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function TabletSkeletonDetail() {
  return (
    <div className="sft-skel-detail" role="status" aria-label="Loading">
      <TabletSkeletonBlock height={24} width="46%" />
      <TabletSkeletonBlock height={13} width="30%" />
      <div className="sft-skel-detail-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="sft-skel-detail-metric" key={index}>
            <TabletSkeletonBlock height={11} width="60%" />
            <TabletSkeletonBlock height={22} width="45%" />
          </div>
        ))}
      </div>
      <TabletSkeletonBlock height={13} width="90%" />
      <TabletSkeletonBlock height={13} width="82%" />
      <TabletSkeletonBlock height={13} width="66%" />
    </div>
  );
}

export function TabletSkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="sft-skel-grid" role="status" aria-label="Loading">
      {Array.from({ length: cards }, (_, index) => (
        <div className="sft-skel-grid-card" key={index}>
          <TabletSkeletonBlock height={11} width="36%" />
          <TabletSkeletonBlock height={26} width="58%" />
          <TabletSkeletonBlock height={11} width="80%" />
        </div>
      ))}
    </div>
  );
}

/** Whole-surface placeholder used while the tablet module resolves. */
export function TabletSkeletonScreen() {
  return (
    <div className="sft-skel-screen" role="status" aria-label="Loading">
      <div className="sft-skel-screen-rail">
        {Array.from({ length: 8 }, (_, index) => (
          <TabletSkeletonBlock key={index} height={38} radius={10} />
        ))}
      </div>
      <div className="sft-skel-screen-main">
        <TabletSkeletonBlock height={26} width="34%" />
        <TabletSkeletonGrid cards={4} />
        <TabletSkeletonMaster rows={5} />
      </div>
    </div>
  );
}
