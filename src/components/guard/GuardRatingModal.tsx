import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { AppModal } from '../ui/motion/AppMotion';
import { GuardrButton } from '../baseui/GuardrButton';

interface GuardRatingModalProps {
  open: boolean;
  clientName: string;
  onSubmit: (rating: number, note: string) => void;
  onSkip: () => void;
}

export function GuardRatingModal({ open, clientName, onSubmit, onSkip }: GuardRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  return (
    <AppModal open={open} align="center" position="absolute" zIndex={1004} onClose={onSkip} panelClassName="p-6 space-y-5">
      <div className="text-center">
        <p className="text-sm font-medium uber-text-accent mb-2">Rate client</p>
        <h3 className="font-bold text-lg">{clientName}</h3>
        <p className="text-sm uber-text-muted mt-1">How was this assignment?</p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} stars`}>
            <Star
              className={`w-8 h-8 transition-colors ${rating >= s ? 'fill-brand-primary uber-text-accent' : 'text-brand-border'}`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional feedback…"
        rows={2}
        className="uber-input resize-none w-full"
      />

      <div className="uber-overlay-actions">
        <GuardrButton kind="secondary" onClick={onSkip} disabled={submitted}>
          Skip
        </GuardrButton>
        <GuardrButton
          kind="primary"
          disabled={submitted}
          onClick={() => {
            if (submitted) return;
            setSubmitted(true);
            onSubmit(rating, note || 'Good assignment.');
          }}
        >
          Submit
        </GuardrButton>
      </div>
    </AppModal>
  );
}
