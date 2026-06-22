import React, { useState } from 'react';
import { AppModal } from '../ui/motion/AppMotion';

interface GuardActivityLogModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: string) => void;
}

export function GuardActivityLogModal({ open, onClose, onSubmit }: GuardActivityLogModalProps) {
  const [entry, setEntry] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = entry.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setEntry('');
    onClose();
  };

  return (
    <AppModal open={open} onClose={onClose} align="center" ariaLabelledBy="guard-activity-log-title" panelClassName="p-5 space-y-4">
      <h3 id="guard-activity-log-title" className="font-bold text-lg">
        Log shift activity
      </h3>
      <p className="text-sm text-brand-text-muted">This note is appended to the daily activity report for this job.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          className="uber-input w-full min-h-[120px] resize-y"
          placeholder="Patrol completed, visitor escorted, perimeter check…"
          required
          autoFocus
        />
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 app-button-outline !h-11 !text-sm">
            Cancel
          </button>
          <button type="submit" disabled={!entry.trim()} className="flex-1 app-button-primary !h-11 !text-sm disabled:opacity-50">
            Save entry
          </button>
        </div>
      </form>
    </AppModal>
  );
}
