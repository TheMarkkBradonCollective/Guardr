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
    dutyBelt: 'Duty Belt',
    requiredEquipment: 'Required Equipment',
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
    <div className="absolute inset-0 z-[1003] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <p className="font-black text-sm uppercase tracking-widest text-brand-primary">Self Audit</p>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-white/60">Confirm your appearance and equipment before starting your shift.</p>

          <div className="space-y-2">
            {(Object.keys(uniform) as (keyof typeof uniform)[]).map((key) => (
              <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
                <div
                  onClick={() => setUniform((p) => ({ ...p, [key]: !p[key] }))}
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    uniform[key] ? 'bg-brand-primary border-brand-primary' : 'border-white/20'
                  }`}
                >
                  {uniform[key] && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="text-sm font-mono">{labels[key]}</span>
              </label>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase text-white/40 mb-2">Take Selfie</p>
            {selfie ? (
              <img src={selfie} alt="Selfie" className="w-full h-40 object-cover rounded-xl border border-brand-primary/30" />
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={loading}
                className="w-full h-40 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-brand-primary transition-colors"
              >
                <Camera className="w-8 h-8 text-white/40" />
                <span className="text-xs font-mono text-white/40">{loading ? 'Capturing...' : 'Tap to capture'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selfie}
            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-wider disabled:opacity-40"
          >
            Submit — Begin Shift
          </button>
        </div>
      </div>
    </div>
  );
}
