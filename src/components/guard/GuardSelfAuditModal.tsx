import React, { useState } from 'react';
import { Check, Camera, Loader2 } from 'lucide-react';
import { SELF_AUDIT_PHOTO_LABELS, SelfAuditPhotoKind } from '../../lib/selfAuditPhotos';

interface GuardSelfAuditModalProps {
  onSubmit: (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
    uniformPhoto?: string;
    shoesPhoto?: string;
  }) => void;
  onClose: () => void;
  onTriggerCamera: () => Promise<string | null>;
}

const PHOTO_KINDS: SelfAuditPhotoKind[] = ['self', 'uniform', 'shoes'];

export function GuardSelfAuditModal({ onSubmit, onClose, onTriggerCamera }: GuardSelfAuditModalProps) {
  const [uniform, setUniform] = useState({ uniformPresent: false, blackShoes: false, dutyBelt: false, requiredEquipment: false });
  const [photos, setPhotos] = useState<Partial<Record<SelfAuditPhotoKind, string>>>({});
  const [loadingKind, setLoadingKind] = useState<SelfAuditPhotoKind | null>(null);

  const labels = {
    uniformPresent: 'Uniform',
    blackShoes: 'Shoes',
    dutyBelt: 'Duty belt',
    requiredEquipment: 'Required equipment',
  };

  const handleCapture = async (kind: SelfAuditPhotoKind) => {
    setLoadingKind(kind);
    const url = await onTriggerCamera();
    if (url) setPhotos((prev) => ({ ...prev, [kind]: url }));
    setLoadingKind(null);
  };

  const handleSubmit = () => {
    if (!photos.self) return;
    onSubmit({
      uniform,
      selfieUpload: photos.self,
      uniformPhoto: photos.uniform,
      shoesPhoto: photos.shoes,
    });
  };

  return (
    <div className="absolute inset-0 z-[1003] modal-overlay flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg modal-panel max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-brand-surface border-b border-brand-border px-5 py-4 flex items-center justify-between rounded-t-[1.25rem]">
          <p className="font-semibold text-brand-primary">Self audit</p>
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-text text-lg">×</button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-brand-text-muted">Confirm your appearance and equipment before starting your job.</p>

          <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
            {(Object.keys(uniform) as (keyof typeof uniform)[]).map((key) => (
              <label key={key} className="flex items-center gap-3 py-2 cursor-pointer w-full">
                <div
                  onClick={() => setUniform((p) => ({ ...p, [key]: !p[key] }))}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    uniform[key] ? 'bg-brand-primary border-brand-primary' : 'border-brand-border'
                  }`}
                >
                  {uniform[key] && <Check className="w-3 h-3 text-brand-accent-text" />}
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
                  <img src={photos[kind]} alt={SELF_AUDIT_PHOTO_LABELS[kind]} className="w-full h-32 object-cover rounded-xl border border-brand-primary/30" />
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleCapture(kind)}
                    disabled={loadingKind !== null}
                    className="w-full h-32 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset"
                  >
                    {loadingKind === kind ? (
                      <Loader2 className="w-8 h-8 animate-spin text-brand-text-muted" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-brand-text-muted" />
                        <span className="text-sm text-brand-text-muted">Tap to capture</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!photos.self}
            className="app-button-primary disabled:opacity-40"
          >
            Submit and start job
          </button>
        </div>
      </div>
    </div>
  );
}
