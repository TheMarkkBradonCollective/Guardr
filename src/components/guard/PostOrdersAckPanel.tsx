import React from 'react';
import type { SecurityRequest } from '../../types';
import { hasListingPostOrders } from '../../lib/jobListing';
import { jobRequiresPostOrdersAck } from '../../lib/postOrdersAck';
import { SlideToConfirm } from '../ui/SlideToConfirm';

interface PostOrdersAckPanelProps {
  job: SecurityRequest;
  guardId: string;
  onAcknowledge: () => void | Promise<void>;
}

export function PostOrdersAckPanel({ job, guardId, onAcknowledge }: PostOrdersAckPanelProps) {
  if (!jobRequiresPostOrdersAck(job, guardId)) return null;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
      <div>
        <h3 className="font-bold text-sm">Review post orders before your shift</h3>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          The client posted site instructions and orders. Acknowledge you have read them before clocking in.
        </p>
      </div>
      {job.siteInstructions?.trim() && (
        <div className="text-sm whitespace-pre-wrap rounded-xl bg-brand-bg-sec border border-brand-border p-3">
          {job.siteInstructions}
        </div>
      )}
      {job.uniformRequirements?.trim() && (
        <p className="text-xs"><span className="font-semibold">Uniform:</span> {job.uniformRequirements}</p>
      )}
      {job.equipmentRequirements?.trim() && (
        <p className="text-xs"><span className="font-semibold">Equipment:</span> {job.equipmentRequirements}</p>
      )}
      <SlideToConfirm label="I have read the post orders" onConfirm={() => void onAcknowledge()} />
    </div>
  );
}

export function hasPostOrdersContent(job: Pick<SecurityRequest, 'siteInstructions' | 'uniformRequirements' | 'equipmentRequirements'>): boolean {
  return hasListingPostOrders(job);
}
