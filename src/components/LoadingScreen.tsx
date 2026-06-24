import React from 'react';
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

// Five independent lightning bolts spread across the screen.
// Each bolt has a main zigzag channel + a short branch fork.
// Coordinates live in a 0-100 x 0-100 SVG viewBox that maps to full-screen
// via preserveAspectRatio="none"; vector-effect="non-scaling-stroke" keeps
// strokes at a consistent pixel width regardless of viewport stretch.
const LIGHTNING_BOLTS = [
  {
    id: 'a',
    main: 'M 28,0 L 24,14 L 30,28 L 22,44 L 28,58 L 20,74 L 25,90',
    branch: 'M 22,44 L 32,56 L 36,68',
    duration: '8s',
    delay: '0s',
    flashCx: '25',
    flashCy: '45',
  },
  {
    id: 'b',
    main: 'M 74,0 L 78,16 L 71,30 L 77,46 L 69,62 L 75,78 L 67,92',
    branch: 'M 77,46 L 68,58 L 63,70',
    duration: '10s',
    delay: '3.1s',
    flashCx: '72',
    flashCy: '48',
  },
  {
    id: 'c',
    main: 'M 42,0 L 38,12 L 44,24 L 36,38 L 43,52 L 34,66',
    branch: 'M 43,52 L 50,63 L 54,72',
    duration: '7s',
    delay: '1.7s',
    flashCx: '40',
    flashCy: '40',
  },
  {
    id: 'd',
    main: 'M 88,2 L 84,16 L 90,28 L 83,42 L 89,56',
    branch: 'M 90,28 L 95,38 L 97,48',
    duration: '9s',
    delay: '5.4s',
    flashCx: '87',
    flashCy: '32',
  },
  {
    id: 'e',
    main: 'M 8,0 L 12,16 L 6,30 L 11,46 L 5,62 L 10,78',
    branch: 'M 11,46 L 16,57 L 20,66',
    duration: '11s',
    delay: '6.8s',
    flashCx: '10',
    flashCy: '48',
  },
];

export function LoadingScreen() {
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
        {LIGHTNING_BOLTS.map((bolt) => (
          <React.Fragment key={`lightning-${bolt.id}`}>
            {/* Full-screen radial flash that illuminates the background and particles */}
            <div
              className="guardr-lightning-flash"
              style={{
                animationDuration: bolt.duration,
                animationDelay: bolt.delay,
                background: `radial-gradient(ellipse 90% 60% at ${bolt.flashCx}% ${bolt.flashCy}%, rgba(200,230,255,0.55), rgba(180,215,255,0.12) 45%, transparent 70%)`,
              }}
            />
            {/* The bolt itself: glow layer + bright core + dimmer branch */}
            <svg
              className="guardr-lightning-bolt"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ animationDuration: bolt.duration, animationDelay: bolt.delay }}
              aria-hidden="true"
            >
              <path d={bolt.main} className="guardr-lightning-glow" />
              <path d={bolt.branch} className="guardr-lightning-glow guardr-lightning-branch" />
              <path d={bolt.main} className="guardr-lightning-core" />
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
