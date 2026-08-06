import React, { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  CREDENTIAL_LINK_FIELD_LABELS,
  CREDENTIAL_LINK_KEYS,
  PLATFORM_DEFAULT_CREDENTIAL_LINKS,
  credentialLinksAreEqual,
  isValidCredentialResourceUrl,
  normalizeCredentialResourceUrl,
  type CityCredentialResourceLinks,
  type CredentialLinkKey,
} from '../../lib/cityCredentialLinks';

interface CityCredentialLinksEditorProps {
  cityName: string;
  links: CityCredentialResourceLinks | undefined;
  busy: boolean;
  onSave: (links: CityCredentialResourceLinks | undefined) => Promise<void>;
}

function emptyDraft(): CityCredentialResourceLinks {
  return {};
}

function draftFromLinks(links: CityCredentialResourceLinks | undefined): CityCredentialResourceLinks {
  if (!links) return emptyDraft();
  const draft: CityCredentialResourceLinks = {};
  for (const key of CREDENTIAL_LINK_KEYS) {
    const entry = links[key];
    if (entry?.url) {
      draft[key] = { url: entry.url, label: entry.label };
    }
  }
  return draft;
}

export function CityCredentialLinksEditor({
  cityName,
  links,
  busy,
  onSave,
}: CityCredentialLinksEditorProps) {
  const [draft, setDraft] = useState<CityCredentialResourceLinks>(() => draftFromLinks(links));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(draftFromLinks(links));
    setError('');
  }, [links, cityName]);

  const hasChanges = !credentialLinksAreEqual(draft, links);

  const updateField = (key: CredentialLinkKey, field: 'url' | 'label', value: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      const current = next[key] ?? { url: '' };
      if (field === 'url') {
        const trimmed = value;
        if (!trimmed.trim()) {
          delete next[key];
          return next;
        }
        next[key] = { ...current, url: trimmed };
      } else {
        next[key] = { ...current, label: value };
      }
      return next;
    });
    setError('');
  };

  const handleSave = async () => {
    setError('');
    for (const key of CREDENTIAL_LINK_KEYS) {
      const entry = draft[key];
      if (entry?.url?.trim() && !isValidCredentialResourceUrl(entry.url)) {
        setError(`${CREDENTIAL_LINK_FIELD_LABELS[key]}: enter a valid http:// or https:// URL.`);
        return;
      }
    }

    const normalized: CityCredentialResourceLinks = {};
    for (const key of CREDENTIAL_LINK_KEYS) {
      const entry = draft[key];
      if (entry?.url?.trim() && isValidCredentialResourceUrl(entry.url)) {
        normalized[key] = {
          url: normalizeCredentialResourceUrl(entry.url),
          label: entry.label?.trim() || undefined,
        };
      }
    }

    const toSave = Object.keys(normalized).length > 0 ? normalized : undefined;
    if (credentialLinksAreEqual(toSave, links)) return;

    setSaving(true);
    try {
      await onSave(toSave);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save credential links.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setDraft(emptyDraft());
    if (!links) return;
    setSaving(true);
    setError('');
    try {
      await onSave(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear credential links.');
    } finally {
      setSaving(false);
    }
  };

  const disabled = busy || saving;

  return (
    <div className="border-t border-brand-border pt-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-4 h-4 text-brand-primary shrink-0" />
          <h4 className="text-sm font-semibold text-brand-text">Marketplace credential links</h4>
        </div>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          City-specific links appear first for guards whose primary service area is {cityName}. Platform
          defaults (Guard Card Courses, BSIS, DMV) show as secondary when no override is set.
        </p>
      </div>

      <div className="space-y-4">
        {CREDENTIAL_LINK_KEYS.map((key) => {
          const platformDefault = PLATFORM_DEFAULT_CREDENTIAL_LINKS[key];
          const entry = draft[key];
          return (
            <div key={key} className="space-y-2 rounded-lg border border-brand-border bg-brand-bg-sec/40 p-3">
              <p className="text-xs font-semibold text-brand-text">{CREDENTIAL_LINK_FIELD_LABELS[key]}</p>
              {platformDefault && (
                <p className="text-[11px] text-brand-text-muted leading-relaxed">
                  Platform default:{' '}
                  <a
                    href={platformDefault.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:underline"
                  >
                    {platformDefault.label || platformDefault.url}
                  </a>
                </p>
              )}
              <label className="block space-y-1">
                <span className="uber-label text-[11px]">{cityName} link URL</span>
                <input
                  type="url"
                  value={entry?.url ?? ''}
                  disabled={disabled}
                  placeholder={platformDefault?.url ?? 'https://…'}
                  onChange={(e) => updateField(key, 'url', e.target.value)}
                  className="uber-input w-full !text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="uber-label text-[11px]">Link label (optional)</span>
                <input
                  type="text"
                  value={entry?.label ?? ''}
                  disabled={disabled}
                  placeholder={platformDefault?.label ?? 'Short label for guards'}
                  onChange={(e) => updateField(key, 'label', e.target.value)}
                  className="uber-input w-full !text-sm"
                />
              </label>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || !hasChanges}
          onClick={() => void handleSave()}
          className="app-button-primary !h-9 !text-sm !px-4"
        >
          {saving ? 'Saving…' : 'Save credential links'}
        </button>
        {links && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void handleClear()}
            className="app-button-outline !h-9 !text-sm !px-4"
          >
            Clear city overrides
          </button>
        )}
      </div>
    </div>
  );
}
