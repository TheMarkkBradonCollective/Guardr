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
