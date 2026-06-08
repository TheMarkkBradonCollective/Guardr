import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface GuardRatingModalProps {
  clientName: string;
  onSubmit: (rating: number, note: string) => void;
  onSkip: () => void;
}

export function GuardRatingModal({ clientName, onSubmit, onSkip }: GuardRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState('');

  return (
    <div className="absolute inset-0 z-[1004] modal-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-sm modal-panel p-6 space-y-5 animate-slide-up">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-primary mb-2">Rate client</p>
          <h3 className="font-bold text-lg">{clientName}</h3>
          <p className="text-sm text-brand-text-muted mt-1">How was this assignment?</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} stars`}>
              <Star className={`w-8 h-8 transition-colors ${rating >= s ? 'fill-brand-primary text-brand-primary' : 'text-brand-border'}`} />
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
          <button type="button" onClick={onSkip} className="flex-1 uber-button-outline h-11 text-sm">
            Skip
          </button>
          <button
            type="button"
            onClick={() => onSubmit(rating, note || 'Good assignment.')}
            className="flex-1 uber-button-sage h-11 text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
