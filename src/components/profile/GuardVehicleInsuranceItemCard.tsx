import React, { useState } from 'react';
import { Car } from 'lucide-react';
import type { GuardVehicleInsurancePolicy, SecurityGuard } from '../../types';
import {
  getVehicleInsuranceUploadStatus,
  guardVehicleInsuranceOnFile,
  resolveVehicleInsuranceStatus,
  VEHICLE_INSURANCE_STATUS_LABELS,
} from '../../lib/guardVehicleInsurance';
import { guardHasDriversLicenseOnFile } from '../../lib/guardVehicle';
import { GuardVehicleInsuranceUploadSheet } from './GuardVehicleInsuranceUploadSheet';

interface GuardVehicleInsuranceItemCardProps {
  guard: SecurityGuard;
  editing?: boolean;
  onSave?: (policy: Partial<GuardVehicleInsurancePolicy> & { guardId: string }) => Promise<void>;
}

export function GuardVehicleInsuranceItemCard({
  guard,
  editing = false,
  onSave,
}: GuardVehicleInsuranceItemCardProps) {
  const [showUpload, setShowUpload] = useState(false);
  if (!guardHasDriversLicenseOnFile(guard) && !guard.vehicleInsurancePolicy) {
    return null;
  }

  const policy = guard.vehicleInsurancePolicy;
  const hasOnFile = guardVehicleInsuranceOnFile(guard);
  const uploadStatus = getVehicleInsuranceUploadStatus(guard);
  const status = policy ? resolveVehicleInsuranceStatus(policy) : 'not_submitted';
  const canEdit = editing && !!onSave;

  return (
    <>
      <div className="app-cert-item">
        <div className="app-cert-item-body min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-snug break-words">
                {policy?.carrier?.trim() || 'Vehicle insurance'}
              </p>
              <p className="text-xs text-brand-text-muted mt-1 break-words">
                {policy?.policyNumber?.trim()
                  ? `#${policy.policyNumber.trim()}`
                  : 'Auto insurance for patrol and driving work'}
              </p>
              <p className="text-xs text-brand-text-muted mt-1">
                {hasOnFile ? VEHICLE_INSURANCE_STATUS_LABELS[status] : 'Not on file'}
                {uploadStatus === 'listed' ? ' · upload document to finish' : ''}
              </p>
            </div>
          </div>
        </div>
        {canEdit ? (
          <button
            type="button"
            className="app-button-outline !w-auto !h-8 !px-3 !text-xs shrink-0"
            onClick={() => setShowUpload(true)}
          >
            {hasOnFile ? 'Update' : 'Add'}
          </button>
        ) : null}
      </div>

      {onSave ? (
        <GuardVehicleInsuranceUploadSheet
          guard={guard}
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}
