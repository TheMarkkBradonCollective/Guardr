import React from 'react';

/**
 * Desktop skeletons.
 *
 * These mirror the operations centre silhouette: sidebar, top bar, toolbar, and
 * a table or dashboard grid. Because the desktop layout is fixed, the skeleton
 * can be an exact stand-in, so nothing shifts when data lands.
 */

export function DesktopSkeletonBlock({
  height = 12,
  width = '100%',
  radius = 4,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="sfd-skel"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        borderRadius: `${radius}px`,
      }}
      aria-hidden
    />
  );
}

export function DesktopSkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className="sfd-skel-metrics" role="status" aria-label="Loading metrics">
      {Array.from({ length: count }, (_, index) => (
        <div className="sfd-skel-metric" key={index}>
          <DesktopSkeletonBlock height={10} width="52%" />
          <DesktopSkeletonBlock height={24} width="38%" />
          <DesktopSkeletonBlock height={10} width="66%" />
        </div>
      ))}
    </div>
  );
}

export function DesktopSkeletonTable({ rows = 12, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="sfd-skel-table" role="status" aria-label="Loading table">
      <div className="sfd-skel-table-head" style={{ ['--sfd-skel-cols' as string]: `${columns}` }}>
        {Array.from({ length: columns }, (_, index) => (
          <DesktopSkeletonBlock key={index} height={9} width="58%" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          className="sfd-skel-table-row"
          key={rowIndex}
          style={{ ['--sfd-skel-cols' as string]: `${columns}` }}
        >
          {Array.from({ length: columns }, (_, cellIndex) => (
            <DesktopSkeletonBlock
              key={cellIndex}
              height={11}
              width={`${42 + ((rowIndex + cellIndex) % 5) * 11}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Whole-surface placeholder used while the desktop module resolves. */
export function DesktopSkeletonScreen() {
  return (
    <div className="sfd-skel-screen" role="status" aria-label="Loading">
      <div className="sfd-skel-screen-sidebar">
        <DesktopSkeletonBlock height={26} width="60%" radius={6} />
        {Array.from({ length: 12 }, (_, index) => (
          <DesktopSkeletonBlock key={index} height={14} width={`${58 + (index % 4) * 10}%`} />
        ))}
      </div>
      <div className="sfd-skel-screen-main">
        <div className="sfd-skel-screen-topbar">
          <DesktopSkeletonBlock height={14} width={180} />
          <DesktopSkeletonBlock height={26} width={240} radius={6} />
        </div>
        <div className="sfd-skel-screen-body">
          <DesktopSkeletonMetrics count={4} />
          <DesktopSkeletonTable rows={10} columns={6} />
        </div>
      </div>
    </div>
  );
}
