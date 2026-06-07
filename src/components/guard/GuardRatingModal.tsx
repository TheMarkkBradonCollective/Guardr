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
    <div className="absolute inset-0 z-[1004] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5 animate-slide-up">
        <div className="text-center">
          <p className="text-[10px] font-mono uppercase text-brand-primary tracking-widest mb-2">Rate Client</p>
          <h3 className="font-black text-lg">{clientName}</h3>
          <p className="text-xs text-white/50 mt-1">How was this assignment?</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} stars`}>
              <Star className={`w-8 h-8 transition-colors ${rating >= s ? 'fill-brand-primary text-brand-primary' : 'text-white/20'}`} />
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional feedback..."
          rows={2}
          className="uber-input rounded-xl resize-none text-sm"
        />

        <div className="flex gap-2">
          <button type="button" onClick={onSkip} className="flex-1 py-3 rounded-xl border border-white/15 text-xs font-black uppercase">
            Skip
          </button>
          <button
            type="button"
            onClick={() => onSubmit(rating, note || 'Good assignment.')}
            className="flex-1 py-3 rounded-xl bg-brand-primary text-black font-black text-xs uppercase"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
