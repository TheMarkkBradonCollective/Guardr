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
      <div className="crew-details-readonly">
        <p className="text-sm font-semibold text-brand-text">{displayName}</p>
        {crewDescription?.trim() && (
          <p className="text-xs text-brand-text-muted leading-relaxed whitespace-pre-wrap mt-1">
            {crewDescription.trim()}
          </p>
        )}
      </div>
    );
  }

  const dirty =
    name.trim() !== (crewName ?? '').trim() || description.trim() !== (crewDescription ?? '').trim();

  return (
    <div className="crew-details-editor">
      <div className="space-y-2.5">
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
          className="app-button-primary app-btn-sm mt-3"
        >
          {saving ? 'Saving…' : 'Save crew details'}
        </button>
      )}
    </div>
  );
}
