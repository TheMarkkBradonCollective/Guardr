import React, { useState } from 'react';
import { BadgeCheck, MapPin, Shield } from 'lucide-react';
import { Logo } from './Logo';

const LANE_PRACTICALS = [Shield, MapPin, BadgeCheck] as const;

const LOADING_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 37 + 13) % 94 + 3}%`,
  top: `${(i * 29 + 19) % 90 + 5}%`,
  delay: `${((i * 0.43) % 6).toFixed(2)}s`,
  duration: `${(5 + (i % 6)).toFixed(1)}s`,
  size: 2 + (i % 4),
}));

// ── Lightning path generation ────────────────────────────────
type Pt = [number, number];

// Build a jagged polyline from (sx,sy) to roughly (ex,ey).
// At each step, jitter perpendicular to the main axis so the bolt
// zigzags like real stepped-leader lightning.
function buildBoltPts(
  sx: number, sy: number,
  ex: number, ey: number,
  steps: number,
  chaos: number,
): Pt[] {
  const pts: Pt[] = [[sx, sy]];
  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Unit perpendicular axis
  const px = -dy / len;
  const py =  dx / len;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const bx = sx + dx * t;
    const by = sy + dy * t;
    // Jitter shrinks slightly toward the endpoint so the bolt converges
    const jitter = (Math.random() - 0.5) * chaos * 2 * (1 - t * 0.35);
    pts.push([bx + px * jitter, by + py * jitter]);
  }
  return pts;
}

function ptsToPath(pts: Pt[]): string {
  return 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
}

interface BoltConfig {
  id: string;
  main: string;
  branch: string;
  duration: string;
  delay: string;
  flashCx: string;
  flashCy: string;
}

// Generates `count` fully random bolts fresh on every call.
// Start edges: 70% top (like cloud discharge), 15% left, 15% right.
// Direction: ±50° from straight-down so bolts can be diagonal or near-horizontal.
// Branches fork from an actual node on the main channel so they visually connect.
function generateBolts(count: number): BoltConfig[] {
  return Array.from({ length: count }, (_, i) => {
    // Random start edge
    const edge = Math.random();
    let sx: number, sy: number;
    if (edge < 0.70) {
      sx = Math.random() * 110 - 5;   // top edge (slight overhang allowed)
      sy = Math.random() * 12 - 5;
    } else if (edge < 0.85) {
      sx = Math.random() * 12 - 5;    // left edge
      sy = Math.random() * 55;
    } else {
      sx = 95 + Math.random() * 10;   // right edge
      sy = Math.random() * 55;
    }

    // Direction: mostly downward but anything from -50° to +50° from vertical
    const angleDeg = (Math.random() - 0.5) * 100;
    const angleRad = (angleDeg * Math.PI) / 180;
    const length = 40 + Math.random() * 60;
    const ex = sx + Math.sin(angleRad) * length;
    const ey = sy + Math.cos(angleRad) * length;

    const steps = 7 + Math.floor(Math.random() * 5);   // 7–11 nodes
    const chaos = 5 + Math.random() * 8;               // jitter magnitude

    const mainPts = buildBoltPts(sx, sy, ex, ey, steps, chaos);
    const main = ptsToPath(mainPts);

    // Fork a branch from a real node on the main path so it connects cleanly
    const nodeIdx = 2 + Math.floor(Math.random() * Math.max(1, mainPts.length - 4));
    const [bx0, by0] = mainPts[nodeIdx];
    const branchAngleDeg = angleDeg + (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 40);
    const branchAngleRad = (branchAngleDeg * Math.PI) / 180;
    const branchLen = 15 + Math.random() * 30;
    const bex = bx0 + Math.sin(branchAngleRad) * branchLen;
    const bey = by0 + Math.cos(branchAngleRad) * branchLen;
    const branchPts = buildBoltPts(
      bx0, by0, bex, bey,
      3 + Math.floor(Math.random() * 3),
      chaos * 0.7,
    );
    const branch = ptsToPath(branchPts);

    const flashCx = Math.max(0, Math.min(100, (sx + ex) / 2));
    const flashCy = Math.max(0, Math.min(100, (sy + ey) / 2));

    return {
      id: String(i + 1),
      main,
      branch,
      duration: `${(3.5 + Math.random() * 4.5).toFixed(1)}s`,
      delay:    `${(Math.random() * 6).toFixed(2)}s`,
      flashCx:  flashCx.toFixed(0),
      flashCy:  flashCy.toFixed(0),
    };
  });
}

export function LoadingScreen() {
  // Lazy initializer runs once on mount — fresh random bolts every page load
  const [bolts] = useState<BoltConfig[]>(() => generateBolts(10));

  return (
    <div className="guardr-loading-screen" role="status" aria-live="polite" aria-label="Loading Guardr">
      <div className="guardr-loading-ambient" aria-hidden="true">
        <span className="guardr-loading-orb guardr-loading-orb--a" />
        <span className="guardr-loading-orb guardr-loading-orb--b" />
        <span className="guardr-loading-orb guardr-loading-orb--c" />
        <span className="guardr-loading-orb guardr-loading-orb--d" />
        <span className="guardr-loading-orb guardr-loading-orb--e" />
        {LOADING_PARTICLES.map((particle, index) => (
          <span
            key={index}
            className="guardr-loading-particle"
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}

        {/* Lightning storm: flash overlay + bolt SVG per strike */}
        {bolts.map((bolt) => (
          <React.Fragment key={`lightning-${bolt.id}`}>
            {/* Radial flash tints background with logo sage-green on each strike */}
            <div
              className="guardr-lightning-flash"
              style={{
                animationDuration: bolt.duration,
                animationDelay: bolt.delay,
                background: `radial-gradient(ellipse 90% 60% at ${bolt.flashCx}% ${bolt.flashCy}%, rgba(156,175,136,0.85), rgba(175,190,160,0.28) 45%, transparent 70%)`,
              }}
            />
            {/* Layered SVG: wide corona + bright core + dimmer branch */}
            <svg
              className="guardr-lightning-bolt"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ animationDuration: bolt.duration, animationDelay: bolt.delay }}
              aria-hidden="true"
            >
              <path d={bolt.main}   className="guardr-lightning-glow" />
              <path d={bolt.branch} className="guardr-lightning-glow guardr-lightning-branch" />
              <path d={bolt.main}   className="guardr-lightning-core" />
              <path d={bolt.branch} className="guardr-lightning-core guardr-lightning-branch" />
            </svg>
          </React.Fragment>
        ))}
      </div>

      <div className="guardr-loading-core">
        <div className="guardr-loading-logo-wrap">
          <Logo size={64} className="guardr-loading-logo" />
        </div>
        <p className="guardr-loading-brand">Guardr</p>
        <p className="guardr-loading-caption">Anytime. Anywhere.</p>

        <div className="guardr-loading-lane" aria-hidden="true">
          <div className="guardr-loading-lane-track" />
          <div className="guardr-loading-lane-shimmer" />
          {LANE_PRACTICALS.map((Icon, index) => (
            <span key={index} className="guardr-loading-lane-practical">
              <span
                className="guardr-loading-lane-practical-icon"
                style={{ animationDelay: `${index * 0.55}s` }}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
