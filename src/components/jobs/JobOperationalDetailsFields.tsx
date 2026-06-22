import React from 'react';
import {
  JobOperationalCheckpoint,
  JobOperationalContact,
  JobOperationalCustomField,
  JobOperationalDetails,
  JobOperationalLocation,
} from '../../types';
import { OPERATIONAL_FIELD_SECTIONS } from '../../lib/jobOperationalFieldRegistry';
import { Plus, Trash2 } from 'lucide-react';

interface JobOperationalDetailsFieldsProps {
  value: JobOperationalDetails;
  onChange: (next: JobOperationalDetails) => void;
}

function setField<K extends keyof JobOperationalDetails>(
  value: JobOperationalDetails,
  onChange: (next: JobOperationalDetails) => void,
  key: K,
  val: JobOperationalDetails[K]
) {
  onChange({ ...value, [key]: val });
}

function LocationListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  title: string;
  description: string;
  items: JobOperationalLocation[];
  onChange: (items: JobOperationalLocation[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const updateItem = (index: number, patch: Partial<JobOperationalLocation>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-brand-border p-3 space-y-2 bg-brand-bg-sec/40">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={item.label ?? ''}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              placeholder="Label (optional) — e.g. North bar, Gate B"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-brand-text-muted hover:text-red-400"
              aria-label={`Remove ${title} entry`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={item.details}
            onChange={(e) => updateItem(index, { details: e.target.value })}
            rows={2}
            placeholder={placeholder}
            className="uber-input w-full resize-none rounded-lg !text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { details: '' }])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function ContactListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
}: {
  title: string;
  description: string;
  items: JobOperationalContact[];
  onChange: (items: JobOperationalContact[]) => void;
  addLabel: string;
}) {
  const updateItem = (index: number, patch: Partial<JobOperationalContact>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-brand-border p-3 space-y-2 bg-brand-bg-sec/40">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={item.role ?? ''}
              onChange={(e) => updateItem(index, { role: e.target.value })}
              placeholder="Role — e.g. Venue manager, EMS liaison"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-brand-text-muted hover:text-red-400"
              aria-label="Remove contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={item.name ?? ''}
              onChange={(e) => updateItem(index, { name: e.target.value })}
              placeholder="Name"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <input
              type="tel"
              value={item.phone ?? ''}
              onChange={(e) => updateItem(index, { phone: e.target.value })}
              placeholder="Phone"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
          </div>
          <input
            type="email"
            value={item.email ?? ''}
            onChange={(e) => updateItem(index, { email: e.target.value })}
            placeholder="Email (optional)"
            className="uber-input w-full rounded-lg !h-9 !text-xs"
          />
          <textarea
            value={item.notes ?? ''}
            onChange={(e) => updateItem(index, { notes: e.target.value })}
            rows={2}
            placeholder="When to call, after-hours, backup contact..."
            className="uber-input w-full resize-none rounded-lg !text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, {}])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function CheckpointListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  title: string;
  description: string;
  items: JobOperationalCheckpoint[];
  onChange: (items: JobOperationalCheckpoint[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const updateItem = (index: number, patch: Partial<JobOperationalCheckpoint>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-brand-border p-3 space-y-2 bg-brand-bg-sec/40">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={item.label ?? ''}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              placeholder="Post name — e.g. Post 1, VIP door"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-brand-text-muted hover:text-red-400"
              aria-label="Remove post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={item.location ?? ''}
              onChange={(e) => updateItem(index, { location: e.target.value })}
              placeholder="Location"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <input
              type="text"
              value={item.schedule ?? ''}
              onChange={(e) => updateItem(index, { schedule: e.target.value })}
              placeholder="Schedule — e.g. 6 PM – 2 AM"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
          </div>
          <textarea
            value={item.instructions ?? ''}
            onChange={(e) => updateItem(index, { instructions: e.target.value })}
            rows={3}
            placeholder={placeholder}
            className="uber-input w-full resize-none rounded-lg !text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, {}])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function CustomFieldListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  title: string;
  description: string;
  items: JobOperationalCustomField[];
  onChange: (items: JobOperationalCustomField[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const updateItem = (index: number, patch: Partial<JobOperationalCustomField>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-brand-border p-3 space-y-2 bg-brand-bg-sec/40">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={item.section ?? ''}
              onChange={(e) => updateItem(index, { section: e.target.value })}
              placeholder="Section (optional) — e.g. Parking, VIP"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-brand-text-muted hover:text-red-400"
              aria-label="Remove custom field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={item.label}
            onChange={(e) => updateItem(index, { label: e.target.value })}
            placeholder="Field label — your title for this detail"
            className="uber-input w-full rounded-lg !text-sm"
          />
          <textarea
            value={item.value}
            onChange={(e) => updateItem(index, { value: e.target.value })}
            rows={3}
            placeholder={placeholder}
            className="uber-input w-full resize-none rounded-lg !text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: '', value: '' }])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="uber-label block mb-1.5">{label}</label>
      {hint && <p className="text-xs text-brand-text-muted mb-2">{hint}</p>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="uber-input w-full resize-none rounded-xl"
      />
    </div>
  );
}

function TimeField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="uber-label block mb-1.5">{label}</label>
      {hint && <p className="text-xs text-brand-text-muted mb-2">{hint}</p>}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'e.g. 9:00 PM'}
        className="uber-input w-full rounded-xl"
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-xl border border-brand-border bg-brand-surface/60 group" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3">
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{description}</p>
      </summary>
      <div className="px-4 pb-4 space-y-4 border-t border-brand-border pt-4">{children}</div>
    </details>
  );
}

export function JobOperationalDetailsFields({ value, onChange }: JobOperationalDetailsFieldsProps) {
  const set = <K extends keyof JobOperationalDetails>(key: K, val: JobOperationalDetails[K]) =>
    setField(value, onChange, key, val);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">Site briefing (optional)</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          You are in full control — every field is optional. Add as much detail as you want across venue layout,
          screening, emergencies, posts, contacts, and unlimited custom fields. Sensitive items (codes, keys, access)
          stay hidden from guards until they are approved for the shift.
        </p>
      </div>

      {OPERATIONAL_FIELD_SECTIONS.map((section) => (
        <Section
          key={section.id}
          title={section.title}
          description={section.description}
          defaultOpen={section.defaultOpen}
        >
          {section.fields.map((field) =>
            field.type === 'time' ? (
              <TimeField
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={value[field.key] as string | undefined}
                onChange={(v) => set(field.key, v)}
                placeholder={field.placeholder}
              />
            ) : (
              <TextField
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={value[field.key] as string | undefined}
                onChange={(v) => set(field.key, v)}
                rows={field.rows ?? 2}
                placeholder={field.placeholder}
              />
            )
          )}

          {section.lists?.map((list) => {
            if (list.type === 'locationList') {
              const items = (value[list.key] as JobOperationalLocation[] | undefined) ?? [];
              return (
                <LocationListEditor
                  key={list.key}
                  title={list.label}
                  description={list.hint ?? ''}
                  items={items}
                  onChange={(items) => set(list.key, items)}
                  addLabel={list.addLabel}
                  placeholder={list.placeholder ?? ''}
                />
              );
            }
            if (list.type === 'contactList') {
              const items = (value[list.key] as JobOperationalContact[] | undefined) ?? [];
              return (
                <ContactListEditor
                  key={list.key}
                  title={list.label}
                  description={list.hint ?? ''}
                  items={items}
                  onChange={(items) => set(list.key, items)}
                  addLabel={list.addLabel}
                />
              );
            }
            if (list.type === 'checkpointList') {
              const items = (value[list.key] as JobOperationalCheckpoint[] | undefined) ?? [];
              return (
                <CheckpointListEditor
                  key={list.key}
                  title={list.label}
                  description={list.hint ?? ''}
                  items={items}
                  onChange={(items) => set(list.key, items)}
                  addLabel={list.addLabel}
                  placeholder={list.placeholder ?? ''}
                />
              );
            }
            const items = (value[list.key] as JobOperationalCustomField[] | undefined) ?? [];
            return (
              <CustomFieldListEditor
                key={list.key}
                title={list.label}
                description={list.hint ?? ''}
                items={items}
                onChange={(items) => set(list.key, items)}
                addLabel={list.addLabel}
                placeholder={list.placeholder ?? ''}
              />
            );
          })}
        </Section>
      ))}
    </div>
  );
}
