import React, { useEffect, useState } from 'react';
import { Link2, Plus, Trash2 } from 'lucide-react';
import {
  CREDENTIAL_ACTIVATION_LINK_KEYS,
  CREDENTIAL_CATALOG_LINK_KEYS,
  CREDENTIAL_LINK_FIELD_LABELS,
  CREDENTIAL_LINK_KEYS,
  PLATFORM_DEFAULT_CREDENTIAL_LINKS,
  credentialCatalogLinkLabel,
  credentialLinksAreEqual,
  isValidCredentialResourceUrl,
  normalizeCredentialResourceUrl,
  type CityCredentialResourceLinks,
  type CredentialLinkKey,
  type CredentialResourceLink,
} from '../../lib/cityCredentialLinks';
import { userFacingError } from '../../lib/userFacingError';

function linkKeyLabel(key: CredentialLinkKey): string {
  if ((CREDENTIAL_ACTIVATION_LINK_KEYS as string[]).includes(key)) {
    return CREDENTIAL_LINK_FIELD_LABELS[key as keyof typeof CREDENTIAL_LINK_FIELD_LABELS];
  }
  return credentialCatalogLinkLabel(key as Parameters<typeof credentialCatalogLinkLabel>[0]);
}

const CE_CATALOG_KEYS = CREDENTIAL_CATALOG_LINK_KEYS.filter(
  (id) =>
    !['bsis-pta-uof-8hr', 'bsis-power-to-arrest', 'bsis-appropriate-use-of-force'].includes(id)
);

const EDITOR_LINK_SECTIONS: { title: string; keys: CredentialLinkKey[] }[] = [
  { title: 'Profile credentials', keys: ['govId', 'coi', 'guardCard'] },
  {
    title: 'Mandatory training — group + individual certs',
    keys: ['ptaUof', 'bsis-pta-uof-8hr', 'bsis-power-to-arrest', 'bsis-appropriate-use-of-force'],
  },
  {
    title: 'Continued Education — 32-hour package + individual courses',
    keys: ['continuedEducation', ...CE_CATALOG_KEYS],
  },
];

interface CityCredentialLinksEditorProps {
  cityName: string;
  links: CityCredentialResourceLinks | undefined;
  busy: boolean;
  onSave: (links: CityCredentialResourceLinks | undefined) => Promise<void>;
}

type DraftLinks = Partial<Record<CredentialLinkKey, CredentialResourceLink[]>>;

function emptyDraft(): DraftLinks {
  return {};
}

function draftFromLinks(links: CityCredentialResourceLinks | undefined): DraftLinks {
  if (!links) return emptyDraft();
  const draft: DraftLinks = {};
  for (const key of CREDENTIAL_LINK_KEYS) {
    const entries = links[key];
    if (entries?.length) {
      draft[key] = entries.map((entry) => ({
        url: entry.url,
        label: entry.label,
        price: entry.price,
      }));
    }
  }
  return draft;
}

function emptyLinkRow(): CredentialResourceLink {
  return { url: '', label: '', price: '' };
}

