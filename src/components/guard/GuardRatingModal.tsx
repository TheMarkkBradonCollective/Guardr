import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { AppModal } from '../ui/motion/AppMotion';

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

  // Modal is controlled by the parent's `open` prop, which typically flips
  // to false right after submit — reset the local guard whenever it reopens
  // so a later rating prompt isn't stuck disabled.
  React.useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  return (
    <AppModal open={open} align="center" position="absolute" zIndex={1004} onClose={onSkip} panelClassName="p-6 space-y-5">
      <div className="text-center">
        <p className="text-sm font-medium text-brand-primary mb-2">Rate client</p>
        <h3 className="font-bold text-lg">{clientName}</h3>
        <p className="text-sm text-brand-text-muted mt-1">How was this assignment?</p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} stars`}>
            <Star
              className={`w-8 h-8 transition-colors ${rating >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional feedback…"
        rows={2}
        className="uber-input resize-none"
      />

      <div className="app-action-row--2">
        <button type="button" onClick={onSkip} className="app-button-outline" disabled={submitted}>
          Skip
        </button>
        <button
          type="button"
          disabled={submitted}
          onClick={() => {
            if (submitted) return;
            setSubmitted(true);
            onSubmit(rating, note || 'Good assignment.');
          }}
          className="app-button-primary disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </AppModal>
  );
}
