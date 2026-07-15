import React, { useState } from 'react';
import type { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import { Zap, Loader2 } from 'lucide-react';

interface ReplacementOfferCardProps {
  request: SecurityRequest;
  onAccept: (requestId: string) => void | Promise<void>;
}

export function ReplacementOfferCard({ request, onAccept }: ReplacementOfferCardProps) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(request.id);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="rounded-xl border border-brand-primary/40 bg-brand-primary/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Zap className="w-5 h-5 text-brand-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold">Emergency replacement offer</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            First to accept gets this mission — {request.title}
          </p>
          <p className="text-xs text-brand-text-muted">{formatShiftRange(request.startDate, request.endDate)}</p>
        </div>
      </div>
      {request.replacementRequest?.reasonNote && (
        <p className="text-xs text-brand-text-muted border-l-2 border-brand-primary/40 pl-2">
          {request.replacementRequest.reasonNote}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleAccept()}
        disabled={accepting}
        className="app-button-primary app-btn-md w-full gap-2"
      >
        {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        Accept mission
      </button>
    </div>
  );
}
