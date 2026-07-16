import React, { useMemo, useState } from 'react';
import { Car, Loader2 } from 'lucide-react';
import type { GuardVehicleProfile, SecurityGuard } from '../../types';
import { US_STATES } from '../../lib/states';
import {
  formatVehicleSummaryLine,
  guardCanSaveVehicleDraft,
  guardCanSubmitVehicleForApproval,
  guardHasApprovedVehicle,
  guardVehicleAccessBlockedReason,
  VEHICLE_PHOTO_SLOTS,
} from '../../lib/guardVehicle';
import { guardVehicleInsuranceOnFile } from '../../lib/guardVehicleInsurance';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppScreen } from '../ui/app/AppPrimitives';
import { showAppToast } from '../ui/AppToast';

interface GuardVehiclePanelProps {
  guard: SecurityGuard;
  onSaveVehicle: (profile: Partial<GuardVehicleProfile> & { guardId: string }) => Promise<void>;
  onSubmitVehicle: (profile: Partial<GuardVehicleProfile> & { guardId: string }) => Promise<void>;
}

export function GuardVehiclePanel({ guard, onSaveVehicle, onSubmitVehicle }: GuardVehiclePanelProps) {
  const existing = guard.vehicleProfile;
  const [make, setMake] = useState(existing?.make ?? '');
  const [model, setModel] = useState(existing?.model ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [color, setColor] = useState(existing?.color ?? '');
  const [plateNumber, setPlateNumber] = useState(existing?.plateNumber ?? '');
  const [plateState, setPlateState] = useState(existing?.plateState ?? 'CA');
  const [frontPhotoUrl, setFrontPhotoUrl] = useState(existing?.frontPhotoUrl ?? '');
  const [leftSidePhotoUrl, setLeftSidePhotoUrl] = useState(existing?.leftSidePhotoUrl ?? '');
  const [rightSidePhotoUrl, setRightSidePhotoUrl] = useState(existing?.rightSidePhotoUrl ?? '');
  const [backPhotoUrl, setBackPhotoUrl] = useState(existing?.backPhotoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const draftProfile = useMemo(
    (): GuardVehicleProfile => ({
      id: existing?.id ?? `vehicle-${guard.id}`,
      guardId: guard.id,
      make: make.trim(),
      model: model.trim(),
      year: year.trim() || undefined,
      color: color.trim() || undefined,
      plateNumber: plateNumber.trim(),
      plateState: plateState.trim().toUpperCase(),
      frontPhotoUrl: frontPhotoUrl.trim() || undefined,
      leftSidePhotoUrl: leftSidePhotoUrl.trim() || undefined,
      rightSidePhotoUrl: rightSidePhotoUrl.trim() || undefined,
      backPhotoUrl: backPhotoUrl.trim() || undefined,
      vehicleInsurancePolicyId: guard.vehicleInsurancePolicy?.id,
      status: existing?.status ?? 'draft',
      rejectionReason: existing?.rejectionReason,
      submittedAt: existing?.submittedAt,
      reviewedAt: existing?.reviewedAt,
      reviewedBy: existing?.reviewedBy,
    }),
    [
      existing,
      guard.id,
      guard.vehicleInsurancePolicy?.id,
      make,
      model,
      year,
      color,
      plateNumber,
      plateState,
      frontPhotoUrl,
      leftSidePhotoUrl,
      rightSidePhotoUrl,
      backPhotoUrl,
    ]
  );

  const canSave = guardCanSaveVehicleDraft(draftProfile);
  const submitCheck = guardCanSubmitVehicleForApproval(guard, draftProfile);
  const approved = guardHasApprovedVehicle(guard);
  const accessBlockedReason = guardVehicleAccessBlockedReason(guard);
  const pending = existing?.status === 'pending';
  const locked = approved || pending || (existing?.status === 'verified' && Boolean(accessBlockedReason));

  const photoSetters: Record<string, (value: string) => void> = {
    front: setFrontPhotoUrl,
    left: setLeftSidePhotoUrl,
    right: setRightSidePhotoUrl,
    back: setBackPhotoUrl,
  };
  const photoValues: Record<string, string> = {
    front: frontPhotoUrl,
    left: leftSidePhotoUrl,
    right: rightSidePhotoUrl,
    back: backPhotoUrl,
  };

  const buildPayload = () => ({
    guardId: guard.id,
    make: make.trim(),
    model: model.trim(),
    year: year.trim() || undefined,
    color: color.trim() || undefined,
    plateNumber: plateNumber.trim(),
    plateState: plateState.trim().toUpperCase(),
    frontPhotoUrl: frontPhotoUrl.trim() || undefined,
    leftSidePhotoUrl: leftSidePhotoUrl.trim() || undefined,
    rightSidePhotoUrl: rightSidePhotoUrl.trim() || undefined,
    backPhotoUrl: backPhotoUrl.trim() || undefined,
    vehicleInsurancePolicyId: guard.vehicleInsurancePolicy?.id,
  });

  const handleSave = async () => {
    if (!canSave) {
      setFormError('Add at least one vehicle detail before saving.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSaveVehicle({ ...buildPayload(), status: 'draft' });
      showAppToast('Vehicle saved. You can submit for approval when ready.', { tone: 'success' });
    } catch {
      setFormError('Could not save vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!submitCheck.ok) {
      setFormError('reason' in submitCheck ? submitCheck.reason : 'Cannot submit vehicle yet.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmitVehicle({ ...buildPayload(), status: 'pending' });
      showAppToast('Vehicle submitted for staff approval.', { tone: 'success' });
    } catch {
      setFormError('Could not submit vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0">
      <div className="guard-tiered-screen-scroll p-4 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/15 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vehicle</h1>
            <p className="text-sm text-brand-text-muted mt-1">
              {approved
                ? 'Your vehicle is approved for driving priority shifts.'
                : accessBlockedReason
                  ? 'Vehicle details are on file, but driving access is paused until insurance is current.'
                  : pending
                    ? 'Your vehicle is pending staff review.'
                    : 'Save your vehicle anytime. Submit for approval once vehicle insurance is in Credentials.'}
            </p>
            {existing ? (
              <p className="text-xs text-brand-text-muted mt-2">{formatVehicleSummaryLine(existing)}</p>
            ) : null}
          </div>
        </div>

        {accessBlockedReason ? (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
            {accessBlockedReason}
          </p>
        ) : null}

        {existing?.status === 'rejected' && existing.rejectionReason ? (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
            {existing.rejectionReason}
          </p>
        ) : null}

        {!guardVehicleInsuranceOnFile(guard) ? (
          <p className="text-sm border border-brand-border rounded-lg px-3 py-2 text-brand-text-muted">
            Upload vehicle insurance in Credentials before you can submit this vehicle for approval. You can still save your vehicle details now.
          </p>
        ) : null}

        <div className="space-y-3">
          <label className="uber-label">Make</label>
          <input className="uber-input w-full" value={make} onChange={(e) => setMake(e.target.value)} disabled={locked} />
          <label className="uber-label">Model</label>
          <input className="uber-input w-full" value={model} onChange={(e) => setModel(e.target.value)} disabled={locked} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="uber-label">Year</label>
              <input className="uber-input w-full" value={year} onChange={(e) => setYear(e.target.value)} disabled={locked} />
            </div>
            <div>
              <label className="uber-label">Color</label>
              <input className="uber-input w-full" value={color} onChange={(e) => setColor(e.target.value)} disabled={locked} />
            </div>
          </div>
          <label className="uber-label">Plate state</label>
          <select className="uber-select w-full" value={plateState} onChange={(e) => setPlateState(e.target.value)} disabled={locked}>
            {US_STATES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <label className="uber-label">Plate number</label>
          <input className="uber-input w-full" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} disabled={locked} />
        </div>

        <div className="space-y-3">
          <p className="uber-label">Vehicle photos</p>
          {VEHICLE_PHOTO_SLOTS.map((slot) => (
            <DocumentPhotoUploadField
              key={slot.id}
              label={slot.label}
              imageUrl={photoValues[slot.id]}
              onImageUrlChange={photoSetters[slot.id]}
              disabled={locked}
            />
          ))}
        </div>

        {formError ? <p className="text-xs text-red-500">{formError}</p> : null}

        {!locked ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !canSave}
              className="app-button-outline !w-auto !h-10 !px-4 gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !submitCheck.ok}
              className="app-button-primary !w-auto !h-10 !px-4 gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit for approval
            </button>
          </div>
        ) : null}
      </div>
    </AppScreen>
  );
}
