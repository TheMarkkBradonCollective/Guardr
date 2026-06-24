import React, { useEffect, useState } from 'react';
import { getCrewDisplayName } from '../../lib/guardTeams';

interface CrewDetailsEditorProps {
  jobTitle: string;
  coordinatorName: string;
  crewName?: string | null;
  crewDescription?: string | null;
  editable?: boolean;
  onSave?: (patch: { crewName: string; crewDescription: string }) => void | Promise<void>;
}

export function CrewDetailsEditor({
  jobTitle,
  coordinatorName,
  crewName,
  crewDescription,
  editable = false,
  onSave,
}: CrewDetailsEditorProps) {
  const [name, setName] = useState(crewName ?? '');
  const [description, setDescription] = useState(crewDescription ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(crewName ?? '');
    setDescription(crewDescription ?? '');
  }, [crewName, crewDescription]);

  const displayName = getCrewDisplayName(
    { title: jobTitle, crewName: crewName ?? null },
    coordinatorName
  );

  if (!editable) {
    if (!crewName?.trim() && !crewDescription?.trim()) return null;
    return (
      <div className="rounded-lg border border-brand-border bg-brand-surface/50 px-3 py-2.5 space-y-1">
        <p className="text-sm font-semibold text-brand-text">{displayName}</p>
        {crewDescription?.trim() && (
          <p className="text-xs text-brand-text-muted leading-relaxed whitespace-pre-wrap">
            {crewDescription.trim()}
          </p>
        )}
      </div>
    );
  }

  const dirty =
    name.trim() !== (crewName ?? '').trim() || description.trim() !== (crewDescription ?? '').trim();

  return (
    <div className="rounded-lg border border-brand-primary/25 bg-brand-primary/8 px-3 py-3 space-y-2.5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
          Crew name & details
        </p>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Clients see this on your crew roster and in the Teams directory.
        </p>
      </div>
      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-brand-text-muted">Crew name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={displayName}
            maxLength={80}
            className="app-input w-full text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-brand-text-muted">About this crew</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Experience, specialties, and why clients should pick your crew…"
            maxLength={500}
            rows={3}
            className="app-input w-full text-sm resize-y min-h-[4.5rem]"
          />
        </label>
      </div>
      {onSave && (
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => {
            void (async () => {
              setSaving(true);
              try {
                await onSave({ crewName: name.trim(), crewDescription: description.trim() });
              } finally {
                setSaving(false);
              }
            })();
          }}
          className="app-button-primary app-btn-sm w-full"
        >
          {saving ? 'Saving…' : 'Save crew details'}
        </button>
      )}
    </div>
  );
}
