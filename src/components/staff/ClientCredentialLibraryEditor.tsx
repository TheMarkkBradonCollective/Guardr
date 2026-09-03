import React, { useEffect, useMemo, useState } from 'react';
import type { ClientType, JobType } from '../../types';
import { AppButton } from '../ui/AppButton';
import {
  catalogTypesForClientType,
  formatClientCredentialApplicableTo,
  selectableJobTypesForCredentialRules,
  upsertClientCredentialRuleOverride,
  type ClientCredentialRuleOverride,
} from '../../lib/clientCredentialCatalog';

interface ClientCredentialLibraryEditorProps {
  rules: ClientCredentialRuleOverride[];
  onChange: (rules: ClientCredentialRuleOverride[]) => void;
  canEdit: boolean;
  /** Immediate saves on every edit (legacy). Manual shows Save / Discard for large forms. */
  saveMode?: 'immediate' | 'manual';
  /** Hide the panel title when wrapped in StaffMgmtSection. */
  embedded?: boolean;
}

function RequiredForEditor({
  typeId,
  selected,
  disabled,
  onChange,
}: {
  typeId: string;
  selected: JobType[];
  disabled: boolean;
  onChange: (next: JobType[]) => void;
}) {
  const options = selectableJobTypesForCredentialRules();
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const checked = selected.includes(option.id);
        return (
          <label
            key={`${typeId}-${option.id}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
              checked ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-brand-border text-brand-text-muted'
            } ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              disabled={disabled}
              onChange={() => {
                onChange(checked ? selected.filter((id) => id !== option.id) : [...selected, option.id]);
              }}
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}

function LibraryGroup({
  clientType,
  title,
  rules,
  onChange,
  canEdit,
}: {
  clientType: ClientType;
  title: string;
  rules: ClientCredentialRuleOverride[];
  onChange: (rules: ClientCredentialRuleOverride[]) => void;
  canEdit: boolean;
}) {
  const types = catalogTypesForClientType(clientType, rules);
  return (
    <section className="space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="space-y-3">
        {types.map((type) => (
          <li key={type.id} className="rounded-xl border border-brand-border p-3 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{type.name}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Applicable to: {formatClientCredentialApplicableTo(type)}
                </p>
              </div>
              {type.alwaysRequired ? (
                <span className="text-[11px] font-semibold text-brand-primary">Always required</span>
              ) : (
                <span className="text-[11px] text-brand-text-muted">Library — not universally required</span>
              )}
            </div>
            <input
              className="uber-input rounded-xl text-sm"
              value={type.requiredForDescription ?? ''}
              disabled={!canEdit || type.alwaysRequired}
              placeholder="Required for — e.g. alcohol-serving establishments"
              onChange={(e) =>
                onChange(
                  upsertClientCredentialRuleOverride(rules, {
                    typeId: type.id,
                    requiredForDescription: e.target.value,
                  })
                )
              }
            />
            {type.alwaysRequired ? null : (
              <RequiredForEditor
                typeId={type.id}
                selected={type.requiredFor}
                disabled={!canEdit}
                onChange={(requiredFor) =>
                  onChange(upsertClientCredentialRuleOverride(rules, { typeId: type.id, requiredFor }))
                }
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClientCredentialLibraryEditor({
  rules,
  onChange,
  canEdit,
  saveMode = 'immediate',
  embedded = false,
}: ClientCredentialLibraryEditorProps) {
  const [draft, setDraft] = useState(rules);
  const activeRules = saveMode === 'manual' ? draft : rules;
  const dirty = useMemo(
    () => saveMode === 'manual' && JSON.stringify(draft) !== JSON.stringify(rules),
    [draft, rules, saveMode],
  );

  useEffect(() => {
    setDraft(rules);
  }, [rules]);

  const handleRulesChange = (next: ClientCredentialRuleOverride[]) => {
    if (saveMode === 'manual') {
      setDraft(next);
      return;
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <div>
          <p className="text-sm font-semibold">Client credential library</p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Credential name → applicable to → required for. Government ID stays required. Licenses and
            permits are selected per service so clients are not asked for documents they do not need.
          </p>
        </div>
      )}
      {embedded ? (
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Credential name → applicable to → required for. Government ID stays required. Licenses and
          permits are selected per service so clients are not asked for documents they do not need.
        </p>
      ) : null}
      <LibraryGroup
        clientType="personal"
        title="Personal accounts"
        rules={activeRules}
        onChange={handleRulesChange}
        canEdit={canEdit}
      />
      <LibraryGroup
        clientType="business"
        title="Business accounts"
        rules={activeRules}
        onChange={handleRulesChange}
        canEdit={canEdit}
      />
      <LibraryGroup
        clientType="security-company"
        title="Security company accounts"
        rules={activeRules}
        onChange={handleRulesChange}
        canEdit={canEdit}
      />
      {saveMode === 'manual' && canEdit && dirty ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <AppButton variant="primary" size="sm" onClick={() => onChange(draft)}>
            Save library
          </AppButton>
          <AppButton variant="outline" size="sm" onClick={() => setDraft(rules)}>
            Discard
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
