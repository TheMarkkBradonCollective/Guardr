import React, { useState } from 'react';
import { CreateSupportTicketInput } from '../../types';
import { AppPageTransition } from '../ui/motion/AppMotion';
import { AppScreen, AppSubScreenHeader } from '../ui/app/AppPrimitives';

interface SupportComposePageProps {
  onBack: () => void;
  onCreateTicket: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onCreated?: (ticketId: string) => void;
}

export function SupportComposePage({ onBack, onCreateTicket, onCreated }: SupportComposePageProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const ticketId = await onCreateTicket({
        kind: 'chat',
        subject: subject.trim(),
        category: 'general',
        body: body.trim(),
        priority: 'normal',
      });
      if (ticketId) onCreated?.(ticketId);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageTransition motionKey="support-compose" className="h-full min-h-0">
      <AppScreen className="client-form-shell">
        <AppSubScreenHeader title="Contact support" onBack={onBack} />

        <p className="text-sm text-brand-text-muted px-5 mb-6">
          Tell the Guardr team what you need — we will reply in this thread.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 pb-24">
          <div>
            <label className="uber-label block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="uber-input w-full"
              placeholder="e.g. Question about my shift"
              required
            />
          </div>
          <div>
            <label className="uber-label block mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="uber-input w-full min-h-[140px] resize-y"
              placeholder="Describe what you need help with..."
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full app-button-primary disabled:opacity-50">
            Send to Guardr staff
          </button>
        </form>
      </AppScreen>
    </AppPageTransition>
  );
}
