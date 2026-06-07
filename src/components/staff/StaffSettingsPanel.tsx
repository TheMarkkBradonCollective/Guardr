import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import { StaffRolesReference } from './RolePermissionsGuide';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  showStaffOnboard: boolean;
  onAddStaffProfile: (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => Promise<void>;
}

export function StaffSettingsPanel({ currentUser, showStaffOnboard, onAddStaffProfile }: StaffSettingsPanelProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [badge, setBadge] = useState('');
  const [role, setRole] = useState<'Director' | 'Administrator' | 'Moderator'>('Moderator');
  const [msg, setMsg] = useState('');

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !badge) { setMsg('All fields required.'); return; }
    try {
      await onAddStaffProfile(name, email, badge, role);
      setMsg('Staff profile created.');
      setName(''); setEmail(''); setBadge('');
    } catch {
      setMsg('Failed to onboard staff.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">System Settings</h1>
        <p className="text-xs font-mono text-brand-text-muted mt-1 uppercase">Platform configuration · Sage green system-wide</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="staff-ops-card space-y-4">
          <h3 className="font-black text-sm">Platform Fees</h3>
          <div>
            <label className="text-[10px] font-mono uppercase text-brand-text-muted">Fee per hour</label>
            <input type="number" defaultValue={PLATFORM_FEE_PER_HOUR} readOnly={currentUser.role !== 'director'} className="uber-input mt-1 w-full" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-brand-text-muted">Approval rules</label>
            <select className="uber-input mt-1 w-full" defaultValue="staff-all">
              <option value="staff-all">All jobs require staff review</option>
              <option value="trusted">Trusted clients auto-open</option>
            </select>
          </div>
        </div>

        <div className="staff-ops-card space-y-4">
          <h3 className="font-black text-sm">Incident Thresholds</h3>
          <div>
            <label className="text-[10px] font-mono uppercase text-brand-text-muted">Auto-escalate at severity</label>
            <select className="uber-input mt-1 w-full" defaultValue="high">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-brand-text-muted">Notifications</label>
            <select className="uber-input mt-1 w-full" defaultValue="all">
              <option value="all">All incidents & disputes</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="staff-ops-card">
        <h3 className="font-black text-sm mb-3">Role Permissions</h3>
        <StaffRolesReference />
      </div>

      {showStaffOnboard && (
        <form onSubmit={handleOnboard} className="staff-ops-card space-y-4">
          <h3 className="font-black text-sm">Onboard Staff (Director)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="uber-input" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="uber-input" />
            <input type="text" placeholder="Badge number" value={badge} onChange={(e) => setBadge(e.target.value)} className="uber-input" />
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="uber-select">
              <option value="Moderator">Moderator</option>
              <option value="Administrator">Administrator</option>
              <option value="Director">Director</option>
            </select>
          </div>
          {msg && <p className="text-xs font-mono text-brand-primary">{msg}</p>}
          <button type="submit" className="staff-ops-btn-primary">Create Staff Account</button>
        </form>
      )}
    </div>
  );
}
