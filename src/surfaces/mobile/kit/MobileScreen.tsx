import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export interface MobileScreenProps {
  /** Large title that collapses into the header band on scroll. */
  title?: string;
  subtitle?: string;
  /** Back affordance. Omit for a root tab screen. */
  onBack?: () => void;
  backLabel?: string;
  /** Icon buttons on the right of the header band. */
  actions?: React.ReactNode;
  /**
   * Filter row (segmented control, chips). Sits below the large title and pins
   * under the header band once the title collapses.
   */
  toolbar?: React.ReactNode;
  /** Sticky bottom CTA area. Sits above the tab bar. */
  actionBar?: React.ReactNode;
  /**
   * Floating action button. Passed as a prop rather than placed in `children` so
   * it stays outside the scroll container and clears the action bar.
   */
  fab?: React.ReactNode;
  /** Content runs under the header to the screen edges (maps, media). */
  bleed?: boolean;
  /** Suppresses the header entirely for immersive screens. */
  hideHeader?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Scroll distance after which the large title has fully collapsed. */
const COLLAPSE_DISTANCE = 48;

/**
 * The mobile app's page container.
 *
 * A single scrolling column between a 56px header band and the tab bar. The large
 * title starts inline with the content and moves into the header band as you
 * scroll; the filter row follows it down and then pins under the band. That
 * ordering — title first, filters second — is what makes the screen read as a
 * native app rather than a web page with a toolbar bolted on top.
 */
export function MobileScreen({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  actions,
  toolbar,
  actionBar,
  fab,
  bleed = false,
  hideHeader = false,
  children,
  className,
}: MobileScreenProps) {
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const onScroll = useCallback(() => {
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const top = scrollRef.current?.scrollTop ?? 0;
      setCollapsed(top > COLLAPSE_DISTANCE);
    });
  }, []);

  const showHeader = !hideHeader && (Boolean(title) || Boolean(onBack) || Boolean(actions));

  return (
    <section
      className={`sfm-screen${className ? ` ${className}` : ''}`}
      data-bleed={bleed ? 'true' : undefined}
      data-action-bar={actionBar ? 'true' : undefined}
    >
      {showHeader ? (
        <header className="sfm-screen-head" data-collapsed={collapsed ? 'true' : undefined}>
          <div className="sfm-screen-head-row">
            {onBack ? (
              <button type="button" className="sfm-icon-btn" onClick={onBack} aria-label={backLabel}>
                <ChevronLeft size={24} strokeWidth={2.25} aria-hidden />
              </button>
            ) : (
              <span className="sfm-screen-head-spacer" aria-hidden />
            )}
            <h1 className="sfm-screen-head-title" aria-hidden={!collapsed}>
              {title}
            </h1>
            <div className="sfm-screen-head-actions">{actions}</div>
          </div>
        </header>
      ) : null}

      <div
        className="sfm-screen-scroll"
        ref={scrollRef}
        onScroll={showHeader ? onScroll : undefined}
        data-bleed={bleed ? 'true' : undefined}
      >
        {showHeader && title ? (
          <div className="sfm-screen-hero">
            <h2 className="sfm-screen-hero-title">{title}</h2>
            {subtitle ? <p className="sfm-screen-hero-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}
        {toolbar ? <div className="sfm-screen-toolbar">{toolbar}</div> : null}
        <div className="sfm-screen-content">{children}</div>
      </div>

      {fab}
      {actionBar ? <div className="sfm-screen-action-bar">{actionBar}</div> : null}
    </section>
  );
}

/** Grouped block with an optional heading and trailing link. */
export function MobileSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`sfm-section${className ? ` ${className}` : ''}`}>
      {title || action ? (
        <div className="sfm-section-head">
          {title ? <h3 className="sfm-section-title">{title}</h3> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
