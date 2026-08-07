import React from 'react';

/**
 * Mobile skeletons.
 *
 * Every mobile screen shows a skeleton with the same silhouette as its loaded
 * state, so content lands in place instead of shifting. The shimmer honours
 * `prefers-reduced-motion` through CSS rather than a JS check.
 */

export function MobileSkeletonBlock({
  height = 16,
  width = '100%',
  radius = 8,
  className,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      className={`sfm-skel${className ? ` ${className}` : ''}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        borderRadius: `${radius}px`,
      }}
      aria-hidden
    />
  );
}

/** Matches the silhouette of `MobileListRow`. */
export function MobileSkeletonRows({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="sfm-skel-rows" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div className="sfm-skel-row" key={index}>
          {avatar ? <MobileSkeletonBlock height={40} width={40} radius={999} /> : null}
          <span className="sfm-skel-row-text">
            <MobileSkeletonBlock height={14} width={`${64 - (index % 3) * 8}%`} />
            <MobileSkeletonBlock height={12} width={`${44 - (index % 2) * 10}%`} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Matches the silhouette of `MobileCard`. */
export function MobileSkeletonCards({ cards = 3 }: { cards?: number }) {
  return (
    <div className="sfm-skel-cards" role="status" aria-label="Loading">
      {Array.from({ length: cards }, (_, index) => (
        <div className="sfm-skel-card" key={index}>
          <MobileSkeletonBlock height={12} width="32%" />
          <MobileSkeletonBlock height={22} width="62%" />
          <MobileSkeletonBlock height={12} width="88%" />
        </div>
      ))}
    </div>
  );
}

/** Whole-screen placeholder used while a surface module or route resolves. */
export function MobileSkeletonScreen({ withHero = true }: { withHero?: boolean }) {
  return (
    <div className="sfm-skel-screen" role="status" aria-label="Loading">
      <div className="sfm-skel-screen-head">
        <MobileSkeletonBlock height={28} width={28} radius={999} />
        <MobileSkeletonBlock height={14} width="34%" />
      </div>
      {withHero ? (
        <div className="sfm-skel-screen-hero">
          <MobileSkeletonBlock height={30} width="58%" />
          <MobileSkeletonBlock height={14} width="40%" />
        </div>
      ) : null}
      <MobileSkeletonCards cards={2} />
      <MobileSkeletonRows rows={4} />
    </div>
  );
}
