import React, { useState } from 'react';
import { Check, Camera } from 'lucide-react';

interface GuardSelfAuditModalProps {
  onSubmit: (payload: {
    uniform: { uniformPresent: boolean; blackShoes: boolean; dutyBelt: boolean; requiredEquipment: boolean };
    selfieUpload: string;
  }) => void;
  onClose: () => void;
  onTriggerCamera: () => Promise<string | null>;
}

export function GuardSelfAuditModal({ onSubmit, onClose, onTriggerCamera }: GuardSelfAuditModalProps) {
  const [uniform, setUniform] = useState({ uniformPresent: false, blackShoes: false, dutyBelt: false, requiredEquipment: false });
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const labels = {
    uniformPresent: 'Uniform',
    blackShoes: 'Shoes',
    dutyBelt: 'Duty belt',
    requiredEquipment: 'Required equipment',
  };

  const handleCapture = async () => {
    setLoading(true);
    const url = await onTriggerCamera();
    if (url) setSelfie(url);
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!selfie) return;
    onSubmit({ uniform, selfieUpload: selfie });
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

          <div>
            <p className="uber-label mb-2">Take selfie</p>
            {selfie ? (
              <img src={selfie} alt="Selfie" className="w-full h-40 object-cover rounded-xl border border-brand-primary/30" />
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={loading}
                className="w-full h-40 rounded-2xl border border-dashed border-brand-border flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors surface-inset"
              >
                <Camera className="w-8 h-8 text-brand-text-muted" />
                <span className="text-sm text-brand-text-muted">{loading ? 'Capturing…' : 'Tap to capture'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selfie}
            className="app-button-primary disabled:opacity-40"
          >
            Submit and start job
          </button>
        </div>
      </div>
    </div>
  );
}
