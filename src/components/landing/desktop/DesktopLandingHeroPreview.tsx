import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Home,
  Map,
  MapPin,
  MessagesSquare,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', active: false },
  { icon: Briefcase, label: 'Jobs', active: false },
  { icon: Map, label: 'Map', active: true },
  { icon: MessagesSquare, label: 'Messages', active: false },
  { icon: Users, label: 'Guards', active: false },
];

const JOBS = [
  { title: 'Retail patrol', meta: 'Tonight · 8 hrs', rate: '$28/hr', hot: true },
  { title: 'Event security', meta: 'Sat · 6 hrs', rate: '$32/hr', hot: false },
  { title: 'Corporate lobby', meta: 'Mon · 12 hrs', rate: '$26/hr', hot: false },
];

export function DesktopLandingHeroPreview() {
  return (
    <motion.div
      className="desktop-landing-preview"
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    >
      <div className="desktop-landing-preview-glow" />
      <div className="desktop-landing-preview-frame">
        <div className="desktop-landing-preview-chrome">
          <span className="desktop-landing-preview-dot desktop-landing-preview-dot--close" />
          <span className="desktop-landing-preview-dot desktop-landing-preview-dot--min" />
          <span className="desktop-landing-preview-dot desktop-landing-preview-dot--max" />
          <span className="desktop-landing-preview-url">app.guardr.com · Guard workspace</span>
        </div>

        <div className="desktop-landing-preview-body">
          <aside className="desktop-landing-preview-rail">
            <div className="desktop-landing-preview-rail-brand">
              <span className="desktop-landing-preview-logo">G</span>
              <span className="desktop-landing-preview-brand-text">Guardr</span>
            </div>
            <div className="desktop-landing-preview-rail-nav">
              {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`desktop-landing-preview-rail-item${
                    active ? ' desktop-landing-preview-rail-item--active' : ''
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.25 : 1.75} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="desktop-landing-preview-main">
            <div className="desktop-landing-preview-command">
              <div>
                <p className="desktop-landing-preview-command-eyebrow">Operations</p>
                <p className="desktop-landing-preview-command-title">Map</p>
              </div>
              <span className="desktop-landing-preview-live">Live</span>
            </div>

            <div className="desktop-landing-preview-workspace">
              <div className="desktop-landing-preview-map">
                <div className="desktop-landing-preview-map-grid" />
                <span className="desktop-landing-preview-pin desktop-landing-preview-pin--a" />
                <span className="desktop-landing-preview-pin desktop-landing-preview-pin--b" />
                <span className="desktop-landing-preview-pin desktop-landing-preview-pin--c desktop-landing-preview-pin--active">
                  <MapPin className="w-3 h-3" />
                </span>
                <div className="desktop-landing-preview-map-label">Open jobs near you</div>
              </div>

              <aside className="desktop-landing-preview-inspector">
                <p className="desktop-landing-preview-inspector-label">3 offers · Inspector</p>
                {JOBS.map((job) => (
                  <div
                    key={job.title}
                    className={`desktop-landing-preview-job${
                      job.hot ? ' desktop-landing-preview-job--hot' : ''
                    }`}
                  >
                    <div>
                      <p className="desktop-landing-preview-job-title">{job.title}</p>
                      <p className="desktop-landing-preview-job-meta">{job.meta}</p>
                    </div>
                    <span className="desktop-landing-preview-job-rate">{job.rate}</span>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
