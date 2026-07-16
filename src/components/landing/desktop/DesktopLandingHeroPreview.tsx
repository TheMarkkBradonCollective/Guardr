import React from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Home,
  Map,
  MessagesSquare,
  Search,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

const MENU = [
  { icon: Home, label: 'Dashboard', active: true, badge: 3 },
  { icon: Briefcase, label: 'Jobs' },
  { icon: Map, label: 'Map' },
  { icon: MessagesSquare, label: 'Messages' },
  { icon: Users, label: 'Guards' },
];

const METRICS = [
  { label: 'Active jobs', value: '12' },
  { label: 'Guards on site', value: '8' },
  { label: 'Open shifts', value: '4' },
];

const ROWS = [
  { id: 'GR-1042', site: 'Retail patrol', status: 'Live', tone: 'success' },
  { id: 'GR-1038', site: 'Event security', status: 'Pending', tone: 'warn' },
  { id: 'GR-1031', site: 'Corporate lobby', status: 'Scheduled', tone: 'neutral' },
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
      <div className="desktop-landing-preview-frame dsk-preview-admin">
        <aside className="dsk-preview-sidebar">
          <div className="dsk-preview-brand">
            <span className="dsk-preview-logo">G</span>
            <span className="dsk-preview-wordmark">
              Guard<span className="dsk-preview-accent">r</span>
            </span>
          </div>
          <p className="dsk-preview-section">Menu</p>
          <nav className="dsk-preview-nav">
            {MENU.map(({ icon: Icon, label, active, badge }) => (
              <span
                key={label}
                className={`dsk-preview-nav-item${active ? ' dsk-preview-nav-item--active' : ''}`}
              >
                <Icon className="w-3 h-3" />
                {label}
                {badge != null ? <span className="dsk-preview-badge">{badge}</span> : null}
              </span>
            ))}
          </nav>
          <p className="dsk-preview-section">Account</p>
          <span className="dsk-preview-nav-item">
            <Shield className="w-3 h-3" />
            Profile
          </span>
        </aside>

        <div className="dsk-preview-main">
          <header className="dsk-preview-header">
            <span className="dsk-preview-search">
              <Search className="w-3 h-3" />
              Search jobs, guards, sites…
            </span>
            <span className="dsk-preview-header-actions">
              <span className="dsk-preview-avatar">S</span>
              <Settings className="w-3 h-3" />
            </span>
          </header>

          <div className="dsk-preview-hero">
            <div>
              <p className="dsk-preview-hero-title">Dashboard</p>
              <p className="dsk-preview-hero-sub">Welcome to Client workspace</p>
            </div>
          </div>

          <div className="dsk-preview-content">
            <div className="dsk-preview-grid">
              <div className="dsk-preview-card dsk-preview-card--welcome">
                <div>
                  <p className="dsk-preview-card-eyebrow">Welcome back</p>
                  <p className="dsk-preview-card-title">Operations console</p>
                  <span className="dsk-preview-btn">View more</span>
                </div>
                <div className="dsk-preview-welcome-art">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <div className="dsk-preview-card">
                <div className="dsk-preview-stat-row">
                  <div>
                    <p className="dsk-preview-stat-value">12</p>
                    <p className="dsk-preview-stat-label">Active coverage</p>
                    <p className="dsk-preview-stat-delta">+ 8% from last week</p>
                  </div>
                  <span className="dsk-preview-ring">72%</span>
                </div>
              </div>

              <div className="dsk-preview-card">
                <p className="dsk-preview-card-heading">Coverage status</p>
                <ul className="dsk-preview-metrics">
                  {METRICS.map((m) => (
                    <li key={m.label}>
                      <span className="dsk-preview-metric-icon">
                        <Briefcase className="w-3 h-3" />
                      </span>
                      <span>
                        <p className="dsk-preview-metric-label">{m.label}</p>
                        <p className="dsk-preview-metric-value">{m.value}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dsk-preview-card dsk-preview-card--wide">
                <p className="dsk-preview-card-heading">Latest jobs</p>
                <table className="dsk-preview-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Site</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.site}</td>
                        <td>
                          <span className={`dsk-preview-pill dsk-preview-pill--${row.tone}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
