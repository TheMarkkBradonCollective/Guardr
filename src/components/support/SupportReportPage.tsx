import React, { useState } from 'react';
import {
  CreateSupportTicketInput,
  SecurityRequest,
  SupportTicketCategory,
  SupportPriority,
} from '../../types';
import {
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
} from '../../lib/support';
import { AppPageTransition } from '../ui/motion/AppMotion';
import { ArrowLeft } from 'lucide-react';

interface SupportReportPageProps {
  relatedRequests?: Pick<SecurityRequest, 'id' | 'title' | 'location'>[];
  onBack: () => void;
  onCreateTicket: (input: CreateSupportTicketInput) => void | Promise<string | void>;
  onSubmitted?: () => void;
}

export function SupportReportPage({
  relatedRequests = [],
  onBack,
  onCreateTicket,
  onSubmitted,
}: SupportReportPageProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('general');
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [relatedRequestId, setRelatedRequestId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await onCreateTicket({
        kind: 'report',
        subject: subject.trim(),
        category,
        priority,
        body: body.trim(),
        relatedRequestId: relatedRequestId || undefined,
      });
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppPageTransition motionKey="support-report" className="h-full min-h-0">
      <div className="max-w-lg mx-auto h-full flex flex-col animate-fade-in client-content-shell">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-brand-surface transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-brand-text-muted mb-6">
          Describe the issue — staff will review and follow up.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pb-24">
          <div>
            <label className="uber-label block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className="uber-input w-full"
            >
              {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="uber-label block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportPriority)}
              className="uber-input w-full"
            >
              {SUPPORT_PRIORITY_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {relatedRequests.length > 0 && (
            <div>
              <label className="uber-label block mb-1">Related job (optional)</label>
              <select
                value={relatedRequestId}
                onChange={(e) => setRelatedRequestId(e.target.value)}
                className="uber-input w-full"
              >
                <option value="">None</option>
                {relatedRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.location}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="uber-label block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="uber-input w-full"
              placeholder="Brief summary"
              required
            />
          </div>
          <div>
            <label className="uber-label block mb-1">Details</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="uber-input w-full min-h-[140px] resize-y"
              placeholder="What happened? Include dates, locations, and anyone involved."
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="w-full app-button-primary disabled:opacity-50">
            Submit report to staff
          </button>
        </form>
      </div>
    </AppPageTransition>
  );
}