function normalizeDraft(draft: DraftLinks): CityCredentialResourceLinks | undefined {
  const normalized: CityCredentialResourceLinks = {};
  for (const key of CREDENTIAL_LINK_KEYS) {
    const entries = draft[key];
    if (!entries?.length) continue;
    const valid = entries
      .filter((entry) => entry.url?.trim() && isValidCredentialResourceUrl(entry.url))
      .map((entry) => ({
        url: normalizeCredentialResourceUrl(entry.url),
        label: entry.label?.trim() || undefined,
        price: entry.price?.trim() || undefined,
      }));
    if (valid.length > 0) normalized[key] = valid;
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function CityCredentialLinksEditor({
  cityName,
  links,
  busy,
  onSave,
}: CityCredentialLinksEditorProps) {
  const [draft, setDraft] = useState<DraftLinks>(() => draftFromLinks(links));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(draftFromLinks(links));
    setError('');
  }, [links, cityName]);

  const hasChanges = !credentialLinksAreEqual(normalizeDraft(draft), links);

  const updateRow = (
    key: CredentialLinkKey,
    index: number,
    field: keyof CredentialResourceLink,
    value: string
  ) => {
    setDraft((prev) => {
      const next = { ...prev };
      const rows = [...(next[key] ?? [])];
      const row = { ...rows[index], [field]: value };
      rows[index] = row;
      if (field === 'url' && !value.trim() && !row.label?.trim() && !row.price?.trim()) {
        rows.splice(index, 1);
      }
      if (rows.length === 0) {
        delete next[key];
      } else {
        next[key] = rows;
      }
      return next;
    });
    setError('');
  };

  const addRow = (key: CredentialLinkKey) => {
    setDraft((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), emptyLinkRow()],
    }));
    setError('');
  };

  const removeRow = (key: CredentialLinkKey, index: number) => {
    setDraft((prev) => {
      const next = { ...prev };
      const rows = [...(next[key] ?? [])];
      rows.splice(index, 1);
      if (rows.length === 0) delete next[key];
      else next[key] = rows;
      return next;
    });
    setError('');
  };

  const handleSave = async () => {
    setError('');
    for (const key of CREDENTIAL_LINK_KEYS) {
      const entries = draft[key] ?? [];
      for (const entry of entries) {
        if (entry.url?.trim() && !isValidCredentialResourceUrl(entry.url)) {
          setError(`${linkKeyLabel(key)}: enter a valid http:// or https:// URL.`);
          return;
        }
      }
    }

    const toSave = normalizeDraft(draft);
    if (credentialLinksAreEqual(toSave, links)) return;

    setSaving(true);
    try {
      await onSave(toSave);
    } catch (err) {
      setError(userFacingError(err, 'Could not save credential links.'));
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
      setError(userFacingError(err, 'Could not clear credential links.'));
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
          Add multiple providers per credential for {cityName}. Guards see a dropdown when more than
          one option is available. Include price when known (e.g. $49). City links appear before
          platform defaults.
        </p>
      </div>

      <div className="space-y-5">
        {EDITOR_LINK_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">
              {section.title}
            </p>
            {section.keys.map((key) => {
              const platformDefaults = PLATFORM_DEFAULT_CREDENTIAL_LINKS[key] ?? [];
              const rows = draft[key] ?? [];
              return (
                <div
                  key={key}
                  className="space-y-2 rounded-lg border border-brand-border bg-brand-bg-sec/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-brand-text">{linkKeyLabel(key)}</p>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addRow(key)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add link
                    </button>
                  </div>
                  {platformDefaults.length > 0 && (
                    <p className="text-[11px] text-brand-text-muted leading-relaxed">
                      Platform defaults:{' '}
                      {platformDefaults.map((entry, index) => (
                        <span key={entry.url}>
                          {index > 0 ? ', ' : ''}
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-primary hover:underline"
                          >
                            {entry.label || entry.url}
                            {entry.price ? ` (${entry.price})` : ''}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                  {rows.length === 0 ? (
                    <p className="text-[11px] text-brand-text-muted">No {cityName} overrides yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {rows.map((row, index) => (
                        <div
                          key={`${key}-${index}`}
                          className="space-y-2 rounded-md border border-brand-border/70 bg-brand-bg p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
                              Link {index + 1}
                            </span>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => removeRow(key, index)}
                              className="p-1 text-brand-text-muted hover:text-red-400 disabled:opacity-50"
                              aria-label={`Remove link ${index + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <label className="block space-y-1">
                            <span className="uber-label text-[11px]">URL</span>
                            <input
                              type="url"
                              value={row.url}
                              disabled={disabled}
                              placeholder="https://www.guardcardcourses.com/…"
                              onChange={(e) => updateRow(key, index, 'url', e.target.value)}
                              className="uber-input w-full !text-sm"
                            />
                          </label>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="block space-y-1">
                              <span className="uber-label text-[11px]">Label</span>
                              <input
                                type="text"
                                value={row.label ?? ''}
                                disabled={disabled}
                                placeholder="Guard Card Courses"
                                onChange={(e) => updateRow(key, index, 'label', e.target.value)}
                                className="uber-input w-full !text-sm"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="uber-label text-[11px]">Price (optional)</span>
                              <input
                                type="text"
                                value={row.price ?? ''}
                                disabled={disabled}
                                placeholder="$49"
                                onChange={(e) => updateRow(key, index, 'price', e.target.value)}
                                className="uber-input w-full !text-sm"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
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
