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
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-brand-text-muted mt-1">Platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-4">
          <h3 className="font-semibold text-sm">Platform Fees</h3>
          <div>
            <label className="uber-label block mb-1">Fee per hour</label>
            <input type="number" defaultValue={PLATFORM_FEE_PER_HOUR} readOnly={currentUser.role !== 'director'} className="uber-input w-full" />
          </div>
          <div>
            <label className="uber-label block mb-1">Approval rules</label>
            <select className="uber-input w-full" defaultValue="staff-all">
              <option value="staff-all">All jobs require staff review</option>
              <option value="trusted">Trusted clients auto-open</option>
            </select>
          </div>
        </div>
      </div>

      <div className="wf-list-card flex-col items-stretch !flex !flex-col">
        <h3 className="font-semibold text-sm mb-3">Role Permissions</h3>
        <StaffRolesReference />
      </div>

      {showStaffOnboard && (
        <form onSubmit={handleOnboard} className="wf-list-card flex-col items-stretch !flex !flex-col gap-4">
          <h3 className="font-semibold text-sm">Onboard staff (Director)</h3>
          <p className="text-sm text-brand-text-muted">
            Staff accounts manage the platform only — they cannot accept field shifts. Field guards are separate sign-ups and cannot be promoted to staff.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="uber-label block mb-1">Full name</label>
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="uber-input w-full" />
            </div>
            <div>
              <label className="uber-label block mb-1">Email</label>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="uber-input w-full" />
            </div>
            <div>
              <label className="uber-label block mb-1">Badge number</label>
              <input type="text" placeholder="Badge number" value={badge} onChange={(e) => setBadge(e.target.value)} className="uber-input w-full" />
            </div>
            <div>
              <label className="uber-label block mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="uber-select w-full">
                <option value="Moderator">Moderator</option>
                <option value="Administrator">Administrator</option>
                <option value="Director">Director</option>
              </select>
            </div>
          </div>
          {msg && <p className="text-sm text-brand-primary">{msg}</p>}
          <button type="submit" className="app-button-primary !w-auto !h-10 !px-6">Create Staff Account</button>
        </form>
      )}
    </div>
  );
}
