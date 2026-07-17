import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { motion, useMotionValue, animate, type PanInfo } from 'motion/react';
import { Block } from 'baseui/block';
import { useStyletron } from 'baseui';
import { LabelSmall } from 'baseui/typography';
import { MOTION_DURATION, MOTION_EASING, motionDuration, prefersReducedMotion } from '../../theme/motionTokens';

export type AppCarouselProps = {
  children: ReactNode[];
  /** Visible slide index */
  index?: number;
  onIndexChange?: (index: number) => void;
  /** Gap between slides in px */
  gap?: number;
  /** Show dot indicators */
  showDots?: boolean;
  /** Show edge fade gradients */
  edgeFade?: boolean;
  /** Emphasize active slide with scale */
  activeScale?: number;
  /** Autoplay interval ms (0 = off) */
  autoplayMs?: number;
  /** Loop infinitely */
  loop?: boolean;
  /** aria-label for the carousel region */
  label?: string;
  className?: string;
};

export function AppCarousel({
  children,
  index: controlledIndex,
  onIndexChange,
  gap = 16,
  showDots = true,
  edgeFade = true,
  activeScale = 1,
  autoplayMs = 0,
  loop = false,
  label = 'Carousel',
  className,
}: AppCarouselProps) {
  const [, theme] = useStyletron();
  const slideCount = children.length;
  const [internalIndex, setInternalIndex] = useState(0);
  const index = controlledIndex ?? internalIndex;
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragX = useMotionValue(0);
  const reduced = prefersReducedMotion();
  const regionId = useId();

  const setIndex = useCallback(
    (next: number) => {
      let resolved = next;
      if (loop) {
        resolved = ((next % slideCount) + slideCount) % slideCount;
      } else {
        resolved = Math.max(0, Math.min(slideCount - 1, next));
      }
      if (controlledIndex === undefined) setInternalIndex(resolved);
      onIndexChange?.(resolved);
    },
    [controlledIndex, loop, onIndexChange, slideCount],
  );

  const scrollToIndex = useCallback(
    (target: number, instant = false) => {
      const el = slideRefs.current[target];
      const container = containerRef.current;
      if (!el || !container) return;
      const offset = el.offsetLeft - (container.clientWidth - el.clientWidth) / 2;
      container.scrollTo({
        left: offset,
        behavior: instant || reduced ? 'instant' : 'smooth',
      });
    },
    [reduced],
  );

  useEffect(() => {
    scrollToIndex(index, reduced);
  }, [index, reduced, scrollToIndex]);

  useEffect(() => {
    if (!autoplayMs || slideCount <= 1) return;
    const id = window.setInterval(() => {
      setIndex(index + 1);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, index, setIndex, slideCount]);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 48;
      const velocity = info.velocity.x;
      if (info.offset.x < -threshold || velocity < -400) {
        setIndex(index + 1);
      } else if (info.offset.x > threshold || velocity > 400) {
        setIndex(index - 1);
      }
      animate(dragX, 0, { duration: motionDuration(MOTION_DURATION.fast) / 1000 });
    },
    [dragX, index, setIndex],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(index + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIndex(slideCount - 1);
      }
    },
    [index, setIndex, slideCount],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (Math.abs(e.deltaX) < 8) return;
      e.preventDefault();
      setIndex(index + (e.deltaX > 0 ? 1 : -1));
    },
    [index, setIndex],
  );

  if (slideCount === 0) return null;

  return (
    <Block className={className} position="relative">
      {edgeFade && (
        <>
          <Block
            position="absolute"
            top="0"
            left="0"
            bottom="0"
            width="48px"
            overrides={{
              Block: {
                style: {
                  pointerEvents: 'none',
                  zIndex: 2,
                  background: `linear-gradient(90deg, ${theme.colors.backgroundPrimary} 0%, transparent 100%)`,
                },
              },
            }}
          />
          <Block
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            width="48px"
            overrides={{
              Block: {
                style: {
                  pointerEvents: 'none',
                  zIndex: 2,
                  background: `linear-gradient(270deg, ${theme.colors.backgroundPrimary} 0%, transparent 100%)`,
                },
              },
            }}
          />
        </>
      )}

      <motion.div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        id={regionId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        style={{
          display: 'flex',
          gap,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 0',
          outline: 'none',
        }}
        className="guardr-carousel-track"
      >
        {children.map((child, i) => {
          const isActive = i === index;
          const scale = activeScale !== 1 && isActive ? activeScale : 1;
          return (
            <motion.div
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slideCount}`}
              aria-hidden={!isActive}
              drag={reduced ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={isActive ? onDragEnd : undefined}
              style={{
                flex: '0 0 auto',
                scrollSnapAlign: 'center',
                x: isActive ? dragX : 0,
                scale,
                opacity: activeScale !== 1 && !isActive ? 0.72 : 1,
                transition: `transform ${MOTION_DURATION.normal}ms ${MOTION_EASING.enter}, opacity ${MOTION_DURATION.normal}ms ease`,
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>

      {showDots && slideCount > 1 && (
        <Block
          display="flex"
          justifyContent="center"
          gridGap="scale300"
          marginTop="scale400"
          role="tablist"
          aria-label={`${label} pagination`}
        >
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-controls={regionId}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? 20 : 8,
                height: 8,
                borderRadius: 9999,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: i === index ? theme.colors.accent : theme.colors.borderOpaque,
                transition: `width ${MOTION_DURATION.fast}ms ${MOTION_EASING.standard}, background ${MOTION_DURATION.fast}ms ease`,
              }}
            />
          ))}
        </Block>
      )}

      {slideCount > 1 && (
        <span className="sr-only" aria-live="polite">
          Slide {index + 1} of {slideCount}
        </span>
      )}
    </Block>
  );
}
