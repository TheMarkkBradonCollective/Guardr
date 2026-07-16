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

const TABS = [
  { icon: Home, label: 'Home' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Map, label: 'Map', active: true },
  { icon: MessagesSquare, label: 'Messages' },
  { icon: Users, label: 'Guards' },
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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1 }}
      aria-hidden
    >
      <div className="desktop-landing-preview-frame dsk-preview-app">
        <div className="dsk-preview-topbar">
          <span className="dsk-preview-logo">G</span>
          <div className="dsk-preview-tabs">
            {TABS.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={`dsk-preview-tab${active ? ' dsk-preview-tab--active' : ''}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="dsk-preview-subheader">
          <div>
            <p className="dsk-preview-sub-eyebrow">Workspace</p>
            <p className="dsk-preview-sub-title">Map</p>
          </div>
          <span className="dsk-preview-live">Live</span>
        </div>

        <div className="dsk-preview-body">
          <div className="dsk-preview-map">
            <div className="dsk-preview-map-grid" />
            <span className="dsk-preview-pin dsk-preview-pin--a" />
            <span className="dsk-preview-pin dsk-preview-pin--b" />
            <span className="dsk-preview-pin dsk-preview-pin--c dsk-preview-pin--active">
              <MapPin className="w-3 h-3" />
            </span>
          </div>
          <aside className="dsk-preview-inspector">
            <p className="dsk-preview-inspector-label">3 offers</p>
            {JOBS.map((job) => (
              <div
                key={job.title}
                className={`dsk-preview-job${job.hot ? ' dsk-preview-job--hot' : ''}`}
              >
                <div>
                  <p className="dsk-preview-job-title">{job.title}</p>
                  <p className="dsk-preview-job-meta">{job.meta}</p>
                </div>
                <span className="dsk-preview-job-rate">{job.rate}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
