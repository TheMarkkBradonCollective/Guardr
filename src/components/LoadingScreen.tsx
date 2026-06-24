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

// Ten independent lightning bolts spread across the full screen width.
// Shorter cycle times (3.5–8 s) and staggered delays ensure strikes fire
// roughly every 0.5–1.5 s somewhere on screen — visibly chaotic.
// Coordinates are in a 0-100 × 0-100 SVG viewBox (preserveAspectRatio="none").
// vector-effect="non-scaling-stroke" keeps stroke width pixel-consistent.
const LIGHTNING_BOLTS = [
  {
    id: '1',
    main: 'M 5,0 L 1,9 L 10,18 L 3,29 L 13,40 L 2,51 L 12,62 L 1,74 L 11,85 L 0,97',
    branch: 'M 13,40 L 21,50 L 28,62 L 23,74',
    duration: '5s',
    delay: '0s',
    flashCx: '6',
    flashCy: '50',
  },
  {
    id: '2',
    main: 'M 25,0 L 20,11 L 30,22 L 18,34 L 29,45 L 17,57 L 28,68 L 16,80 L 27,92',
    branch: 'M 29,45 L 37,55 L 43,65 L 39,77',
    duration: '7s',
    delay: '1.4s',
    flashCx: '24',
    flashCy: '48',
  },
  {
    id: '3',
    main: 'M 48,0 L 43,10 L 53,21 L 41,33 L 52,44 L 39,56 L 51,67 L 38,79 L 50,92',
    branch: 'M 39,56 L 31,66 L 26,78 L 30,88',
    duration: '4.5s',
    delay: '2.1s',
    flashCx: '46',
    flashCy: '50',
  },
  {
    id: '4',
    main: 'M 68,0 L 73,12 L 63,23 L 72,35 L 62,46 L 71,58 L 61,70 L 70,82',
    branch: 'M 62,46 L 56,56 L 51,66 L 54,76',
    duration: '6s',
    delay: '0.6s',
    flashCx: '67',
    flashCy: '44',
  },
  {
    id: '5',
    main: 'M 88,0 L 83,11 L 92,22 L 82,34 L 91,46 L 81,58 L 90,70 L 79,82 L 89,94',
    branch: 'M 91,46 L 97,56 L 100,68',
    duration: '5.5s',
    delay: '3.2s',
    flashCx: '87',
    flashCy: '48',
  },
  {
    id: '6',
    main: 'M 14,5 L 19,16 L 10,28 L 18,40 L 9,52 L 17,64 L 7,76',
    branch: 'M 10,28 L 4,38 L 0,50',
    duration: '3.5s',
    delay: '1.8s',
    flashCx: '13',
    flashCy: '42',
  },
  {
    id: '7',
    main: 'M 36,0 L 31,13 L 40,26 L 29,39 L 39,52 L 28,64 L 38,76 L 26,90',
    branch: 'M 29,39 L 22,49 L 17,61 L 21,72',
    duration: '8s',
    delay: '4.0s',
    flashCx: '35',
    flashCy: '46',
  },
  {
    id: '8',
    main: 'M 57,2 L 63,14 L 54,26 L 62,38 L 53,50 L 61,62 L 51,74',
    branch: 'M 54,26 L 47,36 L 42,48',
    duration: '4s',
    delay: '2.7s',
    flashCx: '57',
    flashCy: '40',
  },
  {
    id: '9',
    main: 'M 78,0 L 73,14 L 82,28 L 72,42 L 81,56 L 71,70 L 80,84',
    branch: 'M 81,56 L 87,67 L 91,78 L 88,88',
    duration: '6.5s',
    delay: '5.3s',
    flashCx: '78',
    flashCy: '44',
  },
  {
    id: '10',
    main: 'M 95,3 L 98,16 L 92,29 L 97,43 L 90,57 L 96,71 L 89,85',
    branch: 'M 92,29 L 87,39 L 82,51',
    duration: '5s',
    delay: '0.9s',
    flashCx: '93',
    flashCy: '46',
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
            {/* Radial flash tints the background on each strike */}
            <div
              className="guardr-lightning-flash"
              style={{
                animationDuration: bolt.duration,
                animationDelay: bolt.delay,
                background: `radial-gradient(ellipse 90% 60% at ${bolt.flashCx}% ${bolt.flashCy}%, rgba(150,185,255,0.85), rgba(175,205,255,0.28) 45%, transparent 70%)`,
              }}
            />
            {/* Layered SVG: wide glow + bright core + dimmer branch */}
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
