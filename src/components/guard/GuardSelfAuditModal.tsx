import React, { useState } from 'react';
import { Check, Camera, Loader2, MapPin } from 'lucide-react';
import { SELF_AUDIT_PHOTO_LABELS, SelfAuditPhotoKind } from '../../lib/selfAuditPhotos';
import { OverlaySheetHeader } from '../baseui/overlays/OverlaySheetHeader';
import { AppModal } from '../ui/motion/AppMotion';
import { SlideToConfirm } from '../ui/SlideToConfirm';

interface GuardSelfAuditModalProps {
  open: boolean;
  onSubmit: (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
    uniformPhoto?: string;
    shoesPhoto?: string;
    locationPhoto?: string;
    locationPhotoSkipped: boolean;
  }) => void;
  onClose: () => void;
  onTriggerCamera: () => Promise<string | null>;
}

const PHOTO_KINDS: SelfAuditPhotoKind[] = ['self', 'uniform', 'shoes'];

export function GuardSelfAuditModal({ open, onSubmit, onClose, onTriggerCamera }: GuardSelfAuditModalProps) {
  const [uniform, setUniform] = useState({
    uniformPresent: false,
    blackShoes: false,
    dutyBelt: false,
    requiredEquipment: false,
  });
  const [photos, setPhotos] = useState<Partial<Record<SelfAuditPhotoKind, string>>>({});
  const [locationPhoto, setLocationPhoto] = useState<string | undefined>();
  const [loadingKind, setLoadingKind] = useState<SelfAuditPhotoKind | 'location' | null>(null);

  const labels = {
    uniformPresent: 'Uniform',
    blackShoes: 'Shoes',
    dutyBelt: 'Duty belt',
    requiredEquipment: 'Required equipment',
  };

  const handleCapture = async (kind: SelfAuditPhotoKind | 'location') => {
    setLoadingKind(kind);
    const url = await onTriggerCamera();
    if (url) {
      if (kind === 'location') setLocationPhoto(url);
      else setPhotos((prev) => ({ ...prev, [kind]: url }));
    }
    setLoadingKind(null);
  };

  const handleSubmit = () => {
    if (!photos.self) return;
    onSubmit({
      uniform,
      selfieUpload: photos.self,
      uniformPhoto: photos.uniform,
      shoesPhoto: photos.shoes,
      locationPhoto,
      locationPhotoSkipped: !locationPhoto,
    });
  };

  return (
    <AppModal open={open} position="absolute" zIndex={1003} onClose={onClose} ariaLabelledBy="guard-self-audit-title">
      <OverlaySheetHeader
        titleId="guard-self-audit-title"
        title="Start of shift package"
        onClose={onClose}
      />

      <div className="uber-overlay-sheet-body space-y-5">
        <p className="text-xs uber-text-muted leading-relaxed">
          Self-audit and location photo before clock-in. Skipping items from the previous screen is allowed but
          automatically flagged for the client.
        </p>

        <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
          {(Object.keys(uniform) as (keyof typeof uniform)[]).map((key) => (
            <label key={key} className="flex items-center gap-3 py-2 cursor-pointer w-full">
              <div
                onClick={() => setUniform((p) => ({ ...p, [key]: !p[key] }))}
                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  uniform[key] ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'
                }`}
              >
                {uniform[key] && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm">{labels[key]}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3">
          {PHOTO_KINDS.map((kind) => (
            <div key={kind}>
              <p className="uber-label mb-2">
                {SELF_AUDIT_PHOTO_LABELS[kind]}
                {kind === 'self' ? ' (required)' : ' (optional)'}
              </p>
              {photos[kind] ? (
                <img
                  src={photos[kind]}
                  alt={SELF_AUDIT_PHOTO_LABELS[kind]}
                  className="w-full h-32 object-cover rounded-xl border border-brand-primary/30"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCapture(kind)}
                  disabled={loadingKind !== null}
                  className="w-full h-32 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset"
                >
                  {loadingKind === kind ? (
                    <Loader2 className="w-8 h-8 animate-spin uber-text-muted" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 uber-text-muted" />
                      <span className="text-sm uber-text-muted">Tap to capture</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <p className="uber-label mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Location photo (optional)
          </p>
          {locationPhoto ? (
            <img
              src={locationPhoto}
              alt="Site location"
              className="w-full h-32 object-cover rounded-xl border border-brand-primary/30"
            />
          ) : (
            <button
              type="button"
              onClick={() => void handleCapture('location')}
              disabled={loadingKind !== null}
              className="w-full h-28 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2"
            >
              {loadingKind === 'location' ? (
                <Loader2 className="w-7 h-7 animate-spin uber-text-muted" />
              ) : (
                <>
                  <MapPin className="w-7 h-7 uber-text-muted" />
                  <span className="text-sm uber-text-muted">Photo of post / site</span>
                </>
              )}
            </button>
          )}
        </div>

        <SlideToConfirm
          label="Slide to start shift"
          confirmedLabel="Clocking in…"
          onConfirm={handleSubmit}
          disabled={!photos.self}
          disabledHint="Capture your selfie before clocking in."
        />
      </div>
    </AppModal>
  );
}
