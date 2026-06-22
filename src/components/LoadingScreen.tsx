import React from 'react';
import { BadgeCheck, MapPin, Shield } from 'lucide-react';
import { Logo } from './Logo';

const LANE_PRACTICALS = [Shield, MapPin, BadgeCheck] as const;

export function LoadingScreen() {
  return (
    <div className="guardr-loading-screen" role="status" aria-live="polite" aria-label="Loading Guardr">
      <div className="guardr-loading-ambient" aria-hidden="true">
        <span className="guardr-loading-orb guardr-loading-orb--a" />
        <span className="guardr-loading-orb guardr-loading-orb--b" />
        <span className="guardr-loading-orb guardr-loading-orb--c" />
      </div>

      <div className="guardr-loading-core">
        <div className="guardr-loading-logo-wrap">
          <Logo size={56} className="guardr-loading-logo" />
        </div>
        <p className="guardr-loading-brand">Guardr</p>
        <p className="guardr-loading-caption">Loading your workspace…</p>

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
