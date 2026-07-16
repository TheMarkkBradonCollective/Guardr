import { showAppToast } from '../ui/AppToast';
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { SecurityGuard } from '../../types';
import {
  staffApproveVehicleBlocker,
  staffCanApproveVehicle,
  formatVehicleSummaryLine,
} from '../../lib/guardVehicle';
import { promptRejectGuardApplicationNote } from '../../lib/staffDocumentReview';

interface StaffVehicleReviewSectionProps {
  guard: SecurityGuard;
  canManage?: boolean;
  onApprove?: (guardId: string) => void | Promise<void>;
  onReject?: (guardId: string, reason?: string) => void | Promise<void>;
}

export function StaffVehicleReviewSection({
  guard,
  canManage = false,
  onApprove,
  onReject,
}: StaffVehicleReviewSectionProps) {
  const profile = guard.vehicleProfile;
  const [actionPending, setActionPending] = useState(false);
  if (!canManage || !profile || profile.status !== 'pending') return null;

  const blocker = staffApproveVehicleBlocker(guard);
  const canApprove = staffCanApproveVehicle(guard);

  return (
    <div className="space-y-3 border border-brand-border rounded-xl p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Vehicle review</p>
        <p className="font-semibold mt-1">{formatVehicleSummaryLine(profile)}</p>
      </div>
      {blocker ? (
        <p className="text-xs text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
          {blocker}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionPending || !canApprove}
          onClick={() => {
            setActionPending(true);
            void Promise.resolve(onApprove?.(guard.id)).finally(() => setActionPending(false));
          }}
          className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1.5 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          Approve vehicle
        </button>
        <button
          type="button"
          disabled={actionPending}
          onClick={() => {
            void (async () => {
              const reason = await promptRejectGuardApplicationNote();
              if (reason === null) return;
              setActionPending(true);
              try {
                await onReject?.(guard.id, reason);
              } finally {
                setActionPending(false);
              }
            })();
          }}
          className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Reject
        </button>
      </div>
    </div>
  );
}
