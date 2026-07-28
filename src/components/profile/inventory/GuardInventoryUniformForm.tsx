import React, { useState } from 'react';
import type { GuardInventoryUniform, GuardInventoryUniformTypeId } from '../../../types';
import { GUARD_INVENTORY_UNIFORM_TYPES } from '../../../lib/guardInventoryCatalog';
import { DocumentPhotoUploadField } from '../../credentials/DocumentPhotoUploadField';
import { AppFormSheet } from '../../ui/app/AppFormSheet';
import { AppButton } from '../../ui/AppButton';

interface GuardInventoryUniformFormProps {
  open: boolean;
  onClose: () => void;
  initial?: GuardInventoryUniform | null;
  onSave: (uniform: GuardInventoryUniform) => void;
}

const EMPTY_FORM = {
  typeId: 'tactical' as GuardInventoryUniformTypeId,
  label: '',
  description: '',
  previewImageUrl: undefined as string | undefined,
};

export function GuardInventoryUniformForm({
  open,
  onClose,
  initial,
  onSave,
}: GuardInventoryUniformFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        typeId: initial.typeId,
        label: initial.label ?? '',
        description: initial.description,
        previewImageUrl: initial.previewImageUrl,
      });
      return;
    }
    const defaultType = GUARD_INVENTORY_UNIFORM_TYPES[0];
    setForm({
      ...EMPTY_FORM,
      description: defaultType?.example ?? '',
    });
  }, [open, initial]);

  const selectedMeta = GUARD_INVENTORY_UNIFORM_TYPES.find((entry) => entry.id === form.typeId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.description.trim()) return;
    onSave({
      id: initial?.id ?? '',
      typeId: form.typeId,
      label: form.label.trim() || undefined,
      description: form.description.trim(),
      previewImageUrl: form.previewImageUrl,
      createdAt: initial?.createdAt,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit uniform' : 'Add uniform'}
      subtitle="Describe the full outfit and add a preview photo so clients can request the right look."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="uber-label">Uniform type</span>
          <select
            className="app-input w-full"
            value={form.typeId}
            onChange={(event) => {
              const typeId = event.target.value as GuardInventoryUniformTypeId;
              const meta = GUARD_INVENTORY_UNIFORM_TYPES.find((entry) => entry.id === typeId);
              setForm((current) => ({
                ...current,
                typeId,
                description: current.description.trim() ? current.description : meta?.example ?? '',
              }));
            }}
          >
            {GUARD_INVENTORY_UNIFORM_TYPES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
          {selectedMeta && (
            <p className="text-xs text-brand-text-muted leading-relaxed">{selectedMeta.description}</p>
          )}
        </label>

        {form.typeId === 'custom' && (
          <label className="block space-y-1">
            <span className="uber-label">Custom uniform name</span>
            <input
              className="app-input w-full"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="e.g. All-black venue staff"
            />
          </label>
        )}

        <label className="block space-y-1">
          <span className="uber-label">Outfit description</span>
          <textarea
            className="app-input w-full min-h-[120px]"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="List every piece: shirt, pants, footwear, accessories, patches, etc."
            required
          />
          {selectedMeta?.example && (
            <p className="text-xs text-brand-text-muted leading-relaxed">Example: {selectedMeta.example}</p>
          )}
        </label>

        <DocumentPhotoUploadField
          label="Full uniform preview photo"
          imageUrl={form.previewImageUrl}
          onImageUrlChange={(previewImageUrl) => setForm((current) => ({ ...current, previewImageUrl }))}
          previewAlt="Uniform preview"
        />

        <div className="flex gap-2 pt-2">
          <AppButton type="submit" variant="primary">
            {initial ? 'Save uniform' : 'Add uniform'}
          </AppButton>
          <AppButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </AppButton>
        </div>
      </form>
    </AppFormSheet>
  );
}
