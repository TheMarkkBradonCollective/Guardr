import React, { useState } from 'react';
import { Camera, Loader2, MapPin } from 'lucide-react';
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
      <div className="sticky top-0 bg-brand-surface border-b border-brand-border px-5 py-4 flex items-center justify-between rounded-t-[1.25rem]">
        <p id="end-shift-checkpoint-title" className="font-semibold text-brand-primary">
          End of shift package
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-brand-text-muted hover:text-brand-text text-lg">
          ×
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Optional end self-audit, location photo, and activity report. Skipping any item is allowed but will be
          automatically flagged for client review.
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
              {loading === 'selfie' ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7 text-brand-text-muted" />}
              <span className="text-sm text-brand-text-muted">Capture end selfie</span>
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
              {loading === 'location' ? <Loader2 className="w-7 h-7 animate-spin" /> : <MapPin className="w-7 h-7 text-brand-text-muted" />}
              <span className="text-sm text-brand-text-muted">Photo of post / site</span>
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
            className="app-input w-full text-sm"
            placeholder="Summary of coverage, handoff notes, and anything the client should know."
          />
        </div>

        <SlideToConfirm label="Slide to complete shift" confirmedLabel="Completing…" tone="success" onConfirm={handleSubmit} />
        <button
          type="button"
          onClick={onSkip}
          className="app-button-outline app-btn-md w-full text-amber-700 dark:text-amber-400 border-amber-500/40"
        >
          Skip all and end shift
        </button>
      </div>
    </AppModal>
  );
}
