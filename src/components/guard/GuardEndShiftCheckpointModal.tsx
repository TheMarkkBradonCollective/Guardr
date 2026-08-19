import React, { useState } from 'react';
import { Camera, Loader2, MapPin } from 'lucide-react';
import { OverlaySheetHeader } from '../baseui/overlays/OverlaySheetHeader';
import { GuardrButton } from '../baseui/GuardrButton';
import { AppModal } from '../ui/motion/AppMotion';
import { SlideToConfirm } from '../ui/SlideToConfirm';

interface GuardEndShiftCheckpointModalProps {
  open: boolean;
  onClose: () => void;
  onTriggerCamera: () => Promise<string | null>;
  existingReport?: string;
  onSubmit: (payload: {
    endSelfie?: string;
    locationPhoto?: string;
    dailyActivityReport: string;
    endSelfAuditSkipped: boolean;
    locationPhotoSkipped: boolean;
    endReportSkipped: boolean;
  }) => void;
  onSkip: () => void;
}

export function GuardEndShiftCheckpointModal({
  open,
  onClose,
  onTriggerCamera,
  existingReport,
  onSubmit,
  onSkip,
}: GuardEndShiftCheckpointModalProps) {
  const [endSelfie, setEndSelfie] = useState<string | undefined>();
  const [locationPhoto, setLocationPhoto] = useState<string | undefined>();
  const [report, setReport] = useState(existingReport ?? '');
  const [loading, setLoading] = useState<'selfie' | 'location' | null>(null);

  const capture = async (kind: 'selfie' | 'location') => {
    setLoading(kind);
    const url = await onTriggerCamera();
    if (url) {
      if (kind === 'selfie') setEndSelfie(url);
      else setLocationPhoto(url);
    }
    setLoading(null);
  };

  const handleSubmit = () => {
    const trimmed = report.trim();
    onSubmit({
      endSelfie,
      locationPhoto,
      dailyActivityReport: trimmed || 'Job completed. No incidents to report.',
      endSelfAuditSkipped: !endSelfie,
      locationPhotoSkipped: !locationPhoto,
      endReportSkipped: !trimmed,
    });
  };

  return (
    <AppModal open={open} position="absolute" zIndex={1003} onClose={onClose} ariaLabelledBy="end-shift-checkpoint-title">
      <OverlaySheetHeader titleId="end-shift-checkpoint-title" title="End of shift package" onClose={onClose} />

      <div className="uber-overlay-sheet-body space-y-5">
        <p className="text-xs uber-text-muted leading-relaxed">
          Optional end self-audit, location photo, and activity report. Skipping any item is allowed but will be
          automatically flagged for customer review.
        </p>

        <div>
          <p className="uber-label mb-2">End selfie (optional)</p>
          {endSelfie ? (
            <img src={endSelfie} alt="End selfie" className="w-full h-32 object-cover rounded-xl border border-brand-primary/30" />
          ) : (
            <button
              type="button"
              onClick={() => void capture('selfie')}
              disabled={loading !== null}
              className="w-full h-28 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2"
            >
              {loading === 'selfie' ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7 uber-text-muted" />}
              <span className="text-sm uber-text-muted">Capture end selfie</span>
            </button>
          )}
        </div>

        <div>
          <p className="uber-label mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Location photo (optional)
          </p>
          {locationPhoto ? (
            <img src={locationPhoto} alt="End location" className="w-full h-32 object-cover rounded-xl border border-brand-primary/30" />
          ) : (
            <button
              type="button"
              onClick={() => void capture('location')}
              disabled={loading !== null}
              className="w-full h-28 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2"
            >
              {loading === 'location' ? <Loader2 className="w-7 h-7 animate-spin" /> : <MapPin className="w-7 h-7 uber-text-muted" />}
              <span className="text-sm uber-text-muted">Photo of post / site</span>
            </button>
          )}
        </div>

        <div>
          <label className="uber-label mb-2 block" htmlFor="end-shift-report">
            End-of-shift report (optional)
          </label>
          <textarea
            id="end-shift-report"
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={4}
            className="uber-input w-full text-sm min-h-[88px] resize-y"
            placeholder="Summary of coverage, handoff notes, and anything the customer should know."
          />
        </div>

        <SlideToConfirm label="Slide to complete shift" confirmedLabel="Completing…" tone="success" onConfirm={handleSubmit} />
        <GuardrButton kind="secondary" onClick={onSkip} className="w-full">
          Skip all and end shift
        </GuardrButton>
      </div>
    </AppModal>
  );
}
