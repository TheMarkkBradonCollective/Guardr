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

      <div className="flex gap-2">
        <button type="button" onClick={onSkip} className="flex-1 app-button-outline !h-11 !text-sm">
          Skip
        </button>
        <button
          type="button"
          onClick={() => onSubmit(rating, note || 'Good assignment.')}
          className="flex-1 app-button-primary !h-11 !text-sm"
        >
          Submit
        </button>
      </div>
    </AppModal>
  );
}
