import React, { useState } from 'react';
import type { SecurityRequest } from '../../types';
import { RefreshCw, Loader2 } from 'lucide-react';

interface ReplacementRequestPanelProps {
  request: SecurityRequest;
  onRequestReplacement: (requestId: string, reasonNote?: string) => void | Promise<void>;
  busy?: boolean;
}

export function ReplacementRequestPanel({
  request,
  onRequestReplacement,
  busy = false,
}: ReplacementRequestPanelProps) {
  const [note, setNote] = useState('');
  const repl = request.replacementRequest;

  if (repl?.status === 'offering') {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 space-y-1">
        <p className="text-sm font-medium text-amber-300">Finding replacement guard</p>
        <p className="text-xs text-brand-text-muted">
          {repl.offeredGuardIds.length} qualified guard
          {repl.offeredGuardIds.length === 1 ? '' : 's'} notified — first to accept gets the mission.
        </p>
      </div>
    );
  }

  if (repl?.status === 'filled') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
        <p className="text-sm font-medium text-emerald-400">Replacement guard assigned</p>
        <p className="text-xs text-brand-text-muted mt-1">A new guard accepted this mission.</p>
      </div>
    );
  }

  const canRequest =
    (request.status === 'accepted' || request.status === 'in-progress') &&
    !!request.assignedGuardId;

  if (!canRequest) return null;

  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg-sec/60 p-3 space-y-3">
      <div>
        <p className="text-sm font-semibold flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-brand-primary" />
          Request replacement guard
        </p>
        <p className="text-xs text-brand-text-muted mt-1">
          Notify nearby qualified guards. The first to accept is auto-assigned — no extra approval needed.
        </p>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (call-off, emergency, etc.)"
        rows={2}
        className="uber-input w-full text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void onRequestReplacement(request.id, note.trim() || undefined)}
        className="app-button-primary app-btn-md w-full gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Request replacement
      </button>
    </div>
  );
}
